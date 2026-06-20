import { AdProvider } from './AdSystem';
import {
  MiniGameAdPlatform,
  MiniGamePlatformAdSystem,
  MiniGamePlatformAdSystemOptions,
} from './MiniGamePlatformAdSystem';

declare const wx: MiniGameAdPlatform | undefined;

export class WeChatMiniGameAdSystem extends MiniGamePlatformAdSystem {
  readonly provider: AdProvider = 'wechat';

  constructor(options: MiniGamePlatformAdSystemOptions = {}) {
    super('wechat', () => (typeof wx === 'undefined' ? null : wx), options);
  }
}
