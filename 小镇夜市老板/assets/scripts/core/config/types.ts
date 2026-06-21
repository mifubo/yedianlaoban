export type LevelId = number;
export type DishId = string;
export type CustomerId = string;
export type EquipmentId = string;
export type StoreUpgradeId = string;
export type CosmeticItemId = string;
export type CosmeticSetId = string;
export type AvatarId = string;
export type AvatarGender = 'male' | 'female';
export type CosmeticSlot = 'hair' | 'hat' | 'apron' | 'shoes' | 'gloves' | 'clothes' | 'tool';

export interface AnchorPoint {
  x: number;
  y: number;
}

export interface EconomyEffects {
  priceBonus?: number;
  speedBonus?: number;
  costReduce?: number;
  patienceBonus?: number;
  complaintReduce?: number;
  rating?: number;
  tipBonus?: number;
  customerAttractBonus?: number;
  maxWaitingCustomers?: number;
  prepCacheLimit?: number;
  pickyAcceptance?: number;
  leftoverLossReduce?: number;
  visualStage?: number;
}

export interface UpgradeMilestone {
  level: number;
  name: string;
  effectText: string;
  effects?: EconomyEffects;
  unlocks?: string[];
}

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
  ingredientCostRate?: number;
  maxLevel?: number;
  priceBonusPerLevel?: number;
  upgradeMilestones?: UpgradeMilestone[];
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
  maxLevel?: number;
  slotUnlockLevels?: number[];
  effectsPerLevel?: EconomyEffects;
  upgradeMilestones?: UpgradeMilestone[];
  tags?: string[];
}

export interface StoreUpgradeConfig {
  id: StoreUpgradeId;
  name: string;
  unlockLevel: number;
  maxLevel: number;
  baseUpgradeCost: number;
  effectsPerLevel: EconomyEffects;
  upgradeMilestones?: UpgradeMilestone[];
  tags?: string[];
}

export interface StoreVisualStage {
  level: number;
  name: string;
  minUpgradeProgress: number;
}

export interface StoreVisualStageSummary {
  level: number;
  name: string;
  upgradeProgress: number;
  mainEffectText: string;
  nextLevel?: number;
  nextName?: string;
  levelsToNextStage: number;
  nextStageGapText: string;
  recommendationText?: string;
}

export interface PlayerAvatarConfig {
  id: AvatarId;
  name: string;
  gender: AvatarGender;
  portraitPath: string;
  previewSpritePath: string;
  actionAnchor: AnchorPoint;
  tags?: string[];
}

export interface CosmeticItemConfig {
  id: CosmeticItemId;
  name: string;
  slot: CosmeticSlot;
  unlockLevel: number;
  cost: number;
  effects: EconomyEffects;
  setId?: string;
  iconPath?: string;
  previewSpritePath?: string;
  anchorOffset?: AnchorPoint;
  tags?: string[];
}

export interface CosmeticSetConfig {
  id: CosmeticSetId;
  name: string;
  requiredCosmeticIds: CosmeticItemId[];
  effects: EconomyEffects;
  tags?: string[];
}

export interface CosmeticConfigFile {
  avatars: PlayerAvatarConfig[];
  items: CosmeticItemConfig[];
  sets: CosmeticSetConfig[];
}

export interface ConfigBundle {
  levels: LevelConfig[];
  dishes: DishConfig[];
  customers: CustomerConfig[];
  equipments: EquipmentConfig[];
  storeUpgrades: StoreUpgradeConfig[];
  avatars: PlayerAvatarConfig[];
  cosmetics: CosmeticItemConfig[];
  cosmeticSets: CosmeticSetConfig[];
}

export interface RuntimeConfig extends ConfigBundle {
  levelById: Map<LevelId, LevelConfig>;
  dishById: Map<DishId, DishConfig>;
  customerById: Map<CustomerId, CustomerConfig>;
  equipmentById: Map<EquipmentId, EquipmentConfig>;
  storeUpgradeById: Map<StoreUpgradeId, StoreUpgradeConfig>;
  avatarById: Map<AvatarId, PlayerAvatarConfig>;
  cosmeticById: Map<CosmeticItemId, CosmeticItemConfig>;
  cosmeticSetById: Map<CosmeticSetId, CosmeticSetConfig>;
}

export interface JsonConfigPaths {
  levels: string;
  dishes: string;
  customers: string;
  equipments: string;
  storeUpgrades: string;
  cosmetics: string;
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
