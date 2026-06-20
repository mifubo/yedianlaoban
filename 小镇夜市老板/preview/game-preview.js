const CONFIG_PATHS = {
  levels: "../assets/resources/configs/levels_mvp.json",
  dishes: "../assets/resources/configs/dishes.json",
  customers: "../assets/resources/configs/customers.json",
  equipments: "../assets/resources/configs/equipments.json",
};

const SAVE_KEY = "town_night_market_boss_preview_save_v1";
const MVP_LEVEL_LIMIT = 10;
const MAX_QUICK_SERVICE_BONUS = 0.45;
const COMBO_REWARD_BONUS_PER_STEP = 0.05;
const MAX_COMBO_REWARD_BONUS = 0.25;
const SERVICE_COIN_BONUS = 8;
const DISH_PRICE_BONUS_PER_LEVEL = 0.08;
const DISH_MAX_LEVEL = 10;
const EQUIPMENT_SLOT_LEVEL_STEP = 2;

const DEFAULT_SAVE_DATA = {
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
  adState: {
    settlementDoubleWatchedByLevel: {},
    failExtendWatchedByLevel: {},
  },
};

const state = {
  configs: null,
  saveData: cloneDefaultSaveData(),
  level: null,
  phase: "idle",
  elapsedSec: 0,
  bonusTimeSec: 0,
  timeRemainingSec: 0,
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
  rngState: 1,
  logLines: [],
  lastFrameMs: 0,
  lastResult: null,
};

const dom = {
  homeView: document.querySelector("#homeView"),
  gameView: document.querySelector("#gameView"),
  upgradeView: document.querySelector("#upgradeView"),
  homeLevelText: document.querySelector("#homeLevelText"),
  homeCoinText: document.querySelector("#homeCoinText"),
  homeStarText: document.querySelector("#homeStarText"),
  homeProgressText: document.querySelector("#homeProgressText"),
  playCurrentButton: document.querySelector("#playCurrentButton"),
  homeLevelOneButton: document.querySelector("#homeLevelOneButton"),
  homeUpgradeButton: document.querySelector("#homeUpgradeButton"),
  clearSaveButton: document.querySelector("#clearSaveButton"),
  gameHomeButton: document.querySelector("#gameHomeButton"),
  levelSelect: document.querySelector("#levelSelect"),
  timeText: document.querySelector("#timeText"),
  coinText: document.querySelector("#coinText"),
  comboText: document.querySelector("#comboText"),
  goalText: document.querySelector("#goalText"),
  customerLane: document.querySelector("#customerLane"),
  stations: document.querySelector("#stations"),
  inventory: document.querySelector("#inventory"),
  dishButtons: document.querySelector("#dishButtons"),
  startButton: document.querySelector("#startButton"),
  pauseButton: document.querySelector("#pauseButton"),
  resetButton: document.querySelector("#resetButton"),
  logList: document.querySelector("#logList"),
  upgradeBackButton: document.querySelector("#upgradeBackButton"),
  upgradeCoinText: document.querySelector("#upgradeCoinText"),
  upgradeLevelText: document.querySelector("#upgradeLevelText"),
  equipmentUpgradeList: document.querySelector("#equipmentUpgradeList"),
  dishUpgradeList: document.querySelector("#dishUpgradeList"),
  resultOverlay: document.querySelector("#resultOverlay"),
  resultTitle: document.querySelector("#resultTitle"),
  resultStats: document.querySelector("#resultStats"),
  claimButton: document.querySelector("#claimButton"),
  adDoubleButton: document.querySelector("#adDoubleButton"),
  adExtendButton: document.querySelector("#adExtendButton"),
  retryButton: document.querySelector("#retryButton"),
  nextButton: document.querySelector("#nextButton"),
  resultHomeButton: document.querySelector("#resultHomeButton"),
};

async function boot() {
  const [levels, dishes, customers, equipments] = await Promise.all([
    loadJson(CONFIG_PATHS.levels),
    loadJson(CONFIG_PATHS.dishes),
    loadJson(CONFIG_PATHS.customers),
    loadJson(CONFIG_PATHS.equipments),
  ]);

  state.configs = {
    levels,
    dishes,
    customers,
    equipments,
    levelById: new Map(levels.map((item) => [item.id, item])),
    dishById: new Map(dishes.map((item) => [item.id, item])),
    customerById: new Map(customers.map((item) => [item.id, item])),
    equipmentById: new Map(equipments.map((item) => [item.id, item])),
  };

  state.saveData = loadSave();
  dom.levelSelect.innerHTML = levels
    .filter((level) => level.id <= MVP_LEVEL_LIMIT)
    .map((level) => `<option value="${level.id}">第 ${level.id} 关</option>`)
    .join("");

  dom.playCurrentButton.addEventListener("click", () => enterLevel(getPlayableLevelId()));
  dom.homeLevelOneButton.addEventListener("click", () => enterLevel(1));
  dom.homeUpgradeButton.addEventListener("click", showUpgrade);
  dom.clearSaveButton.addEventListener("click", clearSaveAndRefresh);
  dom.gameHomeButton.addEventListener("click", showHome);
  dom.levelSelect.addEventListener("change", () => enterLevel(Number(dom.levelSelect.value)));
  dom.startButton.addEventListener("click", startBusiness);
  dom.pauseButton.addEventListener("click", togglePause);
  dom.resetButton.addEventListener("click", () => enterLevel(state.level.id));
  dom.claimButton.addEventListener("click", claimBaseReward);
  dom.adDoubleButton.addEventListener("click", claimAdDoubleMock);
  dom.adExtendButton.addEventListener("click", claimExtendTimeMock);
  dom.retryButton.addEventListener("click", retryLevel);
  dom.nextButton.addEventListener("click", playNextLevel);
  dom.resultHomeButton.addEventListener("click", showHome);
  dom.upgradeBackButton.addEventListener("click", showHome);
  dom.equipmentUpgradeList.addEventListener("click", handleUpgradeClick);
  dom.dishUpgradeList.addEventListener("click", handleUpgradeClick);
  dom.customerLane.addEventListener("pointerdown", handleCustomerPointerDown);
  dom.stations.addEventListener("pointerdown", handleStationPointerDown);
  dom.dishButtons.addEventListener("pointerdown", handleDishPointerDown);

  showHome();
  requestAnimationFrame(tick);
  window.__nightMarketPreview = {
    state,
    enterLevel,
    loadSave,
    clearSaveAndRefresh,
  };
}

