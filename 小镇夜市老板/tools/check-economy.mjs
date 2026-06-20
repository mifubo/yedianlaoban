import {
  applySimulatedLevelResult,
  buyUpgrade,
  createDefaultSaveData,
  loadConfigs,
  simulateLevel,
} from './economy-sim-lib.mjs';

const FRONT30_LEVEL_LIMIT = 30;

const recommendedUpgradeTargets = [
  [2, 'store', 'store_signboard', 2],
  [3, 'dish', 'dish_001', 2],
  [4, 'dish', 'dish_002', 2],
  [5, 'equipment', 'station_drink', 2],
  [6, 'equipment', 'station_wok', 2],
  [7, 'dish', 'dish_003', 2],
  [8, 'equipment', 'station_griddle', 2],
  [9, 'store', 'store_tables', 2],
  [10, 'dish', 'dish_001', 3],
  [10, 'dish', 'dish_002', 3],
  [10, 'dish', 'dish_003', 3],
  [11, 'equipment', 'station_griddle', 3],
  [12, 'equipment', 'station_fryer', 2],
  [12, 'dish', 'dish_004', 2],
  [13, 'store', 'store_fridge', 2],
  [14, 'store', 'store_cleanliness', 2],
  [15, 'equipment', 'station_drink', 3],
  [15, 'equipment', 'station_wok', 3],
  [15, 'equipment', 'station_fryer', 3],
  [15, 'dish', 'dish_004', 3],
  [15, 'dish', 'dish_002', 4],
  [16, 'dish', 'dish_003', 4],
  [18, 'dish', 'dish_005', 2],
  [18, 'equipment', 'station_drink', 4],
  [19, 'store', 'store_signboard', 3],
  [20, 'dish', 'dish_004', 4],
  [20, 'dish', 'dish_005', 3],
  [20, 'store', 'store_tables', 3],
  [22, 'store', 'store_fridge', 3],
  [24, 'equipment', 'station_grill', 2],
  [24, 'dish', 'dish_006', 2],
  [25, 'equipment', 'station_grill', 3],
  [25, 'dish', 'dish_006', 3],
  [25, 'equipment', 'station_fryer', 4],
  [26, 'dish', 'dish_005', 4],
  [27, 'equipment', 'station_drink', 5],
  [28, 'store', 'store_signboard', 4],
  [28, 'dish', 'dish_004', 5],
  [29, 'dish', 'dish_006', 4],
  [30, 'equipment', 'station_grill', 4],
  [30, 'store', 'store_tables', 4],
  [30, 'dish', 'dish_006', 5],
];

const configs = loadConfigs();
const errors = [];
const noUpgradeResults = runNoUpgradeBaseline();
const planned = runRecommendedPlan();

validateFront30Progression(planned.results);
validateUpgradeMeaning(noUpgradeResults, planned.results);
validateAdBonus(planned.results);
validateUpgradeDefinitions();

printCurve(planned.results, planned.buys);
printUpgradeSummary(planned.buys, planned.saveData);

