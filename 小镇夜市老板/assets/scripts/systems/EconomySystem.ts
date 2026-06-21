import {
  CosmeticItemConfig,
  DishConfig,
  DishId,
  EconomyEffects,
  EquipmentConfig,
  RuntimeConfig,
  StoreUpgradeConfig,
  StoreVisualStage,
  StoreVisualStageSummary,
} from '../core/config/types';
import type { PlayerSaveData } from '../core/save/SaveSystem';
import type { CustomerConfig, LevelConfig } from '../core/config/types';

export interface CustomerRewardBreakdown {
  grossSales: number;
  tips: number;
  serviceBonus: number;
  ingredientCost: number;
  netCoins: number;
}

export interface LeftoverLossBreakdown {
  remainingDishCount: number;
  ingredientCost: number;
  lossRate: number;
  lossCoins: number;
}

export const DEFAULT_DISH_MAX_LEVEL = 15;
export const DEFAULT_DISH_PRICE_BONUS_PER_LEVEL = 0.05;
export const DEFAULT_INGREDIENT_COST_RATE = 0.32;
export const SERVICE_COIN_BONUS = 11;
export const MAX_QUICK_TIP_BONUS = 0.34;
export const COMBO_TIP_BONUS_PER_STEP = 0.04;
export const MAX_COMBO_TIP_BONUS = 0.24;
export const DEFAULT_EQUIPMENT_SLOT_LEVEL_STEP = 2;
export const SETTLEMENT_AD_BONUS_RATE = 0.5;
export const SETTLEMENT_AD_GOAL_CAP_RATE = 0.6;
export const FAIL_EXTEND_SECONDS = 15;
export const DEFAULT_MAX_WAITING_CUSTOMERS = 4;
export const DEFAULT_PREP_CACHE_LIMIT = 3;
export const FRONT30_CUSTOMER_ATTRACT_CAP = 0.15;
export const LATE_CUSTOMER_ATTRACT_CAP = 0.25;
export const MIDGAME_LEFTOVER_LOSS_RATE = 0.4;
export const LATEGAME_LEFTOVER_LOSS_RATE = 0.6;
export const MAX_LEFTOVER_LOSS_REDUCE = 0.65;
export const STORE_VISUAL_STAGES: StoreVisualStage[] = [
  { level: 1, name: '破旧推车', minUpgradeProgress: 0 },
  { level: 2, name: '亮灯小摊', minUpgradeProgress: 4 },
  { level: 3, name: '夜市摊位', minUpgradeProgress: 9 },
  { level: 4, name: '老街档口', minUpgradeProgress: 16 },
  { level: 5, name: '网红夜市摊', minUpgradeProgress: 25 },
];

export class EconomySystem {
  static getStoreUpgradeEffects(configs: RuntimeConfig, saveData: PlayerSaveData): EconomyEffects {
    const total: EconomyEffects = {};

    for (const storeUpgrade of configs.storeUpgrades) {
      const level = this.getSavedLevel(saveData.storeUpgradeLevels[storeUpgrade.id], storeUpgrade.maxLevel);
      this.addEffects(total, this.scaleEffects(storeUpgrade.effectsPerLevel, Math.max(0, level - 1)));
      this.addEffects(total, this.getMilestoneEffects(storeUpgrade, level));
    }

    return total;
  }

  static getTotalEconomyEffects(configs: RuntimeConfig, saveData: PlayerSaveData): EconomyEffects {
    const total: EconomyEffects = this.getStoreUpgradeEffects(configs, saveData);

    const equippedOwnedCosmeticIds = new Set<string>();
    for (const cosmeticId of Object.values(saveData.equippedCosmeticIds)) {
      if (!cosmeticId) {
        continue;
      }

      const cosmetic = configs.cosmeticById.get(cosmeticId);
      if (cosmetic && saveData.ownedCosmeticIds.includes(cosmetic.id)) {
        equippedOwnedCosmeticIds.add(cosmetic.id);
        this.addEffects(total, cosmetic.effects);
      }
    }

    for (const cosmeticSet of configs.cosmeticSets) {
      const isActive = cosmeticSet.requiredCosmeticIds.every((cosmeticId) => equippedOwnedCosmeticIds.has(cosmeticId));
      if (isActive) {
        this.addEffects(total, cosmeticSet.effects);
      }
    }

    return total;
  }

