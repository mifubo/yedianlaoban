import { DishConfig, EquipmentConfig } from '../core/config/types';
import { PlayerSaveData } from '../core/save/SaveSystem';

export interface UpgradePreview {
  id: string;
  currentLevel: number;
  nextLevel: number;
  maxLevel: number;
  cost: number;
  canAfford: boolean;
  canUpgrade: boolean;
  isUnlocked: boolean;
  isMaxLevel: boolean;
  effectText: string;
  lockedReason?: string;
}

const DISH_PRICE_BONUS_PER_LEVEL = 0.08;
const DISH_MAX_LEVEL = 10;
const EQUIPMENT_SLOT_LEVEL_STEP = 2;

export class UpgradeSystem {
  constructor(private readonly saveData: PlayerSaveData) {}

  previewEquipment(config: EquipmentConfig, chapter = 1): UpgradePreview {
    const maxLevel = this.getEquipmentMaxLevel(config);
    const currentLevel = this.getSavedLevel(this.saveData.equipmentLevels[config.id], maxLevel);
    const isUnlocked = this.isUnlocked(config.unlockLevel);
    const isMaxLevel = currentLevel >= maxLevel;
    const nextLevel = isMaxLevel ? currentLevel : currentLevel + 1;
    const cost = isUnlocked && !isMaxLevel ? this.getEquipmentUpgradeCost(config, currentLevel, chapter) : 0;
    const canAfford = isUnlocked && !isMaxLevel && this.saveData.coins >= cost;

    return {
      id: config.id,
      currentLevel,
      nextLevel,
      maxLevel,
      cost,
      canAfford,
      canUpgrade: canAfford,
      isUnlocked,
      isMaxLevel,
      effectText: this.getEquipmentEffectText(config, currentLevel, nextLevel, isUnlocked, isMaxLevel),
      lockedReason: isUnlocked ? undefined : `第${config.unlockLevel}关解锁`,
    };
  }

  buyEquipment(config: EquipmentConfig, chapter = 1): boolean {
    const preview = this.previewEquipment(config, chapter);
    if (!preview.canUpgrade) {
      return false;
    }

    this.saveData.coins -= preview.cost;
    this.saveData.equipmentLevels[config.id] = preview.nextLevel;
    return true;
  }

  previewDish(config: DishConfig, chapter = 1): UpgradePreview {
    const currentLevel = this.getSavedLevel(this.saveData.dishLevels[config.id], DISH_MAX_LEVEL);
    const isUnlocked = this.isUnlocked(config.unlockLevel);
    const isMaxLevel = currentLevel >= DISH_MAX_LEVEL;
    const nextLevel = isMaxLevel ? currentLevel : currentLevel + 1;
    const cost = isUnlocked && !isMaxLevel ? this.getDishUpgradeCost(config, currentLevel, chapter) : 0;
    const canAfford = isUnlocked && !isMaxLevel && this.saveData.coins >= cost;

    return {
      id: config.id,
      currentLevel,
      nextLevel,
      maxLevel: DISH_MAX_LEVEL,
      cost,
      canAfford,
      canUpgrade: canAfford,
      isUnlocked,
      isMaxLevel,
      effectText: this.getDishEffectText(config, nextLevel, isUnlocked, isMaxLevel),
      lockedReason: isUnlocked ? undefined : `第${config.unlockLevel}关解锁`,
    };
  }

  buyDish(config: DishConfig, chapter = 1): boolean {
    const preview = this.previewDish(config, chapter);
    if (!preview.canUpgrade) {
      return false;
    }

    this.saveData.coins -= preview.cost;
    this.saveData.dishLevels[config.id] = preview.nextLevel;
    return true;
  }

  private isUnlocked(unlockLevel: number): boolean {
    return this.saveData.currentLevelId >= unlockLevel;
  }

  private getSavedLevel(value: number | undefined, maxLevel: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 1;
    }

    return Math.min(maxLevel, Math.max(1, Math.floor(value)));
  }

  private getEquipmentMaxLevel(config: EquipmentConfig): number {
    const speedSteps =
      config.speedBonusPerLevel > 0 ? Math.ceil(config.maxSpeedBonus / config.speedBonusPerLevel) : 0;
    const slotSteps = Math.max(0, config.slotCountMax - config.slotCountBase) * EQUIPMENT_SLOT_LEVEL_STEP;
    return 1 + Math.max(speedSteps, slotSteps);
  }

  private getEquipmentEffectText(
    config: EquipmentConfig,
    currentLevel: number,
    nextLevel: number,
    isUnlocked: boolean,
    isMaxLevel: boolean
  ): string {
    if (!isUnlocked) {
      return `第${config.unlockLevel}关解锁`;
    }

    if (isMaxLevel) {
      return '已满级';
    }

    const nextSpeedBonus = this.getEquipmentSpeedBonus(config, nextLevel);
    const currentSlotCount = this.getEquipmentSlotCount(config, currentLevel);
    const nextSlotCount = this.getEquipmentSlotCount(config, nextLevel);
    const parts = [`制作时间-${Math.round(nextSpeedBonus * 100)}%`];

    if (nextSlotCount > currentSlotCount) {
      parts.push(`工位+${nextSlotCount - currentSlotCount}`);
    }

    return parts.join('，');
  }

  private getDishEffectText(config: DishConfig, nextLevel: number, isUnlocked: boolean, isMaxLevel: boolean): string {
    if (!isUnlocked) {
      return `第${config.unlockLevel}关解锁`;
    }

    if (isMaxLevel) {
      return '已满级';
    }

    const nextPrice = this.getDishPrice(config, nextLevel);
    const priceBonus = (nextPrice - config.basePrice) / config.basePrice;
    return `售价+${Math.round(priceBonus * 100)}%`;
  }

  private getEquipmentSpeedBonus(config: EquipmentConfig, level: number): number {
    return Math.min(config.maxSpeedBonus, Math.max(0, level - 1) * config.speedBonusPerLevel);
  }

  private getEquipmentSlotCount(config: EquipmentConfig, level: number): number {
    const extraSlots = Math.floor(Math.max(0, level - 1) / EQUIPMENT_SLOT_LEVEL_STEP);
    return Math.min(config.slotCountMax, config.slotCountBase + extraSlots);
  }

  private getDishPrice(config: DishConfig, level: number): number {
    const priceBonus = 1 + Math.max(0, level - 1) * DISH_PRICE_BONUS_PER_LEVEL;
    return Math.round(config.basePrice * priceBonus);
  }

  private getEquipmentUpgradeCost(config: EquipmentConfig, level: number, chapter: number): number {
    const raw = config.baseUpgradeCost * Math.pow(level, 1.65) * (1 + 0.35 * (chapter - 1));
    return this.roundTo10(raw);
  }

  private getDishUpgradeCost(config: DishConfig, level: number, chapter: number): number {
    const raw = config.baseUpgradeCost * Math.pow(level, 1.55) * (1 + 0.25 * (chapter - 1));
    return this.roundTo10(raw);
  }

  private roundTo10(value: number): number {
    return Math.round(value / 10) * 10;
  }
}
