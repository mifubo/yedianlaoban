const CONFIG_PATHS = {
  levels: "/assets/resources/configs/levels_mvp.json",
  dishes: "/assets/resources/configs/dishes.json",
  customers: "/assets/resources/configs/customers.json",
  equipments: "/assets/resources/configs/equipments.json",
  storeUpgrades: "/assets/resources/configs/store_upgrades.json",
  cosmetics: "/assets/resources/configs/cosmetics.json",
};

const SAVE_KEY = "town_night_market_boss_preview_save_v3";
const LEGACY_SAVE_KEYS = ["town_night_market_boss_preview_save_v2", "town_night_market_boss_preview_save_v1"];
const MVP_LEVEL_LIMIT = 30;
const MAX_QUICK_TIP_BONUS = 0.34;
const COMBO_TIP_BONUS_PER_STEP = 0.04;
const MAX_COMBO_TIP_BONUS = 0.24;
const SERVICE_COIN_BONUS = 11;
const DEFAULT_DISH_PRICE_BONUS_PER_LEVEL = 0.05;
const DEFAULT_DISH_MAX_LEVEL = 15;
const DEFAULT_INGREDIENT_COST_RATE = 0.32;
const EQUIPMENT_SLOT_LEVEL_STEP = 2;
const SETTLEMENT_AD_BONUS_RATE = 0.5;
const SETTLEMENT_AD_GOAL_CAP_RATE = 0.6;
const FAIL_EXTEND_SECONDS = 15;
const DEFAULT_MAX_WAITING_CUSTOMERS = 4;
const DEFAULT_PREP_CACHE_LIMIT = 3;
const FRONT30_CUSTOMER_ATTRACT_CAP = 0.15;
const LATE_CUSTOMER_ATTRACT_CAP = 0.25;
const MIDGAME_LEFTOVER_LOSS_RATE = 0.4;
const LATEGAME_LEFTOVER_LOSS_RATE = 0.6;
const MAX_LEFTOVER_LOSS_REDUCE = 0.65;
const STORE_VISUAL_STAGES = [
  { level: 1, name: "破旧推车", minUpgradeProgress: 0 },
  { level: 2, name: "亮灯小摊", minUpgradeProgress: 4 },
  { level: 3, name: "夜市摊位", minUpgradeProgress: 9 },
  { level: 4, name: "老街档口", minUpgradeProgress: 16 },
  { level: 5, name: "网红夜市摊", minUpgradeProgress: 25 },
];

const DEFAULT_SAVE_DATA = {
  schemaVersion: 3,
  playerId: "",
  selectedAvatarId: "avatar_male_boss",
  selectedGender: "male",
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
    store_prep_table: 1,
    store_facade: 1,
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
    lastSyncedAt: "",
    lastSyncStatus: "idle",
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
  complaintPenaltyCoins: 0,
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
  growthViewMode: "commercialStreet",
  activeShopId: "outfitShop",
  shopkeeperLineIndex: 0,
};

const dom = {
  loadingView: document.querySelector("#loadingView"),
  avatarSelectView: document.querySelector("#avatarSelectView"),
  homeView: document.querySelector("#homeView"),
  gameView: document.querySelector("#gameView"),
  upgradeView: document.querySelector("#upgradeView"),
  homeLevelText: document.querySelector("#homeLevelText"),
  homeCoinText: document.querySelector("#homeCoinText"),
  homeStarText: document.querySelector("#homeStarText"),
  homeProgressText: document.querySelector("#homeProgressText"),
  homeStoreStageText: document.querySelector("#homeStoreStageText"),
  homeStoreEffectText: document.querySelector("#homeStoreEffectText"),
  homeStoreNextText: document.querySelector("#homeStoreNextText"),
  homeStoreHintText: document.querySelector("#homeStoreHintText"),
  homeTitleButton: document.querySelector("#homeTitleButton"),
  homeAdminPanel: document.querySelector("#homeAdminPanel"),
  selectMaleAvatarButton: document.querySelector("#selectMaleAvatarButton"),
  selectFemaleAvatarButton: document.querySelector("#selectFemaleAvatarButton"),
  playCurrentButton: document.querySelector("#playCurrentButton"),
  homeLevelOneButton: document.querySelector("#homeLevelOneButton"),
  homeOutfitButton: document.querySelector("#homeOutfitButton"),
  homeEquipmentButton: document.querySelector("#homeEquipmentButton"),
  homeGrowthButton: document.querySelector("#homeGrowthButton"),
  dailyAdButton: document.querySelector("#dailyAdButton"),
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
  upgradeKicker: document.querySelector("#upgradeKicker"),
  upgradeTitle: document.querySelector("#upgradeTitle"),
  upgradeCoinMeter: document.querySelector("#upgradeCoinMeter"),
  upgradeLevelMeter: document.querySelector("#upgradeLevelMeter"),
  upgradeCoinText: document.querySelector("#upgradeCoinText"),
  upgradeLevelText: document.querySelector("#upgradeLevelText"),
  upgradeStoreStageText: document.querySelector("#upgradeStoreStageText"),
  upgradeStoreEffectText: document.querySelector("#upgradeStoreEffectText"),
  upgradeStoreNextText: document.querySelector("#upgradeStoreNextText"),
  upgradeStoreHintText: document.querySelector("#upgradeStoreHintText"),
  outfitSection: document.querySelector("#outfitSection"),
  upgradeAvatarImage: document.querySelector("#upgradeAvatarImage"),
  upgradeAvatarText: document.querySelector("#upgradeAvatarText"),
  upgradeOutfitText: document.querySelector("#upgradeOutfitText"),
  outfitList: document.querySelector("#outfitList"),
  marketSection: document.querySelector("#marketSection"),
  shopSection: document.querySelector("#shopSection"),
  equipmentManageSection: document.querySelector("#equipmentManageSection"),
  personalGrowthSection: document.querySelector("#personalGrowthSection"),
  commercialStreet: document.querySelector("#commercialStreet"),
  streetBackButton: document.querySelector("#streetBackButton"),
  shopFixture: document.querySelector("#shopFixture"),
  shopkeeperButton: document.querySelector("#shopkeeperButton"),
  shopkeeperBubble: document.querySelector("#shopkeeperBubble"),
  activeShopName: document.querySelector("#activeShopName"),
  shopItemList: document.querySelector("#shopItemList"),
  equipmentManageList: document.querySelector("#equipmentManageList"),
  personalGrowthList: document.querySelector("#personalGrowthList"),
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
  const levels = await loadJson(CONFIG_PATHS.levels);
  const dishes = await loadJson(CONFIG_PATHS.dishes);
  const customers = await loadJson(CONFIG_PATHS.customers);
  const equipments = await loadJson(CONFIG_PATHS.equipments);
  const storeUpgrades = await loadJson(CONFIG_PATHS.storeUpgrades);
  const cosmeticsRaw = await loadJson(CONFIG_PATHS.cosmetics);
  const cosmeticsConfig = normalizeCosmeticsConfig(cosmeticsRaw);

  state.configs = {
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

  state.saveData = loadSave();
  dom.levelSelect.innerHTML = levels
    .filter((level) => level.id <= MVP_LEVEL_LIMIT)
    .map((level) => `<option value="${level.id}">第 ${level.id} 关</option>`)
    .join("");

  dom.playCurrentButton.addEventListener("click", () => enterLevel(getPlayableLevelId()));
  dom.homeLevelOneButton.addEventListener("click", () => enterLevel(1));
  dom.dailyAdButton.addEventListener("click", claimDailyAdRewardMock);
  dom.homeTitleButton.addEventListener("click", toggleHomeAdminPanel);
  dom.homeUpgradeButton.addEventListener("click", () => showUpgrade("commercialStreet"));
  dom.homeOutfitButton.addEventListener("click", () => showUpgrade("outfit"));
  dom.homeEquipmentButton.addEventListener("click", () => showUpgrade("equipmentManagement"));
  dom.homeGrowthButton.addEventListener("click", () => showUpgrade("personalGrowth"));
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
  dom.selectMaleAvatarButton.addEventListener("click", () => selectAvatarByGender("male"));
  dom.selectFemaleAvatarButton.addEventListener("click", () => selectAvatarByGender("female"));
  dom.commercialStreet.addEventListener("click", handleShopClick);
  dom.streetBackButton.addEventListener("click", () => showUpgrade("commercialStreet"));
  dom.shopkeeperButton.addEventListener("click", cycleShopkeeperLine);
  dom.shopItemList.addEventListener("click", handleUpgradeClick);
  dom.outfitList.addEventListener("click", handleUpgradeClick);
  dom.personalGrowthList.addEventListener("click", handleUpgradeClick);
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
    selectAvatarByGender,
    equipCosmeticById,
    unequipCosmeticById,
  };
}

function loadJson(path, attempt = 1) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const url = `${path}${path.includes("?") ? "&" : "?"}v=${Date.now()}-${attempt}`;
    request.open("GET", url, true);
    request.timeout = 15000;
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        retryOrReject(path, attempt, resolve, reject, new Error(`HTTP ${request.status}: ${path}`));
        return;
      }

      try {
        resolve(JSON.parse(request.responseText));
      } catch (error) {
        retryOrReject(path, attempt, resolve, reject, error);
      }
    };
    request.onerror = () => retryOrReject(path, attempt, resolve, reject, new Error(`Cannot load ${path}`));
    request.ontimeout = () => retryOrReject(path, attempt, resolve, reject, new Error(`Timeout loading ${path}`));
    request.send();
  });
}

