import { createDefaultSaveData, loadConfigs, simulateLevel } from './economy-sim-lib.mjs';

const MVP_LEVEL_LIMIT = 10;

const configs = loadConfigs();
const results = [];

for (let levelId = 1; levelId <= MVP_LEVEL_LIMIT; levelId += 1) {
  const saveData = createDefaultSaveData();
  saveData.currentLevelId = levelId;
  results.push(simulateLevel(configs, levelId, saveData));
}

const failures = results.filter((result) => result.outcome !== 'success');
const firstTenLevels = configs.levels.filter((level) => level.id <= MVP_LEVEL_LIMIT);
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

function printSummary(items, scope) {
  console.log('MVP simulation passed for levels 1-10.');
  console.log(
    `MVP scope in first 10 levels: ${scope.dishCount} dishes, ${scope.equipmentCount} equipments, ${scope.customerCount} customers.`,
  );
  console.log('level outcome stars coins adBonus served combo angry elapsed');
  for (const item of items) {
    console.log(
      `${String(item.levelId).padStart(5)} ${item.outcome.padEnd(7)} ${String(item.stars).padStart(5)} ${String(item.earnedCoins).padStart(5)} ${String(item.settlementAdBonusCoins).padStart(7)} ${String(item.servedCustomers).padStart(6)} ${String(item.maxCombo).padStart(5)} ${String(item.angryLeaveCount).padStart(5)} ${String(item.elapsedSec).padStart(7)}`,
    );
  }
}