  static getEffectiveCustomerCount(configs: RuntimeConfig, saveData: PlayerSaveData, level: LevelConfig): number {
    const baseCount = Math.max(1, Math.floor(level.modifiers.customerCount));
    if (level.id <= 10) {
      return baseCount;
    }

    const storeEffects = this.getStoreUpgradeEffects(configs, saveData);
    const cap = level.id <= 30 ? FRONT30_CUSTOMER_ATTRACT_CAP : LATE_CUSTOMER_ATTRACT_CAP;
    const attractBonus = Math.min(cap, Math.max(0, storeEffects.customerAttractBonus ?? 0));
    const denseFlowBonus = this.getLevelDenseFlowBonus(configs, level);
    const eventMultiplier = this.getLevelEventCustomerCountMultiplier(level);
    return Math.max(1, Math.floor(baseCount * eventMultiplier * (1 + attractBonus + denseFlowBonus) + 0.0001));
  }

  static getMaxWaitingCustomers(
    configs: RuntimeConfig,
    saveData: PlayerSaveData,
    baseWaitingCustomers = DEFAULT_MAX_WAITING_CUSTOMERS,
  ): number {
    const storeEffects = this.getStoreUpgradeEffects(configs, saveData);
    const extraSlots = Math.floor(Math.max(0, storeEffects.maxWaitingCustomers ?? 0));
    return Math.min(8, Math.max(1, Math.floor(baseWaitingCustomers) + extraSlots));
  }

  static getPreparedDishLimit(configs: RuntimeConfig, saveData: PlayerSaveData, baseLimit = DEFAULT_PREP_CACHE_LIMIT): number {
    const storeEffects = this.getStoreUpgradeEffects(configs, saveData);
    const extraLimit = Math.floor(Math.max(0, storeEffects.prepCacheLimit ?? 0));
    return Math.min(8, Math.max(1, Math.floor(baseLimit) + extraLimit));
  }

  static getPickyCustomerAcceptance(configs: RuntimeConfig, saveData: PlayerSaveData): number {
    const storeEffects = this.getStoreUpgradeEffects(configs, saveData);
    return Math.min(1, Math.max(0, storeEffects.pickyAcceptance ?? 0));
  }

  static getStoreVisualStageSummary(
    configs: RuntimeConfig,
    saveData: PlayerSaveData,
    levelId = saveData.currentLevelId,
  ): StoreVisualStageSummary {
    const upgradeProgress = configs.storeUpgrades.reduce((sum, storeUpgrade) => {
      const level = this.getSavedLevel(saveData.storeUpgradeLevels[storeUpgrade.id], storeUpgrade.maxLevel);
      return sum + Math.max(0, level - 1);
    }, 0);
    const storeEffects = this.getStoreUpgradeEffects(configs, saveData);
    const progressStage = [...STORE_VISUAL_STAGES]
      .reverse()
      .find((stage) => upgradeProgress >= stage.minUpgradeProgress) ?? STORE_VISUAL_STAGES[0];
    const visualStageLevel = Math.min(5, Math.max(1, 1 + Math.floor(Math.max(0, storeEffects.visualStage ?? 0))));
    const stageLevel = Math.max(progressStage.level, visualStageLevel);
    const stage = STORE_VISUAL_STAGES.find((item) => item.level === stageLevel) ?? STORE_VISUAL_STAGES[0];
    const nextStage = STORE_VISUAL_STAGES.find((item) => item.level === stage.level + 1);
    const levelsToNextStage = nextStage ? Math.max(0, nextStage.minUpgradeProgress - upgradeProgress) : 0;

    return {
      level: stage.level,
      name: stage.name,
      upgradeProgress,
      mainEffectText: this.formatStoreMainEffects(storeEffects),
      nextLevel: nextStage?.level,
      nextName: nextStage?.name,
      levelsToNextStage,
      nextStageGapText: nextStage
        ? `还差 ${levelsToNextStage} 次店铺升级到 Lv.${nextStage.level} ${nextStage.name}`
        : '已达到最高视觉阶段',
      recommendationText: this.getStoreUpgradeRecommendation(configs, saveData, levelId),
    };
  }