function loadJson(path) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", path, true);
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(`HTTP ${request.status}: ${path}`));
        return;
      }

      try {
        resolve(JSON.parse(request.responseText));
      } catch (error) {
        reject(error);
      }
    };
    request.onerror = () => reject(new Error(`Cannot load ${path}`));
    request.send();
  });
}

function showHome() {
  if (state.phase === "running") {
    state.phase = "paused";
  }
  dom.resultOverlay.classList.add("hidden");
  showView("home");
  renderHome();
}

function showUpgrade() {
  if (state.phase === "running") {
    state.phase = "paused";
  }
  dom.resultOverlay.classList.add("hidden");
  showView("upgrade");
  renderUpgrade();
}

function showView(name) {
  dom.homeView.classList.toggle("hidden", name !== "home");
  dom.gameView.classList.toggle("hidden", name !== "game");
  dom.upgradeView.classList.toggle("hidden", name !== "upgrade");
}

function enterLevel(levelId) {
  loadLevel(levelId);
  showView("game");
  startBusiness();
}

function loadLevel(levelId) {
  state.saveData = loadSave();
  state.level = state.configs.levelById.get(levelId) ?? state.configs.levels[0];
  state.phase = "idle";
  state.elapsedSec = 0;
  state.bonusTimeSec = 0;
  state.timeRemainingSec = state.level.durationSec;
  state.earnedCoins = 0;
  state.servedCustomers = 0;
  state.angryLeaveCount = 0;
  state.wrongServeCount = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.customerSerial = 0;
  state.activeCustomers = [];
  state.cookedInventory = {};
  state.targetDishServedCounts = {};
  state.rngState = createSeed(state.level.id);
  state.spawnQueue = buildSpawnQueue();
  state.equipments = buildRuntimeEquipments();
  state.logLines = [];
  state.lastResult = null;
  dom.levelSelect.value = String(state.level.id);
  dom.resultOverlay.classList.add("hidden");
  addLog(`第 ${state.level.id} 关准备好了`);
  render();
}

function startBusiness() {
  if (!state.level || state.phase === "running") {
    return;
  }

  if (state.phase === "ended") {
    loadLevel(state.level.id);
  }

  state.phase = "running";
  state.lastFrameMs = performance.now();
  spawnDueCustomers();
  addLog("开摊营业");
  render();
}

function togglePause() {
  if (state.phase === "running") {
    state.phase = "paused";
    addLog("暂停营业");
  } else if (state.phase === "paused") {
    state.phase = "running";
    state.lastFrameMs = performance.now();
    addLog("继续营业");
  }
  render();
}

function tick(frameMs) {
  const deltaSec = Math.min(0.08, Math.max(0, (frameMs - (state.lastFrameMs || frameMs)) / 1000));
  state.lastFrameMs = frameMs;

  if (state.phase === "running") {
    update(deltaSec);
    render();
  }

  requestAnimationFrame(tick);
}

function update(deltaSec) {
  state.elapsedSec += deltaSec;
  state.timeRemainingSec = Math.max(0, getTotalDurationSec() - state.elapsedSec);
  spawnDueCustomers();
  updateCooking(deltaSec);
  updateCustomerPatience(deltaSec);

  if (state.timeRemainingSec <= 0) {
    endBusiness();
    return;
  }

  if (shouldEndBecauseQueueFinished()) {
    endBusiness();
  }
}

function handleCustomerPointerDown(event) {
  const button = event.target.closest("[data-customer]");
  if (!button) {
    return;
  }

  event.preventDefault();
  serveCustomer(button.dataset.customer);
  render();
}

function handleStationPointerDown(event) {
  const button = event.target.closest("[data-equipment]");
  if (!button) {
    return;
  }

  event.preventDefault();
  cookByEquipmentId(button.dataset.equipment);
  render();
}

function handleDishPointerDown(event) {
  const button = event.target.closest("[data-dish]");
  if (!button) {
    return;
  }

  event.preventDefault();
  cookDishById(button.dataset.dish);
  render();
}

function buildRuntimeEquipments() {
  const equipmentIds = new Set();
  for (const dishId of state.level.dishPool) {
    const dish = state.configs.dishById.get(dishId);
    if (dish) {
      equipmentIds.add(dish.stationId);
    }
  }

  return [...equipmentIds]
    .map((equipmentId) => state.configs.equipmentById.get(equipmentId))
    .filter(Boolean)
    .map((config) => ({
      configId: config.id,
      name: config.name,
      slots: Array.from({ length: getEquipmentSlotCount(config) }, (_, slotIndex) => ({
        slotIndex,
        status: "idle",
        dishId: null,
        timeRemainingSec: 0,
        totalCookTimeSec: 0,
      })),
    }));
}

