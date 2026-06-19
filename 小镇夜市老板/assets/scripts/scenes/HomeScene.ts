import { _decorator, Component, director } from 'cc';
import { ConfigLoader } from '../core/config/ConfigLoader';
import { GameContext } from '../core/game/GameContext';
import { SceneName } from '../core/game/SceneNames';
import { SaveSystem } from '../core/save/SaveSystem';

const { ccclass, property } = _decorator;

@ccclass('HomeScene')
export class HomeScene extends Component {
  @property
  preferJsonConfig = false;

  private isReady = false;

  onLoad(): void {
    void this.bootstrap();
  }

  playCurrentLevel(): void {
    if (!this.isReady) {
      return;
    }

    const saveData = SaveSystem.load();
    GameContext.instance.selectLevel(saveData.currentLevelId);
    director.loadScene(SceneName.Game);
  }

  openUpgrade(): void {
    director.loadScene(SceneName.Upgrade);
  }

  private async bootstrap(): Promise<void> {
    const configs = await ConfigLoader.load({
      kind: this.preferJsonConfig ? 'hybrid' : 'ts',
    });
    GameContext.instance.setConfigs(configs);
    this.isReady = true;
  }
}