  static getStoreUpgradeRecommendation(
    configs: RuntimeConfig,
    saveData: PlayerSaveData,
    levelId = saveData.currentLevelId,
  ): string | undefined {
    const recommendations = [
      {
        levelId: 15,
        text: '第15关建议补清洁台和备菜台，降低客诉并放宽出餐缓存',
        targets: [
          ['store_cleanliness', 2],
          ['store_prep_table', 2],
        ],
      },
      {
        levelId: 24,
        text: '第24关建议补灯牌、桌椅和门面，承接热狗解锁后的客流',
        targets: [
          ['store_signboard', 3],
          ['store_tables', 3],
          ['store_facade', 2],
        ],
      },
      {
        levelId: 30,
        text: '第30关建议店铺进入夜市摊位阶段，优先桌椅、灯牌、备菜台',
        targets: [
          ['store_tables', 4],
          ['store_signboard', 4],
          ['store_prep_table', 3],
        ],
      },
    ] as const;

    const recommendation = recommendations.find((item) => item.levelId === levelId);
    if (!recommendation) {
      return undefined;
    }

    const missingTargets = recommendation.targets
      .map(([storeUpgradeId, targetLevel]) => {
        const config = configs.storeUpgradeById.get(storeUpgradeId);
        if (!config) {
          return null;
        }

        const currentLevel = this.getSavedLevel(saveData.storeUpgradeLevels[storeUpgradeId], config.maxLevel);
        return currentLevel < targetLevel ? `${config.name}Lv.${targetLevel}` : null;
      })
      .filter((item): item is string => item !== null);

    return missingTargets.length > 0
      ? `${recommendation.text}（推荐：${missingTargets.join(' / ')}）`
      : `第${levelId}关店铺推荐已达标`;
  }