function buildSpawnQueue() {
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
      const jitterSec = waveIndex === 0 && orderIndex === 0 ? 0 : (random() - 0.5) * 1.4;
      const customer = pickCustomerConfig();
      items.push({
        spawnAtSec: Math.max(0, waveStartSec + orderIndex * spacingSec + jitterSec),
        customerId: customer.id,
        orderDishIds: generateOrder(customer),
      });
    }
  }

  ensureTargetDishOrders(items);
  return items.sort((a, b) => a.spawnAtSec - b.spawnAtSec);
}

function getWaveCustomerCount(totalCustomers, waveCount, waveIndex) {
  const baseCount = Math.floor(totalCustomers / waveCount);
  const remainder = totalCustomers % waveCount;
  return baseCount + (waveIndex < remainder ? 1 : 0);
}

function ensureTargetDishOrders(items) {
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

function spawnDueCustomers() {
  while (
    state.spawnQueue.length > 0 &&
    state.spawnQueue[0].spawnAtSec <= state.elapsedSec &&
    state.activeCustomers.length < 4
  ) {
    const spawnItem = state.spawnQueue.shift();
    const customerConfig = state.configs.customerById.get(spawnItem.customerId);
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
    addLog(`${customerConfig.name} 点了 ${spawnItem.orderDishIds.map(getDishName).join(" + ")}`);
  }
}

function updateCooking(deltaSec) {
  for (const equipment of state.equipments) {
    for (const slot of equipment.slots) {
      if (slot.status !== "cooking" || !slot.dishId) {
        continue;
      }

      slot.timeRemainingSec = Math.max(0, slot.timeRemainingSec - deltaSec);
      if (slot.timeRemainingSec <= 0) {
        state.cookedInventory[slot.dishId] = (state.cookedInventory[slot.dishId] ?? 0) + 1;
        addLog(`${getDishName(slot.dishId)} 做好了`);
        slot.status = "idle";
        slot.dishId = null;
        slot.totalCookTimeSec = 0;
      }
    }
  }
}

function updateCustomerPatience(deltaSec) {
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
    addLog(`${customer.name} 等急走了`);
    spawnDueCustomers();
  }
}

function cookByEquipmentId(equipmentId) {
  if (state.phase !== "running") {
    addLog("先点击开始营业");
    return false;
  }

  const equipment = state.equipments.find((item) => item.configId === equipmentId);
  const slot = equipment?.slots.find((item) => item.status === "idle");
  if (!equipment || !slot) {
    addLog("设备正在忙");
    return false;
  }

  const dishId = pickNextDishForEquipment(equipmentId);
  if (!dishId) {
    return false;
  }

  startCooking(equipment, slot, dishId);
  return true;
}

function cookDishById(dishId) {
  if (state.phase !== "running") {
    addLog("先点击开始营业");
    return false;
  }

  if (!state.level.dishPool.includes(dishId)) {
    return false;
  }

  const dish = state.configs.dishById.get(dishId);
  const equipment = state.equipments.find((item) => item.configId === dish.stationId);
  const slot = equipment?.slots.find((item) => item.status === "idle");
  if (!equipment || !slot) {
    addLog("设备正在忙");
    return false;
  }

  startCooking(equipment, slot, dishId);
  return true;
}

function startCooking(equipment, slot, dishId) {
  const dish = state.configs.dishById.get(dishId);
  slot.status = "cooking";
  slot.dishId = dishId;
  slot.totalCookTimeSec = getCookDurationSec(dish);
  slot.timeRemainingSec = slot.totalCookTimeSec;
  addLog(`${equipment.name} 开始做 ${dish.name}`);
}

function serveCustomer(runtimeId) {
  if (state.phase !== "running") {
    return false;
  }

  const customer = state.activeCustomers.find((item) => item.runtimeId === runtimeId);
  if (!customer) {
    return false;
  }

  if (!hasCookedDishes(customer.orderDishIds)) {
    state.wrongServeCount += 1;
    state.combo = 0;
    customer.patienceRemainingSec = Math.max(0, customer.patienceRemainingSec - 2);
    addLog("菜还没齐，上菜失败");
    return false;
  }

  consumeCookedDishes(customer.orderDishIds);
  const rewardCoins = calculateCustomerReward(customer);
  state.earnedCoins += rewardCoins;
  state.servedCustomers += 1;
  state.combo += 1;
  state.maxCombo = Math.max(state.maxCombo, state.combo);
  for (const dishId of customer.orderDishIds) {
    state.targetDishServedCounts[dishId] = (state.targetDishServedCounts[dishId] ?? 0) + 1;
  }

  state.activeCustomers = state.activeCustomers.filter((item) => item.runtimeId !== customer.runtimeId);
  addLog(`${customer.name} 满意离开，+${rewardCoins} 金币`);
  spawnDueCustomers();
  if (shouldEndBecauseQueueFinished()) {
    endBusiness();
  }
  return true;
}

function hasCookedDishes(orderDishIds) {
  const requiredCounts = countDishIds(orderDishIds);
  return Object.entries(requiredCounts).every(([dishId, count]) => (state.cookedInventory[dishId] ?? 0) >= count);
}

function consumeCookedDishes(orderDishIds) {
  const requiredCounts = countDishIds(orderDishIds);
  for (const [dishId, count] of Object.entries(requiredCounts)) {
    state.cookedInventory[dishId] = Math.max(0, (state.cookedInventory[dishId] ?? 0) - count);
  }
}

