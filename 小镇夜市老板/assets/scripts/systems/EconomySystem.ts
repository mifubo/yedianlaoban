import {
  CosmeticItemConfig,
  DishConfig,
  DishId,
  EconomyEffects,
  EquipmentConfig,
  RuntimeConfig,
  StoreUpgradeConfig,
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

export class EconomySystem {
  static getTotalEconomyEffects(configs: RuntimeConfig, saveData: PlayerSaveData): EconomyEffects {
    const total: EconomyEffects = {};

    for (const storeUpgrade of configs.storeUpgrades) {
      const level = this.getSavedLevel(saveData.storeUpgradeLevels[storeUpgrade.id], storeUpgrade.maxLevel);
      this.addEffects(total, this.scaleEffects(storeUpgrade.effectsPerLevel, Math.max(0, level - 1)));
      this.addEffects(total, this.getMilestoneEffects(storeUpgrade, level));
    }

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
    const tipRate = quickTipRate + comboTipRate + (effects.tipBonus ?? 0);
    const levelRewardMultiplier = level.modifiers.rewardMultiplier ?? 1;
    const adjustedSales = grossSales * customer.tipMultiplier * levelRewardMultiplier;
    const tips = Math.round(grossSales * tipRate * customer.tipMultiplier * levelRewardMultiplier);
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
    return customer.basePatience * (level.modifiers.patienceMultiplier ?? 1) * (1 + patienceBonus);
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
  }
}
