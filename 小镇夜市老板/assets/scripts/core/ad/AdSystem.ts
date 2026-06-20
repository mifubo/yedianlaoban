export enum RewardedAdSlot {
  SettlementDouble = 'settlement_double',
  FailExtendTime = 'fail_extend_time',
}

export enum InterstitialAdSlot {
  LevelResult = 'level_result',
}

export type AdProvider = 'mock' | 'wechat' | 'douyin';
export type AdShowStatus = 'completed' | 'closed' | 'skipped' | 'failed';

export interface AdShowContext {
  levelId?: number;
  sceneName?: string;
}

export interface RewardedAdResult {
  adType: 'rewarded';
  provider: AdProvider;
  slot: RewardedAdSlot;
  status: AdShowStatus;
  completed: boolean;
  rewardGranted: boolean;
  errorMessage?: string;
}

export interface InterstitialAdResult {
  adType: 'interstitial';
  provider: AdProvider;
  slot: InterstitialAdSlot;
  status: AdShowStatus;
  shown: boolean;
  errorMessage?: string;
}

export interface IAdSystem {
  readonly provider: AdProvider;
  canShowRewarded(slot: RewardedAdSlot, context?: AdShowContext): boolean;
  showRewarded(slot: RewardedAdSlot, context?: AdShowContext): Promise<RewardedAdResult>;
  canShowInterstitial(slot: InterstitialAdSlot, context?: AdShowContext): boolean;
  showInterstitial(slot: InterstitialAdSlot, context?: AdShowContext): Promise<InterstitialAdResult>;
}

export interface MockAdSystemOptions {
  rewardedShouldComplete?: boolean | Partial<Record<RewardedAdSlot, boolean>>;
  interstitialShouldSucceed?: boolean;
  interstitialMinLevelId?: number;
  latencyMs?: number;
}

export class MockAdSystem implements IAdSystem {
  readonly provider: AdProvider = 'mock';

  private readonly rewardedShouldComplete: boolean | Partial<Record<RewardedAdSlot, boolean>>;
  private readonly interstitialShouldSucceed: boolean;
  private readonly interstitialMinLevelId: number;
  private readonly latencyMs: number;

  constructor(options: MockAdSystemOptions | boolean = {}) {
    const normalizedOptions: MockAdSystemOptions =
      typeof options === 'boolean' ? { rewardedShouldComplete: options } : options;

    this.rewardedShouldComplete = normalizedOptions.rewardedShouldComplete ?? true;
    this.interstitialShouldSucceed = normalizedOptions.interstitialShouldSucceed ?? true;
    this.interstitialMinLevelId = normalizedOptions.interstitialMinLevelId ?? 6;
    this.latencyMs = normalizedOptions.latencyMs ?? 0;
  }

  canShowRewarded(_slot: RewardedAdSlot, _context?: AdShowContext): boolean {
    return true;
  }

  async showRewarded(slot: RewardedAdSlot, _context?: AdShowContext): Promise<RewardedAdResult> {
    try {
      await this.wait();
      const completed = this.shouldCompleteRewarded(slot);

      return {
        adType: 'rewarded',
        provider: this.provider,
        slot,
        status: completed ? 'completed' : 'closed',
        completed,
        rewardGranted: completed,
      };
    } catch (error) {
      return this.createRewardedFailure(slot, this.stringifyError(error));
    }
  }

  canShowInterstitial(_slot: InterstitialAdSlot, context?: AdShowContext): boolean {
    return !this.isBeforeInterstitialGate(context);
  }

  async showInterstitial(slot: InterstitialAdSlot, context?: AdShowContext): Promise<InterstitialAdResult> {
    try {
      await this.wait();

      if (!this.canShowInterstitial(slot, context)) {
        return {
          adType: 'interstitial',
          provider: this.provider,
          slot,
          status: 'skipped',
          shown: false,
        };
      }

      if (!this.interstitialShouldSucceed) {
        return this.createInterstitialFailure(slot, 'mock_interstitial_failed');
      }

      return {
        adType: 'interstitial',
        provider: this.provider,
        slot,
        status: 'completed',
        shown: true,
      };
    } catch (error) {
      return this.createInterstitialFailure(slot, this.stringifyError(error));
    }
  }

  private shouldCompleteRewarded(slot: RewardedAdSlot): boolean {
    if (typeof this.rewardedShouldComplete === 'boolean') {
      return this.rewardedShouldComplete;
    }

    return this.rewardedShouldComplete[slot] ?? true;
  }

  private isBeforeInterstitialGate(context?: AdShowContext): boolean {
    return typeof context?.levelId === 'number' && context.levelId < this.interstitialMinLevelId;
  }

  private async wait(): Promise<void> {
    if (this.latencyMs <= 0) {
      await Promise.resolve();
      return;
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, this.latencyMs);
    });
  }

  private createRewardedFailure(slot: RewardedAdSlot, errorMessage: string): RewardedAdResult {
    return {
      adType: 'rewarded',
      provider: this.provider,
      slot,
      status: 'failed',
      completed: false,
      rewardGranted: false,
      errorMessage,
    };
  }

  private createInterstitialFailure(slot: InterstitialAdSlot, errorMessage: string): InterstitialAdResult {
    return {
      adType: 'interstitial',
      provider: this.provider,
      slot,
      status: 'failed',
      shown: false,
      errorMessage,
    };
  }

  private stringifyError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

export type IAdService = IAdSystem;

export class MockAdService extends MockAdSystem {}