function calculateCustomerReward(customer) {
  const customerConfig = state.configs.customerById.get(customer.configId);
  const patienceRatio = customer.maxPatienceSec <= 0 ? 0 : customer.patienceRemainingSec / customer.maxPatienceSec;
  const satisfactionBonus = 1 + Math.max(0, patienceRatio) * MAX_QUICK_SERVICE_BONUS;
  const comboBonus = Math.min(MAX_COMBO_REWARD_BONUS, Math.max(0, state.combo) * COMBO_REWARD_BONUS_PER_STEP);
  const levelRewardMultiplier = state.level.modifiers.rewardMultiplier ?? 1;
  const total = customer.orderDishIds.reduce((sum, dishId) => sum + getDishPrice(state.configs.dishById.get(dishId)), 0);

  return Math.max(
    1,
    Math.round(total * customerConfig.tipMultiplier * levelRewardMultiplier * (satisfactionBonus + comboBonus)) +
      SERVICE_COIN_BONUS
  );
}

function pickNextDishForEquipment(equipmentId) {
  const cookableDishIds = state.level.dishPool.filter((dishId) => {
    return state.configs.dishById.get(dishId).stationId === equipmentId;
  });

  let bestDishId = null;
  let bestDemand = 0;
  for (const dishId of cookableDishIds) {
    const demand = getWaitingDemandCount(dishId) - getSupplyCount(dishId);
    if (demand > bestDemand) {
      bestDemand = demand;
      bestDishId = dishId;
    }
  }

  return bestDishId ?? cookableDishIds[0] ?? null;
}

function getWaitingDemandCount(dishId) {
  return state.activeCustomers.reduce((sum, customer) => {
    return sum + customer.orderDishIds.filter((orderDishId) => orderDishId === dishId).length;
  }, 0);
}

function getSupplyCount(dishId) {
  const cooked = state.cookedInventory[dishId] ?? 0;
  const cooking = state.equipments.reduce((sum, equipment) => {
    return sum + equipment.slots.filter((slot) => slot.dishId === dishId).length;
  }, 0);
  return cooked + cooking;
}

function generateOrder(customer) {
  const orderSize = getOrderSize(customer);
  const orderDishIds = [];

  for (let index = 0; index < orderSize; index += 1) {
    const availableDishIds = state.level.dishPool.filter((dishId) => !orderDishIds.includes(dishId));
    orderDishIds.push(pickDishForCustomer(customer, availableDishIds.length > 0 ? availableDishIds : state.level.dishPool));
  }

  return orderDishIds;
}

function getOrderSize(customer) {
  const maxOrderItems = Math.max(1, customer.maxOrderItems);
  if (maxOrderItems <= 1) {
    return 1;
  }

  const multiItemChance = state.level.levelType === "bulk_order" || state.level.levelType === "boss" ? 0.35 : 0.12;
  return random() < multiItemChance ? Math.min(2, maxOrderItems) : 1;
}

function pickDishForCustomer(customer, dishPool) {
  const weights = dishPool.map((dishId) => ({
    id: dishId,
    weight: getDishOrderWeight(customer, dishId),
  }));
  return pickWeighted(weights) ?? dishPool[0];
}

function getDishOrderWeight(customer, dishId) {
  const targetWeights = state.level.modifiers.targetDishWeights ?? {};
  const hasTargetWeights = Object.keys(targetWeights).length > 0;
  let weight = hasTargetWeights ? 0.65 : 1;

  if (customer.preferredDishes.includes(dishId)) {
    weight += 0.35;
  }

  if (typeof targetWeights[dishId] === "number") {
    weight += targetWeights[dishId] * 4;
  }

  if (state.level.goals.targetDishId === dishId) {
    weight += 2;
  }

  return Math.max(0.01, weight);
}

function pickCustomerConfig() {
  const weightedCustomers = Object.entries(state.level.customerMix)
    .map(([id, weight]) => ({ id, weight: weight ?? 0 }))
    .filter((item) => item.weight > 0);
  return state.configs.customerById.get(pickWeighted(weightedCustomers) ?? state.configs.customers[0].id);
}

function pickWeighted(items) {
  const totalWeight = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (totalWeight <= 0) {
    return items[0]?.id ?? null;
  }

  let cursor = random() * totalWeight;
  for (const item of items) {
    cursor -= Math.max(0, item.weight);
    if (cursor <= 0) {
      return item.id;
    }
  }
  return items[items.length - 1]?.id ?? null;
}

function endBusiness() {
  if (state.phase === "ended") {
    return;
  }

  const success = hasMetMainGoal();
  state.phase = "ended";
  state.lastResult = {
    levelId: state.level.id,
    outcome: success ? "success" : "fail",
    earnedCoins: state.earnedCoins,
    baseRewardCoins: Math.max(0, state.earnedCoins),
    finalRewardCoins: Math.max(0, state.earnedCoins),
    servedCustomers: state.servedCustomers,
    maxCombo: state.maxCombo,
    angryLeaveCount: state.angryLeaveCount,
    wrongServeCount: state.wrongServeCount,
    stars: success ? calculateStars() : 0,
    rewardClaimed: false,
    canWatchDoubleRewardAd: success && state.earnedCoins > 0,
    canWatchExtendTimeAd: !success && canResumeFailedLevel(),
  };

  if (success) {
    settleBaseReward(state.lastResult);
  }

  renderResultDialog();
  showInterstitialMock();
  addLog(success ? "本关达成目标" : "本关未达成目标");
}