  static calculateCustomerReward(
    configs: RuntimeConfig,
    saveData: PlayerSaveData,
    level: LevelConfig,
    customer: CustomerConfig,
    orderDishIds: DishId[],
    patienceRatio: number,
    combo: number,
  ): CustomerRewardBreakdown {
    const effects = this.getTotalEconomyEffects(configs, saveData);
    const grossSales = orderDishIds.reduce((sum, dishId) => {
      const dish = configs.dishById.get(dishId);
      return sum + (dish ? this.getDishPriceForSave(dish, saveData, effects) : 0);
    }, 0);
    const ingredientCost = orderDishIds.reduce((sum, dishId) => {
      const dish = configs.dishById.get(dishId);
      return sum + (dish ? this.getDishIngredientCostForSave(dish, saveData, effects) : 0);
    }, 0);

    const safePatienceRatio = Math.min(1, Math.max(0, patienceRatio));
    const quickTipRate = safePatienceRatio * MAX_QUICK_TIP_BONUS;
    const comboTipRate = Math.min(MAX_COMBO_TIP_BONUS, Math.max(0, combo) * COMBO_TIP_BONUS_PER_STEP);
    const traitTipRate = this.getCustomerTraitTipBonus(customer, combo);
    const pickyTipMultiplier = this.getPickyCustomerTipMultiplier(configs, saveData, customer);
    const tipRate = quickTipRate + comboTipRate + traitTipRate + this.getLevelEventTipBonus(level) + (effects.tipBonus ?? 0);
    const levelRewardMultiplier = level.modifiers.rewardMultiplier ?? 1;
    const ticketMultiplier =
      this.getCustomerTicketMultiplier(customer) *
      this.getPickyCustomerTicketMultiplier(configs, saveData, customer) *
      this.getLevelEventPriceMultiplier(level);
    const adjustedSales = grossSales * customer.tipMultiplier * ticketMultiplier * levelRewardMultiplier;
    const tips = Math.round(grossSales * tipRate * customer.tipMultiplier * pickyTipMultiplier * levelRewardMultiplier);
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

  static calculateAngryLeavePenalty(configs: RuntimeConfig, saveData: PlayerSaveData): number {
    const effects = this.getTotalEconomyEffects(configs, saveData);
    const complaintReduce = Math.min(0.8, Math.max(0, effects.complaintReduce ?? 0));
    return Math.max(0, Math.round(4 * (1 - complaintReduce)));
  }

  static calculateWrongServePenalty(configs: RuntimeConfig, saveData: PlayerSaveData): number {
    const effects = this.getTotalEconomyEffects(configs, saveData);
    const complaintReduce = Math.min(0.8, Math.max(0, effects.complaintReduce ?? 0));
    return Math.max(0, Math.round(2 * (1 - complaintReduce)));
  }

  static calculateLeftoverLoss(
    configs: RuntimeConfig,
    saveData: PlayerSaveData,
    level: LevelConfig,
    cookedInventory: Partial<Record<DishId, number>>,
  ): LeftoverLossBreakdown {
    const lossRate = this.getLeftoverLossRate(configs, saveData, level);
    const effects = this.getTotalEconomyEffects(configs, saveData);
    let remainingDishCount = 0;
    let ingredientCost = 0;

    for (const [dishId, count] of Object.entries(cookedInventory)) {
      const safeCount = Math.max(0, Math.floor(count ?? 0));
      if (safeCount <= 0) {
        continue;
      }

      const dish = configs.dishById.get(dishId);
      if (!dish) {
        continue;
      }

      remainingDishCount += safeCount;
      ingredientCost += this.getDishIngredientCostForSave(dish, saveData, effects) * safeCount;
    }

    return {
      remainingDishCount,
      ingredientCost,
      lossRate,
      lossCoins: Math.round(ingredientCost * lossRate),
    };
  }

  static getLeftoverLossRate(configs: RuntimeConfig, saveData: PlayerSaveData, level: LevelConfig): number {
    const baseRate = this.getBaseLeftoverLossRate(level.id);
    if (baseRate <= 0) {
      return 0;
    }

    const effects = this.getStoreUpgradeEffects(configs, saveData);
    const reduce = Math.min(MAX_LEFTOVER_LOSS_REDUCE, Math.max(0, effects.leftoverLossReduce ?? 0));
    return Math.max(0, baseRate * (1 - reduce));
  }

  static getBaseLeftoverLossRate(levelId: number): number {
    if (levelId <= 10) {
      return 0;
    }

    return levelId <= 20 ? MIDGAME_LEFTOVER_LOSS_RATE : LATEGAME_LEFTOVER_LOSS_RATE;
  }

  static calculateSettlementAdBonus(level: LevelConfig, baseRewardCoins: number): number {
    if (baseRewardCoins <= 0) {
      return 0;
    }

    const byRate = baseRewardCoins * SETTLEMENT_AD_BONUS_RATE;
    const byGoalCap = level.goals.coin1 * SETTLEMENT_AD_GOAL_CAP_RATE;
    return Math.max(10, Math.floor(Math.min(byRate, byGoalCap) / 10) * 10);
  }

  static getCustomerPatienceSec(customer: CustomerConfig, level: LevelConfig, configs: RuntimeConfig, saveData: PlayerSaveData): number {
    const effects = this.getTotalEconomyEffects(configs, saveData);
    const patienceBonus = Math.min(0.6, Math.max(0, effects.patienceBonus ?? 0));
    const traitMultiplier = this.getCustomerPatienceTraitMultiplier(configs, saveData, level, customer);
    return customer.basePatience * (level.modifiers.patienceMultiplier ?? 1) * (1 + patienceBonus) * traitMultiplier;
  }

  static getCustomerTraitLabels(customer: CustomerConfig): string[] {
    const labels: string[] = [];
    if (this.hasCustomerTrait(customer, 'low_patience', 'pressure_intro')) {
      labels.push('急');
    }
    if (this.hasCustomerTrait(customer, 'combo_bonus', 'loyal')) {
      labels.push('熟');
    }
    if (this.hasCustomerTrait(customer, 'picky', 'hygiene_sensitive', 'facade_sensitive')) {
      labels.push('挑');
    }
    if (this.hasCustomerTrait(customer, 'dense_flow', 'lower_ticket')) {
      labels.push('学');
    }
    return labels;
  }

  static getPickyReadiness(configs: RuntimeConfig, saveData: PlayerSaveData): number {
    const effects = this.getStoreUpgradeEffects(configs, saveData);
    return Math.min(
      1,
      Math.max(0, effects.pickyAcceptance ?? 0) +
        Math.max(0, effects.visualStage ?? 0) * 0.08 +
        Math.max(0, effects.rating ?? 0) * 0.015,
    );
  }

  static getDishMaxLevel(dish: DishConfig): number {
    return Math.max(1, Math.floor(dish.maxLevel ?? DEFAULT_DISH_MAX_LEVEL));
  }

  static getDishDisplayName(dish: DishConfig, level: number): string {
    const milestone = [...(dish.upgradeMilestones ?? [])]
      .filter((item) => item.level <= level)
      .sort((a, b) => b.level - a.level)[0];
    return milestone?.name ?? dish.name;
  }

  static getDishPriceForSave(dish: DishConfig, saveData: PlayerSaveData, effects: EconomyEffects = {}): number {
    const level = this.getSavedLevel(saveData.dishLevels[dish.id], this.getDishMaxLevel(dish));
    return this.getDishPriceAtLevel(dish, level, effects);
  }

  static getDishPriceAtLevel(dish: DishConfig, level: number, effects: EconomyEffects = {}): number {
    const safeLevel = this.getSavedLevel(level, this.getDishMaxLevel(dish));
    const perLevelBonus = dish.priceBonusPerLevel ?? DEFAULT_DISH_PRICE_BONUS_PER_LEVEL;
    const milestoneBonus = this.getMilestoneEffects(dish, safeLevel).priceBonus ?? 0;
    const totalBonus = Math.max(0, (safeLevel - 1) * perLevelBonus + milestoneBonus + (effects.priceBonus ?? 0));
    return Math.max(1, Math.round(dish.basePrice * (1 + totalBonus)));
  }

  static getDishIngredientCostForSave(dish: DishConfig, saveData: PlayerSaveData, effects: EconomyEffects = {}): number {
    const level = this.getSavedLevel(saveData.dishLevels[dish.id], this.getDishMaxLevel(dish));
    return this.getDishIngredientCostAtLevel(dish, level, effects);
  }

  static getDishIngredientCostAtLevel(dish: DishConfig, level: number, effects: EconomyEffects = {}): number {
    const safeLevel = this.getSavedLevel(level, this.getDishMaxLevel(dish));
    const costReduce = Math.min(0.75, Math.max(0, effects.costReduce ?? 0));
    const baseCost = dish.basePrice * (dish.ingredientCostRate ?? DEFAULT_INGREDIENT_COST_RATE);
    const levelCostPressure = 1 + Math.max(0, safeLevel - 1) * 0.012;
    return Math.max(1, Math.round(baseCost * levelCostPressure * (1 - costReduce)));
  }

  static getCookDurationSec(dish: DishConfig, equipment: EquipmentConfig | undefined, saveData: PlayerSaveData, configs: RuntimeConfig): number {
    const effects = this.getTotalEconomyEffects(configs, saveData);
    const equipmentLevel = equipment ? this.getSavedLevel(saveData.equipmentLevels[equipment.id], this.getEquipmentMaxLevel(equipment)) : 1;
    const equipmentSpeedBonus = equipment ? this.getEquipmentSpeedBonusAtLevel(equipment, equipmentLevel) : 0;
    const speedBonus = Math.min(0.75, equipmentSpeedBonus + Math.max(0, effects.speedBonus ?? 0));
    return Math.max(0.5, dish.baseCookTime * (1 - speedBonus));
  }

  static getEquipmentMaxLevel(equipment: EquipmentConfig): number {
    if (equipment.maxLevel && equipment.maxLevel > 0) {
      return Math.floor(equipment.maxLevel);
    }

    const speedSteps =
      equipment.speedBonusPerLevel > 0 ? Math.ceil(equipment.maxSpeedBonus / equipment.speedBonusPerLevel) : 0;
    const slotSteps = Math.max(0, equipment.slotCountMax - equipment.slotCountBase) * DEFAULT_EQUIPMENT_SLOT_LEVEL_STEP;
    return 1 + Math.max(speedSteps, slotSteps);
  }

  static getEquipmentSlotCountAtLevel(equipment: EquipmentConfig, level: number): number {
    const safeLevel = this.getSavedLevel(level, this.getEquipmentMaxLevel(equipment));
    const unlockLevels = equipment.slotUnlockLevels;
    if (unlockLevels && unlockLevels.length > 0) {
      const unlockedExtraSlots = unlockLevels.filter((unlockLevel) => safeLevel >= unlockLevel).length;
      return Math.min(equipment.slotCountMax, equipment.slotCountBase + unlockedExtraSlots);
    }

    const extraSlots = Math.floor(Math.max(0, safeLevel - 1) / DEFAULT_EQUIPMENT_SLOT_LEVEL_STEP);
    return Math.min(equipment.slotCountMax, equipment.slotCountBase + extraSlots);
  }

  static getEquipmentSpeedBonusAtLevel(equipment: EquipmentConfig, level: number): number {
    const safeLevel = this.getSavedLevel(level, this.getEquipmentMaxLevel(equipment));
    const baseBonus = Math.max(0, safeLevel - 1) * equipment.speedBonusPerLevel;
    const perLevelBonus = this.scaleEffects(equipment.effectsPerLevel, Math.max(0, safeLevel - 1)).speedBonus ?? 0;
    const milestoneBonus = this.getMilestoneEffects(equipment, safeLevel).speedBonus ?? 0;
    return Math.min(equipment.maxSpeedBonus + 0.12, Math.max(0, baseBonus + perLevelBonus + milestoneBonus));
  }

  static getStoreUpgradeCost(config: StoreUpgradeConfig, level: number, chapter: number): number {
    const raw = config.baseUpgradeCost * Math.pow(level, 1.48) * (1 + 0.22 * (chapter - 1));
    return this.roundTo10(raw);
  }

  static getEquipmentUpgradeCost(config: EquipmentConfig, level: number, chapter: number): number {
    const raw = config.baseUpgradeCost * Math.pow(level, 1.52) * (1 + 0.28 * (chapter - 1));
    return this.roundTo10(raw);
  }

  static getDishUpgradeCost(config: DishConfig, level: number, chapter: number): number {
    const raw = config.baseUpgradeCost * Math.pow(level, 1.42) * (1 + 0.2 * (chapter - 1));
    return this.roundTo10(raw);
  }

  static getSavedLevel(value: number | undefined, maxLevel: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 1;
    }

    return Math.min(maxLevel, Math.max(1, Math.floor(value)));
  }

