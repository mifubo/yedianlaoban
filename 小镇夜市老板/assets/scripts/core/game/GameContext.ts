import { CustomerId, DishId, EquipmentId, RuntimeConfig, LevelId } from '../config/types';
import { LevelResult } from './GameSession';

export type GameResumeCustomerStatus = 'waiting' | 'served' | 'left';
export type GameResumeCookingSlotStatus = 'idle' | 'cooking';
export type GrowthViewMode = 'commercialStreet' | 'shop' | 'outfit' | 'equipmentManagement' | 'personalGrowth';

export interface GameResumeSpawnItem {
  spawnAtSec: number;
  customerId: CustomerId;
  orderDishIds: DishId[];
}

export interface GameResumeCustomer {
  runtimeId: string;
  configId: CustomerId;
  name: string;
  orderDishIds: DishId[];
  maxPatienceSec: number;
  patienceRemainingSec: number;
  status: GameResumeCustomerStatus;
}

export interface GameResumeCookingSlot {
  slotIndex: number;
  status: GameResumeCookingSlotStatus;
  dishId: DishId | null;
  timeRemainingSec: number;
  totalCookTimeSec: number;
}

export interface GameResumeEquipment {
  configId: EquipmentId;
  name: string;
  slots: GameResumeCookingSlot[];
}

export interface GameResumeState {
  levelId: LevelId;
  elapsedSec: number;
  bonusTimeSec: number;
  earnedCoins: number;
  servedCustomers: number;
  angryLeaveCount: number;
  wrongServeCount: number;
  complaintPenaltyCoins: number;
  combo: number;
  maxCombo: number;
  customerSerial: number;
  spawnQueue: GameResumeSpawnItem[];
  activeCustomers: GameResumeCustomer[];
  equipments: GameResumeEquipment[];
  cookedInventory: Partial<Record<DishId, number>>;
  targetDishServedCounts: Partial<Record<DishId, number>>;
  rngState: number;
}

export class GameContext {
  private static cached: GameContext | null = null;

  selectedLevelId = 1;
  growthViewMode: GrowthViewMode = 'commercialStreet';
  configs: RuntimeConfig | null = null;
  lastResult: LevelResult | null = null;
  private failedLevelResumeState: GameResumeState | null = null;

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

  selectGrowthView(mode: GrowthViewMode): void {
    this.growthViewMode = mode;
  }

  setFailedLevelResumeState(state: GameResumeState): void {
    this.failedLevelResumeState = cloneResumeState(state);
  }

  prepareFailedLevelResume(extraTimeSec: number): boolean {
    if (!this.failedLevelResumeState) {
      return false;
    }

    this.failedLevelResumeState = {
      ...cloneResumeState(this.failedLevelResumeState),
      bonusTimeSec: this.failedLevelResumeState.bonusTimeSec + Math.max(0, extraTimeSec),
    };
    this.selectedLevelId = this.failedLevelResumeState.levelId;
    return true;
  }

  consumeFailedLevelResumeState(levelId: LevelId): GameResumeState | null {
    if (!this.failedLevelResumeState || this.failedLevelResumeState.levelId !== levelId) {
      return null;
    }

    const state = cloneResumeState(this.failedLevelResumeState);
    this.failedLevelResumeState = null;
    return state;
  }

  clearFailedLevelResumeState(): void {
    this.failedLevelResumeState = null;
  }
}

function cloneResumeState(state: GameResumeState): GameResumeState {
  return JSON.parse(JSON.stringify(state)) as GameResumeState;
}