function retryOrReject(path, attempt, resolve, reject, error) {
  if (attempt < 3) {
    window.setTimeout(() => {
      loadJson(path, attempt + 1).then(resolve, reject);
    }, 300 * attempt);
    return;
  }

  reject(error);
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

function showHome() {
  if (state.phase === "running") {
    state.phase = "paused";
  }
  state.saveData = loadSave();
  dom.resultOverlay.classList.add("hidden");
  if (!state.saveData.avatarSelectionLocked) {
    showView("avatarSelect");
    return;
  }
  showView("home");
  setHomeAdminPanel(false);
  renderHome();
}

function showUpgrade(mode = "commercialStreet") {
  if (state.phase === "running") {
    state.phase = "paused";
  }
  state.saveData = loadSave();
  if (!state.saveData.avatarSelectionLocked) {
    showView("avatarSelect");
    return;
  }
  state.growthViewMode = normalizeGrowthViewMode(mode);
  dom.resultOverlay.classList.add("hidden");
  showView("upgrade");
  renderUpgrade();
}

function showView(name) {
  dom.loadingView.classList.toggle("hidden", name !== "loading");
  dom.avatarSelectView.classList.toggle("hidden", name !== "avatarSelect");
  dom.homeView.classList.toggle("hidden", name !== "home");
  dom.gameView.classList.toggle("hidden", name !== "game");
  dom.upgradeView.classList.toggle("hidden", name !== "upgrade");
}

function toggleHomeAdminPanel() {
  setHomeAdminPanel(dom.homeAdminPanel.classList.contains("hidden"));
}

function setHomeAdminPanel(isOpen) {
  dom.homeAdminPanel.classList.toggle("hidden", !isOpen);
  dom.homeTitleButton.setAttribute("aria-expanded", String(isOpen));
}

function normalizeGrowthViewMode(mode) {
  return ["commercialStreet", "shop", "outfit", "equipmentManagement", "personalGrowth"].includes(mode)
    ? mode
    : "commercialStreet";
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
  state.complaintPenaltyCoins = 0;
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
  const totalCustomers = getEffectiveCustomerCount(state.level);
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
  applyEventSpawnTiming(items);
  return items.sort((a, b) => a.spawnAtSec - b.spawnAtSec);
}

function applyEventSpawnTiming(items) {
  if (!state.level || items.length <= 1) {
    return;
  }

  const eventId = state.level.modifiers.eventId;
  if (eventId !== "event_influencer_visit" && eventId !== "event_school_rush") {
    return;
  }

  const sortedItems = items.sort((a, b) => a.spawnAtSec - b.spawnAtSec);
  const frontShare = eventId === "event_influencer_visit" ? 0.38 : 0.45;
  const frontWindowSec = Math.min(eventId === "event_influencer_visit" ? 30 : 34, state.level.durationSec * 0.42);
  const frontCount = Math.max(1, Math.ceil(sortedItems.length * frontShare));

  for (let index = 0; index < sortedItems.length; index += 1) {
    const item = sortedItems[index];
    if (index < frontCount) {
      const spacingSec = frontCount <= 1 ? 0 : frontWindowSec / frontCount;
      const jitterSec = index === 0 ? 0 : (random() - 0.5) * 0.8;
      item.spawnAtSec = Math.max(0, index * spacingSec + jitterSec);
    } else {
      item.spawnAtSec = Math.max(frontWindowSec, item.spawnAtSec);
    }
  }
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
    state.activeCustomers.length < getMaxWaitingCustomers()
  ) {
    const spawnItem = state.spawnQueue.shift();
    const customerConfig = state.configs.customerById.get(spawnItem.customerId);
    const maxPatienceSec = getCustomerPatienceSec(customerConfig);
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
        state.cookedInventory[slot.dishId] = Math.min(getPreparedDishLimit(), (state.cookedInventory[slot.dishId] ?? 0) + 1);
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
    const penalty = calculateAngryLeavePenalty();
    state.earnedCoins = Math.max(0, state.earnedCoins - penalty);
    state.complaintPenaltyCoins += penalty;
    state.activeCustomers = state.activeCustomers.filter((item) => item.runtimeId !== customer.runtimeId);
    addLog(`${customer.name} 等急走了${penalty > 0 ? `，客诉 -${penalty}` : ""}`);
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
    if (state.level.id >= 11) {
      addLog("当前没有明确缺口，点击具体菜品手动备菜");
    }
    return false;
  }

  return startCooking(equipment, slot, dishId);
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

  return startCooking(equipment, slot, dishId);
}

function startCooking(equipment, slot, dishId) {
  const dish = state.configs.dishById.get(dishId);
  if (isDishAtPreparedLimit(dishId)) {
    addLog(`${dish.name} 已到备菜上限`);
    return false;
  }

  slot.status = "cooking";
  slot.dishId = dishId;
  slot.totalCookTimeSec = getCookDurationSec(dish);
  slot.timeRemainingSec = slot.totalCookTimeSec;
  addLog(`${equipment.name} 开始做 ${dish.name}`);
  return true;
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
    const penalty = calculateWrongServePenalty();
    state.earnedCoins = Math.max(0, state.earnedCoins - penalty);
    state.complaintPenaltyCoins += penalty;
    customer.patienceRemainingSec = Math.max(0, customer.patienceRemainingSec - 2);
    addLog(`菜还没齐，上菜失败${penalty > 0 ? `，客诉 -${penalty}` : ""}`);
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
  const breakdown = calculateCustomerRewardBreakdown(customerConfig, customer.orderDishIds, patienceRatio, state.combo);
  return breakdown.netCoins;
}