  static roundTo10(value: number): number {
    return Math.round(value / 10) * 10;
  }

  private static hasCustomerTrait(customer: CustomerConfig, ...traits: string[]): boolean {
    return traits.some((trait) => customer.traits?.includes(trait));
  }

  private static getLevelDenseFlowBonus(configs: RuntimeConfig, level: LevelConfig): number {
    const denseWeight = Object.entries(level.customerMix).reduce((sum, [customerId, weight]) => {
      const customer = configs.customerById.get(customerId);
      if (!customer || !this.hasCustomerTrait(customer, 'dense_flow')) {
        return sum;
      }

      return sum + Math.max(0, weight ?? 0);
    }, 0);
    return Math.min(0.16, denseWeight * 0.12);
  }

  private static getLevelEventCustomerCountMultiplier(level: LevelConfig): number {
    switch (level.modifiers.eventId) {
      case 'event_rain_light':
        return 0.9;
      case 'event_school_rush':
        return 1.12;
      default:
        return 1;
    }
  }

  private static getLevelEventPriceMultiplier(level: LevelConfig): number {
    switch (level.modifiers.eventId) {
      case 'event_rain_light':
        return 1.15;
      default:
        return 1;
    }
  }

  private static getLevelEventTipBonus(level: LevelConfig): number {
    switch (level.modifiers.eventId) {
      case 'event_rain_light':
        return 0.12;
      case 'event_influencer_visit':
        return 0.03;
      case 'event_hygiene_check':
        return 0.02;
      default:
        return 0;
    }
  }

