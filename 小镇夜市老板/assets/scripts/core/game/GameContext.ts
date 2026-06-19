import { RuntimeConfig } from '../config/types';
import { LevelResult } from './GameSession';

export class GameContext {
  private static cached: GameContext | null = null;

  selectedLevelId = 1;
  configs: RuntimeConfig | null = null;
  lastResult: LevelResult | null = null;

  static get instance(): GameContext {
    if (!this.cached) {
      this.cached = new GameContext();
    }

    return this.cached;
  }

  setConfigs(configs: RuntimeConfig): void {
    this.configs = configs;
  }

  selectLevel(levelId: number): void {
    this.selectedLevelId = levelId;
  }
}
