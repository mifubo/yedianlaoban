import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const configDir = path.join(projectRoot, 'assets', 'resources', 'configs');

const files = {
  levels: path.join(configDir, 'levels_mvp.json'),
  dishes: path.join(configDir, 'dishes.json'),
  customers: path.join(configDir, 'customers.json'),
  equipments: path.join(configDir, 'equipments.json'),
  storeUpgrades: path.join(configDir, 'store_upgrades.json'),
  cosmetics: path.join(configDir, 'cosmetics.json'),
};

const errors = [];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`Cannot read ${path.relative(projectRoot, filePath)}: ${error.message}`);
    return [];
  }
}

function assertArray(name, value) {
  if (!Array.isArray(value)) {
    errors.push(`${name} must be an array.`);
    return [];
  }
  return value;
}

function indexById(name, items) {
  const map = new Map();
  for (const item of items) {
    if (!item || typeof item.id !== 'string' && typeof item.id !== 'number') {
      errors.push(`${name} has an item without a string/number id.`);
      continue;
    }
    if (map.has(item.id)) {
      errors.push(`${name} has duplicate id: ${item.id}`);
      continue;
    }
    map.set(item.id, item);
  }
  return map;
}

function requireNumber(label, value, min = 0) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < min) {
    errors.push(`${label} must be a number >= ${min}.`);
  }
}

function requireExisting(map, label, id) {
  if (!map.has(id)) {
    errors.push(`${label} references missing id: ${id}`);
  }
}

const levels = assertArray('levels', readJson(files.levels));
const dishes = assertArray('dishes', readJson(files.dishes));
const customers = assertArray('customers', readJson(files.customers));
const equipments = assertArray('equipments', readJson(files.equipments));
const storeUpgrades = assertArray('storeUpgrades', readJson(files.storeUpgrades));
const cosmeticsConfig = normalizeCosmeticsConfig(readJson(files.cosmetics));
const avatars = assertArray('cosmetics.avatars', cosmeticsConfig.avatars);
const cosmetics = assertArray('cosmetics.items', cosmeticsConfig.items);
const cosmeticSets = assertArray('cosmetics.sets', cosmeticsConfig.sets);

const levelById = indexById('levels', levels);
const dishById = indexById('dishes', dishes);
const customerById = indexById('customers', customers);
const equipmentById = indexById('equipments', equipments);
indexById('storeUpgrades', storeUpgrades);
const avatarById = indexById('cosmetics.avatars', avatars);
const cosmeticById = indexById('cosmetics.items', cosmetics);
const cosmeticSetById = indexById('cosmetics.sets', cosmeticSets);

if (levels.length < 30) {
  errors.push(`levels should contain at least 30 items, got ${levels.length}.`);
}

for (let id = 1; id <= 30; id += 1) {
  if (!levelById.has(id)) {
    errors.push(`levels is missing level id ${id}.`);
  }
}

if (dishes.length < 12) {
  errors.push(`dishes should contain at least 12 items, got ${dishes.length}.`);
}

if (customers.length < 6) {
  errors.push(`customers should contain at least 6 items, got ${customers.length}.`);
}

for (const equipment of equipments) {
  requireNumber(`Equipment ${equipment.id}.unlockLevel`, equipment.unlockLevel, 1);
  requireNumber(`Equipment ${equipment.id}.slotCountBase`, equipment.slotCountBase, 1);
  requireNumber(`Equipment ${equipment.id}.slotCountMax`, equipment.slotCountMax, equipment.slotCountBase ?? 1);
  requireNumber(`Equipment ${equipment.id}.baseUpgradeCost`, equipment.baseUpgradeCost, 1);
  requireNumber(`Equipment ${equipment.id}.speedBonusPerLevel`, equipment.speedBonusPerLevel, 0);
  requireNumber(`Equipment ${equipment.id}.maxSpeedBonus`, equipment.maxSpeedBonus, 0);
  if (equipment.maxLevel !== undefined) {
    requireNumber(`Equipment ${equipment.id}.maxLevel`, equipment.maxLevel, 1);
  }
  for (const slotLevel of equipment.slotUnlockLevels ?? []) {
    requireNumber(`Equipment ${equipment.id}.slotUnlockLevels[]`, slotLevel, 2);
  }
  validateMilestones(`Equipment ${equipment.id}`, equipment.upgradeMilestones, equipment.maxLevel ?? 20);
}

