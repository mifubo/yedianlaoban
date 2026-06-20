import {
  AdProvider,
  AdShowContext,
  InterstitialAdResult,
  InterstitialAdSlot,
  IAdSystem,
  RewardedAdResult,
  RewardedAdSlot,
} from './AdSystem';

interface MiniGameAdError {
  errMsg?: string;
  errCode?: number;
}

interface MiniGameRewardedCloseResult {
  isEnded?: boolean;
}

interface MiniGameRewardedVideoAd {
  load?: () => Promise<void> | void;
  show: () => Promise<void> | void;
  onClose: (callback: (result?: MiniGameRewardedCloseResult) => void) => void;
  offClose?: (callback: (result?: MiniGameRewardedCloseResult) => void) => void;
  onError: (callback: (error?: MiniGameAdError) => void) => void;
  offError?: (callback: (error?: MiniGameAdError) => void) => void;
  destroy?: () => void;
}

interface MiniGameInterstitialAd {
  load?: () => Promise<void> | void;
  show: () => Promise<void> | void;
  onClose?: (callback: () => void) => void;
  offClose?: (callback: () => void) => void;
  onError: (callback: (error?: MiniGameAdError) => void) => void;
  offError?: (callback: (error?: MiniGameAdError) => void) => void;
  destroy?: () => void;
}

export interface MiniGameAdPlatform {
  createRewardedVideoAd?: (options: { adUnitId: string }) => MiniGameRewardedVideoAd;
  createInterstitialAd?: (options: { adUnitId: string }) => MiniGameInterstitialAd;
}

export interface MiniGamePlatformAdSystemOptions {
  rewardedAdUnitIds?: Partial<Record<RewardedAdSlot, string>>;
  interstitialAdUnitIds?: Partial<Record<InterstitialAdSlot, string>>;
  interstitialMinLevelId?: number;
  timeoutMs?: number;
}

export abstract class MiniGamePlatformAdSystem implements IAdSystem {
  abstract readonly provider: AdProvider;

  private readonly interstitialMinLevelId: number;
  private readonly timeoutMs: number;

  protected constructor(
    private readonly platformName: string,
    private readonly getPlatform: () => MiniGameAdPlatform | null,
    private readonly options: MiniGamePlatformAdSystemOptions = {},
  ) {
    this.interstitialMinLevelId = options.interstitialMinLevelId ?? 6;
    this.timeoutMs = options.timeoutMs ?? 8000;
  }

  canShowRewarded(slot: RewardedAdSlot, _context?: AdShowContext): boolean {
    const platform = this.getPlatform();
    return Boolean(platform?.createRewardedVideoAd && this.options.rewardedAdUnitIds?.[slot]);
  }

