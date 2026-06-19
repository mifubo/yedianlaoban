import { DishConfig, EquipmentConfig } from '../core/config/types';
import { PlayerSaveData } from '../core/save/SaveSystem';

export interface UpgradePreview {
  id: string;
  currentLevel: number;
  nextLevel: number;
  cost: number;
  canAfford: boolean;
  effectText: string;
}

export class UpgradeSystem {
  constructor(private readonly saveData: PlayerSaveData) {}

  previewEquipment(config: EquipmentConfig, chapter = 1): UpgradePreview {
    const currentLevel = this.saveData.equipmentLevels[config.id] ?? 1;
    const cost = this.getEquipmentUpgradeCost(config, currentLevel, chapter);
    const nextSpeedBonus = Math.min(config.maxSpeedBonus, config.speedBonusPerLevel * currentLevel);

    return {
      id: config.id,
      currentLevel,
      nextLevel: currentLevel + 1,
      cost,
      canAfford: this.saveData.coins >= cost,
      effectText: `制作时间-${Math.round(nextSpeedBonus * 100)}%`,
    };
  }

  buyEquipment(config: EquipmentConfig, chapter = 1): boolean {
    const preview = this.previewEquipment(config, chapter);
    if (!preview.canAfford) {
      return false;
    }

    this.saveData.coins -= preview.cost;
    this.saveData.equipmentLevels[config.id] = preview.nextLevel;
    return true;
  }

  previewDish(config: DishConfig, chapter = 1): UpgradePreview {
    const currentLevel = this.saveData.dishLevels[config.id] ?? 1;
    const cost = this.getDishUpgradeCost(config, currentLevel, chapter);
    const priceBonus = 0.08 * currentLevel;

    return {
      id: config.id,
      currentLevel,
      nextLevel: currentLevel + 1,
      cost,
      canAfford: this.saveData.coins >= cost,
      effectText: `售价+${Math.round(priceBonus * 100)}%`,
    };
  }

  buyDish(config: DishConfig, chapter = 1): boolean {
    const preview = this.previewDish(config, chapter);
    if (!preview.canAfford) {
      return false;
    }

    this.saveData.coins -= preview.cost;
    this.saveData.dishLevels[config.id] = preview.nextLevel;
    return true;
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