for (const dish of dishes) {
  requireExisting(equipmentById, `Dish ${dish.id}.stationId`, dish.stationId);
  requireNumber(`Dish ${dish.id}.unlockLevel`, dish.unlockLevel, 1);
  requireNumber(`Dish ${dish.id}.basePrice`, dish.basePrice, 1);
  requireNumber(`Dish ${dish.id}.baseCookTime`, dish.baseCookTime, 0.1);
  requireNumber(`Dish ${dish.id}.complexity`, dish.complexity, 1);
  requireNumber(`Dish ${dish.id}.baseUpgradeCost`, dish.baseUpgradeCost, 1);
  if (dish.ingredientCostRate !== undefined) {
    requireNumber(`Dish ${dish.id}.ingredientCostRate`, dish.ingredientCostRate, 0.05);
    if (dish.ingredientCostRate >= 0.75) {
      errors.push(`Dish ${dish.id}.ingredientCostRate should be < 0.75.`);
    }
  }
  if (dish.maxLevel !== undefined) {
    requireNumber(`Dish ${dish.id}.maxLevel`, dish.maxLevel, 1);
  }
  validateMilestones(`Dish ${dish.id}`, dish.upgradeMilestones, dish.maxLevel ?? 15);
}

for (const customer of customers) {
  requireNumber(`Customer ${customer.id}.unlockChapter`, customer.unlockChapter, 1);
  requireNumber(`Customer ${customer.id}.basePatience`, customer.basePatience, 1);
  requireNumber(`Customer ${customer.id}.tipMultiplier`, customer.tipMultiplier, 0);
  for (const dishId of customer.preferredDishes ?? []) {
    requireExisting(dishById, `Customer ${customer.id}.preferredDishes`, dishId);
  }
}

for (const storeUpgrade of storeUpgrades) {
  requireNumber(`StoreUpgrade ${storeUpgrade.id}.unlockLevel`, storeUpgrade.unlockLevel, 1);
  requireNumber(`StoreUpgrade ${storeUpgrade.id}.maxLevel`, storeUpgrade.maxLevel, 1);
  requireNumber(`StoreUpgrade ${storeUpgrade.id}.baseUpgradeCost`, storeUpgrade.baseUpgradeCost, 1);
  validateEffects(`StoreUpgrade ${storeUpgrade.id}.effectsPerLevel`, storeUpgrade.effectsPerLevel);
  validateMilestones(`StoreUpgrade ${storeUpgrade.id}`, storeUpgrade.upgradeMilestones, storeUpgrade.maxLevel);
}

validateAvatars(avatars, avatarById);

for (const cosmetic of cosmetics) {
  requireNumber(`Cosmetic ${cosmetic.id}.unlockLevel`, cosmetic.unlockLevel, 1);
  requireNumber(`Cosmetic ${cosmetic.id}.cost`, cosmetic.cost, 1);
  if (!['hair', 'hat', 'apron', 'shoes', 'gloves', 'clothes', 'tool'].includes(cosmetic.slot)) {
    errors.push(`Cosmetic ${cosmetic.id}.slot is invalid: ${cosmetic.slot}`);
  }
  validateEffects(`Cosmetic ${cosmetic.id}.effects`, cosmetic.effects);
  validateCosmeticEffectCaps(cosmetic);
  if (cosmetic.setId) {
    requireExisting(cosmeticSetById, `Cosmetic ${cosmetic.id}.setId`, cosmetic.setId);
  }
}

validateCosmeticCoverage(cosmetics);
validateCosmeticSets(cosmeticSets, cosmeticById);