function pickNextDishForEquipment(equipmentId) {
  const cookableDishIds = state.level.dishPool.filter((dishId) => {
    return state.configs.dishById.get(dishId).stationId === equipmentId && !isDishAtPreparedLimit(dishId);
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

  if (bestDemand > 0) {
    return bestDishId;
  }

  return state.level.id <= 10 ? (cookableDishIds[0] ?? null) : null;
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

function isDishAtPreparedLimit(dishId) {
  return getSupplyCount(dishId) >= getPreparedDishLimit();
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

  const leftoverLoss = calculateLeftoverLoss();
  const netProfitCoins = Math.max(0, state.earnedCoins - leftoverLoss.lossCoins);
  const success = hasMetMainGoal(netProfitCoins);
  state.phase = "ended";
  state.lastResult = {
    levelId: state.level.id,
    outcome: success ? "success" : "fail",
    earnedCoins: netProfitCoins,
    netProfitCoins,
    baseRewardCoins: netProfitCoins,
    finalRewardCoins: netProfitCoins,
    settlementAdBonusCoins: success ? calculateSettlementAdBonus(state.level, netProfitCoins) : 0,
    servedCustomers: state.servedCustomers,
    maxCombo: state.maxCombo,
    angryLeaveCount: state.angryLeaveCount,
    wrongServeCount: state.wrongServeCount,
    complaintPenaltyCoins: state.complaintPenaltyCoins,
    leftoverLossCoins: leftoverLoss.lossCoins,
    remainingDishCount: leftoverLoss.remainingDishCount,
    stars: success ? calculateStars(netProfitCoins) : 0,
    rewardClaimed: false,
    canWatchSettlementBonusAd: false,
    canWatchExtendTimeAd: !success && canResumeFailedLevel(),
  };
  state.lastResult.canWatchSettlementBonusAd = success && state.lastResult.settlementAdBonusCoins > 0;

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
    result.outcome === "success" && result.canWatchSettlementBonusAd
      ? `广告可追加：${result.settlementAdBonusCoins}`
      : null;

  dom.resultStats.innerHTML = [
    `营业金币：${state.earnedCoins}`,
    `剩菜损耗：-${result.leftoverLossCoins}`,
    `客诉扣款：-${result.complaintPenaltyCoins}`,
    `净利润：${result.netProfitCoins} / ${state.level.goals.coin1}`,
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
  dom.adDoubleButton.textContent = "广告追加金币 mock";
  dom.claimButton.disabled = result.rewardClaimed || result.finalRewardCoins <= 0;
  dom.adDoubleButton.disabled =
    !result.canWatchSettlementBonusAd ||
    state.saveData.adState.settlementBonusWatchedByLevel[levelKey] === true;
  dom.adExtendButton.disabled =
    result.rewardClaimed ||
    !result.canWatchExtendTimeAd ||
    state.saveData.adState.failExtendWatchedByLevel[levelKey] === true;
  dom.nextButton.disabled = result.outcome !== "success";
  dom.resultOverlay.classList.remove("hidden");
}

function hasMetMainGoal(netProfitCoins = state.earnedCoins) {
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
  return netProfitCoins >= goals.coin1;
}

function calculateStars(netProfitCoins = state.earnedCoins) {
  if (netProfitCoins >= state.level.goals.coin3) {
    return 3;
  }
  if (netProfitCoins >= state.level.goals.coin2) {
    return 2;
  }
  if (netProfitCoins >= state.level.goals.coin1) {
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
  return claimSettlementBonusMock();
}

function claimSettlementBonusMock() {
  const result = state.lastResult;
  if (!result || result.outcome !== "success" || !result.canWatchSettlementBonusAd || result.settlementAdBonusCoins <= 0) {
    return false;
  }

  const levelKey = String(result.levelId);
  if (state.saveData.adState.settlementBonusWatchedByLevel[levelKey]) {
    result.canWatchSettlementBonusAd = false;
    renderResultDialog();
    return false;
  }

  if (!result.rewardClaimed) {
    result.finalRewardCoins = result.baseRewardCoins + result.settlementAdBonusCoins;
    settleBaseReward(result);
  } else {
    addRewardCoins(result.settlementAdBonusCoins);
  }

  result.canWatchSettlementBonusAd = false;
  state.saveData.adState.settlementBonusWatchedByLevel[levelKey] = true;
  saveGame();
  addLog(`广告 mock 完成，追加 ${result.settlementAdBonusCoins} 金币`);
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
  state.bonusTimeSec += FAIL_EXTEND_SECONDS;
  state.timeRemainingSec = Math.max(0, getTotalDurationSec() - state.elapsedSec);
  state.phase = "running";
  state.lastFrameMs = performance.now();
  state.lastResult = null;
  dom.resultOverlay.classList.add("hidden");
  addLog(`广告 mock 完成，续时 ${FAIL_EXTEND_SECONDS} 秒`);
  render();
  return true;
}

function claimDailyAdRewardMock() {
  state.saveData = loadSave();
  const dateKey = getLocalDateKey();
  if (state.saveData.adState.dailyRewardWatchedByDate[dateKey]) {
    addLog("今日广告奖励已领取");
    renderHome();
    return false;
  }

  const chapter = getCurrentChapter();
  const rewardCoins = 80 + chapter * 30;
  state.saveData.adState.dailyRewardWatchedByDate[dateKey] = true;
  state.saveData.coins += rewardCoins;
  saveGame();
  addLog(`每日广告 mock 完成，领取 ${rewardCoins} 金币`);
  renderHome();
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
  const storeStage = getStoreVisualStageSummary(currentLevelId);
  dom.homeLevelText.textContent = String(currentLevelId);
  dom.homeCoinText.textContent = String(state.saveData.coins);
  dom.homeStarText.textContent = String(getTotalStars());
  dom.homeProgressText.textContent = `${getMvpCompletedCount()}/${MVP_LEVEL_LIMIT}`;
  dom.playCurrentButton.textContent = `进入第 ${currentLevelId} 关`;
  dom.homeStoreStageText.textContent = `Lv.${storeStage.level} ${storeStage.name}`;
  dom.homeStoreEffectText.textContent = storeStage.mainEffectText;
  dom.homeStoreNextText.textContent = storeStage.nextStageGapText;
  dom.homeStoreHintText.textContent = storeStage.recommendationText ?? "";
  const dailyRewardClaimed = state.saveData.adState.dailyRewardWatchedByDate[getLocalDateKey()] === true;
  dom.dailyAdButton.disabled = dailyRewardClaimed;
  dom.dailyAdButton.textContent = dailyRewardClaimed ? "今日已领取" : "每日广告奖励";
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
  const maxWaitingCustomers = getMaxWaitingCustomers();
  for (let index = 0; index < maxWaitingCustomers; index += 1) {
    const customer = state.activeCustomers[index];
    if (!customer) {
      slots.push('<div class="empty-customer"></div>');
      continue;
    }

    const patienceRatio = customer.maxPatienceSec <= 0 ? 0 : customer.patienceRemainingSec / customer.maxPatienceSec;
    const customerConfig = state.configs.customerById.get(customer.configId);
    const traitLabels = getCustomerTraitLabels(customerConfig);
    const className = traitLabels.includes("急") ? "customer rush" : "customer";
    slots.push(`
      <button class="${className}" type="button" data-customer="${customer.runtimeId}">
        <div class="face"></div>
        <div class="customer-name">${customer.name}</div>
        <div class="trait-tags">${traitLabels.map((label) => `<span>${label}</span>`).join("")}</div>
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
      const recommendedDishId = pickNextDishForEquipment(equipment.configId);
      const canCook =
        state.phase === "running" &&
        equipment.slots.some((slot) => slot.status === "idle") &&
        recommendedDishId !== null;
      const actionLabel =
        state.level.id >= 11
          ? recommendedDishId
            ? `补${getDishName(recommendedDishId)}缺口`
            : "点菜品备菜"
          : "制作需求菜";
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
          <button type="button" data-equipment="${equipment.configId}" ${canCook ? "" : "disabled"}>${actionLabel}</button>
        </div>
      `;
    })
    .join("");
}

function renderInventory() {
  const limit = getPreparedDishLimit();
  const lossRate = getLeftoverLossRate();
  dom.inventory.innerHTML = state.level.dishPool
    .map((dishId) => {
      const count = state.cookedInventory[dishId] ?? 0;
      const riskCoins = calculateDishLeftoverRisk(dishId, count, lossRate);
      return `
        <div class="inventory-item">
          <span>${getDishName(dishId)}<em>${lossRate > 0 && count > 0 ? `风险 -${riskCoins}` : "无损耗"}</em></span>
          <strong>${count}/${limit}</strong>
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
      const canCook = state.phase === "running" && equipment?.slots.some((slot) => slot.status === "idle") && !isDishAtPreparedLimit(dishId);
      return `<button type="button" data-dish="${dishId}" ${canCook ? "" : "disabled"}>${dish.name}<br>${getCookDurationSec(dish).toFixed(1)}s · ${getSupplyCount(dishId)}/${getPreparedDishLimit()}</button>`;
    })
    .join("");
}

function renderLog() {
  const renderKey = state.logLines.join("\n");
  if (dom.logList.dataset.renderKey === renderKey) {
    return;
  }

  const previousScrollTop = dom.logList.scrollTop;
  const shouldStickToLatest = previousScrollTop <= 4;
  dom.logList.dataset.renderKey = renderKey;
  dom.logList.innerHTML = state.logLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("");
  dom.logList.scrollTop = shouldStickToLatest ? 0 : previousScrollTop;
}

function renderUpgrade() {
  state.saveData = loadSave();
  const storeStage = getStoreVisualStageSummary(state.saveData.currentLevelId);
  dom.upgradeCoinText.textContent = String(state.saveData.coins);
  dom.upgradeLevelText.textContent = String(state.saveData.currentLevelId);
  dom.upgradeStoreStageText.textContent = `Lv.${storeStage.level} ${storeStage.name}`;
  dom.upgradeStoreEffectText.textContent = storeStage.mainEffectText;
  dom.upgradeStoreNextText.textContent = storeStage.nextStageGapText;
  dom.upgradeStoreHintText.textContent = storeStage.recommendationText ?? "";
  renderGrowthModeHeader();

  const isStreet = state.growthViewMode === "commercialStreet";
  const isShop = state.growthViewMode === "shop";
  const isOutfit = state.growthViewMode === "outfit";
  const isEquipmentManagement = state.growthViewMode === "equipmentManagement";
  const isPersonalGrowth = state.growthViewMode === "personalGrowth";

  dom.upgradeLevelMeter.classList.toggle("hidden", isStreet || isShop);
  dom.marketSection.classList.toggle("hidden", !isStreet);
  dom.shopSection.classList.toggle("hidden", !isShop);
  dom.outfitSection.classList.toggle("hidden", !isOutfit);
  dom.equipmentManageSection.classList.toggle("hidden", !isEquipmentManagement);
  dom.personalGrowthSection.classList.toggle("hidden", !isPersonalGrowth);

  if (isStreet) {
    renderCommercialStreet();
  } else if (isShop) {
    renderShopInterior();
  } else if (isOutfit) {
    renderOutfitManagement();
  } else if (isEquipmentManagement) {
    renderEquipmentManagement();
  } else if (isPersonalGrowth) {
    renderPersonalGrowth();
  }
}

function renderUpgradeCard(kind, config, preview) {
  const lockedClass = preview.isUnlocked ? "" : " locked";
  const actionText = getUpgradeActionText(kind, preview);
  const isDisabled = kind === "cosmetic" ? !canUseCosmeticAction(preview) : !preview.canUpgrade;
  return `
    <div class="upgrade-card${lockedClass}">
      <div class="upgrade-card-header">
        <span>${config.name}</span>
        <span>${kind === "cosmetic" ? preview.slot : `Lv.${preview.currentLevel}`}</span>
      </div>
      <div class="upgrade-effect">${preview.effectText}</div>
      <div class="upgrade-cost">金币 ${state.saveData.coins}</div>
      <button type="button" data-upgrade-kind="${kind}" data-upgrade-id="${config.id}" ${isDisabled ? "disabled" : ""}>${actionText}</button>
    </div>
  `;
}

function renderGrowthModeHeader() {
  if (state.growthViewMode === "personalGrowth") {
    dom.upgradeKicker.textContent = "个人成长";
    dom.upgradeTitle.textContent = "手艺成长";
    return;
  }
  if (state.growthViewMode === "outfit") {
    dom.upgradeKicker.textContent = "角色衣柜";
    dom.upgradeTitle.textContent = "装扮";
    return;
  }
  if (state.growthViewMode === "equipmentManagement") {
    dom.upgradeKicker.textContent = "摊位资产";
    dom.upgradeTitle.textContent = "设备管理";
    return;
  }
  if (state.growthViewMode === "shop") {
    const shop = getActiveShop();
    dom.upgradeKicker.textContent = "商业街店铺";
    dom.upgradeTitle.textContent = shop.name;
    return;
  }

  dom.upgradeKicker.textContent = "老街商业街";
  dom.upgradeTitle.textContent = "商业街";
}

function renderCommercialStreet() {
  const shop = getActiveShop();
  for (const button of dom.commercialStreet.querySelectorAll("[data-shop-id]")) {
    button.classList.toggle("active", button.dataset.shopId === shop.id);
    button.classList.remove("entering");
  }
}

function renderShopInterior() {
  const shop = getActiveShop();
  dom.activeShopName.textContent = shop.name;
  dom.shopFixture.className = `shop-fixture ${shop.fixtureClass}`;
  dom.shopkeeperBubble.textContent = getCurrentShopkeeperLine(shop);
  dom.shopItemList.innerHTML = shop.items.map(({ kind, config, preview }) => renderUpgradeCard(kind, config, preview)).join("");
}

function renderOutfitManagement() {
  renderAvatarSummary("upgrade");
  const ownedCosmetics = state.configs.cosmetics
    .filter((cosmetic) => state.saveData.ownedCosmeticIds.includes(cosmetic.id))
    .sort((a, b) => a.slot.localeCompare(b.slot) || a.unlockLevel - b.unlockLevel)
    .map((cosmetic) => renderUpgradeCard("cosmetic", cosmetic, previewCosmetic(cosmetic)));

  dom.outfitList.innerHTML =
    ownedCosmetics.join("") || '<div class="empty-state">还没有装扮，去商业街的装扮铺看看。</div>';
}

function renderEquipmentManagement() {
  dom.equipmentManageList.innerHTML = state.configs.equipments
    .filter((equipment) => state.saveData.currentLevelId >= equipment.unlockLevel)
    .sort((a, b) => a.unlockLevel - b.unlockLevel)
    .map((equipment) => renderEquipmentManageCard(equipment))
    .join("") || '<div class="empty-state">还没有设备。</div>';
}

function renderEquipmentManageCard(equipment) {
  const maxLevel = getEquipmentMaxLevel(equipment);
  const level = getSavedLevel(state.saveData.equipmentLevels[equipment.id], maxLevel);
  const isUnlocked = state.saveData.currentLevelId >= equipment.unlockLevel;
  const slotCount = getEquipmentSlotCountAtLevel(equipment, level);
  const speedBonus = Math.round(getEquipmentSpeedBonus(equipment, level) * 100);
  return `
    <div class="upgrade-card${isUnlocked ? "" : " locked"}">
      <div class="upgrade-card-header">
        <span>${equipment.name}</span>
        <span>${isUnlocked ? `Lv.${level}` : `第${equipment.unlockLevel}关`}</span>
      </div>
      <div class="upgrade-effect">${isUnlocked ? `工位 ${slotCount}，制作时间-${speedBonus}%` : "尚未购置"}</div>
      <div class="upgrade-cost">设备资产</div>
    </div>
  `;
}

function getActiveShop() {
  const shops = getCommercialStreetShops();
  return shops.find((shop) => shop.id === state.activeShopId) ?? shops[0];
}

function getCurrentShopkeeperLine(shop) {
  return shop.lines[state.shopkeeperLineIndex % shop.lines.length];
}

function cycleShopkeeperLine() {
  const shop = getActiveShop();
  state.shopkeeperLineIndex = (state.shopkeeperLineIndex + 1) % shop.lines.length;
  dom.shopkeeperBubble.textContent = getCurrentShopkeeperLine(shop);
}

function enterShop(shopId) {
  if (!getCommercialStreetShops().some((shop) => shop.id === shopId)) {
    return;
  }

  state.activeShopId = shopId;
  state.shopkeeperLineIndex = Math.floor(Math.random() * getActiveShop().lines.length);
  showUpgrade("shop");
}

function renderPersonalGrowth() {
  dom.personalGrowthList.innerHTML = state.configs.dishes
    .filter((dish) => dish.unlockLevel <= MVP_LEVEL_LIMIT)
    .sort((a, b) => a.unlockLevel - b.unlockLevel)
    .map((dish) => renderUpgradeCard("dish", dish, previewDish(dish)))
    .join("");
}

function getCommercialStreetShops() {
  return [
    {
      id: "outfitShop",
      name: "装扮铺",
      fixtureClass: "wardrobe",
      lines: ["新围裙刚到，试试手感。", "人靠衣装，摊靠招牌。", "这件耐脏，忙起来不怕溅油。"],
      items: state.configs.cosmetics
        .filter((cosmetic) => cosmetic.unlockLevel <= MVP_LEVEL_LIMIT)
        .sort((a, b) => a.unlockLevel - b.unlockLevel)
        .map((config) => ({ kind: "cosmetic", config, preview: previewCosmetic(config) })),
    },
    {
      id: "applianceShop",
      name: "电器铺",
      fixtureClass: "appliance-shelf",
      lines: ["铁板火候稳，出餐就稳。", "饮品台升级，放学潮也不乱。", "设备趁早添，排队少皱眉。"],
      items: state.configs.equipments
        .filter((equipment) => equipment.unlockLevel <= MVP_LEVEL_LIMIT)
        .sort((a, b) => a.unlockLevel - b.unlockLevel)
        .map((config) => ({ kind: "equipment", config, preview: previewEquipment(config) })),
    },
    {
      id: "kitchenMall",
      name: "厨具商场",
      fixtureClass: "kitchen-shelf",
      lines: ["小摊也要有大排面。", "灯牌亮一点，客人自然看得见。", "好厨具省心，老板少操心。"],
      items: state.configs.storeUpgrades
        .filter((storeUpgrade) => storeUpgrade.unlockLevel <= MVP_LEVEL_LIMIT)
        .sort((a, b) => a.unlockLevel - b.unlockLevel)
        .map((config) => ({ kind: "store", config, preview: previewStoreUpgrade(config) })),
    },
  ];
}

function getUpgradeActionText(kind, preview) {
  if (kind === "cosmetic") {
    if (!preview.isUnlocked) {
      return preview.lockedReason;
    }
    if (!preview.isOwned) {
      return `购买 ${preview.cost}`;
    }
    return preview.isEquipped ? "卸下" : "装备";
  }

  if (preview.isMaxLevel) {
    return "已满";
  }
  if (!preview.isUnlocked) {
    return preview.lockedReason;
  }
  if (kind === "dish") {
    return `成长 ${preview.cost}`;
  }
  return `添置 ${preview.cost}`;
}

function canUseCosmeticAction(preview) {
  if (!preview.isUnlocked) {
    return false;
  }
  if (!preview.isOwned) {
    return preview.canUpgrade;
  }
  return true;
}

function handleUpgradeClick(event) {
  const button = event.target.closest("[data-upgrade-kind]");
  if (!button) {
    return;
  }

  buyUpgrade(button.dataset.upgradeKind, button.dataset.upgradeId);
}

function handleShopClick(event) {
  const button = event.target.closest("[data-shop-id]");
  if (!button) {
    return;
  }

  state.activeShopId = button.dataset.shopId;
  for (const hotspot of dom.commercialStreet.querySelectorAll("[data-shop-id]")) {
    hotspot.classList.toggle("active", hotspot === button);
    hotspot.classList.remove("entering");
  }
  button.classList.add("entering");
  window.setTimeout(() => enterShop(button.dataset.shopId), 220);
}

function buyUpgrade(kind, id) {
  state.saveData = loadSave();
  const config = getUpgradeConfig(kind, id);
  const preview = getUpgradePreview(kind, config);
  if (kind === "cosmetic") {
    return useCosmeticAction(config, preview);
  }

  if (!preview.canUpgrade) {
    return false;
  }

  state.saveData.coins -= preview.cost;
  if (kind === "equipment") {
    state.saveData.equipmentLevels[id] = preview.nextLevel;
  } else if (kind === "store") {
    state.saveData.storeUpgradeLevels[id] = preview.nextLevel;
  } else {
    state.saveData.dishLevels[id] = preview.nextLevel;
  }
  saveGame();
  renderUpgrade();
  return true;
}

function useCosmeticAction(config, preview) {
  if (!config || !canUseCosmeticAction(preview)) {
    return false;
  }

  if (!preview.isOwned) {
    state.saveData.coins -= preview.cost;
    state.saveData.ownedCosmeticIds.push(config.id);
    state.saveData.ownedCosmeticIds.sort();
    equipCosmetic(config);
  } else if (preview.isEquipped) {
    unequipCosmetic(config);
  } else {
    equipCosmetic(config);
  }

  saveGame();
  renderUpgrade();
  renderHome();
  return true;
}

function getUpgradeConfig(kind, id) {
  if (kind === "equipment") {
    return state.configs.equipmentById.get(id);
  }
  if (kind === "store") {
    return state.configs.storeUpgradeById.get(id);
  }
  if (kind === "cosmetic") {
    return state.configs.cosmeticById.get(id);
  }
  return state.configs.dishById.get(id);
}

function getUpgradePreview(kind, config) {
  if (kind === "equipment") {
    return previewEquipment(config);
  }
  if (kind === "store") {
    return previewStoreUpgrade(config);
  }
  if (kind === "cosmetic") {
    return previewCosmetic(config);
  }
  return previewDish(config);
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
  const milestone = getMilestoneAtLevel(config, nextLevel);
  const effectText = !isUnlocked
    ? `第${config.unlockLevel}关解锁`
    : isMaxLevel
      ? "已满级"
      : [
          `制作时间-${Math.round(nextSpeedBonus * 100)}%`,
          nextSlotCount > currentSlotCount ? `工位+${nextSlotCount - currentSlotCount}` : null,
          milestone?.name,
        ]
          .filter(Boolean)
          .join("，");

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
  const maxLevel = getDishMaxLevel(config);
  const currentLevel = getSavedLevel(state.saveData.dishLevels[config.id], maxLevel);
  const isUnlocked = state.saveData.currentLevelId >= config.unlockLevel;
  const isMaxLevel = currentLevel >= maxLevel;
  const nextLevel = isMaxLevel ? currentLevel : currentLevel + 1;
  const cost = isUnlocked && !isMaxLevel ? getDishUpgradeCost(config, currentLevel, getCurrentChapter()) : 0;
  const canAfford = isUnlocked && !isMaxLevel && state.saveData.coins >= cost;
  const currentPrice = getDishPriceAtLevel(config, currentLevel);
  const nextPrice = getDishPriceAtLevel(config, nextLevel);
  const milestone = getMilestoneAtLevel(config, nextLevel);
  const effectText = !isUnlocked
    ? `第${config.unlockLevel}关解锁`
    : isMaxLevel
      ? "已满级"
      : [
          `${getDishDisplayName(config, nextLevel)}，售价+${Math.max(0, nextPrice - currentPrice)}`,
          milestone?.effectText,
        ]
          .filter(Boolean)
          .join("，");

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

function previewStoreUpgrade(config) {
  const currentLevel = getSavedLevel(state.saveData.storeUpgradeLevels[config.id], config.maxLevel);
  const isUnlocked = state.saveData.currentLevelId >= config.unlockLevel;
  const isMaxLevel = currentLevel >= config.maxLevel;
  const nextLevel = isMaxLevel ? currentLevel : currentLevel + 1;
  const cost = isUnlocked && !isMaxLevel ? getStoreUpgradeCost(config, currentLevel, getCurrentChapter()) : 0;
  const canAfford = isUnlocked && !isMaxLevel && state.saveData.coins >= cost;
  const milestone = getMilestoneAtLevel(config, nextLevel);
  const effectText = !isUnlocked
    ? `第${config.unlockLevel}关解锁`
    : isMaxLevel
      ? "已满级"
      : [formatEffects(config.effectsPerLevel), milestone?.effectText ?? milestone?.name].filter(Boolean).join("，");

  return {
    id: config.id,
    currentLevel,
    nextLevel,
    maxLevel: config.maxLevel,
    cost,
    canAfford,
    canUpgrade: canAfford,
    isUnlocked,
    isMaxLevel,
    effectText,
    lockedReason: isUnlocked ? undefined : `第${config.unlockLevel}关解锁`,
  };
}

function previewCosmetic(config) {
  const isUnlocked = state.saveData.currentLevelId >= config.unlockLevel;
  const isOwned = state.saveData.ownedCosmeticIds.includes(config.id);
  const isEquipped = state.saveData.equippedCosmeticIds[config.slot] === config.id;
  const canAfford = isUnlocked && !isOwned && state.saveData.coins >= config.cost;
  return {
    id: config.id,
    currentLevel: isOwned ? 1 : 0,
    nextLevel: 1,
    maxLevel: 1,
    cost: isOwned ? 0 : config.cost,
    canAfford,
    canUpgrade: canAfford,
    isUnlocked,
    isMaxLevel: isOwned,
    effectText: getCosmeticEffectText(config, isOwned, isEquipped),
    lockedReason: isUnlocked ? undefined : `第${config.unlockLevel}关解锁`,
    isOwned,
    isEquipped,
    slot: getSlotDisplayName(config.slot),
  };
}

function getCosmeticEffectText(config, isOwned, isEquipped) {
  const setName = config.setId ? state.configs.cosmeticSetById.get(config.setId)?.name : null;
  const effectText = formatEffects(config.effects);
  const statusText = isOwned ? (isEquipped ? "已装备" : "已拥有") : effectText;
  return [statusText, setName ? `套装：${setName}` : null].filter(Boolean).join("，");
}

function renderAvatarSummary(target) {
  const avatar = getSelectedAvatar();
  const equippedCosmetics = getEquippedCosmetics();
  const activeSets = getActiveCosmeticSets();
  const outfitText = equippedCosmetics.map((item) => item.name).join(" / ") || "未装备装扮";
  const setText = activeSets.length > 0 ? `（${activeSets.map((item) => item.name).join(" / ")}）` : "";
  const image = target === "upgrade" ? dom.upgradeAvatarImage : null;
  const nameText = target === "upgrade" ? dom.upgradeAvatarText : null;
  const outfit = target === "upgrade" ? dom.upgradeOutfitText : null;

  if (image) {
    image.src = toResourceUrl(avatar.previewSpritePath || avatar.portraitPath);
  }
  if (nameText) {
    nameText.textContent = avatar.name;
  }
  if (outfit) {
    outfit.textContent = `${outfitText}${setText}`;
  }
}

function getSelectedAvatar() {
  return (
    state.configs.avatarById.get(state.saveData.selectedAvatarId) ??
    state.configs.avatars.find((avatar) => avatar.gender === state.saveData.selectedGender) ??
    state.configs.avatars[0] ?? {
      id: "avatar_male_boss",
      name: "男老板",
      gender: "male",
      portraitPath: "placeholders/avatar/male_boss.svg",
      previewSpritePath: "placeholders/avatar/male_boss.svg",
    }
  );
}

function getEquippedCosmetics() {
  return Object.values(state.saveData.equippedCosmeticIds)
    .map((cosmeticId) => state.configs.cosmeticById.get(cosmeticId))
    .filter((cosmetic) => cosmetic && state.saveData.ownedCosmeticIds.includes(cosmetic.id))
    .sort((a, b) => getSlotSortIndex(a.slot) - getSlotSortIndex(b.slot));
}

function getActiveCosmeticSets() {
  const equippedIds = new Set(getEquippedCosmetics().map((cosmetic) => cosmetic.id));
  return state.configs.cosmeticSets.filter((cosmeticSet) => {
    return cosmeticSet.requiredCosmeticIds.every((cosmeticId) => equippedIds.has(cosmeticId));
  });
}

function selectAvatarByGender(gender) {
  state.saveData = loadSave();
  if (state.saveData.avatarSelectionLocked) {
    return false;
  }

  const avatar = state.configs.avatars.find((item) => item.gender === gender);
  if (!avatar) {
    return false;
  }

  state.saveData.selectedAvatarId = avatar.id;
  state.saveData.selectedGender = avatar.gender;
  state.saveData.avatarSelectionLocked = true;
  saveGame();
  showHome();
  return true;
}

function equipCosmeticById(cosmeticId) {
  const cosmetic = state.configs.cosmeticById.get(cosmeticId);
  if (!cosmetic) {
    return false;
  }
  state.saveData = loadSave();
  const didEquip = equipCosmetic(cosmetic);
  if (didEquip) {
    saveGame();
    renderUpgrade();
    renderHome();
  }
  return didEquip;
}

function unequipCosmeticById(cosmeticId) {
  const cosmetic = state.configs.cosmeticById.get(cosmeticId);
  if (!cosmetic) {
    return false;
  }
  state.saveData = loadSave();
  const didUnequip = unequipCosmetic(cosmetic);
  if (didUnequip) {
    saveGame();
    renderUpgrade();
    renderHome();
  }
  return didUnequip;
}

function equipCosmetic(config) {
  if (!state.saveData.ownedCosmeticIds.includes(config.id)) {
    return false;
  }

  state.saveData.equippedCosmeticIds[config.slot] = config.id;
  return true;
}

function unequipCosmetic(config) {
  if (state.saveData.equippedCosmeticIds[config.slot] !== config.id) {
    return false;
  }

  delete state.saveData.equippedCosmeticIds[config.slot];
  return true;
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
  const raw = [SAVE_KEY, ...LEGACY_SAVE_KEYS].map((key) => localStorage.getItem(key)).find((item) => item !== null);
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
  const merged = mergeSaveData(state.saveData);
  merged.cloudSync.revision += 1;
  localStorage.setItem(SAVE_KEY, JSON.stringify(merged));
}

function clearSaveAndRefresh() {
  localStorage.removeItem(SAVE_KEY);
  for (const legacyKey of LEGACY_SAVE_KEYS) {
    localStorage.removeItem(legacyKey);
  }
  state.saveData = loadSave();
  state.phase = "idle";
  state.lastResult = null;
  dom.resultOverlay.classList.add("hidden");
  showHome();
}

function mergeSaveData(rawParsed) {
  const defaults = cloneDefaultSaveData();
  const parsed = rawParsed && typeof rawParsed === "object" ? rawParsed : {};
  const selectedAvatarId = normalizeAvatarId(parsed.selectedAvatarId, parsed.selectedGender);
  return {
    ...defaults,
    ...parsed,
    schemaVersion: 3,
    playerId: typeof parsed.playerId === "string" ? parsed.playerId : defaults.playerId,
    selectedAvatarId,
    selectedGender: inferGenderFromAvatarId(selectedAvatarId, normalizeGender(parsed.selectedGender, defaults.selectedGender)),
    avatarSelectionLocked: parsed.avatarSelectionLocked === true,
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
    storeUpgradeLevels: {
      ...defaults.storeUpgradeLevels,
      ...normalizeLevelMap(parsed.storeUpgradeLevels),
    },
    ownedCosmeticIds: normalizeStringIds(parsed.ownedCosmeticIds),
    equippedCosmeticIds: normalizeEquippedCosmetics(parsed.equippedCosmeticIds),
    adState: {
      settlementBonusWatchedByLevel: {
        ...defaults.adState.settlementBonusWatchedByLevel,
        ...normalizeBooleanMap(parsed.adState?.settlementBonusWatchedByLevel ?? parsed.adState?.settlementDoubleWatchedByLevel),
      },
      failExtendWatchedByLevel: {
        ...defaults.adState.failExtendWatchedByLevel,
        ...normalizeBooleanMap(parsed.adState?.failExtendWatchedByLevel),
      },
      dailyRewardWatchedByDate: {
        ...defaults.adState.dailyRewardWatchedByDate,
        ...normalizeBooleanMap(parsed.adState?.dailyRewardWatchedByDate),
      },
    },
    cloudSync: {
      revision: normalizePositiveInteger(parsed.cloudSync?.revision, defaults.cloudSync.revision + 1) - 1,
      lastSyncedAt: typeof parsed.cloudSync?.lastSyncedAt === "string" ? parsed.cloudSync.lastSyncedAt : "",
      lastSyncStatus: ["idle", "pending", "synced", "failed"].includes(parsed.cloudSync?.lastSyncStatus)
        ? parsed.cloudSync.lastSyncStatus
        : "idle",
    },
  };
}

function cloneDefaultSaveData() {
  return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
}

function normalizePositiveInteger(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
}

function normalizeGender(value, fallback) {
  return value === "male" || value === "female" ? value : fallback;
}

function normalizeAvatarId(value, gender) {
  if (value === "avatar_male_boss" || value === "avatar_female_boss") {
    return value;
  }

  return normalizeGender(gender, "male") === "female" ? "avatar_female_boss" : "avatar_male_boss";
}

function inferGenderFromAvatarId(value, fallback) {
  if (value === "avatar_female_boss") {
    return "female";
  }
  if (value === "avatar_male_boss") {
    return "male";
  }
  return fallback;
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

function normalizeStringIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((item) => typeof item === "string" && item.length > 0))].sort();
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

function normalizeEquippedCosmetics(value) {
  const normalized = {};
  if (!value || typeof value !== "object") {
    return normalized;
  }

  const allowedSlots = new Set(["hair", "hat", "apron", "shoes", "gloves", "clothes", "tool"]);
  for (const [slot, itemId] of Object.entries(value)) {
    if (allowedSlots.has(slot) && typeof itemId === "string" && itemId.length > 0) {
      normalized[slot] = itemId;
    }
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

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStoreUpgradeEffects() {
  const total = {};
  for (const storeUpgrade of state.configs.storeUpgrades) {
    const level = getSavedLevel(state.saveData.storeUpgradeLevels[storeUpgrade.id], storeUpgrade.maxLevel);
    addEffects(total, scaleEffects(storeUpgrade.effectsPerLevel, Math.max(0, level - 1)));
    addEffects(total, getMilestoneEffects(storeUpgrade, level));
  }
  return total;
}

function getTotalEconomyEffects() {
  const total = getStoreUpgradeEffects();
  const equippedOwnedCosmeticIds = new Set();

  for (const cosmeticId of Object.values(state.saveData.equippedCosmeticIds)) {
    const cosmetic = state.configs.cosmeticById.get(cosmeticId);
    if (cosmetic && state.saveData.ownedCosmeticIds.includes(cosmetic.id)) {
      equippedOwnedCosmeticIds.add(cosmetic.id);
      addEffects(total, cosmetic.effects);
    }
  }

  for (const cosmeticSet of state.configs.cosmeticSets) {
    if (cosmeticSet.requiredCosmeticIds.every((cosmeticId) => equippedOwnedCosmeticIds.has(cosmeticId))) {
      addEffects(total, cosmeticSet.effects);
    }
  }

  return total;
}

function getEffectiveCustomerCount(level) {
  const baseCount = Math.max(1, Math.floor(level.modifiers.customerCount));
  if (level.id <= 10) {
    return baseCount;
  }

  const effects = getStoreUpgradeEffects();
  const cap = level.id <= MVP_LEVEL_LIMIT ? FRONT30_CUSTOMER_ATTRACT_CAP : LATE_CUSTOMER_ATTRACT_CAP;
  const attractBonus = Math.min(cap, Math.max(0, effects.customerAttractBonus ?? 0));
  const denseFlowBonus = getLevelDenseFlowBonus(level);
  const eventMultiplier = getLevelEventCustomerCountMultiplier(level);
  return Math.max(1, Math.floor(baseCount * eventMultiplier * (1 + attractBonus + denseFlowBonus) + 0.0001));
}

function getMaxWaitingCustomers() {
  const effects = getStoreUpgradeEffects();
  const extraSlots = Math.floor(Math.max(0, effects.maxWaitingCustomers ?? 0));
  return Math.min(8, Math.max(1, DEFAULT_MAX_WAITING_CUSTOMERS + extraSlots));
}

function getPreparedDishLimit() {
  const effects = getStoreUpgradeEffects();
  const extraLimit = Math.floor(Math.max(0, effects.prepCacheLimit ?? 0));
  return Math.min(8, Math.max(1, DEFAULT_PREP_CACHE_LIMIT + extraLimit));
}

function getStoreVisualStageSummary(levelId = state.saveData.currentLevelId) {
  const upgradeProgress = state.configs.storeUpgrades.reduce((sum, storeUpgrade) => {
    const level = getSavedLevel(state.saveData.storeUpgradeLevels[storeUpgrade.id], storeUpgrade.maxLevel);
    return sum + Math.max(0, level - 1);
  }, 0);
  const effects = getStoreUpgradeEffects();
  const progressStage = [...STORE_VISUAL_STAGES]
    .reverse()
    .find((stage) => upgradeProgress >= stage.minUpgradeProgress) ?? STORE_VISUAL_STAGES[0];
  const visualStageLevel = Math.min(5, Math.max(1, 1 + Math.floor(Math.max(0, effects.visualStage ?? 0))));
  const stageLevel = Math.max(progressStage.level, visualStageLevel);
  const stage = STORE_VISUAL_STAGES.find((item) => item.level === stageLevel) ?? STORE_VISUAL_STAGES[0];
  const nextStage = STORE_VISUAL_STAGES.find((item) => item.level === stage.level + 1);
  const levelsToNextStage = nextStage ? Math.max(0, nextStage.minUpgradeProgress - upgradeProgress) : 0;
  return {
    level: stage.level,
    name: stage.name,
    upgradeProgress,
    mainEffectText: formatStoreMainEffects(effects),
    nextLevel: nextStage?.level,
    nextName: nextStage?.name,
    levelsToNextStage,
    nextStageGapText: nextStage
      ? `还差 ${levelsToNextStage} 次店铺升级到 Lv.${nextStage.level} ${nextStage.name}`
      : "已达到最高视觉阶段",
    recommendationText: getStoreUpgradeRecommendation(levelId),
  };
}

function getStoreUpgradeRecommendation(levelId = state.saveData.currentLevelId) {
  const recommendations = [
    {
      levelId: 15,
      text: "第15关建议补清洁台和备菜台，降低客诉并放宽出餐缓存",
      targets: [
        ["store_cleanliness", 2],
        ["store_prep_table", 2],
      ],
    },
    {
      levelId: 24,
      text: "第24关建议补灯牌、桌椅和门面，承接热狗解锁后的客流",
      targets: [
        ["store_signboard", 3],
        ["store_tables", 3],
        ["store_facade", 2],
      ],
    },
    {
      levelId: 30,
      text: "第30关建议店铺进入夜市摊位阶段，优先桌椅、灯牌、备菜台",
      targets: [
        ["store_tables", 4],
        ["store_signboard", 4],
        ["store_prep_table", 3],
      ],
    },
  ];
  const recommendation = recommendations.find((item) => item.levelId === levelId);
  if (!recommendation) {
    return undefined;
  }

  const missingTargets = recommendation.targets
    .map(([storeUpgradeId, targetLevel]) => {
      const config = state.configs.storeUpgradeById.get(storeUpgradeId);
      if (!config) {
        return null;
      }
      const currentLevel = getSavedLevel(state.saveData.storeUpgradeLevels[storeUpgradeId], config.maxLevel);
      return currentLevel < targetLevel ? `${config.name}Lv.${targetLevel}` : null;
    })
    .filter(Boolean);

  return missingTargets.length > 0
    ? `${recommendation.text}（推荐：${missingTargets.join(" / ")}）`
    : `第${levelId}关店铺推荐已达标`;
}

function calculateCustomerRewardBreakdown(customerConfig, orderDishIds, patienceRatio, combo) {
  const effects = getTotalEconomyEffects();
  const grossSales = orderDishIds.reduce((sum, dishId) => {
    const dish = state.configs.dishById.get(dishId);
    return sum + (dish ? getDishPriceAtLevel(dish, state.saveData.dishLevels[dish.id] ?? 1, effects) : 0);
  }, 0);
  const ingredientCost = orderDishIds.reduce((sum, dishId) => {
    const dish = state.configs.dishById.get(dishId);
    return sum + (dish ? getDishIngredientCostAtLevel(dish, state.saveData.dishLevels[dish.id] ?? 1, effects) : 0);
  }, 0);
  const quickTipRate = Math.min(1, Math.max(0, patienceRatio)) * MAX_QUICK_TIP_BONUS;
  const comboTipRate = Math.min(MAX_COMBO_TIP_BONUS, Math.max(0, combo) * COMBO_TIP_BONUS_PER_STEP);
  const levelRewardMultiplier = state.level.modifiers.rewardMultiplier ?? 1;
  const traitTipRate = getCustomerTraitTipBonus(customerConfig, combo);
  const tipRate = quickTipRate + comboTipRate + traitTipRate + getLevelEventTipBonus(state.level) + (effects.tipBonus ?? 0);
  const ticketMultiplier =
    getCustomerTicketMultiplier(customerConfig) * getPickyCustomerTicketMultiplier(customerConfig) * getLevelEventPriceMultiplier(state.level);
  const tips = Math.round(grossSales * tipRate * customerConfig.tipMultiplier * getPickyCustomerTipMultiplier(customerConfig) * levelRewardMultiplier);
  const adjustedSales = grossSales * customerConfig.tipMultiplier * ticketMultiplier * levelRewardMultiplier;
  const serviceBonus = SERVICE_COIN_BONUS + Math.floor(Math.max(0, effects.rating ?? 0) * 0.5);
  const netCoins = Math.max(1, Math.round(adjustedSales + tips + serviceBonus - ingredientCost));

  return {
    grossSales: Math.round(adjustedSales),
    tips,
    serviceBonus,
    ingredientCost,
    netCoins,
  };
}

function getCustomerPatienceSec(customerConfig) {
  const effects = getTotalEconomyEffects();
  const patienceBonus = Math.min(0.6, Math.max(0, effects.patienceBonus ?? 0));
  return customerConfig.basePatience * (state.level.modifiers.patienceMultiplier ?? 1) * (1 + patienceBonus) * getCustomerPatienceTraitMultiplier(customerConfig);
}

function calculateLeftoverLoss() {
  const lossRate = getLeftoverLossRate();
  const effects = getTotalEconomyEffects();
  let remainingDishCount = 0;
  let ingredientCost = 0;

  for (const [dishId, count] of Object.entries(state.cookedInventory)) {
    const safeCount = Math.max(0, Math.floor(count ?? 0));
    if (safeCount <= 0) {
      continue;
    }

    const dish = state.configs.dishById.get(dishId);
    if (!dish) {
      continue;
    }

    remainingDishCount += safeCount;
    ingredientCost += getDishIngredientCostAtLevel(dish, state.saveData.dishLevels[dish.id] ?? 1, effects) * safeCount;
  }

  return {
    remainingDishCount,
    ingredientCost,
    lossRate,
    lossCoins: Math.round(ingredientCost * lossRate),
  };
}

function calculateDishLeftoverRisk(dishId, count, lossRate = getLeftoverLossRate()) {
  const dish = state.configs.dishById.get(dishId);
  if (!dish || count <= 0 || lossRate <= 0) {
    return 0;
  }

  return Math.round(getDishIngredientCostAtLevel(dish, state.saveData.dishLevels[dish.id] ?? 1, getTotalEconomyEffects()) * count * lossRate);
}

function getLeftoverLossRate() {
  const baseRate = getBaseLeftoverLossRate(state.level?.id ?? 1);
  if (baseRate <= 0) {
    return 0;
  }

  const effects = getStoreUpgradeEffects();
  const reduce = Math.min(MAX_LEFTOVER_LOSS_REDUCE, Math.max(0, effects.leftoverLossReduce ?? 0));
  return Math.max(0, baseRate * (1 - reduce));
}

function getBaseLeftoverLossRate(levelId) {
  if (levelId <= 10) {
    return 0;
  }
  return levelId <= 20 ? MIDGAME_LEFTOVER_LOSS_RATE : LATEGAME_LEFTOVER_LOSS_RATE;
}

function calculateAngryLeavePenalty() {
  const effects = getTotalEconomyEffects();
  const complaintReduce = Math.min(0.8, Math.max(0, effects.complaintReduce ?? 0));
  return Math.max(0, Math.round(4 * (1 - complaintReduce)));
}

function calculateWrongServePenalty() {
  const effects = getTotalEconomyEffects();
  const complaintReduce = Math.min(0.8, Math.max(0, effects.complaintReduce ?? 0));
  return Math.max(0, Math.round(2 * (1 - complaintReduce)));
}

function hasCustomerTrait(customerConfig, ...traits) {
  return traits.some((trait) => customerConfig?.traits?.includes(trait));
}

function getCustomerTraitLabels(customerConfig) {
  const labels = [];
  if (hasCustomerTrait(customerConfig, "low_patience", "pressure_intro")) {
    labels.push("急");
  }
  if (hasCustomerTrait(customerConfig, "combo_bonus", "loyal")) {
    labels.push("熟");
  }
  if (hasCustomerTrait(customerConfig, "picky", "hygiene_sensitive", "facade_sensitive")) {
    labels.push("挑");
  }
  if (hasCustomerTrait(customerConfig, "dense_flow", "lower_ticket")) {
    labels.push("学");
  }
  return labels;
}

function getLevelDenseFlowBonus(level) {
  const denseWeight = Object.entries(level.customerMix).reduce((sum, [customerId, weight]) => {
    const customer = state.configs.customerById.get(customerId);
    return hasCustomerTrait(customer, "dense_flow") ? sum + Math.max(0, weight ?? 0) : sum;
  }, 0);
  return Math.min(0.16, denseWeight * 0.12);
}

function getLevelEventCustomerCountMultiplier(level) {
  if (level.modifiers.eventId === "event_rain_light") {
    return 0.9;
  }
  if (level.modifiers.eventId === "event_school_rush") {
    return 1.12;
  }
  return 1;
}

function getLevelEventPriceMultiplier(level) {
  return level.modifiers.eventId === "event_rain_light" ? 1.15 : 1;
}

function getLevelEventTipBonus(level) {
  if (level.modifiers.eventId === "event_rain_light") {
    return 0.12;
  }
  if (level.modifiers.eventId === "event_influencer_visit") {
    return 0.03;
  }
  if (level.modifiers.eventId === "event_hygiene_check") {
    return 0.02;
  }
  return 0;
}

function getPickyReadiness() {
  const effects = getStoreUpgradeEffects();
  return Math.min(
    1,
    Math.max(0, effects.pickyAcceptance ?? 0) +
      Math.max(0, effects.visualStage ?? 0) * 0.08 +
      Math.max(0, effects.rating ?? 0) * 0.015,
  );
}

function getCustomerPatienceTraitMultiplier(customerConfig) {
  let multiplier = 1;
  if (hasCustomerTrait(customerConfig, "low_patience", "pressure_intro")) {
    multiplier *= 0.92;
  }
  if (hasCustomerTrait(customerConfig, "picky", "hygiene_sensitive", "facade_sensitive")) {
    const requiredReadiness = state.level.modifiers.eventId === "event_hygiene_check" ? 0.28 : 0.18;
    if (getPickyReadiness() < requiredReadiness) {
      multiplier *= 0.82;
    }
  }
  return multiplier;
}

function getCustomerTraitTipBonus(customerConfig, combo) {
  let bonus = 0;
  if (hasCustomerTrait(customerConfig, "low_patience", "pressure_intro")) {
    bonus += 0.08;
  }
  if (hasCustomerTrait(customerConfig, "combo_bonus", "loyal") && combo >= 2) {
    bonus += Math.min(0.18, combo * 0.025);
  }
  return bonus;
}

function getCustomerTicketMultiplier(customerConfig) {
  return hasCustomerTrait(customerConfig, "lower_ticket") ? 0.9 : 1;
}

function getPickyCustomerTicketMultiplier(customerConfig) {
  if (!hasCustomerTrait(customerConfig, "picky", "hygiene_sensitive", "facade_sensitive")) {
    return 1;
  }
  return getPickyReadiness() >= 0.18 ? 1 : 0.92;
}

function getPickyCustomerTipMultiplier(customerConfig) {
  if (!hasCustomerTrait(customerConfig, "picky", "hygiene_sensitive", "facade_sensitive")) {
    return 1;
  }
  return getPickyReadiness() >= 0.18 ? 1 : 0.86;
}

function calculateSettlementAdBonus(level, baseRewardCoins) {
  if (baseRewardCoins <= 0) {
    return 0;
  }

  return Math.max(10, Math.floor(Math.min(baseRewardCoins * SETTLEMENT_AD_BONUS_RATE, level.goals.coin1 * SETTLEMENT_AD_GOAL_CAP_RATE) / 10) * 10);
}

function getMilestoneAtLevel(config, level) {
  return config.upgradeMilestones?.find((milestone) => milestone.level === level) ?? null;
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
    customerAttractBonus: (effects.customerAttractBonus ?? 0) * scale,
    maxWaitingCustomers: (effects.maxWaitingCustomers ?? 0) * scale,
    prepCacheLimit: (effects.prepCacheLimit ?? 0) * scale,
    pickyAcceptance: (effects.pickyAcceptance ?? 0) * scale,
    leftoverLossReduce: (effects.leftoverLossReduce ?? 0) * scale,
    visualStage: (effects.visualStage ?? 0) * scale,
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
  target.customerAttractBonus = (target.customerAttractBonus ?? 0) + (source.customerAttractBonus ?? 0);
  target.maxWaitingCustomers = (target.maxWaitingCustomers ?? 0) + (source.maxWaitingCustomers ?? 0);
  target.prepCacheLimit = (target.prepCacheLimit ?? 0) + (source.prepCacheLimit ?? 0);
  target.pickyAcceptance = (target.pickyAcceptance ?? 0) + (source.pickyAcceptance ?? 0);
  target.leftoverLossReduce = (target.leftoverLossReduce ?? 0) + (source.leftoverLossReduce ?? 0);
  target.visualStage = (target.visualStage ?? 0) + (source.visualStage ?? 0);
}

function formatStoreMainEffects(effects) {
  const parts = [];
  if (effects.customerAttractBonus) {
    parts.push(`客流+${Math.round(effects.customerAttractBonus * 100)}%`);
  }
  if (effects.priceBonus) {
    parts.push(`售价+${Math.round(effects.priceBonus * 100)}%`);
  }
  const waitingSlots = Math.floor(effects.maxWaitingCustomers ?? 0);
  if (waitingSlots > 0) {
    parts.push(`排队上限+${waitingSlots}`);
  }
  if (effects.prepCacheLimit) {
    parts.push(`备菜上限+${Math.floor(effects.prepCacheLimit)}`);
  }
  if (effects.costReduce) {
    parts.push(`食材成本-${Math.round(effects.costReduce * 100)}%`);
  }
  if (effects.complaintReduce) {
    parts.push(`客诉惩罚-${Math.round(effects.complaintReduce * 100)}%`);
  }
  if (effects.pickyAcceptance) {
    parts.push(`挑剔接受+${Math.round(effects.pickyAcceptance * 100)}%`);
  }
  if (effects.leftoverLossReduce) {
    parts.push(`剩菜损耗-${Math.round(effects.leftoverLossReduce * 100)}%`);
  }
  if (effects.rating) {
    parts.push(`口碑+${Math.round(effects.rating * 10) / 10}`);
  }
  return parts.join("，") || "基础摊位";
}

function formatEffects(effects) {
  const parts = [];
  if (effects.priceBonus) {
    parts.push(`售价+${Math.round(effects.priceBonus * 100)}%`);
  }
  if (effects.speedBonus) {
    parts.push(`制作速度+${Math.round(effects.speedBonus * 100)}%`);
  }
  if (effects.costReduce) {
    parts.push(`食材成本-${Math.round(effects.costReduce * 100)}%`);
  }
  if (effects.patienceBonus) {
    parts.push(`顾客耐心+${Math.round(effects.patienceBonus * 100)}%`);
  }
  if (effects.complaintReduce) {
    parts.push(`客诉惩罚-${Math.round(effects.complaintReduce * 100)}%`);
  }
  if (effects.rating) {
    parts.push(`口碑+${effects.rating}`);
  }
  if (effects.tipBonus) {
    parts.push(`小费+${Math.round(effects.tipBonus * 100)}%`);
  }
  if (effects.customerAttractBonus) {
    parts.push(`客流+${Math.round(effects.customerAttractBonus * 100)}%`);
  }
  if (effects.maxWaitingCustomers) {
    parts.push(
      effects.maxWaitingCustomers >= 1
        ? `排队上限+${Math.floor(effects.maxWaitingCustomers)}`
        : `排队上限进度+${Math.round(effects.maxWaitingCustomers * 100)}%`,
    );
  }
  if (effects.prepCacheLimit) {
    parts.push(`备菜上限+${Math.round(effects.prepCacheLimit)}`);
  }
  if (effects.pickyAcceptance) {
    parts.push(`挑剔接受+${Math.round(effects.pickyAcceptance * 100)}%`);
  }
  if (effects.leftoverLossReduce) {
    parts.push(`剩菜损耗-${Math.round(effects.leftoverLossReduce * 100)}%`);
  }
  if (effects.visualStage) {
    parts.push(`视觉阶段+${Math.round(effects.visualStage * 10) / 10}`);
  }
  return parts.join("，") || "外观升级";
}

function getSlotDisplayName(slot) {
  const names = {
    hair: "发型",
    hat: "帽子",
    clothes: "衣服",
    apron: "围裙",
    shoes: "鞋子",
    gloves: "手套",
    tool: "工具",
  };
  return names[slot] ?? slot;
}

function getSlotSortIndex(slot) {
  return ["hair", "hat", "clothes", "apron", "shoes", "gloves", "tool"].indexOf(slot);
}

function toResourceUrl(resourcePath) {
  if (!resourcePath) {
    return "";
  }

  if (/^(https?:)?\/\//.test(resourcePath) || resourcePath.startsWith("data:")) {
    return resourcePath;
  }

  return `../assets/resources/${resourcePath}`;
}

function getDishPrice(dish) {
  const dishLevel = state.saveData.dishLevels[dish.id] ?? 1;
  return getDishPriceAtLevel(dish, dishLevel, getTotalEconomyEffects());
}

function getDishPriceAtLevel(dish, level, effects = {}) {
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

function getDishDisplayName(dish, level) {
  const milestone = [...(dish.upgradeMilestones ?? [])]
    .filter((item) => item.level <= level)
    .sort((a, b) => b.level - a.level)[0];
  return milestone?.name ?? dish.name;
}

function getDishMaxLevel(dish) {
  return Math.max(1, Math.floor(dish.maxLevel ?? DEFAULT_DISH_MAX_LEVEL));
}

function getCookDurationSec(dish) {
  const equipment = state.configs.equipmentById.get(dish.stationId);
  const effects = getTotalEconomyEffects();
  const equipmentLevel = equipment ? state.saveData.equipmentLevels[equipment.id] ?? 1 : 1;
  const speedBonus = Math.min(0.75, (equipment ? getEquipmentSpeedBonus(equipment, equipmentLevel) : 0) + (effects.speedBonus ?? 0));
  return Math.max(0.5, dish.baseCookTime * (1 - speedBonus));
}

function getEquipmentSlotCount(equipment) {
  const equipmentLevel = state.saveData.equipmentLevels[equipment.id] ?? 1;
  return getEquipmentSlotCountAtLevel(equipment, equipmentLevel);
}

function getEquipmentSlotCountAtLevel(equipment, level) {
  if (Array.isArray(equipment.slotUnlockLevels) && equipment.slotUnlockLevels.length > 0) {
    const extraSlots = equipment.slotUnlockLevels.filter((unlockLevel) => level >= unlockLevel).length;
    return Math.min(equipment.slotCountMax, equipment.slotCountBase + extraSlots);
  }

  const extraSlots = Math.floor(Math.max(0, level - 1) / EQUIPMENT_SLOT_LEVEL_STEP);
  return Math.min(equipment.slotCountMax, equipment.slotCountBase + extraSlots);
}

function getEquipmentSpeedBonus(config, level) {
  const baseBonus = Math.max(0, level - 1) * config.speedBonusPerLevel;
  const perLevelBonus = scaleEffects(config.effectsPerLevel, Math.max(0, level - 1)).speedBonus ?? 0;
  const milestoneBonus = getMilestoneEffects(config, level).speedBonus ?? 0;
  return Math.min(config.maxSpeedBonus + 0.12, Math.max(0, baseBonus + perLevelBonus + milestoneBonus));
}

function getEquipmentMaxLevel(config) {
  if (config.maxLevel && config.maxLevel > 0) {
    return Math.floor(config.maxLevel);
  }

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
  const raw = config.baseUpgradeCost * Math.pow(level, 1.52) * (1 + 0.28 * (chapter - 1));
  return roundTo10(raw);
}

function getDishUpgradeCost(config, level, chapter) {
  const raw = config.baseUpgradeCost * Math.pow(level, 1.42) * (1 + 0.2 * (chapter - 1));
  return roundTo10(raw);
}

function getStoreUpgradeCost(config, level, chapter) {
  const raw = config.baseUpgradeCost * Math.pow(level, 1.48) * (1 + 0.22 * (chapter - 1));
  return roundTo10(raw);
}

function roundTo10(value) {
  return Math.round(value / 10) * 10;
}

function addLog(message) {
  state.logLines.unshift(decorateLogMessage(message));
  state.logLines = state.logLines.slice(0, 32);
}

function decorateLogMessage(message) {
  if (/^(🪙|⚠️|🍳|🧾|✅|📋|•)/u.test(message)) {
    return message;
  }
  if (/客诉|上菜失败|等急|未达成目标/.test(message)) {
    return `⚠️ ${message}`;
  }
  if (/金币|满意离开/.test(message)) {
    return `🪙 ${message}`;
  }
  if (/开始做|做好了|备菜|制作/.test(message)) {
    return `🍳 ${message}`;
  }
  if (/点了|菜还没齐/.test(message)) {
    return `🧾 ${message}`;
  }
  if (/达成目标/.test(message)) {
    return `✅ ${message}`;
  }
  if (/营业|开摊|暂停|继续|准备好了/.test(message)) {
    return `📋 ${message}`;
  }
  return `• ${message}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
