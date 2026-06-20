import { AdProvider } from './AdSystem';
import {
  MiniGameAdPlatform,
  MiniGamePlatformAdSystem,
  MiniGamePlatformAdSystemOptions,
} from './MiniGamePlatformAdSystem';

declare const tt: MiniGameAdPlatform | undefined;

export class DouyinMiniGameAdSystem extends MiniGamePlatformAdSystem {
  readonly provider: AdProvider = 'douyin';

  constructor(options: MiniGamePlatformAdSystemOptions = {}) {
    super('douyin', () => (typeof tt === 'undefined' ? null : tt), options);
  }
}
