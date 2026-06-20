import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const configDir = path.join(projectRoot, 'assets', 'resources', 'configs');

const MVP_LEVEL_LIMIT = 10;
const MAX_QUICK_SERVICE_BONUS = 0.45;
const COMBO_REWARD_BONUS_PER_STEP = 0.05;
const MAX_COMBO_REWARD_BONUS = 0.25;
const SERVICE_COIN_BONUS = 8;
const SIM_DELTA_SEC = 0.1;

const levels = readJson('levels_mvp.json');
const dishes = readJson('dishes.json');
const customers = readJson('customers.json');
const equipments = readJson('equipments.json');

const configs = {
  levels,
  dishes,
  customers,
  equipments,
  levelById: new Map(levels.map((item) => [item.id, item])),
  dishById: new Map(dishes.map((item) => [item.id, item])),
  customerById: new Map(customers.map((item) => [item.id, item])),
  equipmentById: new Map(equipments.map((item) => [item.id, item])),
};

const results = [];
for (let levelId = 1; levelId <= MVP_LEVEL_LIMIT; levelId += 1) {
  results.push(simulateLevel(levelId));
}

const failures = results.filter((result) => result.outcome !== 'success');
const firstTenLevels = levels.filter((level) => level.id <= MVP_LEVEL_LIMIT);
const firstTenDishIds = new Set(firstTenLevels.flatMap((level) => level.dishPool));
const firstTenCustomerIds = new Set(firstTenLevels.flatMap((level) => Object.keys(level.customerMix)));
const firstTenEquipmentIds = new Set(
  [...firstTenDishIds].map((dishId) => configs.dishById.get(dishId)?.stationId).filter(Boolean),
);

printSummary(results, {
  dishCount: firstTenDishIds.size,
  customerCount: firstTenCustomerIds.size,
  equipmentCount: firstTenEquipmentIds.size,
});

if (failures.length > 0) {
  console.error(`MVP simulation failed: ${failures.length} level(s) did not meet their main goal.`);
  for (const failure of failures) {
    console.error(
      `- Level ${failure.levelId}: coins=${failure.earnedCoins}, served=${failure.servedCustomers}, maxCombo=${failure.maxCombo}, angry=${failure.angryLeaveCount}`,
    );
  }
  process.exit(1);
}

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(configDir, fileName), 'utf8'));
}

function simulateLevel(levelId) {
  const state = createRuntimeState(levelId);
  spawnDueCustomers(state);

  while (state.phase === 'running') {
    serveReadyCustomers(state);
    fillIdleSlots(state);

    state.elapsedSec += SIM_DELTA_SEC;
    state.timeRemainingSec = Math.max(0, getTotalDurationSec(state) - state.elapsedSec);
    spawnDueCustomers(state);
    updateCooking(state, SIM_DELTA_SEC);
    serveReadyCustomers(state);
    updateCustomerPatience(state, SIM_DELTA_SEC);

    if (state.timeRemainingSec <= 0 || shouldEndBecauseQueueFinished(state)) {
      endBusiness(state);
    }
  }

  return {
    levelId: state.level.id,
    outcome: state.outcome,
    stars: state.outcome === 'success' ? calculateStars(state.level, state.earnedCoins) : 0,
    earnedCoins: state.earnedCoins,
    servedCustomers: state.servedCustomers,
    maxCombo: state.maxCombo,
    angryLeaveCount: state.angryLeaveCount,
    wrongServeCount: state.wrongServeCount,
    elapsedSec: Math.round(state.elapsedSec * 10) / 10,
  };
}

function createRuntimeState(levelId) {
  const level = configs.levelById.get(levelId);
  if (!level) {
    throw new Error(`Missing level ${levelId}`);
  }

  const state = {
    level,
    phase: 'running',
    elapsedSec: 0,
    bonusTimeSec: 0,
    timeRemainingSec: level.durationSec,
    earnedCoins: 0,
    servedCustomers: 0,
    angryLeaveCount: 0,
    wrongServeCount: 0,
    combo: 0,
    maxCombo: 0,
    customerSerial: 0,
    spawnQueue: [],
    activeCustomers: [],
    equipments: [],
    cookedInventory: {},
    targetDishServedCounts: {},
    rngState: createSeed(level.id),
    outcome: 'fail',
  };

  state.spawnQueue = buildSpawnQueue(state);
  state.equipments = buildRuntimeEquipments(state);
  return state;
}

