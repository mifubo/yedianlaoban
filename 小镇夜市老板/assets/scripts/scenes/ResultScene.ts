import { _decorator, Component, director } from 'cc';
import { MockAdService, RewardedAdSlot } from '../core/ad/AdService';
import { GameContext } from '../core/game/GameContext';
import { SceneName } from '../core/game/SceneNames';
import { SaveSystem } from '../core/save/SaveSystem';

const { ccclass } = _decorator;

@ccclass('ResultScene')
export class ResultScene extends Component {
  private readonly adService = new MockAdService(true);

  claimBaseReward(): void {
    const result = GameContext.instance.lastResult;
    if (!result) {
      director.loadScene(SceneName.Home);
      return;
    }

    const saveData = SaveSystem.load();
    saveData.coins += result.finalRewardCoins;

    if (result.outcome === 'success') {
      if (!saveData.completedLevels.includes(result.levelId)) {
        saveData.completedLevels.push(result.levelId);
      }
      saveData.currentLevelId = Math.max(saveData.currentLevelId, result.levelId + 1);
    }

    SaveSystem.save(saveData);
  }

  async claimDoubleRewardByAd(): Promise<void> {
    const result = GameContext.instance.lastResult;
    if (!result || !result.canWatchDoubleRewardAd) {
      return;
    }

    const adResult = await this.adService.showRewarded(RewardedAdSlot.SettlementDouble);
    if (!adResult.rewardGranted) {
      return;
    }

    result.finalRewardCoins = result.baseRewardCoins * 2;
    result.canWatchDoubleRewardAd = false;
    const saveData = SaveSystem.load();
    saveData.adState.settlementDoubleWatchedByLevel[String(result.levelId)] = true;
    SaveSystem.save(saveData);
  }

  retryLevel(): void {
    const result = GameContext.instance.lastResult;
    if (result) {
      GameContext.instance.selectLevel(result.levelId);
    }

    director.loadScene(SceneName.Game);
  }

  playNextLevel(): void {
    const saveData = SaveSystem.load();
    GameContext.instance.selectLevel(saveData.currentLevelId);
    director.loadScene(SceneName.Game);
  }

  goHome(): void {
    director.loadScene(SceneName.Home);
  }
}
