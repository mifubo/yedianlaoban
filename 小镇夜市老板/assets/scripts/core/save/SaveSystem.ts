import { sys } from 'cc';
import { DishId, EquipmentId, LevelId } from '../config/types';
import type { LevelResult } from '../game/GameSession';

export interface PlayerSaveData {
  currentLevelId: LevelId;
  coins: number;
  completedLevels: LevelId[];
  levelStars: Record<string, number>;
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
  levelStars: {},
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

function mergeSaveData(rawParsed: unknown): PlayerSaveData {
  const defaults = cloneDefaultSaveData();
  const parsed = rawParsed && typeof rawParsed === 'object' ? (rawParsed as Partial<PlayerSaveData>) : {};

  const merged: PlayerSaveData = {
    ...defaults,
    ...parsed,
    currentLevelId: normalizePositiveInteger(parsed.currentLevelId, defaults.currentLevelId),
    coins: normalizeCoins(parsed.coins, defaults.coins),
    completedLevels: normalizeLevelIds(parsed.completedLevels),
    levelStars: normalizeStarMap(parsed.levelStars),
    equipmentLevels: {
      ...defaults.equipmentLevels,
      ...normalizeLevelMap(parsed.equipmentLevels),
    },
    dishLevels: {
      ...defaults.dishLevels,
      ...normalizeLevelMap(parsed.dishLevels),
    },
    adState: {
      settlementDoubleWatchedByLevel: {
        ...defaults.adState.settlementDoubleWatchedByLevel,
        ...normalizeBooleanMap(parsed.adState?.settlementDoubleWatchedByLevel),
      },
      failExtendWatchedByLevel: {
        ...defaults.adState.failExtendWatchedByLevel,
        ...normalizeBooleanMap(parsed.adState?.failExtendWatchedByLevel),
      },
    },
  };

  return merged;
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
}

function normalizeCoins(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function normalizeLevelIds(value: unknown): LevelId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((item): item is number => Number.isInteger(item) && item > 0))].sort((a, b) => a - b);
}

function normalizeLevelMap(value: unknown): Record<string, number> {
  const normalized: Record<string, number> = {};
  if (!value || typeof value !== 'object') {
    return normalized;
  }

  for (const [key, level] of Object.entries(value)) {
    if (typeof level === 'number' && Number.isFinite(level)) {
      normalized[key] = Math.max(1, Math.floor(level));
    }
  }

  return normalized;
}

function normalizeStarMap(value: unknown): Record<string, number> {
  const normalized: Record<string, number> = {};
  if (!value || typeof value !== 'object') {
    return normalized;
  }

  for (const [levelId, stars] of Object.entries(value)) {
    if (typeof stars === 'number' && Number.isFinite(stars)) {
      normalized[levelId] = Math.min(3, Math.max(0, Math.floor(stars)));
    }
  }

  return normalized;
}

function normalizeBooleanMap(value: unknown): Record<string, boolean> {
  const normalized: Record<string, boolean> = {};
  if (!value || typeof value !== 'object') {
    return normalized;
  }

  for (const [key, flag] of Object.entries(value)) {
    normalized[key] = flag === true;
  }

  return normalized;
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
    sys.localStorage.setItem(SAVE_KEY, JSON.stringify(mergeSaveData(data)));
  }

  static clear(): void {
    sys.localStorage.removeItem(SAVE_KEY);
  }

  static addCoins(data: PlayerSaveData, amount: number): void {
    data.coins = normalizeCoins(data.coins + amount, data.coins);
  }

  static getLevelStars(data: PlayerSaveData, levelId: LevelId): number {
    return data.levelStars[String(levelId)] ?? 0;
  }

  static getTotalStars(data: PlayerSaveData): number {
    return Object.values(data.levelStars).reduce((sum, stars) => sum + Math.min(3, Math.max(0, stars)), 0);
  }

  static applyLevelResult(data: PlayerSaveData, result: LevelResult): void {
    this.addCoins(data, result.finalRewardCoins);

    if (result.outcome !== 'success') {
      return;
    }

    if (!data.completedLevels.includes(result.levelId)) {
      data.completedLevels.push(result.levelId);
      data.completedLevels.sort((a, b) => a - b);
    }

    const levelKey = String(result.levelId);
    data.levelStars[levelKey] = Math.max(data.levelStars[levelKey] ?? 0, result.stars);
    data.currentLevelId = Math.max(data.currentLevelId, result.levelId + 1);
  }
}