function renderResultDialog() {
  const result = state.lastResult;
  if (!result) {
    return;
  }

  const stars = result.stars;
  dom.resultTitle.textContent = result.outcome === "success" ? `通关 ${"★".repeat(Math.max(1, stars))}` : "营业结束";
  const baseRewardLine = result.rewardClaimed
    ? `已入账金币：${result.baseRewardCoins}`
    : `待领金币：${result.finalRewardCoins}`;
  const adBonusLine =
    result.outcome === "success" && result.canWatchDoubleRewardAd ? `广告可追加：${result.baseRewardCoins}` : null;

  dom.resultStats.innerHTML = [
    `金币：${state.earnedCoins} / ${state.level.goals.coin1}`,
    `服务：${state.servedCustomers} 人`,
    `最大连击：${state.maxCombo}`,
    `超时离开：${state.angryLeaveCount}`,
    `错误上菜：${state.wrongServeCount}`,
    baseRewardLine,
    adBonusLine,
  ]
    .filter(Boolean)
    .map((line) => `<div>${line}</div>`)
    .join("");

  const levelKey = String(result.levelId);
  dom.claimButton.textContent = result.rewardClaimed ? "已领取" : "领取金币";
  dom.adDoubleButton.textContent = result.rewardClaimed ? "广告追加金币 mock" : "广告翻倍 mock";
  dom.claimButton.disabled = result.rewardClaimed || result.finalRewardCoins <= 0;
  dom.adDoubleButton.disabled =
    !result.canWatchDoubleRewardAd ||
    state.saveData.adState.settlementDoubleWatchedByLevel[levelKey] === true;
  dom.adExtendButton.disabled =
    result.rewardClaimed ||
    !result.canWatchExtendTimeAd ||
    state.saveData.adState.failExtendWatchedByLevel[levelKey] === true;
  dom.nextButton.disabled = result.outcome !== "success";
  dom.resultOverlay.classList.remove("hidden");
}