function buildRuntimeEquipments(state) {
  const equipmentIds = new Set();
  for (const dishId of state.level.dishPool) {
    const dish = configs.dishById.get(dishId);
    if (dish) {
      equipmentIds.add(dish.stationId);
    }
  }

  return [...equipmentIds].map((equipmentId) => {
    const config = configs.equipmentById.get(equipmentId);
    return {
      configId: config.id,
      name: config.name,
      slots: Array.from({ length: config.slotCountBase }, (_, slotIndex) => ({
        slotIndex,
        status: 'idle',
        dishId: null,
        timeRemainingSec: 0,
        totalCookTimeSec: 0,
      })),
    };
  });
}

function buildSpawnQueue(state) {
  const totalCustomers = state.level.modifiers.customerCount;
  const waveCount = Math.max(1, state.level.modifiers.waveCount ?? 1);
  const spawnWindowSec = Math.max(1, state.level.durationSec * 0.72);
  const items = [];

  for (let waveIndex = 0; waveIndex < waveCount; waveIndex += 1) {
    const customersInWave = getWaveCustomerCount(totalCustomers, waveCount, waveIndex);
    const waveStartSec = (spawnWindowSec / waveCount) * waveIndex;
    const waveDurationSec = (spawnWindowSec / waveCount) * (waveCount > 1 ? 0.58 : 1);

    for (let orderIndex = 0; orderIndex < customersInWave; orderIndex += 1) {
      const spacingSec = customersInWave <= 1 ? 0 : waveDurationSec / customersInWave;
      const jitterSec = waveIndex === 0 && orderIndex === 0 ? 0 : (random(state) - 0.5) * 1.4;
      const customer = pickCustomerConfig(state);
      items.push({
        spawnAtSec: Math.max(0, waveStartSec + orderIndex * spacingSec + jitterSec),
        customerId: customer.id,
        orderDishIds: generateOrder(state, customer),
      });
    }
  }

  ensureTargetDishOrders(state, items);
  return items.sort((a, b) => a.spawnAtSec - b.spawnAtSec);
}

function getWaveCustomerCount(totalCustomers, waveCount, waveIndex) {
  const baseCount = Math.floor(totalCustomers / waveCount);
  const remainder = totalCustomers % waveCount;
  return baseCount + (waveIndex < remainder ? 1 : 0);
}

function ensureTargetDishOrders(state, items) {
  const targetDishId = state.level.goals.targetDishId;
  const targetDishCount = state.level.goals.targetDishCount ?? 0;
  if (!targetDishId || targetDishCount <= 0 || !state.level.dishPool.includes(targetDishId)) {
    return;
  }

  let currentCount = items.reduce((count, item) => {
    return count + item.orderDishIds.filter((dishId) => dishId === targetDishId).length;
  }, 0);

  for (const item of items) {
    if (currentCount >= targetDishCount) {
      return;
    }

    if (!item.orderDishIds.includes(targetDishId)) {
      item.orderDishIds[0] = targetDishId;
      currentCount += 1;
    }
  }
}

function spawnDueCustomers(state) {
  while (
    state.spawnQueue.length > 0 &&
    state.spawnQueue[0].spawnAtSec <= state.elapsedSec &&
    state.activeCustomers.length < 4
  ) {
    const spawnItem = state.spawnQueue.shift();
    const customerConfig = configs.customerById.get(spawnItem.customerId);
    const maxPatienceSec = customerConfig.basePatience * (state.level.modifiers.patienceMultiplier ?? 1);
    state.customerSerial += 1;
    state.activeCustomers.push({
      runtimeId: `customer_${state.customerSerial}`,
      configId: customerConfig.id,
      name: customerConfig.name,
      orderDishIds: spawnItem.orderDishIds,
      maxPatienceSec,
      patienceRemainingSec: maxPatienceSec,
    });
  }
}

function fillIdleSlots(state) {
  for (const equipment of state.equipments) {
    for (const slot of equipment.slots) {
      if (slot.status !== 'idle') {
        continue;
      }

      const dishId = pickNextDemandedDishForEquipment(state, equipment.configId);
      if (dishId) {
        startCooking(state, equipment, slot, dishId);
      }
    }
  }
}

function pickNextDemandedDishForEquipment(state, equipmentId) {
  const cookableDishIds = state.level.dishPool.filter((dishId) => {
    return configs.dishById.get(dishId).stationId === equipmentId;
  });

  let bestDishId = null;
  let bestDemand = 0;
  for (const dishId of cookableDishIds) {
    const demand = getWaitingDemandCount(state, dishId) - getSupplyCount(state, dishId);
    if (demand > bestDemand) {
      bestDemand = demand;
      bestDishId = dishId;
    }
  }

  return bestDemand > 0 ? bestDishId : null;
}

