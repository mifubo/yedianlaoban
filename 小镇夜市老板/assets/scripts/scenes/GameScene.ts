import { _decorator, Component, director } from 'cc';
import { ConfigLoader } from '../core/config/ConfigLoader';
import { LevelConfig, RuntimeConfig } from '../core/config/types';
import { GameContext } from '../core/game/GameContext';
import { buildLevelResult } from '../core/game/GameSession';
import { SceneName } from '../core/game/SceneNames';

const { ccclass, property } = _decorator;

@ccclass('GameScene')
export class GameScene extends Component {
  @property
  autoStart = true;

  private configs: RuntimeConfig | null = null;
  private level: LevelConfig | null = null;
  private isRunning = false;
  private isPaused = false;

  onLoad(): void {
    void this.bootstrap();
  }

  startBusiness(): void {
    if (!this.level) {
      return;
    }

    this.isRunning = true;
    this.isPaused = false;
  }

  pauseBusiness(): void {
    if (!this.isRunning) {
      return;
    }

    this.isPaused = true;
  }

  resumeBusiness(): void {
    if (!this.isRunning) {
      return;
    }

    this.isPaused = false;
  }

  completeLevelMock(): void {
    if (!this.level) {
      return;
    }

    GameContext.instance.lastResult = buildLevelResult({
      level: this.level,
      outcome: 'success',
      earnedCoins: this.level.goals.coin1,
      servedCustomers: this.level.modifiers.customerCount,
      maxCombo: this.level.goals.combo ?? 0,
    });
    director.loadScene(SceneName.Result);
  }

  failLevelMock(): void {
    if (!this.level) {
      return;
    }

    GameContext.instance.lastResult = buildLevelResult({
      level: this.level,
      outcome: 'fail',
      earnedCoins: Math.floor(this.level.goals.coin1 * 0.5),
      servedCustomers: Math.floor(this.level.modifiers.customerCount * 0.5),
      maxCombo: 0,
      angryLeaveCount: 1,
    });
    director.loadScene(SceneName.Result);
  }

  goHome(): void {
    director.loadScene(SceneName.Home);
  }

  private async bootstrap(): Promise<void> {
    this.configs = GameContext.instance.configs ?? (await ConfigLoader.load({ kind: 'ts' }));
    GameContext.instance.setConfigs(this.configs);

    const selectedLevelId = GameContext.instance.selectedLevelId;
    this.level = this.configs.levelById.get(selectedLevelId) ?? this.configs.levels[0] ?? null;

    if (this.autoStart) {
      this.startBusiness();
    }
  }
}