function hasMetMainGoal() {
  const goals = state.level.goals;
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

function calculateStars() {
  if (state.earnedCoins >= state.level.goals.coin3) {
    return 3;
  }
  if (state.earnedCoins >= state.level.goals.coin2) {
    return 2;
  }
  if (state.earnedCoins >= state.level.goals.coin1) {
    return 1;
  }
  return 0;
}

function claimBaseReward() {
  const result = state.lastResult;
  if (!result || result.rewardClaimed || result.finalRewardCoins <= 0) {
    return false;
  }

  settleBaseReward(result);
  addLog(`领取 ${result.finalRewardCoins} 金币`);
  renderResultDialog();
  render();
  return true;
}

function claimAdDoubleMock() {
  const result = state.lastResult;
  if (!result || result.outcome !== "success" || !result.canWatchDoubleRewardAd) {
    return false;
  }

  const levelKey = String(result.levelId);
  if (state.saveData.adState.settlementDoubleWatchedByLevel[levelKey]) {
    result.canWatchDoubleRewardAd = false;
    renderResultDialog();
    return false;
  }

  if (!result.rewardClaimed) {
    settleBaseReward(result);
  }

  addRewardCoins(result.baseRewardCoins);
  result.canWatchDoubleRewardAd = false;
  state.saveData.adState.settlementDoubleWatchedByLevel[levelKey] = true;
  saveGame();
  addLog(`广告 mock 完成，追加 ${result.baseRewardCoins} 金币`);
  renderResultDialog();
  render();
  return true;
}

function claimExtendTimeMock() {
  const result = state.lastResult;
  if (!result || result.outcome !== "fail" || result.rewardClaimed || !result.canWatchExtendTimeAd) {
    return false;
  }

  const levelKey = String(result.levelId);
  if (state.saveData.adState.failExtendWatchedByLevel[levelKey]) {
    result.canWatchExtendTimeAd = false;
    renderResultDialog();
    return false;
  }

  state.saveData.adState.failExtendWatchedByLevel[levelKey] = true;
  saveGame();
  state.bonusTimeSec += 15;
  state.timeRemainingSec = Math.max(0, getTotalDurationSec() - state.elapsedSec);
  state.phase = "running";
  state.lastFrameMs = performance.now();
  state.lastResult = null;
  dom.resultOverlay.classList.add("hidden");
  addLog("广告 mock 完成，续时 15 秒");
  render();
  return true;
}

function retryLevel() {
  enterLevel(state.level.id);
}

function playNextLevel() {
  const result = state.lastResult;
  if (!result || result.outcome !== "success") {
    return;
  }

  if (!result.rewardClaimed) {
    claimBaseReward();
  }

  const nextLevelId = getPlayableLevelId();
  enterLevel(nextLevelId);
}

function canResumeFailedLevel() {
  return state.timeRemainingSec <= 0 && (state.spawnQueue.length > 0 || state.activeCustomers.length > 0);
}

function showInterstitialMock() {
  if (state.level.id < 6) {
    return;
  }

  addLog("插屏广告 mock 展示");
}

function shouldEndBecauseQueueFinished() {
  return state.phase === "running" && state.spawnQueue.length === 0 && state.activeCustomers.length === 0;
}

function getTotalDurationSec() {
  return state.level.durationSec + state.bonusTimeSec;
}

function renderHome() {
  state.saveData = loadSave();
  const currentLevelId = getPlayableLevelId();
  dom.homeLevelText.textContent = String(currentLevelId);
  dom.homeCoinText.textContent = String(state.saveData.coins);
  dom.homeStarText.textContent = String(getTotalStars());
  dom.homeProgressText.textContent = `${getMvpCompletedCount()}/${MVP_LEVEL_LIMIT}`;
  dom.playCurrentButton.textContent = `进入第 ${currentLevelId} 关`;
}

function render() {
  if (!state.level) {
    return;
  }

  dom.timeText.textContent = `${state.timeRemainingSec.toFixed(1)}s`;
  dom.coinText.textContent = String(state.earnedCoins);
  dom.comboText.textContent = String(state.combo);
  dom.goalText.textContent = state.level.goals.mainText;
  dom.startButton.textContent = state.phase === "ended" ? "再开一局" : state.phase === "running" ? "营业中" : "开始营业";
  dom.startButton.disabled = state.phase === "running";
  dom.pauseButton.textContent = state.phase === "paused" ? "继续" : "暂停";
  dom.pauseButton.disabled = state.phase === "idle" || state.phase === "ended";

  renderCustomers();
  renderStations();
  renderInventory();
  renderDishButtons();
  renderLog();
}

function renderCustomers() {
  const slots = [];
  for (let index = 0; index < 4; index += 1) {
    const customer = state.activeCustomers[index];
    if (!customer) {
      slots.push('<div class="empty-customer"></div>');
      continue;
    }

    const patienceRatio = customer.maxPatienceSec <= 0 ? 0 : customer.patienceRemainingSec / customer.maxPatienceSec;
    const className = customer.configId === "customer_005" ? "customer rush" : "customer";
    slots.push(`
      <button class="${className}" type="button" data-customer="${customer.runtimeId}">
        <div class="face"></div>
        <div class="customer-name">${customer.name}</div>
        <div class="orders">${customer.orderDishIds.map((dishId) => `<span class="chip">${getDishName(dishId)}</span>`).join("")}</div>
        <div class="patience"><div class="patience-fill" style="transform: scaleX(${Math.max(0, patienceRatio)})"></div></div>
      </button>
    `);
  }

  dom.customerLane.innerHTML = slots.join("");
}

function renderStations() {
  dom.stations.innerHTML = state.equipments
    .map((equipment) => {
      const canCook = state.phase === "running" && equipment.slots.some((slot) => slot.status === "idle");
      const slots = equipment.slots
        .map((slot) => {
          const progress = slot.totalCookTimeSec <= 0 ? 0 : 1 - slot.timeRemainingSec / slot.totalCookTimeSec;
          const label = slot.dishId ? `${getDishName(slot.dishId)} ${slot.timeRemainingSec.toFixed(1)}s` : "空闲";
          return `
            <div class="slot">
              <div class="slot-fill" style="width: ${slot.status === "cooking" ? `${Math.max(8, progress * 100)}%` : "100%"}">${label}</div>
            </div>
          `;
        })
        .join("");

      return `
        <div class="station">
          <strong>${equipment.name}</strong>
          ${slots}
          <button type="button" data-equipment="${equipment.configId}" ${canCook ? "" : "disabled"}>制作需求菜</button>
        </div>
      `;
    })
    .join("");
}

function renderInventory() {
  dom.inventory.innerHTML = state.level.dishPool
    .map((dishId) => {
      return `
        <div class="inventory-item">
          <span>${getDishName(dishId)}</span>
          <strong>${state.cookedInventory[dishId] ?? 0}</strong>
        </div>
      `;
    })
    .join("");
}

function renderDishButtons() {
  dom.dishButtons.innerHTML = state.level.dishPool
    .map((dishId) => {
      const dish = state.configs.dishById.get(dishId);
      const equipment = state.equipments.find((item) => item.configId === dish.stationId);
      const canCook = state.phase === "running" && equipment?.slots.some((slot) => slot.status === "idle");
      return `<button type="button" data-dish="${dishId}" ${canCook ? "" : "disabled"}>${dish.name}<br>${getCookDurationSec(dish).toFixed(1)}s</button>`;
    })
    .join("");
}

function renderLog() {
  dom.logList.innerHTML = state.logLines.map((line) => `<div>${line}</div>`).join("");
}

function renderUpgrade() {
  state.saveData = loadSave();
  dom.upgradeCoinText.textContent = String(state.saveData.coins);
  dom.upgradeLevelText.textContent = String(state.saveData.currentLevelId);

  dom.equipmentUpgradeList.innerHTML = state.configs.equipments
    .filter((equipment) => equipment.unlockLevel <= MVP_LEVEL_LIMIT)
    .sort((a, b) => a.unlockLevel - b.unlockLevel)
    .map((equipment) => renderUpgradeCard("equipment", equipment, previewEquipment(equipment)))
    .join("");

  dom.dishUpgradeList.innerHTML = state.configs.dishes
    .filter((dish) => dish.unlockLevel <= MVP_LEVEL_LIMIT)
    .sort((a, b) => a.unlockLevel - b.unlockLevel)
    .map((dish) => renderUpgradeCard("dish", dish, previewDish(dish)))
    .join("");
}

function renderUpgradeCard(kind, config, preview) {
  const lockedClass = preview.isUnlocked ? "" : " locked";
  const actionText = preview.isMaxLevel ? "满级" : preview.isUnlocked ? `升级 ${preview.cost}` : preview.lockedReason;
  return `
    <div class="upgrade-card${lockedClass}">
      <div class="upgrade-card-header">
        <span>${config.name}</span>
        <span>Lv.${preview.currentLevel}</span>
      </div>
      <div class="upgrade-effect">${preview.effectText}</div>
      <div class="upgrade-cost">金币 ${state.saveData.coins}</div>
      <button type="button" data-upgrade-kind="${kind}" data-upgrade-id="${config.id}" ${preview.canUpgrade ? "" : "disabled"}>${actionText}</button>
    </div>
  `;
}

function handleUpgradeClick(event) {
  const button = event.target.closest("[data-upgrade-kind]");
  if (!button) {
    return;
  }

  buyUpgrade(button.dataset.upgradeKind, button.dataset.upgradeId);
}

function buyUpgrade(kind, id) {
  state.saveData = loadSave();
  const config = kind === "equipment" ? state.configs.equipmentById.get(id) : state.configs.dishById.get(id);
  const preview = kind === "equipment" ? previewEquipment(config) : previewDish(config);
  if (!preview.canUpgrade) {
    return false;
  }

  state.saveData.coins -= preview.cost;
  if (kind === "equipment") {
    state.saveData.equipmentLevels[id] = preview.nextLevel;
  } else {
    state.saveData.dishLevels[id] = preview.nextLevel;
  }
  saveGame();
  renderUpgrade();
  return true;
}

function previewEquipment(config) {
  const maxLevel = getEquipmentMaxLevel(config);
  const currentLevel = getSavedLevel(state.saveData.equipmentLevels[config.id], maxLevel);
  const isUnlocked = state.saveData.currentLevelId >= config.unlockLevel;
  const isMaxLevel = currentLevel >= maxLevel;
  const nextLevel = isMaxLevel ? currentLevel : currentLevel + 1;
  const cost = isUnlocked && !isMaxLevel ? getEquipmentUpgradeCost(config, currentLevel, getCurrentChapter()) : 0;
  const canAfford = isUnlocked && !isMaxLevel && state.saveData.coins >= cost;
  const currentSlotCount = getEquipmentSlotCountAtLevel(config, currentLevel);
  const nextSlotCount = getEquipmentSlotCountAtLevel(config, nextLevel);
  const nextSpeedBonus = getEquipmentSpeedBonus(config, nextLevel);
  const effectText = !isUnlocked
    ? `第${config.unlockLevel}关解锁`
    : isMaxLevel
      ? "已满级"
      : `制作时间-${Math.round(nextSpeedBonus * 100)}%${nextSlotCount > currentSlotCount ? `，工位+${nextSlotCount - currentSlotCount}` : ""}`;

  return {
    id: config.id,
    currentLevel,
    nextLevel,
    maxLevel,
    cost,
    canAfford,
    canUpgrade: canAfford,
    isUnlocked,
    isMaxLevel,
    effectText,
    lockedReason: isUnlocked ? undefined : `第${config.unlockLevel}关解锁`,
  };
}

function previewDish(config) {
  const currentLevel = getSavedLevel(state.saveData.dishLevels[config.id], DISH_MAX_LEVEL);
  const isUnlocked = state.saveData.currentLevelId >= config.unlockLevel;
  const isMaxLevel = currentLevel >= DISH_MAX_LEVEL;
  const nextLevel = isMaxLevel ? currentLevel : currentLevel + 1;
  const cost = isUnlocked && !isMaxLevel ? getDishUpgradeCost(config, currentLevel, getCurrentChapter()) : 0;
  const canAfford = isUnlocked && !isMaxLevel && state.saveData.coins >= cost;
  const nextPrice = getDishPriceAtLevel(config, nextLevel);
  const effectText = !isUnlocked
    ? `第${config.unlockLevel}关解锁`
    : isMaxLevel
      ? "已满级"
      : `售价+${Math.round(((nextPrice - config.basePrice) / config.basePrice) * 100)}%`;

  return {
    id: config.id,
    currentLevel,
    nextLevel,
    maxLevel: DISH_MAX_LEVEL,
    cost,
    canAfford,
    canUpgrade: canAfford,
    isUnlocked,
    isMaxLevel,
    effectText,
    lockedReason: isUnlocked ? undefined : `第${config.unlockLevel}关解锁`,
  };
}

function applyLevelResult(result) {
  state.saveData = loadSave();
  state.saveData.coins = Math.max(0, Math.floor(state.saveData.coins + result.finalRewardCoins));

  if (result.outcome === "success") {
    if (!state.saveData.completedLevels.includes(result.levelId)) {
      state.saveData.completedLevels.push(result.levelId);
      state.saveData.completedLevels.sort((a, b) => a - b);
    }

    const levelKey = String(result.levelId);
    state.saveData.levelStars[levelKey] = Math.max(state.saveData.levelStars[levelKey] ?? 0, result.stars);
    state.saveData.currentLevelId = Math.min(MVP_LEVEL_LIMIT, Math.max(state.saveData.currentLevelId, result.levelId + 1));
  }

  saveGame();
}

function settleBaseReward(result) {
  if (!result || result.rewardClaimed || result.finalRewardCoins <= 0) {
    return false;
  }

  applyLevelResult(result);
  result.rewardClaimed = true;
  state.saveData = loadSave();
  return true;
}

function addRewardCoins(amount) {
  state.saveData = loadSave();
  state.saveData.coins = Math.max(0, Math.floor(state.saveData.coins + Math.max(0, amount)));
  saveGame();
}

function loadSave() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    return cloneDefaultSaveData();
  }

  try {
    return mergeSaveData(JSON.parse(raw));
  } catch (error) {
    console.warn("存档读取失败，已重置。", error);
    return cloneDefaultSaveData();
  }
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(mergeSaveData(state.saveData)));
}

