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

const levelById = indexById('levels', levels);
const dishById = indexById('dishes', dishes);
const customerById = indexById('customers', customers);
const equipmentById = indexById('equipments', equipments);

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
}

for (const dish of dishes) {
  requireExisting(equipmentById, `Dish ${dish.id}.stationId`, dish.stationId);
  requireNumber(`Dish ${dish.id}.unlockLevel`, dish.unlockLevel, 1);
  requireNumber(`Dish ${dish.id}.basePrice`, dish.basePrice, 1);
  requireNumber(`Dish ${dish.id}.baseCookTime`, dish.baseCookTime, 0.1);
  requireNumber(`Dish ${dish.id}.complexity`, dish.complexity, 1);
}

for (const customer of customers) {
  requireNumber(`Customer ${customer.id}.unlockChapter`, customer.unlockChapter, 1);
  requireNumber(`Customer ${customer.id}.basePatience`, customer.basePatience, 1);
  requireNumber(`Customer ${customer.id}.tipMultiplier`, customer.tipMultiplier, 0);
  for (const dishId of customer.preferredDishes ?? []) {
    requireExisting(dishById, `Customer ${customer.id}.preferredDishes`, dishId);
  }
}

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
  `Config validation passed: ${levels.length} levels, ${dishes.length} dishes, ${customers.length} customers, ${equipments.length} equipments.`,
);
