import { sys } from 'cc';
import {
  AvatarGender,
  AvatarId,
  CosmeticItemId,
  CosmeticSlot,
  DishId,
  EquipmentId,
  LevelId,
  StoreUpgradeId,
} from '../config/types';
import type { LevelResult } from '../game/GameSession';

export interface PlayerSaveData {
  schemaVersion: number;
  playerId: string;
  selectedAvatarId: AvatarId;
  selectedGender: AvatarGender;
  avatarSelectionLocked: boolean;
  currentLevelId: LevelId;
  coins: number;
  completedLevels: LevelId[];
  levelStars: Record<string, number>;
  equipmentLevels: Record<EquipmentId, number>;
  dishLevels: Record<DishId, number>;
  storeUpgradeLevels: Record<StoreUpgradeId, number>;
  ownedCosmeticIds: CosmeticItemId[];
  equippedCosmeticIds: Partial<Record<CosmeticSlot, CosmeticItemId>>;
  adState: {
    settlementBonusWatchedByLevel: Record<string, boolean>;
    failExtendWatchedByLevel: Record<string, boolean>;
    dailyRewardWatchedByDate: Record<string, boolean>;
  };
  cloudSync: {
    revision: number;
    lastSyncedAt: string;
    lastSyncStatus: 'idle' | 'pending' | 'synced' | 'failed';
  };
}

const SAVE_SCHEMA_VERSION = 3;
const SAVE_KEY = 'town_night_market_boss_save_v3';
const LEGACY_SAVE_KEYS = ['town_night_market_boss_save_v2', 'town_night_market_boss_save_v1'];

export const DEFAULT_SAVE_DATA: PlayerSaveData = {
  schemaVersion: SAVE_SCHEMA_VERSION,
  playerId: '',
  selectedAvatarId: 'avatar_male_boss',
  selectedGender: 'male',
  avatarSelectionLocked: false,
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
  storeUpgradeLevels: {
    store_signboard: 1,
    store_tables: 1,
    store_fridge: 1,
    store_cleanliness: 1,
  },
  ownedCosmeticIds: [],
  equippedCosmeticIds: {},
  adState: {
    settlementBonusWatchedByLevel: {},
    failExtendWatchedByLevel: {},
    dailyRewardWatchedByDate: {},
  },
  cloudSync: {
    revision: 0,
    lastSyncedAt: '',
    lastSyncStatus: 'idle',
  },
};

function cloneDefaultSaveData(): PlayerSaveData {
  return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA)) as PlayerSaveData;
}

function mergeSaveData(rawParsed: unknown): PlayerSaveData {
  const defaults = cloneDefaultSaveData();
  const parsed = rawParsed && typeof rawParsed === 'object' ? (rawParsed as Partial<PlayerSaveData>) : {};
  const selectedAvatarId = normalizeAvatarId(parsed.selectedAvatarId, parsed.selectedGender);

  const merged: PlayerSaveData = {
    ...defaults,
    ...parsed,
    schemaVersion: SAVE_SCHEMA_VERSION,
    playerId: normalizeString(parsed.playerId, defaults.playerId),
    selectedAvatarId,
    selectedGender: inferGenderFromAvatarId(selectedAvatarId, normalizeGender(parsed.selectedGender, defaults.selectedGender)),
    avatarSelectionLocked: parsed.avatarSelectionLocked === true,
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
    storeUpgradeLevels: {
      ...defaults.storeUpgradeLevels,
      ...normalizeLevelMap(parsed.storeUpgradeLevels),
    },
    ownedCosmeticIds: normalizeStringIds(parsed.ownedCosmeticIds),
    equippedCosmeticIds: normalizeEquippedCosmetics(parsed.equippedCosmeticIds),
    adState: {
      settlementBonusWatchedByLevel: {
        ...defaults.adState.settlementBonusWatchedByLevel,
        ...normalizeBooleanMap(readSettlementBonusMap(parsed)),
      },
      failExtendWatchedByLevel: {
        ...defaults.adState.failExtendWatchedByLevel,
        ...normalizeBooleanMap(parsed.adState?.failExtendWatchedByLevel),
      },
      dailyRewardWatchedByDate: {
        ...defaults.adState.dailyRewardWatchedByDate,
        ...normalizeBooleanMap(parsed.adState?.dailyRewardWatchedByDate),
      },
    },
    cloudSync: {
      revision: normalizeNonNegativeInteger(parsed.cloudSync?.revision, defaults.cloudSync.revision),
      lastSyncedAt: normalizeString(parsed.cloudSync?.lastSyncedAt, defaults.cloudSync.lastSyncedAt),
      lastSyncStatus: normalizeSyncStatus(parsed.cloudSync?.lastSyncStatus),
    },
  };

  return merged;
}

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeGender(value: unknown, fallback: AvatarGender): AvatarGender {
  return value === 'female' || value === 'male' ? value : fallback;
}

function normalizeAvatarId(value: unknown, gender: unknown): AvatarId {
  if (value === 'avatar_male_boss' || value === 'avatar_female_boss') {
    return value;
  }

  return normalizeGender(gender, 'male') === 'female' ? 'avatar_female_boss' : 'avatar_male_boss';
}

function inferGenderFromAvatarId(value: unknown, fallback: AvatarGender): AvatarGender {
  if (value === 'avatar_female_boss') {
    return 'female';
  }

  if (value === 'avatar_male_boss') {
    return 'male';
  }

  return fallback;
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
}

function normalizeCoins(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function normalizeNonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function normalizeLevelIds(value: unknown): LevelId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((item): item is number => Number.isInteger(item) && item > 0))].sort((a, b) => a - b);
}

function normalizeStringIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0))].sort();
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

function normalizeEquippedCosmetics(value: unknown): Partial<Record<CosmeticSlot, CosmeticItemId>> {
  const normalized: Partial<Record<CosmeticSlot, CosmeticItemId>> = {};
  if (!value || typeof value !== 'object') {
    return normalized;
  }

  const allowedSlots = new Set<CosmeticSlot>(['hair', 'hat', 'apron', 'shoes', 'gloves', 'clothes', 'tool']);
  for (const [slot, itemId] of Object.entries(value)) {
    if (allowedSlots.has(slot as CosmeticSlot) && typeof itemId === 'string' && itemId.length > 0) {
      normalized[slot as CosmeticSlot] = itemId;
    }
  }

  return normalized;
}

function normalizeSyncStatus(value: unknown): PlayerSaveData['cloudSync']['lastSyncStatus'] {
  if (value === 'pending' || value === 'synced' || value === 'failed') {
    return value;
  }

  return 'idle';
}

function readSettlementBonusMap(parsed: Partial<PlayerSaveData>): unknown {
  const rawAdState = parsed.adState as
    | (Partial<PlayerSaveData['adState']> & { settlementDoubleWatchedByLevel?: Record<string, boolean> })
    | undefined;
  return rawAdState?.settlementBonusWatchedByLevel ?? rawAdState?.settlementDoubleWatchedByLevel;
}

export class SaveSystem {
  static load(): PlayerSaveData {
    const raw = [SAVE_KEY, ...LEGACY_SAVE_KEYS].map((key) => sys.localStorage.getItem(key)).find((item) => item !== null);
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
    const merged = mergeSaveData(data);
    merged.cloudSync.revision += 1;
    sys.localStorage.setItem(SAVE_KEY, JSON.stringify(merged));
  }

  static clear(): void {
    sys.localStorage.removeItem(SAVE_KEY);
    for (const legacyKey of LEGACY_SAVE_KEYS) {
      sys.localStorage.removeItem(legacyKey);
    }
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