if (errors.length > 0) {
  console.error(`Economy check failed with ${errors.length} issue(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Economy check passed: levels 1-30, upgrade pacing, ad bonus caps, and upgrade value checks are valid.');

function runNoUpgradeBaseline() {
  const results = [];
  for (let levelId = 1; levelId <= FRONT30_LEVEL_LIMIT; levelId += 1) {
    const saveData = createDefaultSaveData();
    saveData.currentLevelId = levelId;
    results.push(simulateLevel(configs, levelId, saveData));
  }
  return results;
}

function runRecommendedPlan() {
  const saveData = createDefaultSaveData();
  const results = [];
  const buys = [];

  for (let levelId = 1; levelId <= FRONT30_LEVEL_LIMIT; levelId += 1) {
    saveData.currentLevelId = levelId;
    const beforeLevelBuys = buyRecommendedUpgrades(saveData, levelId);
    buys.push(...beforeLevelBuys);

    const result = simulateLevel(configs, levelId, saveData);
    results.push({
      ...result,
      goalCoin1: configs.levelById.get(levelId).goals.coin1,
      goalCoin2: configs.levelById.get(levelId).goals.coin2,
      goalCoin3: configs.levelById.get(levelId).goals.coin3,
      balanceBeforeReward: saveData.coins,
      upgradeSpendBeforeLevel: beforeLevelBuys.reduce((sum, buy) => sum + buy.cost, 0),
    });
    applySimulatedLevelResult(saveData, result, false);
  }

  return { results, buys, saveData };
}

function buyRecommendedUpgrades(saveData, levelId) {
  const bought = [];
  let didBuy = true;
  while (didBuy) {
    didBuy = false;
    for (const [availableAt, kind, id, targetLevel] of recommendedUpgradeTargets) {
      if (availableAt > levelId || getOwnedLevel(saveData, kind, id) >= targetLevel) {
        continue;
      }

      const currentLevel = configs.levelById.get(levelId);
      const buy = buyUpgrade(configs, saveData, kind, id, currentLevel.chapter);
      if (buy) {
        bought.push({ levelId, ...buy, balanceAfter: saveData.coins });
        didBuy = true;
      }
    }
  }
  return bought;
}

function getOwnedLevel(saveData, kind, id) {
  if (kind === 'equipment') {
    return saveData.equipmentLevels[id] ?? 1;
  }
  if (kind === 'store') {
    return saveData.storeUpgradeLevels[id] ?? 1;
  }
  if (kind === 'cosmetic') {
    return saveData.ownedCosmeticIds.includes(id) ? 1 : 0;
  }
  return saveData.dishLevels[id] ?? 1;
}

function validateFront30Progression(results) {
  const failures = results.filter((result) => result.outcome !== 'success');
  if (failures.length > 0) {
    errors.push(`Recommended upgrade route fails levels: ${failures.map((item) => item.levelId).join(', ')}`);
  }

  for (const result of results) {
    if (result.levelId <= 10 && result.outcome !== 'success') {
      errors.push(`MVP level ${result.levelId} must stay passable.`);
    }
    if (result.earnedCoins < 1) {
      errors.push(`Level ${result.levelId} produced no coins.`);
    }
  }
}

function validateUpgradeMeaning(noUpgradeResults, plannedResults) {
  const coinGoalLevels = configs.levels
    .filter((level) => level.id >= 11 && level.id <= FRONT30_LEVEL_LIMIT && !level.goals.served && !level.goals.combo && !level.goals.targetDishId)
    .map((level) => level.id);
  const noUpgradeCoinFails = noUpgradeResults.filter((result) => {
    return coinGoalLevels.includes(result.levelId) && result.earnedCoins < configs.levelById.get(result.levelId).goals.coin1;
  });

  if (noUpgradeCoinFails.length < 6) {
    errors.push(`Upgrades are too weak: only ${noUpgradeCoinFails.length} coin-goal levels fail without upgrades.`);
  }

  for (const result of plannedResults) {
    const noUpgrade = noUpgradeResults.find((item) => item.levelId === result.levelId);
    if (result.levelId >= 11 && noUpgrade && result.earnedCoins < noUpgrade.earnedCoins) {
      errors.push(`Recommended upgrades reduce level ${result.levelId} earnings.`);
    }
  }
}

function validateAdBonus(results) {
  for (const result of results) {
    if (result.settlementAdBonusCoins <= 0) {
      continue;
    }

    const ratio = result.settlementAdBonusCoins / result.earnedCoins;
    const goalCap = configs.levelById.get(result.levelId).goals.coin1 * 0.6;
    if (ratio > 0.52) {
      errors.push(`Level ${result.levelId} settlement ad bonus ratio is too high: ${(ratio * 100).toFixed(1)}%.`);
    }
    if (result.settlementAdBonusCoins > goalCap + 0.001) {
      errors.push(`Level ${result.levelId} settlement ad bonus exceeds goal cap.`);
    }
  }
}

function validateUpgradeDefinitions() {
  const lemonade = configs.dishById.get('dish_002');
  const lemonadeMilestoneNames = (lemonade.upgradeMilestones ?? []).map((item) => item.name).join('|');
  for (const name of ['鸭屎香柠檬水', '霸王柠檬水', '招牌桶装柠檬水']) {
    if (!lemonadeMilestoneNames.includes(name)) {
      errors.push(`Lemonade product ladder is missing: ${name}`);
    }
  }

  for (const dish of configs.dishes.filter((item) => item.unlockLevel <= FRONT30_LEVEL_LIMIT)) {
    const level1Price = dish.basePrice;
    const level5Milestone = dish.upgradeMilestones?.find((item) => item.level === 5);
    if (!level5Milestone) {
      errors.push(`Dish ${dish.id} needs a level 5 product milestone.`);
    }
    if ((dish.maxLevel ?? 0) < 15) {
      errors.push(`Dish ${dish.id} maxLevel should support long-term upgrades.`);
    }
    if (level1Price <= 0) {
      errors.push(`Dish ${dish.id} has invalid base price.`);
    }
  }

  for (const equipment of configs.equipments.filter((item) => item.unlockLevel <= FRONT30_LEVEL_LIMIT)) {
    if (!Array.isArray(equipment.slotUnlockLevels) || equipment.slotUnlockLevels.length === 0) {
      errors.push(`Equipment ${equipment.id} needs configured slot breakthrough levels.`);
    }
  }
}

function printCurve(results, buys) {
  console.log('Front-30 economy curve with recommended upgrades:');
  console.log('level outcome stars coins goal1 adBonus spend balance served combo angry buys');
  for (const result of results) {
    const levelBuys = buys
      .filter((buy) => buy.levelId === result.levelId)
      .map((buy) => `${buy.id}->${buy.to}`)
      .join(',');
    console.log(
      `${String(result.levelId).padStart(5)} ${result.outcome.padEnd(7)} ${String(result.stars).padStart(5)} ${String(result.earnedCoins).padStart(5)} ${String(result.goalCoin1).padStart(5)} ${String(result.settlementAdBonusCoins).padStart(7)} ${String(result.upgradeSpendBeforeLevel).padStart(5)} ${String(result.balanceBeforeReward).padStart(7)} ${String(result.servedCustomers).padStart(6)} ${String(result.maxCombo).padStart(5)} ${String(result.angryLeaveCount).padStart(5)} ${levelBuys}`,
    );
  }
}

function printUpgradeSummary(buys, saveData) {
  const totalSpend = buys.reduce((sum, buy) => sum + buy.cost, 0);
  console.log(`Upgrade spend through level 30: ${totalSpend} coins across ${buys.length} purchases.`);
  console.log(`Ending balance without ad rewards: ${saveData.coins} coins.`);
  console.log('Final upgrade levels:', {
    dishes: saveData.dishLevels,
    equipments: saveData.equipmentLevels,
    store: saveData.storeUpgradeLevels,
  });
}
