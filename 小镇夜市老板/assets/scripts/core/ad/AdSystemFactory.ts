import { AdProvider, IAdSystem, MockAdSystem, MockAdSystemOptions, RewardedAdSlot, InterstitialAdSlot } from './AdSystem';
import { DouyinMiniGameAdSystem } from './DouyinMiniGameAdSystem';
import { MiniGameAdPlatform, MiniGamePlatformAdSystemOptions } from './MiniGamePlatformAdSystem';
import { WeChatMiniGameAdSystem } from './WeChatMiniGameAdSystem';

declare const wx: MiniGameAdPlatform | undefined;
declare const tt: MiniGameAdPlatform | undefined;

export type AdProviderPreference = AdProvider | 'auto';

export interface AdUnitIdOptions {
  settlementDoubleRewarded?: string;
  failExtendTimeRewarded?: string;
  resultInterstitial?: string;
}

export interface CreateAdSystemOptions {
  provider?: AdProviderPreference;
  adUnitIds?: AdUnitIdOptions;
  mock?: MockAdSystemOptions;
  platform?: Omit<MiniGamePlatformAdSystemOptions, 'rewardedAdUnitIds' | 'interstitialAdUnitIds'>;
}

export function createAdSystem(options: CreateAdSystemOptions = {}): IAdSystem {
  const provider = options.provider ?? 'mock';

  if (provider === 'mock') {
    return new MockAdSystem(options.mock);
  }

  if (provider === 'wechat') {
    return new WeChatMiniGameAdSystem(createPlatformOptions(options));
  }

  if (provider === 'douyin') {
    return new DouyinMiniGameAdSystem(createPlatformOptions(options));
  }

  if (isWeChatMiniGameRuntime()) {
    return new WeChatMiniGameAdSystem(createPlatformOptions(options));
  }

  if (isDouyinMiniGameRuntime()) {
    return new DouyinMiniGameAdSystem(createPlatformOptions(options));
  }

  return new MockAdSystem(options.mock);
}

function createPlatformOptions(options: CreateAdSystemOptions): MiniGamePlatformAdSystemOptions {
  return {
    ...options.platform,
    rewardedAdUnitIds: {
      [RewardedAdSlot.SettlementDouble]: options.adUnitIds?.settlementDoubleRewarded ?? '',
      [RewardedAdSlot.FailExtendTime]: options.adUnitIds?.failExtendTimeRewarded ?? '',
    },
    interstitialAdUnitIds: {
      [InterstitialAdSlot.LevelResult]: options.adUnitIds?.resultInterstitial ?? '',
    },
  };
}

function isWeChatMiniGameRuntime(): boolean {
  return typeof wx !== 'undefined' && typeof wx.createRewardedVideoAd === 'function';
}

function isDouyinMiniGameRuntime(): boolean {
  return typeof tt !== 'undefined' && typeof tt.createRewardedVideoAd === 'function';
}
