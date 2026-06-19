export enum RewardedAdSlot {
  SettlementDouble = 'settlement_double',
  FailExtendTime = 'fail_extend_time',
  DailySubsidy = 'daily_subsidy',
}

export interface RewardedAdResult {
  slot: RewardedAdSlot;
  completed: boolean;
  rewardGranted: boolean;
  errorMessage?: string;
}

export interface IAdService {
  showRewarded(slot: RewardedAdSlot): Promise<RewardedAdResult>;
  canShowRewarded(slot: RewardedAdSlot): boolean;
}

export class MockAdService implements IAdService {
  constructor(private readonly alwaysComplete = true) {}

  canShowRewarded(_slot: RewardedAdSlot): boolean {
    return true;
  }

  async showRewarded(slot: RewardedAdSlot): Promise<RewardedAdResult> {
    await Promise.resolve();

    return {
      slot,
      completed: this.alwaysComplete,
      rewardGranted: this.alwaysComplete,
    };
  }
}
