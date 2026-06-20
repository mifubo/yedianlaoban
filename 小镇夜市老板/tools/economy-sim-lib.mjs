import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(__dirname, '..');
const configDir = path.join(projectRoot, 'assets', 'resources', 'configs');

export const SIM_DELTA_SEC = 0.1;
export const SERVICE_COIN_BONUS = 11;
export const MAX_QUICK_TIP_BONUS = 0.34;
export const COMBO_TIP_BONUS_PER_STEP = 0.04;
export const MAX_COMBO_TIP_BONUS = 0.24;
export const DEFAULT_DISH_PRICE_BONUS_PER_LEVEL = 0.05;
export const DEFAULT_DISH_MAX_LEVEL = 15;
export const DEFAULT_INGREDIENT_COST_RATE = 0.32;
export const DEFAULT_EQUIPMENT_SLOT_LEVEL_STEP = 2;
export const SETTLEMENT_AD_BONUS_RATE = 0.5;
export const SETTLEMENT_AD_GOAL_CAP_RATE = 0.6;

export function loadConfigs() {
  const levels = readJson('levels_mvp.json');
  const dishes = readJson('dishes.json');
  const customers = readJson('customers.json');
  const equipments = readJson('equipments.json');
  const storeUpgrades = readJson('store_upgrades.json');
  const cosmeticsConfig = normalizeCosmeticsConfig(readJson('cosmetics.json'));

  return {
    levels,
    dishes,
    customers,
    equipments,
    storeUpgrades,
    avatars: cosmeticsConfig.avatars,
    cosmetics: cosmeticsConfig.items,
    cosmeticSets: cosmeticsConfig.sets,
    levelById: new Map(levels.map((item) => [item.id, item])),
    dishById: new Map(dishes.map((item) => [item.id, item])),
    customerById: new Map(customers.map((item) => [item.id, item])),
    equipmentById: new Map(equipments.map((item) => [item.id, item])),
    storeUpgradeById: new Map(storeUpgrades.map((item) => [item.id, item])),
    avatarById: new Map(cosmeticsConfig.avatars.map((item) => [item.id, item])),
    cosmeticById: new Map(cosmeticsConfig.items.map((item) => [item.id, item])),
    cosmeticSetById: new Map(cosmeticsConfig.sets.map((item) => [item.id, item])),
  };
}

export function createDefaultSaveData() {
  return {
    schemaVersion: 3,
    playerId: 'sim',
    selectedAvatarId: 'avatar_male_boss',
    selectedGender: 'male',
    avatarSelectionLocked: false,
    currentLevelId: 1,
    coins: 0,
    completedLevels: [],
    levelStars: {},
    equipmentLevels: {
      station_griddle: 1,
      station_drink: 1,
      station_wok: 1,
    },
    dishLevels: {
      dish_001: 1,
      dish_002: 1,
      dish_003: 1,
    },
    storeUpgradeLevels: {
      store_signboard: 1,
      store_tables: 1,
      store_fridge: 1,
      store_cleanliness: 1,
    },
    ownedCosmeticIds: [],
    equippedCosmeticIds: {},
    adState: {
      settlementBonusWatchedByLevel: {},
      failExtendWatchedByLevel: {},
      dailyRewardWatchedByDate: {},
    },
    cloudSync: {
      revision: 0,
      lastSyncedAt: '',
      lastSyncStatus: 'idle',
    },
  };
}

export function simulateLevel(configs, levelId, saveData = createDefaultSaveData()) {
  const state = createRuntimeState(configs, levelId, saveData);
  spawnDueCustomers(configs, state);

  while (state.phase === 'running') {
    serveReadyCustomers(configs, state);
    fillIdleSlots(configs, state);

    state.elapsedSec += SIM_DELTA_SEC;
    state.timeRemainingSec = Math.max(0, getTotalDurationSec(state) - state.elapsedSec);
    spawnDueCustomers(configs, state);
    updateCooking(state, SIM_DELTA_SEC);
    serveReadyCustomers(configs, state);
    updateCustomerPatience(configs, state, SIM_DELTA_SEC);

    if (state.timeRemainingSec <= 0 || shouldEndBecauseQueueFinished(state)) {
      endBusiness(state);
    }
  }

  const settlementAdBonusCoins =
    state.outcome === 'success' ? calculateSettlementAdBonus(state.level, Math.max(0, state.earnedCoins)) : 0;

  return {
    levelId: state.level.id,
    outcome: state.outcome,
    stars: state.outcome === 'success' ? calculateStars(state.level, state.earnedCoins) : 0,
    earnedCoins: state.earnedCoins,
    settlementAdBonusCoins,
    servedCustomers: state.servedCustomers,
    maxCombo: state.maxCombo,
    angryLeaveCount: state.angryLeaveCount,
    wrongServeCount: state.wrongServeCount,
    elapsedSec: Math.round(state.elapsedSec * 10) / 10,
  };
}

