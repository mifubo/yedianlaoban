import { JsonAsset, resources } from 'cc';
import { defaultConfigBundle } from './defaultConfigs';
import {
  ConfigBundle,
  ConfigSource,
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
    const [levels, dishes, customers, equipments] = await Promise.all([
      this.loadJsonAsset<ConfigBundle['levels']>(resolvedPaths.levels),
      this.loadJsonAsset<ConfigBundle['dishes']>(resolvedPaths.dishes),
      this.loadJsonAsset<ConfigBundle['customers']>(resolvedPaths.customers),
      this.loadJsonAsset<ConfigBundle['equipments']>(resolvedPaths.equipments),
    ]);

    return this.normalize({
      levels,
      dishes,
      customers,
      equipments,
    });
  }

  static normalize(bundle: ConfigBundle): RuntimeConfig {
    this.assertUniqueIds(bundle.levels, 'LevelConfig');
    this.assertUniqueIds(bundle.dishes, 'DishConfig');
    this.assertUniqueIds(bundle.customers, 'CustomerConfig');
    this.assertUniqueIds(bundle.equipments, 'EquipmentConfig');
    this.assertLevelReferences(bundle);

    return {
      levels: [...bundle.levels].sort((a, b) => a.id - b.id),
      dishes: bundle.dishes,
      customers: bundle.customers,
      equipments: bundle.equipments,
      levelById: new Map(bundle.levels.map((item) => [item.id, item])),
      dishById: new Map(bundle.dishes.map((item) => [item.id, item])),
      customerById: new Map(bundle.customers.map((item) => [item.id, item])),
      equipmentById: new Map(bundle.equipments.map((item) => [item.id, item])),
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
}