for (const level of levels) {
  const label = `Level ${level.id}`;
  requireNumber(`${label}.chapter`, level.chapter, 1);
  requireNumber(`${label}.localIndex`, level.localIndex, 1);
  requireNumber(`${label}.durationSec`, level.durationSec, 1);
  requireNumber(`${label}.modifiers.customerCount`, level.modifiers?.customerCount, 1);

  if (!Array.isArray(level.dishPool) || level.dishPool.length === 0) {
    errors.push(`${label}.dishPool must be a non-empty array.`);
  }

  for (const dishId of level.dishPool ?? []) {
    requireExisting(dishById, `${label}.dishPool`, dishId);
    const dish = dishById.get(dishId);
    if (dish && dish.unlockLevel > level.id) {
      errors.push(`${label} uses ${dishId} before unlockLevel ${dish.unlockLevel}.`);
    }
  }

  const customerMix = level.customerMix ?? {};
  const mixTotal = Object.entries(customerMix).reduce((sum, [customerId, weight]) => {
    requireExisting(customerById, `${label}.customerMix`, customerId);
    requireNumber(`${label}.customerMix.${customerId}`, weight, 0);
    return sum + (typeof weight === 'number' ? weight : 0);
  }, 0);

  if (Math.abs(mixTotal - 1) > 0.001) {
    errors.push(`${label}.customerMix should sum to 1, got ${mixTotal.toFixed(4)}.`);
  }

  const goals = level.goals ?? {};
  requireNumber(`${label}.goals.coin1`, goals.coin1, 0);
  requireNumber(`${label}.goals.coin2`, goals.coin2, goals.coin1 ?? 0);
  requireNumber(`${label}.goals.coin3`, goals.coin3, goals.coin2 ?? 0);

  if (goals.targetDishId) {
    requireExisting(dishById, `${label}.goals.targetDishId`, goals.targetDishId);
    if (!level.dishPool?.includes(goals.targetDishId)) {
      errors.push(`${label}.goals.targetDishId must be included in dishPool: ${goals.targetDishId}`);
    }
  }

  for (const [dishId, weight] of Object.entries(level.modifiers?.targetDishWeights ?? {})) {
    requireExisting(dishById, `${label}.modifiers.targetDishWeights`, dishId);
    if (!level.dishPool?.includes(dishId)) {
      errors.push(`${label}.modifiers.targetDishWeights uses dish outside dishPool: ${dishId}`);
    }
    requireNumber(`${label}.modifiers.targetDishWeights.${dishId}`, weight, 0);
    if (typeof weight === 'number' && weight > 1) {
      errors.push(`${label}.modifiers.targetDishWeights.${dishId} must be <= 1.`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Config validation failed with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Config validation passed: ${levels.length} levels, ${dishes.length} dishes, ${customers.length} customers, ${equipments.length} equipments, ${storeUpgrades.length} store upgrades, ${avatars.length} avatars, ${cosmetics.length} cosmetics, ${cosmeticSets.length} cosmetic sets.`,
);

function normalizeCosmeticsConfig(raw) {
  if (Array.isArray(raw)) {
    return {
      avatars: [],
      items: raw,
      sets: [],
    };
  }

  if (!raw || typeof raw !== 'object') {
    errors.push('cosmetics must be an array or an object with avatars/items/sets.');
    return {
      avatars: [],
      items: [],
      sets: [],
    };
  }

  return {
    avatars: raw.avatars ?? [],
    items: raw.items ?? [],
    sets: raw.sets ?? [],
  };
}

function validateAvatars(items, map) {
  if (!map.has('avatar_male_boss')) {
    errors.push('cosmetics.avatars is missing avatar_male_boss.');
  }
  if (!map.has('avatar_female_boss')) {
    errors.push('cosmetics.avatars is missing avatar_female_boss.');
  }

  const genders = new Set();
  for (const avatar of items) {
    if (avatar.gender !== 'male' && avatar.gender !== 'female') {
      errors.push(`Avatar ${avatar.id}.gender is invalid: ${avatar.gender}`);
    } else {
      genders.add(avatar.gender);
    }
    if (typeof avatar.name !== 'string' || avatar.name.length === 0) {
      errors.push(`Avatar ${avatar.id}.name must be a non-empty string.`);
    }
    if (typeof avatar.portraitPath !== 'string' || avatar.portraitPath.length === 0) {
      errors.push(`Avatar ${avatar.id}.portraitPath must be a non-empty string.`);
    }
    if (typeof avatar.previewSpritePath !== 'string' || avatar.previewSpritePath.length === 0) {
      errors.push(`Avatar ${avatar.id}.previewSpritePath must be a non-empty string.`);
    }
    validateAnchor(`Avatar ${avatar.id}.actionAnchor`, avatar.actionAnchor);
  }

  if (!genders.has('male') || !genders.has('female')) {
    errors.push('cosmetics.avatars must include both male and female genders.');
  }
}

function validateCosmeticCoverage(items) {
  if (items.length !== 12) {
    errors.push(`cosmetics.items should contain exactly 12 items for v1, got ${items.length}.`);
  }

  for (const slot of ['hair', 'hat', 'clothes', 'apron', 'shoes', 'gloves', 'tool']) {
    if (!items.some((item) => item.slot === slot)) {
      errors.push(`cosmetics.items must include at least one ${slot} item.`);
    }
  }
}

function validateCosmeticSets(items, cosmeticMap) {
  if (items.length < 2) {
    errors.push(`cosmetics.sets should contain at least 2 sets, got ${items.length}.`);
  }

  for (const cosmeticSet of items) {
    if (!Array.isArray(cosmeticSet.requiredCosmeticIds) || cosmeticSet.requiredCosmeticIds.length < 2) {
      errors.push(`CosmeticSet ${cosmeticSet.id}.requiredCosmeticIds must include at least 2 items.`);
      continue;
    }
    for (const cosmeticId of cosmeticSet.requiredCosmeticIds) {
      requireExisting(cosmeticMap, `CosmeticSet ${cosmeticSet.id}.requiredCosmeticIds`, cosmeticId);
    }
    validateEffects(`CosmeticSet ${cosmeticSet.id}.effects`, cosmeticSet.effects);
  }
}

function validateCosmeticEffectCaps(cosmetic) {
  const percentageKeys = ['priceBonus', 'speedBonus', 'costReduce', 'patienceBonus', 'complaintReduce', 'tipBonus'];
  const cap = cosmetic.slot === 'tool' && cosmetic.unlockLevel >= 25 ? 0.1 : 0.06;
  for (const key of percentageKeys) {
    const value = cosmetic.effects?.[key];
    if (typeof value === 'number' && value > cap + 0.0001) {
      errors.push(`Cosmetic ${cosmetic.id}.effects.${key} exceeds ${(cap * 100).toFixed(0)}%.`);
    }
  }
}

function validateAnchor(label, value) {
  if (!value || typeof value !== 'object') {
    errors.push(`${label} must be an object.`);
    return;
  }
  requireNumber(`${label}.x`, value.x, 0);
  requireNumber(`${label}.y`, value.y, 0);
  if (value.x > 1 || value.y > 1) {
    errors.push(`${label} x/y must be <= 1.`);
  }
}

function validateMilestones(label, milestones, maxLevel) {
  if (milestones === undefined) {
    return;
  }
  if (!Array.isArray(milestones)) {
    errors.push(`${label}.upgradeMilestones must be an array when provided.`);
    return;
  }

  const seenLevels = new Set();
  for (const milestone of milestones) {
    requireNumber(`${label}.upgradeMilestones.level`, milestone.level, 2);
    if (milestone.level > maxLevel) {
      errors.push(`${label}.upgradeMilestones level ${milestone.level} exceeds maxLevel ${maxLevel}.`);
    }
    if (seenLevels.has(milestone.level)) {
      errors.push(`${label}.upgradeMilestones has duplicate level: ${milestone.level}.`);
    }
    seenLevels.add(milestone.level);
    if (typeof milestone.name !== 'string' || milestone.name.length === 0) {
      errors.push(`${label}.upgradeMilestones level ${milestone.level} needs a name.`);
    }
    validateEffects(`${label}.upgradeMilestones level ${milestone.level}.effects`, milestone.effects ?? {});
  }
}

function validateEffects(label, effects) {
  if (!effects || typeof effects !== 'object') {
    errors.push(`${label} must be an object.`);
    return;
  }

  for (const key of ['priceBonus', 'speedBonus', 'costReduce', 'patienceBonus', 'complaintReduce', 'rating', 'tipBonus']) {
    if (effects[key] !== undefined) {
      requireNumber(`${label}.${key}`, effects[key], 0);
    }
  }
}