export function applySimulatedLevelResult(saveData, result, watchSettlementAd = false) {
  const rewardCoins = result.earnedCoins + (watchSettlementAd ? result.settlementAdBonusCoins : 0);
  saveData.coins = Math.max(0, Math.floor(saveData.coins + rewardCoins));
  if (result.outcome !== 'success') {
    return;
  }

  if (!saveData.completedLevels.includes(result.levelId)) {
    saveData.completedLevels.push(result.levelId);
    saveData.completedLevels.sort((a, b) => a - b);
  }
  saveData.levelStars[String(result.levelId)] = Math.max(saveData.levelStars[String(result.levelId)] ?? 0, result.stars);
  saveData.currentLevelId = Math.max(saveData.currentLevelId, result.levelId + 1);
}

export function buyUpgrade(configs, saveData, kind, id, chapter) {
  const config = getUpgradeConfig(configs, kind, id);
  if (!config) {
    return null;
  }

  const preview = previewUpgrade(configs, saveData, kind, config, chapter);
  if (!preview.canUpgrade) {
    return null;
  }

  saveData.coins -= preview.cost;
  if (kind === 'equipment') {
    saveData.equipmentLevels[id] = preview.nextLevel;
  } else if (kind === 'store') {
    saveData.storeUpgradeLevels[id] = preview.nextLevel;
  } else if (kind === 'cosmetic') {
    if (!saveData.ownedCosmeticIds.includes(id)) {
      saveData.ownedCosmeticIds.push(id);
      saveData.ownedCosmeticIds.sort();
    }
    equipCosmetic(configs, saveData, id);
  } else {
    saveData.dishLevels[id] = preview.nextLevel;
  }

  return {
    kind,
    id,
    name: config.name,
    from: preview.currentLevel,
    to: preview.nextLevel,
    cost: preview.cost,
  };
}

export function equipCosmetic(configs, saveData, id) {
  const config = configs.cosmeticById.get(id);
  if (!config || !saveData.ownedCosmeticIds.includes(id)) {
    return false;
  }

  saveData.equippedCosmeticIds[config.slot] = id;
  return true;
}

export function unequipCosmetic(configs, saveData, id) {
  const config = configs.cosmeticById.get(id);
  if (!config || saveData.equippedCosmeticIds[config.slot] !== id) {
    return false;
  }

  delete saveData.equippedCosmeticIds[config.slot];
  return true;
}

export function selectAvatarByGender(configs, saveData, gender) {
  if (saveData.avatarSelectionLocked) {
    return false;
  }

  const avatar = configs.avatars.find((item) => item.gender === gender);
  if (!avatar) {
    return false;
  }

  saveData.selectedAvatarId = avatar.id;
  saveData.selectedGender = avatar.gender;
  saveData.avatarSelectionLocked = true;
  return true;
}

export function previewUpgrade(configs, saveData, kind, config, chapter) {
  if (kind === 'equipment') {
    const maxLevel = getEquipmentMaxLevel(config);
    const currentLevel = getSavedLevel(saveData.equipmentLevels[config.id], maxLevel);
    const isUnlocked = saveData.currentLevelId >= config.unlockLevel;
    const isMaxLevel = currentLevel >= maxLevel;
    const nextLevel = isMaxLevel ? currentLevel : currentLevel + 1;
    const cost = isUnlocked && !isMaxLevel ? getEquipmentUpgradeCost(config, currentLevel, chapter) : 0;
    return buildPreview(config, currentLevel, nextLevel, maxLevel, cost, isUnlocked, saveData);
  }

  if (kind === 'store') {
    const currentLevel = getSavedLevel(saveData.storeUpgradeLevels[config.id], config.maxLevel);
    const isUnlocked = saveData.currentLevelId >= config.unlockLevel;
    const isMaxLevel = currentLevel >= config.maxLevel;
    const nextLevel = isMaxLevel ? currentLevel : currentLevel + 1;
    const cost = isUnlocked && !isMaxLevel ? getStoreUpgradeCost(config, currentLevel, chapter) : 0;
    return buildPreview(config, currentLevel, nextLevel, config.maxLevel, cost, isUnlocked, saveData);
  }

  if (kind === 'cosmetic') {
    const isOwned = saveData.ownedCosmeticIds.includes(config.id);
    const isUnlocked = saveData.currentLevelId >= config.unlockLevel;
    const cost = isUnlocked && !isOwned ? config.cost : 0;
    return buildPreview(config, isOwned ? 1 : 0, 1, 1, cost, isUnlocked, saveData, isOwned);
  }

  const maxLevel = getDishMaxLevel(config);
  const currentLevel = getSavedLevel(saveData.dishLevels[config.id], maxLevel);
  const isUnlocked = saveData.currentLevelId >= config.unlockLevel;
  const isMaxLevel = currentLevel >= maxLevel;
  const nextLevel = isMaxLevel ? currentLevel : currentLevel + 1;
  const cost = isUnlocked && !isMaxLevel ? getDishUpgradeCost(config, currentLevel, chapter) : 0;
  return buildPreview(config, currentLevel, nextLevel, maxLevel, cost, isUnlocked, saveData);
}

