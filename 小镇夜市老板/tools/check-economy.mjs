import {
  applySimulatedLevelResult,
  buyUpgrade,
  createDefaultSaveData,
  getBaseLeftoverLossRate,
  getEffectiveCustomerCount,
  getLeftoverLossRate,
  getStoreVisualStageSummary,
  getTotalEconomyEffects,
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
  [15, 'store', 'store_prep_table', 2],
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
  [21, 'store', 'store_facade', 2],
  [22, 'store', 'store_fridge', 3],
  [24, 'equipment', 'station_grill', 2],
  [24, 'dish', 'dish_006', 2],
  [24, 'store', 'store_signboard', 4],
  [25, 'equipment', 'station_grill', 3],
  [25, 'dish', 'dish_006', 3],
  [25, 'equipment', 'station_fryer', 4],
  [26, 'store', 'store_prep_table', 3],
  [26, 'dish', 'dish_005', 4],
  [27, 'equipment', 'station_drink', 5],
  [28, 'store', 'store_facade', 3],
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
validateStoreUpgradeV1(planned.saveData);
validateGameplayV1(noUpgradeResults, planned.results, planned.saveData);

printCurve(planned.results, planned.buys);
printUpgradeSummary(planned.buys, planned.saveData);

if (errors.length > 0) {
  console.error(`Economy check failed with ${errors.length} issue(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Economy check passed: levels 1-30, upgrade pacing, v1 traits/events/leftover loss, ad bonus caps, and upgrade value checks are valid.');

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

function validateStoreUpgradeV1(saveData) {
  const requiredStoreUpgrades = [
    ['store_signboard', ['priceBonus', 'rating', 'customerAttractBonus']],
    ['store_tables', ['patienceBonus', 'maxWaitingCustomers']],
    ['store_fridge', ['costReduce', 'leftoverLossReduce']],
    ['store_cleanliness', ['complaintReduce', 'pickyAcceptance']],
    ['store_prep_table', ['prepCacheLimit', 'leftoverLossReduce']],
    ['store_facade', ['visualStage', 'rating']],
  ];

  for (const [storeUpgradeId, effectKeys] of requiredStoreUpgrades) {
    const config = configs.storeUpgradeById.get(storeUpgradeId);
    if (!config) {
      errors.push(`Missing store upgrade v1 item: ${storeUpgradeId}`);
      continue;
    }

    const availableKeys = new Set([
      ...Object.keys(config.effectsPerLevel ?? {}),
      ...(config.upgradeMilestones ?? []).flatMap((milestone) => Object.keys(milestone.effects ?? {})),
    ]);
    for (const effectKey of effectKeys) {
      if (!availableKeys.has(effectKey)) {
        errors.push(`Store upgrade ${storeUpgradeId} must expose ${effectKey}.`);
      }
    }

    if (availableKeys.has('speedBonus')) {
      errors.push(`Store upgrade ${storeUpgradeId} must not define speedBonus.`);
    }
  }

  for (const level of configs.levels.filter((item) => item.id >= 11 && item.id <= FRONT30_LEVEL_LIMIT)) {
    const effectiveCustomers = getEffectiveCustomerCount(configs, saveData, level);
    const noStoreAttractSave = createDefaultSaveData();
    noStoreAttractSave.currentLevelId = level.id;
    const eventAndTraitBaseline = getEffectiveCustomerCount(configs, noStoreAttractSave, level);
    const maxAllowed = Math.floor(eventAndTraitBaseline * 1.15 + 0.0001);
    if (effectiveCustomers > maxAllowed) {
      errors.push(`Level ${level.id} exceeds the front-30 signboard traffic cap: ${effectiveCustomers}/${maxAllowed}.`);
    }
  }

  const finalEffects = getTotalEconomyEffects(configs, saveData);
  if ((finalEffects.speedBonus ?? 0) > 0) {
    errors.push('Recommended store path must not add store speedBonus.');
  }

  const stage = getStoreVisualStageSummary(configs, saveData, FRONT30_LEVEL_LIMIT);
  if (stage.level < 3) {
    errors.push(`Recommended route should reach at least store visual Lv.3 by level 30, got Lv.${stage.level}.`);
  }
}

function validateGameplayV1(noUpgradeResults, plannedResults, plannedSaveData) {
  if (getBaseLeftoverLossRate(10) !== 0 || Math.abs(getBaseLeftoverLossRate(11) - 0.4) > 0.0001 || Math.abs(getBaseLeftoverLossRate(21) - 0.6) > 0.0001) {
    errors.push('Leftover loss base rates must be 0% for 1-10, 40% for 11-20, and 60% from 21.');
  }

  for (const result of plannedResults.filter((item) => item.levelId <= 10)) {
    if (result.leftoverLossCoins !== 0) {
      errors.push(`Level ${result.levelId} must not deduct leftover loss before level 11.`);
    }
  }

  const baseSave = createDefaultSaveData();
  baseSave.currentLevelId = 21;
  const upgradedSave = createDefaultSaveData();
  upgradedSave.currentLevelId = 21;
  upgradedSave.storeUpgradeLevels.store_fridge = 3;
  upgradedSave.storeUpgradeLevels.store_prep_table = 3;
  const level21 = configs.levelById.get(21);
  const baseLossRate = getLeftoverLossRate(configs, baseSave, level21);
  const upgradedLossRate = getLeftoverLossRate(configs, upgradedSave, level21);
  if (!(upgradedLossRate < baseLossRate)) {
    errors.push(`Fridge/prep upgrades should reduce leftover loss rate: ${baseLossRate} -> ${upgradedLossRate}.`);
  }

  const rainLevel = configs.levelById.get(14);
  const rainCustomers = getEffectiveCustomerCount(configs, createDefaultSaveData(), rainLevel);
  if (!(rainCustomers < rainLevel.modifiers.customerCount)) {
    errors.push(`event_rain_light should reduce customer count, got ${rainCustomers}/${rainLevel.modifiers.customerCount}.`);
  }

  const schoolRushLevel = configs.levelById.get(25);
  const schoolRushCustomers = getEffectiveCustomerCount(configs, createDefaultSaveData(), schoolRushLevel);
  if (!(schoolRushCustomers > schoolRushLevel.modifiers.customerCount)) {
    errors.push(`event_school_rush and student density should increase customer count, got ${schoolRushCustomers}/${schoolRushLevel.modifiers.customerCount}.`);
  }

  const customerTraits = new Map(configs.customers.map((customer) => [customer.id, new Set(customer.traits ?? [])]));
  const requiredTraitCustomers = [
    ['customer_005', 'low_patience'],
    ['customer_002', 'dense_flow'],
    ['customer_006', 'combo_bonus'],
    ['customer_007', 'picky'],
  ];
  for (const [customerId, trait] of requiredTraitCustomers) {
    if (!customerTraits.get(customerId)?.has(trait)) {
      errors.push(`Customer ${customerId} must define trait ${trait}.`);
    }
  }

  const hasLoyalLevel = configs.levels.some((level) => level.id >= 11 && (level.customerMix.customer_006 ?? 0) > 0);
  const hasPickyLevel = configs.levels.some((level) => level.id >= 11 && (level.customerMix.customer_007 ?? 0) > 0);
  if (!hasLoyalLevel || !hasPickyLevel) {
    errors.push('Post-10 levels must include loyal and picky customers so trait rules are exercised.');
  }

  const post10WithoutManualPrep = plannedResults.filter((result) => result.levelId >= 11 && result.manualPrepDecisionCount <= 0);
  if (post10WithoutManualPrep.length > 0) {
    errors.push(`Post-10 simulations must make manual prep decisions: ${post10WithoutManualPrep.map((item) => item.levelId).join(', ')}.`);
  }

  const plannedLevel28 = plannedResults.find((result) => result.levelId === 28);
  if (!plannedLevel28 || plannedLevel28.complaintPenaltyCoins < 0) {
    errors.push('Level 28 hygiene check simulation should report complaint penalty accounting.');
  }

  const plannedLossRate = getLeftoverLossRate(configs, plannedSaveData, level21);
  if (!(plannedLossRate <= baseLossRate)) {
    errors.push('Recommended save path should not increase leftover loss rate.');
  }
}

function printCurve(results, buys) {
  console.log('Front-30 economy curve with recommended upgrades:');
  console.log('level outcome stars net goal1 loss complain adBonus spend balance served combo angry prep buys');
  for (const result of results) {
    const levelBuys = buys
      .filter((buy) => buy.levelId === result.levelId)
      .map((buy) => `${buy.id}->${buy.to}`)
      .join(',');
    console.log(
      `${String(result.levelId).padStart(5)} ${result.outcome.padEnd(7)} ${String(result.stars).padStart(5)} ${String(result.earnedCoins).padStart(5)} ${String(result.goalCoin1).padStart(5)} ${String(result.leftoverLossCoins).padStart(4)} ${String(result.complaintPenaltyCoins).padStart(8)} ${String(result.settlementAdBonusCoins).padStart(7)} ${String(result.upgradeSpendBeforeLevel).padStart(5)} ${String(result.balanceBeforeReward).padStart(7)} ${String(result.servedCustomers).padStart(6)} ${String(result.maxCombo).padStart(5)} ${String(result.angryLeaveCount).padStart(5)} ${String(result.manualPrepDecisionCount).padStart(4)} ${levelBuys}`,
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