  showRewarded(slot: RewardedAdSlot, _context?: AdShowContext): Promise<RewardedAdResult> {
    const adUnitId = this.options.rewardedAdUnitIds?.[slot];
    const platform = this.getPlatform();
    const createRewardedVideoAd = platform?.createRewardedVideoAd;

    if (!createRewardedVideoAd || !adUnitId) {
      return Promise.resolve(this.createRewardedFailure(slot, `${this.platformName}_rewarded_unavailable`));
    }

    return new Promise<RewardedAdResult>((resolve) => {
      let settled = false;
      let ad: MiniGameRewardedVideoAd | null = null;
      let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

      const finish = (result: RewardedAdResult): void => {
        if (settled) {
          return;
        }

        settled = true;
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }

        if (ad) {
          ad.offClose?.(handleClose);
          ad.offError?.(handleError);
          ad.destroy?.();
        }

        resolve(result);
      };

      const handleClose = (result?: MiniGameRewardedCloseResult): void => {
        const completed = result?.isEnded !== false;
        finish({
          adType: 'rewarded',
          provider: this.provider,
          slot,
          status: completed ? 'completed' : 'closed',
          completed,
          rewardGranted: completed,
        });
      };

      const handleError = (error?: MiniGameAdError): void => {
        finish(this.createRewardedFailure(slot, this.stringifyPlatformError(error)));
      };

      try {
        ad = createRewardedVideoAd({ adUnitId });
        ad.onClose(handleClose);
        ad.onError(handleError);
        timeoutHandle = setTimeout(() => {
          finish(this.createRewardedFailure(slot, `${this.platformName}_rewarded_timeout`));
        }, this.timeoutMs);

        Promise.resolve(ad.load?.())
          .then(() => Promise.resolve(ad?.show()))
          .catch((error: unknown) => {
            finish(this.createRewardedFailure(slot, this.stringifyUnknownError(error)));
          });
      } catch (error) {
        finish(this.createRewardedFailure(slot, this.stringifyUnknownError(error)));
      }
    });
  }

  canShowInterstitial(slot: InterstitialAdSlot, context?: AdShowContext): boolean {
    if (this.isBeforeInterstitialGate(context)) {
      return false;
    }

    const platform = this.getPlatform();
    return Boolean(platform?.createInterstitialAd && this.options.interstitialAdUnitIds?.[slot]);
  }

  showInterstitial(slot: InterstitialAdSlot, context?: AdShowContext): Promise<InterstitialAdResult> {
    if (this.isBeforeInterstitialGate(context)) {
      return Promise.resolve({
        adType: 'interstitial',
        provider: this.provider,
        slot,
        status: 'skipped',
        shown: false,
      });
    }

    const adUnitId = this.options.interstitialAdUnitIds?.[slot];
    const platform = this.getPlatform();
    const createInterstitialAd = platform?.createInterstitialAd;
    if (!createInterstitialAd || !adUnitId) {
      return Promise.resolve(this.createInterstitialFailure(slot, `${this.platformName}_interstitial_unavailable`));
    }

    return new Promise<InterstitialAdResult>((resolve) => {
      let settled = false;
      let ad: MiniGameInterstitialAd | null = null;
      let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

      const finish = (result: InterstitialAdResult): void => {
        if (settled) {
          return;
        }

        settled = true;
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }

        if (ad) {
          ad.offClose?.(handleClose);
          ad.offError?.(handleError);
          ad.destroy?.();
        }

        resolve(result);
      };

      const handleClose = (): void => {
        finish({
          adType: 'interstitial',
          provider: this.provider,
          slot,
          status: 'completed',
          shown: true,
        });
      };

      const handleError = (error?: MiniGameAdError): void => {
        finish(this.createInterstitialFailure(slot, this.stringifyPlatformError(error)));
      };

      try {
        ad = createInterstitialAd({ adUnitId });
        ad.onClose?.(handleClose);
        ad.onError(handleError);
        timeoutHandle = setTimeout(() => {
          finish(this.createInterstitialFailure(slot, `${this.platformName}_interstitial_timeout`));
        }, this.timeoutMs);

        Promise.resolve(ad.load?.())
          .then(() => Promise.resolve(ad?.show()))
          .then(() => {
            if (!ad?.onClose) {
              finish({
                adType: 'interstitial',
                provider: this.provider,
                slot,
                status: 'completed',
                shown: true,
              });
            }
          })
          .catch((error: unknown) => {
            finish(this.createInterstitialFailure(slot, this.stringifyUnknownError(error)));
          });
      } catch (error) {
        finish(this.createInterstitialFailure(slot, this.stringifyUnknownError(error)));
      }
    });
  }

  private isBeforeInterstitialGate(context?: AdShowContext): boolean {
    return typeof context?.levelId === 'number' && context.levelId < this.interstitialMinLevelId;
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

  private stringifyPlatformError(error?: MiniGameAdError): string {
    if (!error) {
      return `${this.platformName}_ad_error`;
    }

    return error.errMsg ?? `${this.platformName}_ad_error_${error.errCode ?? 'unknown'}`;
  }

  private stringifyUnknownError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
