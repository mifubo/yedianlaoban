import { LevelConfig, LevelId } from '../config/types';
import { EconomySystem } from '../../systems/EconomySystem';

export type LevelOutcome = 'success' | 'fail';

export interface LevelResult {
  levelId: LevelId;
  outcome: LevelOutcome;
  earnedCoins: number;
  netProfitCoins: number;
  baseRewardCoins: number;
  finalRewardCoins: number;
  settlementAdBonusCoins: number;
  servedCustomers: number;
  maxCombo: number;
  angryLeaveCount: number;
  wrongServeCount: number;
  complaintPenaltyCoins: number;
  leftoverLossCoins: number;
  remainingDishCount: number;
  stars: number;
  rewardClaimed: boolean;
  canWatchSettlementBonusAd: boolean;
  canWatchExtendTimeAd: boolean;
}

export interface BuildLevelResultOptions {
  level: LevelConfig;
  outcome: LevelOutcome;
  earnedCoins: number;
  servedCustomers: number;
  maxCombo: number;
  angryLeaveCount?: number;
  wrongServeCount?: number;
  complaintPenaltyCoins?: number;
  leftoverLossCoins?: number;
  remainingDishCount?: number;
}

export function calculateStars(level: LevelConfig, earnedCoins: number): number {
  if (earnedCoins >= level.goals.coin3) {
    return 3;
  }

  if (earnedCoins >= level.goals.coin2) {
    return 2;
  }

  if (earnedCoins >= level.goals.coin1) {
    return 1;
  }

  return 0;
}

export function buildLevelResult(options: BuildLevelResultOptions): LevelResult {
  const stars = options.outcome === 'success' ? calculateStars(options.level, options.earnedCoins) : 0;
  const baseRewardCoins = Math.max(0, options.earnedCoins);
  const settlementAdBonusCoins =
    options.outcome === 'success' ? EconomySystem.calculateSettlementAdBonus(options.level, baseRewardCoins) : 0;

  return {
    levelId: options.level.id,
    outcome: options.outcome,
    earnedCoins: options.earnedCoins,
    netProfitCoins: options.earnedCoins,
    baseRewardCoins,
    finalRewardCoins: baseRewardCoins,
    settlementAdBonusCoins,
    servedCustomers: options.servedCustomers,
    maxCombo: options.maxCombo,
    angryLeaveCount: options.angryLeaveCount ?? 0,
    wrongServeCount: options.wrongServeCount ?? 0,
    complaintPenaltyCoins: options.complaintPenaltyCoins ?? 0,
    leftoverLossCoins: options.leftoverLossCoins ?? 0,
    remainingDishCount: options.remainingDishCount ?? 0,
    stars,
    rewardClaimed: false,
    canWatchSettlementBonusAd: options.outcome === 'success' && settlementAdBonusCoins > 0,
    canWatchExtendTimeAd: options.outcome === 'fail',
  };
}
