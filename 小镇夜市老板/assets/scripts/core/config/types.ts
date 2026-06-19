export type LevelId = number;
export type DishId = string;
export type CustomerId = string;
export type EquipmentId = string;

export type LevelType =
  | 'tutorial'
  | 'tutorial_new_dish'
  | 'tutorial_chapter'
  | 'standard'
  | 'rush'
  | 'combo'
  | 'target_dish'
  | 'event'
  | 'bulk_order'
  | 'boss';

export interface LevelGoals {
  mainText: string;
  coin1: number;
  coin2: number;
  coin3: number;
  served?: number;
  combo?: number;
  targetDishId?: DishId;
  targetDishCount?: number;
}

export interface LevelModifiers {
  customerCount: number;
  patienceMultiplier: number;
  rewardMultiplier: number;
  waveCount?: number;
  targetDishWeights?: Partial<Record<DishId, number>>;
  eventId?: string | null;
  rawRuleText?: string;
}

export interface LevelConfig {
  id: LevelId;
  chapter: number;
  localIndex: number;
  levelType: LevelType;
  durationSec: number;
  dishPool: DishId[];
  customerMix: Partial<Record<CustomerId, number>>;
  goals: LevelGoals;
  modifiers: LevelModifiers;
}

export interface DishConfig {
  id: DishId;
  name: string;
  unlockLevel: number;
  stationId: EquipmentId;
  basePrice: number;
  baseCookTime: number;
  complexity: number;
  ingredients: string[];
  baseUpgradeCost: number;
  tags?: string[];
}

export interface CustomerConfig {
  id: CustomerId;
  name: string;
  unlockChapter: number;
  basePatience: number;
  tipMultiplier: number;
  preferredDishes: DishId[];
  maxOrderItems: number;
  traits?: string[];
}

export interface EquipmentConfig {
  id: EquipmentId;
  name: string;
  unlockLevel: number;
  slotCountBase: number;
  slotCountMax: number;
  baseUpgradeCost: number;
  speedBonusPerLevel: number;
  maxSpeedBonus: number;
  tags?: string[];
}

export interface ConfigBundle {
  levels: LevelConfig[];
  dishes: DishConfig[];
  customers: CustomerConfig[];
  equipments: EquipmentConfig[];
}

export interface RuntimeConfig extends ConfigBundle {
  levelById: Map<LevelId, LevelConfig>;
  dishById: Map<DishId, DishConfig>;
  customerById: Map<CustomerId, CustomerConfig>;
  equipmentById: Map<EquipmentId, EquipmentConfig>;
}

export interface JsonConfigPaths {
  levels: string;
  dishes: string;
  customers: string;
  equipments: string;
}

export type ConfigSource =
  | {
      kind: 'ts';
      bundle?: ConfigBundle;
    }
  | {
      kind: 'json';
      paths?: Partial<JsonConfigPaths>;
    }
  | {
      kind: 'hybrid';
      paths?: Partial<JsonConfigPaths>;
      fallback?: ConfigBundle;
    };
