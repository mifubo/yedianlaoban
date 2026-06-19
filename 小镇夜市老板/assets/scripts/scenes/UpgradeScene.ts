import { _decorator, Component, director } from 'cc';
import { ConfigLoader } from '../core/config/ConfigLoader';
import { RuntimeConfig } from '../core/config/types';
import { GameContext } from '../core/game/GameContext';
import { SceneName } from '../core/game/SceneNames';
import { PlayerSaveData, SaveSystem } from '../core/save/SaveSystem';
import { UpgradePreview, UpgradeSystem } from '../systems/UpgradeSystem';

const { ccclass } = _decorator;

@ccclass('UpgradeScene')
export class UpgradeScene extends Component {
  private configs: RuntimeConfig | null = null;
  private saveData: PlayerSaveData | null = null;
  private upgradeSystem: UpgradeSystem | null = null;

  onLoad(): void {
    void this.bootstrap();
  }

  previewGriddleUpgrade(): UpgradePreview | null {
    const equipment = this.configs?.equipmentById.get('station_griddle');
    if (!equipment || !this.upgradeSystem) {
      return null;
    }

    return this.upgradeSystem.previewEquipment(equipment);
  }

  buyGriddleUpgrade(): boolean {
    const equipment = this.configs?.equipmentById.get('station_griddle');
    if (!equipment || !this.upgradeSystem || !this.saveData) {
      return false;
    }

    const didBuy = this.upgradeSystem.buyEquipment(equipment);
    if (didBuy) {
      SaveSystem.save(this.saveData);
    }

    return didBuy;
  }

  previewDishUpgrade(dishId: string): UpgradePreview | null {
    const dish = this.configs?.dishById.get(dishId);
    if (!dish || !this.upgradeSystem) {
      return null;
    }

    return this.upgradeSystem.previewDish(dish);
  }

  buyDishUpgrade(dishId: string): boolean {
    const dish = this.configs?.dishById.get(dishId);
    if (!dish || !this.upgradeSystem || !this.saveData) {
      return false;
    }

    const didBuy = this.upgradeSystem.buyDish(dish);
    if (didBuy) {
      SaveSystem.save(this.saveData);
    }

    return didBuy;
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
}
