import { JsonAsset, resources } from 'cc';
import { defaultConfigBundle } from './defaultConfigs';
import {
  AvatarId,
  ConfigBundle,
  ConfigSource,
  CosmeticConfigFile,
  CosmeticItemConfig,
  DishId,
  EquipmentId,
  JsonConfigPaths,
  LevelId,
  RuntimeConfig,
} from './types';

export const DEFAULT_JSON_CONFIG_PATHS: JsonConfigPaths = {
  levels: 'configs/levels_mvp',
  dishes: 'configs/dishes',
  customers: 'configs/customers',
  equipments: 'configs/equipments',
  storeUpgrades: 'configs/store_upgrades',
  cosmetics: 'configs/cosmetics',
};

export class ConfigLoader {
  static load(source: ConfigSource = { kind: 'ts' }): Promise<RuntimeConfig> {
    if (source.kind === 'json') {
      return this.fromJson(source.paths);
    }

    if (source.kind === 'hybrid') {
      return this.fromJson(source.paths).catch((error: unknown) => {
        console.warn('[ConfigLoader] JSON config load failed, using TS fallback.', error);
        return this.fromTs(source.fallback ?? defaultConfigBundle);
      });
    }

    return Promise.resolve(this.fromTs(source.bundle ?? defaultConfigBundle));
  }

  static fromTs(bundle: ConfigBundle = defaultConfigBundle): RuntimeConfig {
    return this.normalize(bundle);
  }

  static async fromJson(paths: Partial<JsonConfigPaths> = {}): Promise<RuntimeConfig> {
    const resolvedPaths = { ...DEFAULT_JSON_CONFIG_PATHS, ...paths };
    const [levels, dishes, customers, equipments, storeUpgrades, cosmeticsRaw] = await Promise.all([
      this.loadJsonAsset<ConfigBundle['levels']>(resolvedPaths.levels),
      this.loadJsonAsset<ConfigBundle['dishes']>(resolvedPaths.dishes),
      this.loadJsonAsset<ConfigBundle['customers']>(resolvedPaths.customers),
      this.loadJsonAsset<ConfigBundle['equipments']>(resolvedPaths.equipments),
      this.loadJsonAsset<ConfigBundle['storeUpgrades']>(resolvedPaths.storeUpgrades),
      this.loadJsonAsset<CosmeticConfigFile | CosmeticItemConfig[]>(resolvedPaths.cosmetics),
    ]);
    const cosmeticsConfig = this.normalizeCosmeticConfig(cosmeticsRaw);

    return this.normalize({
      levels,
      dishes,
      customers,
      equipments,
      storeUpgrades,
      avatars: cosmeticsConfig.avatars,
      cosmetics: cosmeticsConfig.items,
      cosmeticSets: cosmeticsConfig.sets,
    });
  }

  static normalize(bundle: ConfigBundle): RuntimeConfig {
    const normalizedBundle = this.withConfigDefaults(bundle);

    this.assertUniqueIds(normalizedBundle.levels, 'LevelConfig');
    this.assertUniqueIds(normalizedBundle.dishes, 'DishConfig');
    this.assertUniqueIds(normalizedBundle.customers, 'CustomerConfig');
    this.assertUniqueIds(normalizedBundle.equipments, 'EquipmentConfig');
    this.assertUniqueIds(normalizedBundle.storeUpgrades, 'StoreUpgradeConfig');
    this.assertUniqueIds(normalizedBundle.avatars, 'PlayerAvatarConfig');
    this.assertUniqueIds(normalizedBundle.cosmetics, 'CosmeticItemConfig');
    this.assertUniqueIds(normalizedBundle.cosmeticSets, 'CosmeticSetConfig');
    this.assertLevelReferences(normalizedBundle);
    this.assertCosmeticReferences(normalizedBundle);

    return {
      levels: [...normalizedBundle.levels].sort((a, b) => a.id - b.id),
      dishes: normalizedBundle.dishes,
      customers: normalizedBundle.customers,
      equipments: normalizedBundle.equipments,
      storeUpgrades: normalizedBundle.storeUpgrades,
      avatars: normalizedBundle.avatars,
      cosmetics: normalizedBundle.cosmetics,
      cosmeticSets: normalizedBundle.cosmeticSets,
      levelById: new Map(normalizedBundle.levels.map((item) => [item.id, item])),
      dishById: new Map(normalizedBundle.dishes.map((item) => [item.id, item])),
      customerById: new Map(normalizedBundle.customers.map((item) => [item.id, item])),
      equipmentById: new Map(normalizedBundle.equipments.map((item) => [item.id, item])),
      storeUpgradeById: new Map(normalizedBundle.storeUpgrades.map((item) => [item.id, item])),
      avatarById: new Map(normalizedBundle.avatars.map((item) => [item.id, item])),
      cosmeticById: new Map(normalizedBundle.cosmetics.map((item) => [item.id, item])),
      cosmeticSetById: new Map(normalizedBundle.cosmeticSets.map((item) => [item.id, item])),
    };
  }