function buildPreview(config, currentLevel, nextLevel, maxLevel, cost, isUnlocked, saveData, forceMax = false) {
  const isMaxLevel = forceMax || currentLevel >= maxLevel;
  const canUpgrade = isUnlocked && !isMaxLevel && saveData.coins >= cost;
  return {
    id: config.id,
    currentLevel,
    nextLevel,
    maxLevel,
    cost,
    canUpgrade,
    isUnlocked,
    isMaxLevel,
  };
}

function getUpgradeConfig(configs, kind, id) {
  if (kind === 'equipment') return configs.equipmentById.get(id);
  if (kind === 'store') return configs.storeUpgradeById.get(id);
  if (kind === 'cosmetic') return configs.cosmeticById.get(id);
  return configs.dishById.get(id);
}

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(configDir, fileName), 'utf8'));
}

function normalizeCosmeticsConfig(raw) {
  if (Array.isArray(raw)) {
    return {
      avatars: [],
      items: raw,
      sets: [],
    };
  }

  return {
    avatars: Array.isArray(raw?.avatars) ? raw.avatars : [],
    items: Array.isArray(raw?.items) ? raw.items : [],
    sets: Array.isArray(raw?.sets) ? raw.sets : [],
  };
}

function createRuntimeState(configs, levelId, saveData) {
  const level = configs.levelById.get(levelId);
  if (!level) {
    throw new Error(`Missing level ${levelId}`);
  }

  const state = {
    level,
    saveData,
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

  state.spawnQueue = buildSpawnQueue(configs, state);
  state.equipments = buildRuntimeEquipments(configs, state);
  return state;
}

function buildRuntimeEquipments(configs, state) {
  const equipmentIds = new Set();
  for (const dishId of state.level.dishPool) {
    const dish = configs.dishById.get(dishId);
    if (dish) {
      equipmentIds.add(dish.stationId);
    }
  }

  return [...equipmentIds].map((equipmentId) => {
    const config = configs.equipmentById.get(equipmentId);
    const equipmentLevel = state.saveData.equipmentLevels[config.id] ?? 1;
    return {
      configId: config.id,
      name: config.name,
      slots: Array.from({ length: getEquipmentSlotCountAtLevel(config, equipmentLevel) }, (_, slotIndex) => ({
        slotIndex,
        status: 'idle',
        dishId: null,
        timeRemainingSec: 0,
        totalCookTimeSec: 0,
      })),
    };
  });
}

function buildSpawnQueue(configs, state) {
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
      const customer = pickCustomerConfig(configs, state);
      items.push({
        spawnAtSec: Math.max(0, waveStartSec + orderIndex * spacingSec + jitterSec),
        customerId: customer.id,
        orderDishIds: generateOrder(configs, state, customer),
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

function spawnDueCustomers(configs, state) {
  while (
    state.spawnQueue.length > 0 &&
    state.spawnQueue[0].spawnAtSec <= state.elapsedSec &&
    state.activeCustomers.length < 4
  ) {
    const spawnItem = state.spawnQueue.shift();
    const customerConfig = configs.customerById.get(spawnItem.customerId);
    const maxPatienceSec = getCustomerPatienceSec(configs, state.saveData, state.level, customerConfig);
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

function fillIdleSlots(configs, state) {
  for (const equipment of state.equipments) {
    for (const slot of equipment.slots) {
      if (slot.status !== 'idle') {
        continue;
      }

      const dishId = pickNextDemandedDishForEquipment(configs, state, equipment.configId);
      if (dishId) {
        startCooking(configs, state, equipment, slot, dishId);
      }
    }
  }
}

function pickNextDemandedDishForEquipment(configs, state, equipmentId) {
  const cookableDishIds = state.level.dishPool.filter((dishId) => configs.dishById.get(dishId).stationId === equipmentId);
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

function startCooking(configs, state, equipment, slot, dishId) {
  const dish = configs.dishById.get(dishId);
  const equipmentConfig = configs.equipmentById.get(equipment.configId);
  slot.status = 'cooking';
  slot.dishId = dishId;
  slot.totalCookTimeSec = getCookDurationSec(configs, state.saveData, dish, equipmentConfig);
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

function serveReadyCustomers(configs, state) {
  let servedAny = true;
  while (servedAny) {
    servedAny = false;
    const readyCustomer = [...state.activeCustomers]
      .sort((a, b) => a.patienceRemainingSec - b.patienceRemainingSec)
      .find((customer) => hasCookedDishes(state, customer.orderDishIds));

    if (readyCustomer) {
      serveCustomer(configs, state, readyCustomer);
      servedAny = true;
      spawnDueCustomers(configs, state);
    }
  }
}

function serveCustomer(configs, state, customer) {
  consumeCookedDishes(state, customer.orderDishIds);
  const rewardCoins = calculateCustomerReward(configs, state, customer);
  state.earnedCoins += rewardCoins;
  state.servedCustomers += 1;
  state.combo += 1;
  state.maxCombo = Math.max(state.maxCombo, state.combo);

  for (const dishId of customer.orderDishIds) {
    state.targetDishServedCounts[dishId] = (state.targetDishServedCounts[dishId] ?? 0) + 1;
  }

  state.activeCustomers = state.activeCustomers.filter((item) => item.runtimeId !== customer.runtimeId);
}

function updateCustomerPatience(configs, state, deltaSec) {
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
    state.earnedCoins = Math.max(0, state.earnedCoins - calculateAngryLeavePenalty(configs, state.saveData));
    state.activeCustomers = state.activeCustomers.filter((item) => item.runtimeId !== customer.runtimeId);
    spawnDueCustomers(configs, state);
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

function calculateCustomerReward(configs, state, customer) {
  const customerConfig = configs.customerById.get(customer.configId);
  const patienceRatio = customer.maxPatienceSec <= 0 ? 0 : customer.patienceRemainingSec / customer.maxPatienceSec;
  return calculateCustomerRewardBreakdown(
    configs,
    state.saveData,
    state.level,
    customerConfig,
    customer.orderDishIds,
    patienceRatio,
    state.combo,
  ).netCoins;
}

function generateOrder(configs, state, customer) {
  const orderSize = getOrderSize(state, customer);
  const orderDishIds = [];
  for (let index = 0; index < orderSize; index += 1) {
    const availableDishIds = state.level.dishPool.filter((dishId) => !orderDishIds.includes(dishId));
    orderDishIds.push(pickDishForCustomer(configs, state, customer, availableDishIds.length > 0 ? availableDishIds : state.level.dishPool));
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

function pickDishForCustomer(configs, state, customer, dishPool) {
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

function pickCustomerConfig(configs, state) {
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

export function calculateStars(level, earnedCoins) {
  if (earnedCoins >= level.goals.coin3) return 3;
  if (earnedCoins >= level.goals.coin2) return 2;
  if (earnedCoins >= level.goals.coin1) return 1;
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

export function getTotalEconomyEffects(configs, saveData) {
  const total = {};
  const equippedOwnedCosmeticIds = new Set();
  for (const storeUpgrade of configs.storeUpgrades) {
    const level = getSavedLevel(saveData.storeUpgradeLevels[storeUpgrade.id], storeUpgrade.maxLevel);
    addEffects(total, scaleEffects(storeUpgrade.effectsPerLevel, Math.max(0, level - 1)));
    addEffects(total, getMilestoneEffects(storeUpgrade, level));
  }
  for (const cosmeticId of Object.values(saveData.equippedCosmeticIds)) {
    const cosmetic = configs.cosmeticById.get(cosmeticId);
    if (cosmetic && saveData.ownedCosmeticIds.includes(cosmetic.id)) {
      equippedOwnedCosmeticIds.add(cosmetic.id);
      addEffects(total, cosmetic.effects);
    }
  }
  for (const cosmeticSet of configs.cosmeticSets) {
    if (cosmeticSet.requiredCosmeticIds.every((cosmeticId) => equippedOwnedCosmeticIds.has(cosmeticId))) {
      addEffects(total, cosmeticSet.effects);
    }
  }
  return total;
}

export function calculateCustomerRewardBreakdown(configs, saveData, level, customer, orderDishIds, patienceRatio, combo) {
  const effects = getTotalEconomyEffects(configs, saveData);
  const grossSales = orderDishIds.reduce((sum, dishId) => {
    const dish = configs.dishById.get(dishId);
    return sum + (dish ? getDishPriceAtLevel(dish, saveData.dishLevels[dish.id] ?? 1, effects) : 0);
  }, 0);
  const ingredientCost = orderDishIds.reduce((sum, dishId) => {
    const dish = configs.dishById.get(dishId);
    return sum + (dish ? getDishIngredientCostAtLevel(dish, saveData.dishLevels[dish.id] ?? 1, effects) : 0);
  }, 0);
  const quickTipRate = Math.min(1, Math.max(0, patienceRatio)) * MAX_QUICK_TIP_BONUS;
  const comboTipRate = Math.min(MAX_COMBO_TIP_BONUS, Math.max(0, combo) * COMBO_TIP_BONUS_PER_STEP);
  const levelRewardMultiplier = level.modifiers.rewardMultiplier ?? 1;
  const tips = Math.round(grossSales * (quickTipRate + comboTipRate + (effects.tipBonus ?? 0)) * customer.tipMultiplier * levelRewardMultiplier);
  const adjustedSales = grossSales * customer.tipMultiplier * levelRewardMultiplier;
  const serviceBonus = SERVICE_COIN_BONUS + Math.floor(Math.max(0, effects.rating ?? 0) * 0.5);
  return {
    grossSales: Math.round(adjustedSales),
    tips,
    serviceBonus,
    ingredientCost,
    netCoins: Math.max(1, Math.round(adjustedSales + tips + serviceBonus - ingredientCost)),
  };
}

function getCustomerPatienceSec(configs, saveData, level, customer) {
  const effects = getTotalEconomyEffects(configs, saveData);
  const patienceBonus = Math.min(0.6, Math.max(0, effects.patienceBonus ?? 0));
  return customer.basePatience * (level.modifiers.patienceMultiplier ?? 1) * (1 + patienceBonus);
}

function calculateAngryLeavePenalty(configs, saveData) {
  const effects = getTotalEconomyEffects(configs, saveData);
  const complaintReduce = Math.min(0.8, Math.max(0, effects.complaintReduce ?? 0));
  return Math.max(0, Math.round(4 * (1 - complaintReduce)));
}

export function calculateSettlementAdBonus(level, baseRewardCoins) {
  if (baseRewardCoins <= 0) {
    return 0;
  }
  return Math.max(10, Math.floor(Math.min(baseRewardCoins * SETTLEMENT_AD_BONUS_RATE, level.goals.coin1 * SETTLEMENT_AD_GOAL_CAP_RATE) / 10) * 10);
}

export function getDishPriceAtLevel(dish, level, effects = {}) {
  const safeLevel = getSavedLevel(level, getDishMaxLevel(dish));
  const perLevelBonus = dish.priceBonusPerLevel ?? DEFAULT_DISH_PRICE_BONUS_PER_LEVEL;
  const milestoneBonus = getMilestoneEffects(dish, safeLevel).priceBonus ?? 0;
  const totalBonus = Math.max(0, (safeLevel - 1) * perLevelBonus + milestoneBonus + (effects.priceBonus ?? 0));
  return Math.max(1, Math.round(dish.basePrice * (1 + totalBonus)));
}

function getDishIngredientCostAtLevel(dish, level, effects = {}) {
  const safeLevel = getSavedLevel(level, getDishMaxLevel(dish));
  const costReduce = Math.min(0.75, Math.max(0, effects.costReduce ?? 0));
  const baseCost = dish.basePrice * (dish.ingredientCostRate ?? DEFAULT_INGREDIENT_COST_RATE);
  return Math.max(1, Math.round(baseCost * (1 + Math.max(0, safeLevel - 1) * 0.012) * (1 - costReduce)));
}

export function getCookDurationSec(configs, saveData, dish, equipment) {
  const effects = getTotalEconomyEffects(configs, saveData);
  const equipmentLevel = equipment ? saveData.equipmentLevels[equipment.id] ?? 1 : 1;
  const speedBonus = Math.min(0.75, (equipment ? getEquipmentSpeedBonusAtLevel(equipment, equipmentLevel) : 0) + (effects.speedBonus ?? 0));
  return Math.max(0.5, dish.baseCookTime * (1 - speedBonus));
}

export function getEquipmentMaxLevel(equipment) {
  if (equipment.maxLevel && equipment.maxLevel > 0) {
    return Math.floor(equipment.maxLevel);
  }
  const speedSteps = equipment.speedBonusPerLevel > 0 ? Math.ceil(equipment.maxSpeedBonus / equipment.speedBonusPerLevel) : 0;
  const slotSteps = Math.max(0, equipment.slotCountMax - equipment.slotCountBase) * DEFAULT_EQUIPMENT_SLOT_LEVEL_STEP;
  return 1 + Math.max(speedSteps, slotSteps);
}

function getEquipmentSlotCountAtLevel(equipment, level) {
  if (Array.isArray(equipment.slotUnlockLevels) && equipment.slotUnlockLevels.length > 0) {
    const extraSlots = equipment.slotUnlockLevels.filter((unlockLevel) => level >= unlockLevel).length;
    return Math.min(equipment.slotCountMax, equipment.slotCountBase + extraSlots);
  }
  const extraSlots = Math.floor(Math.max(0, level - 1) / DEFAULT_EQUIPMENT_SLOT_LEVEL_STEP);
  return Math.min(equipment.slotCountMax, equipment.slotCountBase + extraSlots);
}

export function getEquipmentSpeedBonusAtLevel(equipment, level) {
  const baseBonus = Math.max(0, level - 1) * equipment.speedBonusPerLevel;
  const perLevelBonus = scaleEffects(equipment.effectsPerLevel, Math.max(0, level - 1)).speedBonus ?? 0;
  const milestoneBonus = getMilestoneEffects(equipment, level).speedBonus ?? 0;
  return Math.min(equipment.maxSpeedBonus + 0.12, Math.max(0, baseBonus + perLevelBonus + milestoneBonus));
}

function getDishMaxLevel(dish) {
  return Math.max(1, Math.floor(dish.maxLevel ?? DEFAULT_DISH_MAX_LEVEL));
}

function getSavedLevel(value, maxLevel) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(maxLevel, Math.max(1, Math.floor(value))) : 1;
}

export function getEquipmentUpgradeCost(config, level, chapter) {
  return roundTo10(config.baseUpgradeCost * Math.pow(level, 1.52) * (1 + 0.28 * (chapter - 1)));
}

export function getDishUpgradeCost(config, level, chapter) {
  return roundTo10(config.baseUpgradeCost * Math.pow(level, 1.42) * (1 + 0.2 * (chapter - 1)));
}

export function getStoreUpgradeCost(config, level, chapter) {
  return roundTo10(config.baseUpgradeCost * Math.pow(level, 1.48) * (1 + 0.22 * (chapter - 1)));
}

function getMilestoneEffects(config, level) {
  const total = {};
  for (const milestone of config.upgradeMilestones ?? []) {
    if (level >= milestone.level) {
      addEffects(total, milestone.effects);
    }
  }
  return total;
}

function scaleEffects(effects, scale) {
  if (!effects || scale <= 0) {
    return {};
  }
  return {
    priceBonus: (effects.priceBonus ?? 0) * scale,
    speedBonus: (effects.speedBonus ?? 0) * scale,
    costReduce: (effects.costReduce ?? 0) * scale,
    patienceBonus: (effects.patienceBonus ?? 0) * scale,
    complaintReduce: (effects.complaintReduce ?? 0) * scale,
    rating: (effects.rating ?? 0) * scale,
    tipBonus: (effects.tipBonus ?? 0) * scale,
  };
}

function addEffects(target, source) {
  if (!source) {
    return;
  }
  target.priceBonus = (target.priceBonus ?? 0) + (source.priceBonus ?? 0);
  target.speedBonus = (target.speedBonus ?? 0) + (source.speedBonus ?? 0);
  target.costReduce = (target.costReduce ?? 0) + (source.costReduce ?? 0);
  target.patienceBonus = (target.patienceBonus ?? 0) + (source.patienceBonus ?? 0);
  target.complaintReduce = (target.complaintReduce ?? 0) + (source.complaintReduce ?? 0);
  target.rating = (target.rating ?? 0) + (source.rating ?? 0);
  target.tipBonus = (target.tipBonus ?? 0) + (source.tipBonus ?? 0);
}

function roundTo10(value) {
  return Math.round(value / 10) * 10;
}
