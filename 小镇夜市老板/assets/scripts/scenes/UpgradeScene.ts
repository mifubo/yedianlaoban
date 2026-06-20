import { _decorator, Component, director } from 'cc';
import { ConfigLoader } from '../core/config/ConfigLoader';
import { DishId, EquipmentId, RuntimeConfig } from '../core/config/types';
import { GameContext } from '../core/game/GameContext';
import { SceneName } from '../core/game/SceneNames';
import { PlayerSaveData, SaveSystem } from '../core/save/SaveSystem';
import { UpgradePreview, UpgradeSystem } from '../systems/UpgradeSystem';

const { ccclass } = _decorator;

export interface UpgradeSceneSnapshot {
  coins: number;
  currentLevelId: number;
  currentChapter: number;
  equipments: UpgradePreview[];
  dishes: UpgradePreview[];
}

@ccclass('UpgradeScene')
export class UpgradeScene extends Component {
  private configs: RuntimeConfig | null = null;
  private saveData: PlayerSaveData | null = null;
  private upgradeSystem: UpgradeSystem | null = null;

  onLoad(): void {
    void this.bootstrap();
  }

  previewGriddleUpgrade(): UpgradePreview | null {
    return this.previewEquipmentUpgrade('station_griddle');
  }

  buyGriddleUpgrade(): boolean {
    return this.buyEquipmentUpgrade('station_griddle');
  }

  previewEquipmentUpgrade(equipmentId: EquipmentId): UpgradePreview | null {
    const equipment = this.configs?.equipmentById.get(equipmentId);
    if (!equipment || !this.upgradeSystem) {
      return null;
    }

    return this.upgradeSystem.previewEquipment(equipment, this.getCurrentChapter());
  }

  buyEquipmentUpgrade(equipmentId: EquipmentId): boolean {
    const equipment = this.configs?.equipmentById.get(equipmentId);
    if (!equipment || !this.upgradeSystem || !this.saveData) {
      return false;
    }

    const didBuy = this.upgradeSystem.buyEquipment(equipment, this.getCurrentChapter());
    if (didBuy) {
      SaveSystem.save(this.saveData);
    }

    return didBuy;
  }

  previewDishUpgrade(dishId: DishId): UpgradePreview | null {
    const dish = this.configs?.dishById.get(dishId);
    if (!dish || !this.upgradeSystem) {
      return null;
    }

    return this.upgradeSystem.previewDish(dish, this.getCurrentChapter());
  }

  buyDishUpgrade(dishId: DishId): boolean {
    const dish = this.configs?.dishById.get(dishId);
    if (!dish || !this.upgradeSystem || !this.saveData) {
      return false;
    }

    const didBuy = this.upgradeSystem.buyDish(dish, this.getCurrentChapter());
    if (didBuy) {
      SaveSystem.save(this.saveData);
    }

    return didBuy;
  }

  getSnapshot(): UpgradeSceneSnapshot | null {
    if (!this.configs || !this.upgradeSystem || !this.saveData) {
      return null;
    }

    return {
      coins: this.saveData.coins,
      currentLevelId: this.saveData.currentLevelId,
      currentChapter: this.getCurrentChapter(),
      equipments: [...this.configs.equipments]
        .sort((a, b) => a.unlockLevel - b.unlockLevel)
        .map((equipment) => this.upgradeSystem?.previewEquipment(equipment, this.getCurrentChapter()))
        .filter((preview): preview is UpgradePreview => preview !== undefined),
      dishes: [...this.configs.dishes]
        .sort((a, b) => a.unlockLevel - b.unlockLevel)
        .map((dish) => this.upgradeSystem?.previewDish(dish, this.getCurrentChapter()))
        .filter((preview): preview is UpgradePreview => preview !== undefined),
    };
  }

  goHome(): void {
    director.loadScene(SceneName.Home);
  }

  private async bootstrap(): Promise<void> {
    this.configs = GameContext.instance.configs ?? (await ConfigLoader.load({ kind: 'ts' }));
    GameContext.instance.setConfigs(this.configs);
    this.saveData = SaveSystem.load();
    this.upgradeSystem = new UpgradeSystem(this.saveData);
  }

  private getCurrentChapter(): number {
    if (!this.configs || !this.saveData) {
      return 1;
    }

    const currentLevel =
      this.configs.levelById.get(this.saveData.currentLevelId) ?? this.configs.levels[this.configs.levels.length - 1];
    return currentLevel?.chapter ?? 1;
  }
}