  private static normalizeCosmeticConfig(raw: CosmeticConfigFile | CosmeticItemConfig[]): CosmeticConfigFile {
    if (Array.isArray(raw)) {
      return {
        avatars: defaultConfigBundle.avatars,
        items: raw,
        sets: [],
      };
    }

    return {
      avatars: Array.isArray(raw.avatars) ? raw.avatars : defaultConfigBundle.avatars,
      items: Array.isArray(raw.items) ? raw.items : [],
      sets: Array.isArray(raw.sets) ? raw.sets : [],
    };
  }

  private static withConfigDefaults(bundle: ConfigBundle): ConfigBundle {
    const optionalBundle = bundle as Partial<ConfigBundle>;
    return {
      ...bundle,
      avatars: optionalBundle.avatars ?? defaultConfigBundle.avatars,
      cosmetics: optionalBundle.cosmetics ?? [],
      cosmeticSets: optionalBundle.cosmeticSets ?? [],
    };
  }

  private static loadJsonAsset<T>(path: string): Promise<T> {
    return new Promise((resolve, reject) => {
      resources.load(path, JsonAsset, (error, asset) => {
        if (error) {
          reject(error);
          return;
        }

        if (!asset) {
          reject(new Error(`[ConfigLoader] Missing JsonAsset at ${path}`));
          return;
        }

        resolve(asset.json as T);
      });
    });
  }

  private static assertUniqueIds<T extends { id: string | number }>(items: T[], label: string): void {
    const seen = new Set<string | number>();
    for (const item of items) {
      if (seen.has(item.id)) {
        throw new Error(`[ConfigLoader] Duplicate ${label} id: ${String(item.id)}`);
      }
      seen.add(item.id);
    }
  }

  private static assertLevelReferences(bundle: ConfigBundle): void {
    const dishIds = new Set<DishId>(bundle.dishes.map((item) => item.id));
    const customerIds = new Set(bundle.customers.map((item) => item.id));
    const equipmentIds = new Set<EquipmentId>(bundle.equipments.map((item) => item.id));

    for (const dish of bundle.dishes) {
      if (!equipmentIds.has(dish.stationId)) {
        throw new Error(`[ConfigLoader] Dish ${dish.id} uses missing equipment ${dish.stationId}`);
      }
    }

    for (const level of bundle.levels) {
      for (const dishId of level.dishPool) {
        if (!dishIds.has(dishId)) {
          throw new Error(`[ConfigLoader] Level ${level.id} uses missing dish ${dishId}`);
        }
      }

      for (const customerId of Object.keys(level.customerMix)) {
        if (!customerIds.has(customerId)) {
          throw new Error(`[ConfigLoader] Level ${level.id} uses missing customer ${customerId}`);
        }
      }

      this.assertGoalTarget(level.id, level.goals.targetDishId, dishIds);
    }
  }

  private static assertGoalTarget(levelId: LevelId, targetDishId: DishId | undefined, dishIds: Set<DishId>): void {
    if (targetDishId && !dishIds.has(targetDishId)) {
      throw new Error(`[ConfigLoader] Level ${levelId} uses missing target dish ${targetDishId}`);
    }
  }

  private static assertCosmeticReferences(bundle: ConfigBundle): void {
    const avatarIds = new Set<AvatarId>(bundle.avatars.map((item) => item.id));
    const cosmeticIds = new Set(bundle.cosmetics.map((item) => item.id));
    const cosmeticSetIds = new Set(bundle.cosmeticSets.map((item) => item.id));
    const allowedSlots = new Set(['hair', 'hat', 'apron', 'shoes', 'gloves', 'clothes', 'tool']);

    if (!avatarIds.has('avatar_male_boss') || !avatarIds.has('avatar_female_boss')) {
      throw new Error('[ConfigLoader] Avatar config must include avatar_male_boss and avatar_female_boss.');
    }

    for (const cosmetic of bundle.cosmetics) {
      if (!allowedSlots.has(cosmetic.slot)) {
        throw new Error(`[ConfigLoader] Cosmetic ${cosmetic.id} uses invalid slot ${cosmetic.slot}`);
      }

      if (cosmetic.setId && !cosmeticSetIds.has(cosmetic.setId)) {
        throw new Error(`[ConfigLoader] Cosmetic ${cosmetic.id} uses missing set ${cosmetic.setId}`);
      }
    }

    for (const cosmeticSet of bundle.cosmeticSets) {
      for (const cosmeticId of cosmeticSet.requiredCosmeticIds) {
        if (!cosmeticIds.has(cosmeticId)) {
          throw new Error(`[ConfigLoader] Cosmetic set ${cosmeticSet.id} uses missing item ${cosmeticId}`);
        }
      }
    }
  }
}