  private static getCustomerPatienceTraitMultiplier(
    configs: RuntimeConfig,
    saveData: PlayerSaveData,
    level: LevelConfig,
    customer: CustomerConfig,
  ): number {
    let multiplier = 1;
    if (this.hasCustomerTrait(customer, 'low_patience', 'pressure_intro')) {
      multiplier *= 0.92;
    }
    if (this.hasCustomerTrait(customer, 'picky', 'hygiene_sensitive', 'facade_sensitive')) {
      const requiredReadiness = level.modifiers.eventId === 'event_hygiene_check' ? 0.28 : 0.18;
      if (this.getPickyReadiness(configs, saveData) < requiredReadiness) {
        multiplier *= 0.82;
      }
    }
    return multiplier;
  }

  private static getCustomerTraitTipBonus(customer: CustomerConfig, combo: number): number {
    let bonus = 0;
    if (this.hasCustomerTrait(customer, 'low_patience', 'pressure_intro')) {
      bonus += 0.08;
    }
    if (this.hasCustomerTrait(customer, 'combo_bonus', 'loyal') && combo >= 2) {
      bonus += Math.min(0.18, combo * 0.025);
    }
    return bonus;
  }

  private static getCustomerTicketMultiplier(customer: CustomerConfig): number {
    return this.hasCustomerTrait(customer, 'lower_ticket') ? 0.9 : 1;
  }

