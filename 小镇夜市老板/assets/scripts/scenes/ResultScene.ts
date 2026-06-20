import { _decorator, Component, director } from 'cc';
import {
  AdProviderPreference,
  createAdSystem,
  IAdSystem,
  InterstitialAdResult,
  InterstitialAdSlot,
  RewardedAdResult,
  RewardedAdSlot,
} from '../core/ad/AdService';
import { GameContext } from '../core/game/GameContext';
import { SceneName } from '../core/game/SceneNames';
import { SaveSystem } from '../core/save/SaveSystem';

const { ccclass, property } = _decorator;

@ccclass('ResultScene')
export class ResultScene extends Component {
  @property
  adProvider = 'mock';

  @property
  settlementDoubleRewardedAdUnitId = '';

  @property
  failExtendTimeRewardedAdUnitId = '';

  @property
  resultInterstitialAdUnitId = '';

  @property
  interstitialMinLevelId = 6;

  @property
  adTimeoutMs = 8000;

  private adSystem: IAdSystem = createAdSystem();

  onLoad(): void {
    this.adSystem = this.createSceneAdSystem();
    void this.tryShowResultInterstitial();
  }

  claimBaseReward(): boolean {
    const result = GameContext.instance.lastResult;
    if (!result) {
      director.loadScene(SceneName.Home);
      return false;
    }

    if (result.rewardClaimed) {
      return false;
    }

    const saveData = SaveSystem.load();
    SaveSystem.applyLevelResult(saveData, result);
    SaveSystem.save(saveData);
    result.rewardClaimed = true;
    result.canWatchDoubleRewardAd = false;

    return true;
  }

  async claimDoubleRewardByAd(): Promise<boolean> {
    const result = GameContext.instance.lastResult;
    if (!result || result.rewardClaimed || !result.canWatchDoubleRewardAd) {
      return false;
    }

    const saveData = SaveSystem.load();
    const levelKey = String(result.levelId);
    if (saveData.adState.settlementDoubleWatchedByLevel[levelKey]) {
      result.canWatchDoubleRewardAd = false;
      return false;
    }

    const adResult = await this.safeShowRewarded(RewardedAdSlot.SettlementDouble, result.levelId);
    if (!adResult.rewardGranted) {
      return false;
    }

    result.finalRewardCoins = result.baseRewardCoins * 2;
    result.canWatchDoubleRewardAd = false;
    result.rewardClaimed = true;
    saveData.adState.settlementDoubleWatchedByLevel[levelKey] = true;
    SaveSystem.applyLevelResult(saveData, result);
    SaveSystem.save(saveData);

    return true;
  }

  async extendFailedLevelByAd(): Promise<boolean> {
    const result = GameContext.instance.lastResult;
    if (!result || result.outcome !== 'fail' || !result.canWatchExtendTimeAd || result.rewardClaimed) {
      return false;
    }

    const saveData = SaveSystem.load();
    const levelKey = String(result.levelId);
    if (saveData.adState.failExtendWatchedByLevel[levelKey]) {
      result.canWatchExtendTimeAd = false;
      return false;
    }

    const adResult = await this.safeShowRewarded(RewardedAdSlot.FailExtendTime, result.levelId);
    if (!adResult.rewardGranted) {
      return false;
    }

    if (!GameContext.instance.prepareFailedLevelResume(15)) {
      result.canWatchExtendTimeAd = false;
      return false;
    }

    result.canWatchExtendTimeAd = false;
    saveData.adState.failExtendWatchedByLevel[levelKey] = true;
    SaveSystem.save(saveData);
    director.loadScene(SceneName.Game);

    return true;
  }

  retryLevel(): void {
    const result = GameContext.instance.lastResult;
    GameContext.instance.clearFailedLevelResumeState();
    if (result) {
      GameContext.instance.selectLevel(result.levelId);
    }

    director.loadScene(SceneName.Game);
  }

  playNextLevel(): void {
    GameContext.instance.clearFailedLevelResumeState();
    const saveData = SaveSystem.load();
    GameContext.instance.selectLevel(saveData.currentLevelId);
    director.loadScene(SceneName.Game);
  }

  goHome(): void {
    GameContext.instance.clearFailedLevelResumeState();
    director.loadScene(SceneName.Home);
  }

  private async tryShowResultInterstitial(): Promise<void> {
    const result = GameContext.instance.lastResult;
    if (!result) {
      return;
    }

    const adResult = await this.safeShowInterstitial(result.levelId);

    if (adResult.status === 'failed') {
      console.warn('[ResultScene] Interstitial ad failed.', adResult.errorMessage);
    }
  }

  private async safeShowRewarded(slot: RewardedAdSlot, levelId: number): Promise<RewardedAdResult> {
    try {
      return await this.adSystem.showRewarded(slot, {
        levelId,
        sceneName: SceneName.Result,
      });
    } catch (error) {
      console.warn('[ResultScene] Rewarded ad failed.', error);
      return {
        adType: 'rewarded' as const,
        provider: this.adSystem.provider,
        slot,
        status: 'failed' as const,
        completed: false,
        rewardGranted: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async safeShowInterstitial(levelId: number): Promise<InterstitialAdResult> {
    try {
      return await this.adSystem.showInterstitial(InterstitialAdSlot.LevelResult, {
        levelId,
        sceneName: SceneName.Result,
      });
    } catch (error) {
      console.warn('[ResultScene] Interstitial ad failed.', error);
      return {
        adType: 'interstitial',
        provider: this.adSystem.provider,
        slot: InterstitialAdSlot.LevelResult,
        status: 'failed',
        shown: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private createSceneAdSystem(): IAdSystem {
    const interstitialMinLevelId = Math.max(1, Math.floor(this.interstitialMinLevelId));
    const timeoutMs = Math.max(1000, Math.floor(this.adTimeoutMs));

    return createAdSystem({
      provider: this.getAdProvider(),
      adUnitIds: {
        settlementDoubleRewarded: this.settlementDoubleRewardedAdUnitId,
        failExtendTimeRewarded: this.failExtendTimeRewardedAdUnitId,
        resultInterstitial: this.resultInterstitialAdUnitId,
      },
      mock: {
        interstitialMinLevelId,
      },
      platform: {
        interstitialMinLevelId,
        timeoutMs,
      },
    });
  }

  private getAdProvider(): AdProviderPreference {
    if (this.adProvider === 'auto' || this.adProvider === 'wechat' || this.adProvider === 'douyin') {
      return this.adProvider;
    }

    return 'mock';
  }
}