function clearSaveAndRefresh() {
  localStorage.removeItem(SAVE_KEY);
  state.saveData = loadSave();
  state.phase = "idle";
  state.lastResult = null;
  dom.resultOverlay.classList.add("hidden");
  showHome();
}

function mergeSaveData(rawParsed) {
  const defaults = cloneDefaultSaveData();
  const parsed = rawParsed && typeof rawParsed === "object" ? rawParsed : {};
  return {
    ...defaults,
    ...parsed,
    currentLevelId: normalizePositiveInteger(parsed.currentLevelId, defaults.currentLevelId),
    coins: normalizeCoins(parsed.coins, defaults.coins),
    completedLevels: normalizeLevelIds(parsed.completedLevels),
    levelStars: normalizeStarMap(parsed.levelStars),
    equipmentLevels: {
      ...defaults.equipmentLevels,
      ...normalizeLevelMap(parsed.equipmentLevels),
    },
    dishLevels: {
      ...defaults.dishLevels,
      ...normalizeLevelMap(parsed.dishLevels),
    },
    adState: {
      settlementDoubleWatchedByLevel: {
        ...defaults.adState.settlementDoubleWatchedByLevel,
        ...normalizeBooleanMap(parsed.adState?.settlementDoubleWatchedByLevel),
      },
      failExtendWatchedByLevel: {
        ...defaults.adState.failExtendWatchedByLevel,
        ...normalizeBooleanMap(parsed.adState?.failExtendWatchedByLevel),
      },
    },
  };
}