  private static getPickyCustomerTicketMultiplier(configs: RuntimeConfig, saveData: PlayerSaveData, customer: CustomerConfig): number {
    if (!this.hasCustomerTrait(customer, 'picky', 'hygiene_sensitive', 'facade_sensitive')) {
      return 1;
    }

    return this.getPickyReadiness(configs, saveData) >= 0.18 ? 1 : 0.92;
  }

  private static getPickyCustomerTipMultiplier(configs: RuntimeConfig, saveData: PlayerSaveData, customer: CustomerConfig): number {
    if (!this.hasCustomerTrait(customer, 'picky', 'hygiene_sensitive', 'facade_sensitive')) {
      return 1;
    }

    return this.getPickyReadiness(configs, saveData) >= 0.18 ? 1 : 0.86;
  }

  private static getMilestoneEffects(config: { upgradeMilestones?: { level: number; effects?: EconomyEffects }[] }, level: number): EconomyEffects {
    const total: EconomyEffects = {};
    for (const milestone of config.upgradeMilestones ?? []) {
      if (level >= milestone.level) {
        this.addEffects(total, milestone.effects);
      }
    }
    return total;
  }

  private static scaleEffects(effects: EconomyEffects | undefined, scale: number): EconomyEffects {
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

  private static addEffects(target: EconomyEffects, source: EconomyEffects | undefined): void {
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

  private static formatStoreMainEffects(effects: EconomyEffects): string {
    const parts: string[] = [];
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
    return parts.join('，') || '基础摊位';
  }
}
