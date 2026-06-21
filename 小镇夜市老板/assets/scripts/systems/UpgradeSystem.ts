import { CosmeticItemConfig, CosmeticSlot, DishConfig, EquipmentConfig, StoreUpgradeConfig } from '../core/config/types';
import { PlayerSaveData } from '../core/save/SaveSystem';
import { EconomySystem } from './EconomySystem';

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
  isOwned?: boolean;
  isEquipped?: boolean;
  slot?: CosmeticSlot;
}

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
    const maxLevel = EconomySystem.getDishMaxLevel(config);
    const currentLevel = this.getSavedLevel(this.saveData.dishLevels[config.id], maxLevel);
    const isUnlocked = this.isUnlocked(config.unlockLevel);
    const isMaxLevel = currentLevel >= maxLevel;
    const nextLevel = isMaxLevel ? currentLevel : currentLevel + 1;
    const cost = isUnlocked && !isMaxLevel ? this.getDishUpgradeCost(config, currentLevel, chapter) : 0;
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

  previewStoreUpgrade(config: StoreUpgradeConfig, chapter = 1): UpgradePreview {
    const currentLevel = this.getSavedLevel(this.saveData.storeUpgradeLevels[config.id], config.maxLevel);
    const isUnlocked = this.isUnlocked(config.unlockLevel);
    const isMaxLevel = currentLevel >= config.maxLevel;
    const nextLevel = isMaxLevel ? currentLevel : currentLevel + 1;
    const cost = isUnlocked && !isMaxLevel ? EconomySystem.getStoreUpgradeCost(config, currentLevel, chapter) : 0;
    const canAfford = isUnlocked && !isMaxLevel && this.saveData.coins >= cost;

    return {
      id: config.id,
      currentLevel,
      nextLevel,
      maxLevel: config.maxLevel,
      cost,
      canAfford,
      canUpgrade: canAfford,
      isUnlocked,
      isMaxLevel,
      effectText: this.getStoreEffectText(config, nextLevel, isUnlocked, isMaxLevel),
      lockedReason: isUnlocked ? undefined : `第${config.unlockLevel}关解锁`,
    };
  }

  buyStoreUpgrade(config: StoreUpgradeConfig, chapter = 1): boolean {
    const preview = this.previewStoreUpgrade(config, chapter);
    if (!preview.canUpgrade) {
      return false;
    }

    this.saveData.coins -= preview.cost;
    this.saveData.storeUpgradeLevels[config.id] = preview.nextLevel;
    return true;
  }

  previewCosmetic(config: CosmeticItemConfig): UpgradePreview {
    const isUnlocked = this.isUnlocked(config.unlockLevel);
    const isOwned = this.saveData.ownedCosmeticIds.includes(config.id);
    const isEquipped = this.saveData.equippedCosmeticIds[config.slot] === config.id;
    const canAfford = isUnlocked && !isOwned && this.saveData.coins >= config.cost;

    return {
      id: config.id,
      currentLevel: isOwned ? 1 : 0,
      nextLevel: 1,
      maxLevel: 1,
      cost: isOwned ? 0 : config.cost,
      canAfford,
      canUpgrade: canAfford,
      isUnlocked,
      isMaxLevel: isOwned,
      effectText: isOwned ? (isEquipped ? '已装备' : '已拥有，可装备') : this.formatEffects(config.effects),
      lockedReason: isUnlocked ? undefined : `第${config.unlockLevel}关解锁`,
      isOwned,
      isEquipped,
      slot: config.slot,
    };
  }

  buyCosmetic(config: CosmeticItemConfig): boolean {
    const preview = this.previewCosmetic(config);
    if (!preview.canUpgrade) {
      return false;
    }

    this.saveData.coins -= preview.cost;
    if (!this.saveData.ownedCosmeticIds.includes(config.id)) {
      this.saveData.ownedCosmeticIds.push(config.id);
      this.saveData.ownedCosmeticIds.sort();
    }
    return this.equipCosmetic(config);
  }

  equipCosmetic(config: CosmeticItemConfig): boolean {
    if (!this.saveData.ownedCosmeticIds.includes(config.id)) {
      return false;
    }

    this.saveData.equippedCosmeticIds[config.slot] = config.id;
    return true;
  }

  unequipCosmetic(config: CosmeticItemConfig): boolean {
    if (this.saveData.equippedCosmeticIds[config.slot] !== config.id) {
      return false;
    }

    delete this.saveData.equippedCosmeticIds[config.slot];
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
    return EconomySystem.getEquipmentMaxLevel(config);
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

    const nextSpeedBonus = EconomySystem.getEquipmentSpeedBonusAtLevel(config, nextLevel);
    const currentSlotCount = EconomySystem.getEquipmentSlotCountAtLevel(config, currentLevel);
    const nextSlotCount = EconomySystem.getEquipmentSlotCountAtLevel(config, nextLevel);
    const parts = [`制作时间-${Math.round(nextSpeedBonus * 100)}%`];

    if (nextSlotCount > currentSlotCount) {
      parts.push(`工位+${nextSlotCount - currentSlotCount}`);
    }

    const milestone = this.getMilestoneAtLevel(config, nextLevel);
    if (milestone) {
      parts.push(milestone.name);
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

    const currentPrice = EconomySystem.getDishPriceAtLevel(config, Math.max(1, nextLevel - 1));
    const nextPrice = EconomySystem.getDishPriceAtLevel(config, nextLevel);
    const nextName = EconomySystem.getDishDisplayName(config, nextLevel);
    const milestone = this.getMilestoneAtLevel(config, nextLevel);
    const priceDelta = Math.max(0, nextPrice - currentPrice);
    const parts = [`${nextName}，售价+${priceDelta}`];
    if (milestone) {
      parts.push(milestone.effectText);
    }

    return parts.join('，');
  }

  private getStoreEffectText(config: StoreUpgradeConfig, nextLevel: number, isUnlocked: boolean, isMaxLevel: boolean): string {
    if (!isUnlocked) {
      return `第${config.unlockLevel}关解锁`;
    }

    if (isMaxLevel) {
      return '已满级';
    }

    const milestone = this.getMilestoneAtLevel(config, nextLevel);
    const parts = [this.formatEffects(config.effectsPerLevel)];
    if (milestone) {
      parts.push(milestone.effectText || milestone.name);
    }
    return parts.join('，');
  }

  private getEquipmentUpgradeCost(config: EquipmentConfig, level: number, chapter: number): number {
    return EconomySystem.getEquipmentUpgradeCost(config, level, chapter);
  }

  private getDishUpgradeCost(config: DishConfig, level: number, chapter: number): number {
    return EconomySystem.getDishUpgradeCost(config, level, chapter);
  }

  private getMilestoneAtLevel(config: { upgradeMilestones?: { level: number; name: string; effectText: string }[] }, level: number): {
    level: number;
    name: string;
    effectText: string;
  } | null {
    return config.upgradeMilestones?.find((milestone) => milestone.level === level) ?? null;
  }

  private formatEffects(effects: {
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
  }): string {
    const parts: string[] = [];
    if (effects.priceBonus) {
      parts.push(`售价+${Math.round(effects.priceBonus * 100)}%`);
    }
    if (effects.speedBonus) {
      parts.push(`制作速度+${Math.round(effects.speedBonus * 100)}%`);
    }
    if (effects.costReduce) {
      parts.push(`食材成本-${Math.round(effects.costReduce * 100)}%`);
    }
    if (effects.patienceBonus) {
      parts.push(`顾客耐心+${Math.round(effects.patienceBonus * 100)}%`);
    }
    if (effects.complaintReduce) {
      parts.push(`客诉惩罚-${Math.round(effects.complaintReduce * 100)}%`);
    }
    if (effects.rating) {
      parts.push(`口碑+${effects.rating}`);
    }
    if (effects.tipBonus) {
      parts.push(`小费+${Math.round(effects.tipBonus * 100)}%`);
    }
    if (effects.customerAttractBonus) {
      parts.push(`客流+${Math.round(effects.customerAttractBonus * 100)}%`);
    }
    if (effects.maxWaitingCustomers) {
      parts.push(
        effects.maxWaitingCustomers >= 1
          ? `排队上限+${Math.floor(effects.maxWaitingCustomers)}`
          : `排队上限进度+${Math.round(effects.maxWaitingCustomers * 100)}%`
      );
    }
    if (effects.prepCacheLimit) {
      parts.push(`备菜上限+${Math.max(1, Math.round(effects.prepCacheLimit))}`);
    }
    if (effects.pickyAcceptance) {
      parts.push(`挑剔接受+${Math.round(effects.pickyAcceptance * 100)}%`);
    }
    if (effects.leftoverLossReduce) {
      parts.push(`剩菜损耗-${Math.round(effects.leftoverLossReduce * 100)}%`);
    }
    if (effects.visualStage) {
      parts.push(`视觉阶段+${Math.round(effects.visualStage * 10) / 10}`);
    }
    return parts.join('，') || '外观升级';
  }
}