function startCooking(state, equipment, slot, dishId) {
  const dish = configs.dishById.get(dishId);
  slot.status = 'cooking';
  slot.dishId = dishId;
  slot.totalCookTimeSec = dish.baseCookTime;
  slot.timeRemainingSec = slot.totalCookTimeSec;
}

function updateCooking(state, deltaSec) {
  for (const equipment of state.equipments) {
    for (const slot of equipment.slots) {
      if (slot.status !== 'cooking' || !slot.dishId) {
        continue;
      }

      slot.timeRemainingSec = Math.max(0, slot.timeRemainingSec - deltaSec);
      if (slot.timeRemainingSec <= 0) {
        state.cookedInventory[slot.dishId] = (state.cookedInventory[slot.dishId] ?? 0) + 1;
        slot.status = 'idle';
        slot.dishId = null;
        slot.totalCookTimeSec = 0;
      }
    }
  }
}

function serveReadyCustomers(state) {
  let servedAny = true;
  while (servedAny) {
    servedAny = false;
    const readyCustomer = [...state.activeCustomers]
      .sort((a, b) => a.patienceRemainingSec - b.patienceRemainingSec)
      .find((customer) => hasCookedDishes(state, customer.orderDishIds));

    if (readyCustomer) {
      serveCustomer(state, readyCustomer);
      servedAny = true;
      spawnDueCustomers(state);
    }
  }
}

function serveCustomer(state, customer) {
  consumeCookedDishes(state, customer.orderDishIds);
  const rewardCoins = calculateCustomerReward(state, customer);
  state.earnedCoins += rewardCoins;
  state.servedCustomers += 1;
  state.combo += 1;
  state.maxCombo = Math.max(state.maxCombo, state.combo);

  for (const dishId of customer.orderDishIds) {
    state.targetDishServedCounts[dishId] = (state.targetDishServedCounts[dishId] ?? 0) + 1;
  }

  state.activeCustomers = state.activeCustomers.filter((item) => item.runtimeId !== customer.runtimeId);
}

function updateCustomerPatience(state, deltaSec) {
  const leaving = [];
  for (const customer of state.activeCustomers) {
    customer.patienceRemainingSec = Math.max(0, customer.patienceRemainingSec - deltaSec);
    if (customer.patienceRemainingSec <= 0) {
      leaving.push(customer);
    }
  }

  for (const customer of leaving) {
    state.angryLeaveCount += 1;
    state.combo = 0;
    state.activeCustomers = state.activeCustomers.filter((item) => item.runtimeId !== customer.runtimeId);
    spawnDueCustomers(state);
  }
}

function hasCookedDishes(state, orderDishIds) {
  const requiredCounts = countDishIds(orderDishIds);
  return Object.entries(requiredCounts).every(([dishId, count]) => (state.cookedInventory[dishId] ?? 0) >= count);
}

function consumeCookedDishes(state, orderDishIds) {
  const requiredCounts = countDishIds(orderDishIds);
  for (const [dishId, count] of Object.entries(requiredCounts)) {
    state.cookedInventory[dishId] = Math.max(0, (state.cookedInventory[dishId] ?? 0) - count);
  }
}

function calculateCustomerReward(state, customer) {
  const customerConfig = configs.customerById.get(customer.configId);
  const patienceRatio = customer.maxPatienceSec <= 0 ? 0 : customer.patienceRemainingSec / customer.maxPatienceSec;
  const satisfactionBonus = 1 + Math.max(0, patienceRatio) * MAX_QUICK_SERVICE_BONUS;
  const comboBonus = Math.min(MAX_COMBO_REWARD_BONUS, Math.max(0, state.combo) * COMBO_REWARD_BONUS_PER_STEP);
  const levelRewardMultiplier = state.level.modifiers.rewardMultiplier ?? 1;
  const total = customer.orderDishIds.reduce((sum, dishId) => sum + configs.dishById.get(dishId).basePrice, 0);

  return Math.max(
    1,
    Math.round(total * customerConfig.tipMultiplier * levelRewardMultiplier * (satisfactionBonus + comboBonus)) +
      SERVICE_COIN_BONUS,
  );
}

function getWaitingDemandCount(state, dishId) {
  return state.activeCustomers.reduce((sum, customer) => {
    return sum + customer.orderDishIds.filter((orderDishId) => orderDishId === dishId).length;
  }, 0);
}

function getSupplyCount(state, dishId) {
  const cooked = state.cookedInventory[dishId] ?? 0;
  const cooking = state.equipments.reduce((sum, equipment) => {
    return sum + equipment.slots.filter((slot) => slot.dishId === dishId).length;
  }, 0);
  return cooked + cooking;
}

