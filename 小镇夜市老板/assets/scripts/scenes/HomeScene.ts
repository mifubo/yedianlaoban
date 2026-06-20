import { _decorator, Component, director, Label } from 'cc';
import { ConfigLoader } from '../core/config/ConfigLoader';
import { RuntimeConfig } from '../core/config/types';
import { GameContext } from '../core/game/GameContext';
import { SceneName } from '../core/game/SceneNames';
import { PlayerSaveData, SaveSystem } from '../core/save/SaveSystem';

const { ccclass, property } = _decorator;

export interface HomeSceneSnapshot {
  isReady: boolean;
  currentLevelId: number;
  coins: number;
  completedLevelCount: number;
  totalStars: number;
}

@ccclass('HomeScene')
export class HomeScene extends Component {
  @property
  preferJsonConfig = false;

  @property(Label)
  currentLevelLabel: Label | null = null;

  @property(Label)
  coinLabel: Label | null = null;

  @property(Label)
  starLabel: Label | null = null;

  private isReady = false;
  private configs: RuntimeConfig | null = null;
  private saveData: PlayerSaveData = SaveSystem.load();

  onLoad(): void {
    void this.bootstrap();
  }

  playCurrentLevel(): void {
    if (!this.isReady) {
      return;
    }

    const saveData = SaveSystem.load();
    GameContext.instance.selectLevel(this.getPlayableLevelId(saveData));
    director.loadScene(SceneName.Game);
  }

  openUpgrade(): void {
    director.loadScene(SceneName.Upgrade);
  }

  getSnapshot(): HomeSceneSnapshot {
    this.saveData = SaveSystem.load();

    return {
      isReady: this.isReady,
      currentLevelId: this.getPlayableLevelId(this.saveData),
      coins: this.saveData.coins,
      completedLevelCount: this.saveData.completedLevels.length,
      totalStars: SaveSystem.getTotalStars(this.saveData),
    };
  }

  private async bootstrap(): Promise<void> {
    this.configs = await ConfigLoader.load({
      kind: this.preferJsonConfig ? 'hybrid' : 'ts',
    });
    GameContext.instance.setConfigs(this.configs);
    this.isReady = true;
    this.refreshView();
  }

  private refreshView(): void {
    const snapshot = this.getSnapshot();

    if (this.currentLevelLabel) {
      this.currentLevelLabel.string = `第 ${snapshot.currentLevelId} 关`;
    }

    if (this.coinLabel) {
      this.coinLabel.string = `${snapshot.coins}`;
    }

    if (this.starLabel) {
      this.starLabel.string = `${snapshot.totalStars}`;
    }
  }

  private getPlayableLevelId(saveData: PlayerSaveData): number {
    if (!this.configs || this.configs.levelById.has(saveData.currentLevelId)) {
      return saveData.currentLevelId;
    }

    return this.configs.levels[this.configs.levels.length - 1]?.id ?? 1;
  }
}
