import {
  createDefaultSaveData,
  equipCosmetic,
  getTotalEconomyEffects,
  loadConfigs,
  selectAvatarByGender,
} from './economy-sim-lib.mjs';

const configs = loadConfigs();
const saveData = createDefaultSaveData();
const errors = [];

const tidyHair = configs.cosmeticById.get('cosmetic_tidy_hair');
const hairBand = configs.cosmeticById.get('cosmetic_ponytail_band');
const veteranSet = configs.cosmeticSetById.get('night_market_veteran');

if (!selectAvatarByGender(configs, saveData, 'female')) {
  errors.push('Selecting avatar gender for the first time should succeed.');
}
if (!saveData.avatarSelectionLocked || saveData.selectedGender !== 'female') {
  errors.push('Selecting avatar gender should lock the character identity.');
}
if (selectAvatarByGender(configs, saveData, 'male')) {
  errors.push('Changing avatar gender after lock should fail.');
}

if (!tidyHair || !hairBand || !veteranSet) {
  errors.push('Missing required avatar/cosmetic test fixtures.');
} else {
  if (equipCosmetic(configs, saveData, tidyHair.id)) {
    errors.push('Equipping an unowned cosmetic should fail.');
  }

  saveData.ownedCosmeticIds.push(tidyHair.id, hairBand.id);
  if (!equipCosmetic(configs, saveData, tidyHair.id)) {
    errors.push('Equipping an owned cosmetic should succeed.');
  }
  if (!equipCosmetic(configs, saveData, hairBand.id)) {
    errors.push('Equipping a second owned hair cosmetic should succeed.');
  }
  if (saveData.equippedCosmeticIds.hair !== hairBand.id) {
    errors.push('Equipping a cosmetic should replace the item in the same slot.');
  }

  for (const cosmeticId of veteranSet.requiredCosmeticIds) {
    if (!saveData.ownedCosmeticIds.includes(cosmeticId)) {
      saveData.ownedCosmeticIds.push(cosmeticId);
    }
    if (!equipCosmetic(configs, saveData, cosmeticId)) {
      errors.push(`Equipping set cosmetic should succeed: ${cosmeticId}`);
    }
  }

  const effects = getTotalEconomyEffects(configs, saveData);
  if ((effects.rating ?? 0) < (veteranSet.effects.rating ?? 0)) {
    errors.push('Equipped set effects should contribute rating to total economy effects.');
  }
  if ((effects.complaintReduce ?? 0) < (veteranSet.effects.complaintReduce ?? 0)) {
    errors.push('Equipped set effects should contribute complaint reduction to total economy effects.');
  }
}

if (errors.length > 0) {
  console.error(`Avatar/cosmetic behavior test failed with ${errors.length} issue(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Avatar/cosmetic behavior test passed: ownership gate, slot exclusivity, and set effects are valid.');