function generateOrder(state, customer) {
  const orderSize = getOrderSize(state, customer);
  const orderDishIds = [];

  for (let index = 0; index < orderSize; index += 1) {
    const availableDishIds = state.level.dishPool.filter((dishId) => !orderDishIds.includes(dishId));
    orderDishIds.push(pickDishForCustomer(state, customer, availableDishIds.length > 0 ? availableDishIds : state.level.dishPool));
  }

  return orderDishIds;
}

function getOrderSize(state, customer) {
  const maxOrderItems = Math.max(1, customer.maxOrderItems);
  if (maxOrderItems <= 1) {
    return 1;
  }

  const multiItemChance = state.level.levelType === 'bulk_order' || state.level.levelType === 'boss' ? 0.35 : 0.12;
  return random(state) < multiItemChance ? Math.min(2, maxOrderItems) : 1;
}

function pickDishForCustomer(state, customer, dishPool) {
  const weights = dishPool.map((dishId) => ({
    id: dishId,
    weight: getDishOrderWeight(state, customer, dishId),
  }));
  return pickWeighted(state, weights) ?? dishPool[0];
}

function getDishOrderWeight(state, customer, dishId) {
  const targetWeights = state.level.modifiers.targetDishWeights ?? {};
  const hasTargetWeights = Object.keys(targetWeights).length > 0;
  let weight = hasTargetWeights ? 0.65 : 1;

  if (customer.preferredDishes.includes(dishId)) {
    weight += 0.35;
  }

  if (typeof targetWeights[dishId] === 'number') {
    weight += targetWeights[dishId] * 4;
  }

  if (state.level.goals.targetDishId === dishId) {
    weight += 2;
  }

  return Math.max(0.01, weight);
}

function pickCustomerConfig(state) {
  const weightedCustomers = Object.entries(state.level.customerMix)
    .map(([id, weight]) => ({ id, weight: weight ?? 0 }))
    .filter((item) => item.weight > 0);
  return configs.customerById.get(pickWeighted(state, weightedCustomers) ?? configs.customers[0].id);
}

function pickWeighted(state, items) {
  const totalWeight = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (totalWeight <= 0) {
    return items[0]?.id ?? null;
  }

  let cursor = random(state) * totalWeight;
  for (const item of items) {
    cursor -= Math.max(0, item.weight);
    if (cursor <= 0) {
      return item.id;
    }
  }
  return items[items.length - 1]?.id ?? null;
}

function endBusiness(state) {
  state.phase = 'ended';
  state.outcome = hasMetMainGoal(state) ? 'success' : 'fail';
}

function hasMetMainGoal(state) {
  const { goals } = state.level;
  if (goals.targetDishId && goals.targetDishCount) {
    return (state.targetDishServedCounts[goals.targetDishId] ?? 0) >= goals.targetDishCount;
  }

  if (goals.combo) {
    return state.maxCombo >= goals.combo;
  }

  if (goals.served) {
    return state.servedCustomers >= goals.served;
  }

  return state.earnedCoins >= goals.coin1;
}

function calculateStars(level, earnedCoins) {
  if (earnedCoins >= level.goals.coin3) {
    return 3;
  }

  if (earnedCoins >= level.goals.coin2) {
    return 2;
  }

  if (earnedCoins >= level.goals.coin1) {
    return 1;
  }

  return 0;
}

function shouldEndBecauseQueueFinished(state) {
  return state.spawnQueue.length === 0 && state.activeCustomers.length === 0;
}

function getTotalDurationSec(state) {
  return state.level.durationSec + state.bonusTimeSec;
}

function countDishIds(dishIds) {
  return dishIds.reduce((counts, dishId) => {
    counts[dishId] = (counts[dishId] ?? 0) + 1;
    return counts;
  }, {});
}

function createSeed(levelId) {
  return (levelId * 2654435761) >>> 0;
}

function random(state) {
  let next = state.rngState || 1;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  state.rngState = next >>> 0;
  return state.rngState / 0xffffffff;
}

function printSummary(items, scope) {
  console.log('MVP simulation passed for levels 1-10.');
  console.log(
    `MVP scope in first 10 levels: ${scope.dishCount} dishes, ${scope.equipmentCount} equipments, ${scope.customerCount} customers.`,
  );
  console.log('level outcome stars coins served combo angry elapsed');
  for (const item of items) {
    console.log(
      `${String(item.levelId).padStart(5)} ${item.outcome.padEnd(7)} ${String(item.stars).padStart(5)} ${String(item.earnedCoins).padStart(5)} ${String(item.servedCustomers).padStart(6)} ${String(item.maxCombo).padStart(5)} ${String(item.angryLeaveCount).padStart(5)} ${String(item.elapsedSec).padStart(7)}`,
    );
  }
}
