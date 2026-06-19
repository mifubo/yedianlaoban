import { sys } from 'cc';
import { DishId, EquipmentId, LevelId } from '../config/types';

export interface PlayerSaveData {
  currentLevelId: LevelId;
  coins: number;
  completedLevels: LevelId[];
  equipmentLevels: Record<EquipmentId, number>;
  dishLevels: Record<DishId, number>;
  adState: {
    settlementDoubleWatchedByLevel: Record<string, boolean>;
    failExtendWatchedByLevel: Record<string, boolean>;
  };
}

const SAVE_KEY = 'town_night_market_boss_save_v1';

export const DEFAULT_SAVE_DATA: PlayerSaveData = {
  currentLevelId: 1,
  coins: 0,
  completedLevels: [],
  equipmentLevels: {
    station_griddle: 1,
    station_drink: 1,
  },
  dishLevels: {
    dish_001: 1,
    dish_002: 1,
    dish_003: 1,
  },
  adState: {
    settlementDoubleWatchedByLevel: {},
    failExtendWatchedByLevel: {},
  },
};

function cloneDefaultSaveData(): PlayerSaveData {
  return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA)) as PlayerSaveData;
}

function mergeSaveData(parsed: Partial<PlayerSaveData>): PlayerSaveData {
  const defaults = cloneDefaultSaveData();

  return {
    ...defaults,
    ...parsed,
    equipmentLevels: {
      ...defaults.equipmentLevels,
      ...parsed.equipmentLevels,
    },
    dishLevels: {
      ...defaults.dishLevels,
      ...parsed.dishLevels,
    },
    adState: {
      settlementDoubleWatchedByLevel: {
        ...defaults.adState.settlementDoubleWatchedByLevel,
        ...parsed.adState?.settlementDoubleWatchedByLevel,
      },
      failExtendWatchedByLevel: {
        ...defaults.adState.failExtendWatchedByLevel,
        ...parsed.adState?.failExtendWatchedByLevel,
      },
    },
  };
}

export class SaveSystem {
  static load(): PlayerSaveData {
    const raw = sys.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return cloneDefaultSaveData();
    }

    try {
      return mergeSaveData(JSON.parse(raw) as Partial<PlayerSaveData>);
    } catch (error) {
      console.warn('[SaveSystem] Failed to parse save data, using default save.', error);
      return cloneDefaultSaveData();
    }
  }

  static save(data: PlayerSaveData): void {
    sys.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  static clear(): void {
    sys.localStorage.removeItem(SAVE_KEY);
  }
}