function cloneDefaultSaveData() {
  return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
}

function normalizePositiveInteger(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
}

function normalizeCoins(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function normalizeLevelIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((item) => Number.isInteger(item) && item > 0))].sort((a, b) => a - b);
}

function normalizeLevelMap(value) {
  const normalized = {};
  if (!value || typeof value !== "object") {
    return normalized;
  }

  for (const [key, level] of Object.entries(value)) {
    if (typeof level === "number" && Number.isFinite(level)) {
      normalized[key] = Math.max(1, Math.floor(level));
    }
  }

  return normalized;
}

function normalizeStarMap(value) {
  const normalized = {};
  if (!value || typeof value !== "object") {
    return normalized;
  }

  for (const [levelId, stars] of Object.entries(value)) {
    if (typeof stars === "number" && Number.isFinite(stars)) {
      normalized[levelId] = Math.min(3, Math.max(0, Math.floor(stars)));
    }
  }

  return normalized;
}

function normalizeBooleanMap(value) {
  const normalized = {};
  if (!value || typeof value !== "object") {
    return normalized;
  }

  for (const [key, flag] of Object.entries(value)) {
    normalized[key] = flag === true;
  }

  return normalized;
}

function getPlayableLevelId() {
  state.saveData = loadSave();
  if (state.configs.levelById.has(state.saveData.currentLevelId) && state.saveData.currentLevelId <= MVP_LEVEL_LIMIT) {
    return state.saveData.currentLevelId;
  }

  return MVP_LEVEL_LIMIT;
}

function getMvpCompletedCount() {
  return state.saveData.completedLevels.filter((levelId) => levelId <= MVP_LEVEL_LIMIT).length;
}

function getTotalStars() {
  return Object.entries(state.saveData.levelStars).reduce((sum, [levelId, stars]) => {
    return Number(levelId) <= MVP_LEVEL_LIMIT ? sum + Math.min(3, Math.max(0, stars)) : sum;
  }, 0);
}

function getCurrentChapter() {
  const currentLevel = state.configs.levelById.get(state.saveData.currentLevelId) ?? state.configs.levelById.get(1);
  return currentLevel?.chapter ?? 1;
}

function getDishPrice(dish) {
  const dishLevel = state.saveData.dishLevels[dish.id] ?? 1;
  return getDishPriceAtLevel(dish, dishLevel);
}

function getDishPriceAtLevel(dish, level) {
  const priceBonus = 1 + Math.max(0, level - 1) * DISH_PRICE_BONUS_PER_LEVEL;
  return Math.round(dish.basePrice * priceBonus);
}

function getCookDurationSec(dish) {
  const equipment = state.configs.equipmentById.get(dish.stationId);
  const equipmentLevel = equipment ? state.saveData.equipmentLevels[equipment.id] ?? 1 : 1;
  const speedBonus = equipment ? getEquipmentSpeedBonus(equipment, equipmentLevel) : 0;
  return Math.max(0.5, dish.baseCookTime * (1 - speedBonus));
}

function getEquipmentSlotCount(equipment) {
  const equipmentLevel = state.saveData.equipmentLevels[equipment.id] ?? 1;
  return getEquipmentSlotCountAtLevel(equipment, equipmentLevel);
}

function getEquipmentSlotCountAtLevel(equipment, level) {
  const extraSlots = Math.floor(Math.max(0, level - 1) / EQUIPMENT_SLOT_LEVEL_STEP);
  return Math.min(equipment.slotCountMax, equipment.slotCountBase + extraSlots);
}

function getEquipmentSpeedBonus(config, level) {
  return Math.min(config.maxSpeedBonus, Math.max(0, level - 1) * config.speedBonusPerLevel);
}

function getEquipmentMaxLevel(config) {
  const speedSteps = config.speedBonusPerLevel > 0 ? Math.ceil(config.maxSpeedBonus / config.speedBonusPerLevel) : 0;
  const slotSteps = Math.max(0, config.slotCountMax - config.slotCountBase) * EQUIPMENT_SLOT_LEVEL_STEP;
  return 1 + Math.max(speedSteps, slotSteps);
}

function getSavedLevel(value, maxLevel) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }

  return Math.min(maxLevel, Math.max(1, Math.floor(value)));
}

function getEquipmentUpgradeCost(config, level, chapter) {
  const raw = config.baseUpgradeCost * Math.pow(level, 1.65) * (1 + 0.35 * (chapter - 1));
  return roundTo10(raw);
}

function getDishUpgradeCost(config, level, chapter) {
  const raw = config.baseUpgradeCost * Math.pow(level, 1.55) * (1 + 0.25 * (chapter - 1));
  return roundTo10(raw);
}

function roundTo10(value) {
  return Math.round(value / 10) * 10;
}

function addLog(message) {
  state.logLines.unshift(message);
  state.logLines = state.logLines.slice(0, 5);
}

function countDishIds(dishIds) {
  return dishIds.reduce((counts, dishId) => {
    counts[dishId] = (counts[dishId] ?? 0) + 1;
    return counts;
  }, {});
}

function getDishName(dishId) {
  return state.configs.dishById.get(dishId)?.name ?? dishId;
}

function createSeed(levelId) {
  return (levelId * 2654435761) >>> 0;
}

function random() {
  let next = state.rngState || 1;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  state.rngState = next >>> 0;
  return state.rngState / 0xffffffff;
}

boot().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<pre>预览启动失败：${error.message}</pre>`;
});
