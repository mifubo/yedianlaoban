import { _decorator, Component, director, Label } from 'cc';
import { ConfigLoader } from '../core/config/ConfigLoader';
import {
  AvatarGender,
  AvatarId,
  CosmeticItemConfig,
  CosmeticItemId,
  DishId,
  EquipmentId,
  RuntimeConfig,
  StoreUpgradeId,
  StoreVisualStageSummary,
} from '../core/config/types';
import { GameContext, GrowthViewMode } from '../core/game/GameContext';
import { SceneName } from '../core/game/SceneNames';
import { PlayerSaveData, SaveSystem } from '../core/save/SaveSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { UpgradePreview, UpgradeSystem } from '../systems/UpgradeSystem';

const { ccclass, property } = _decorator;

export interface UpgradeSceneSnapshot {
  coins: number;
  currentLevelId: number;
  currentChapter: number;
  viewMode: GrowthViewMode;
  selectedAvatar: {
    id: AvatarId;
    name: string;
    gender: AvatarGender;
    portraitPath: string;
  };
  avatarSelectionLocked: boolean;
  equippedCosmetics: {
    id: CosmeticItemId;
    name: string;
    slot: string;
  }[];
  activeCosmeticSets: string[];
  commercialStreetShops: {
    id: 'outfitShop' | 'applianceShop' | 'kitchenMall';
    name: string;
    items: UpgradePreview[];
  }[];
  personalGrowth: UpgradePreview[];
  equipments: UpgradePreview[];
  dishes: UpgradePreview[];
  storeUpgrades: UpgradePreview[];
  cosmetics: UpgradePreview[];
  storeStage: StoreVisualStageSummary;
}

@ccclass('UpgradeScene')
export class UpgradeScene extends Component {
  @property(Label)
  avatarLabel: Label | null = null;

  @property(Label)
  equippedCosmeticsLabel: Label | null = null;

  @property(Label)
  storeStageLabel: Label | null = null;

  @property(Label)
  storeEffectLabel: Label | null = null;

  @property(Label)
  storeNextStageLabel: Label | null = null;

  @property(Label)
  storeUpgradeHintLabel: Label | null = null;

  private configs: RuntimeConfig | null = null;
  private saveData: PlayerSaveData | null = null;
  private upgradeSystem: UpgradeSystem | null = null;

  onLoad(): void {
    void this.bootstrap();
  }

  previewGriddleUpgrade(): UpgradePreview | null {
    return this.previewEquipmentUpgrade('station_griddle');
  }

  buyGriddleUpgrade(): boolean {
    return this.buyEquipmentUpgrade('station_griddle');
  }

  previewEquipmentUpgrade(equipmentId: EquipmentId): UpgradePreview | null {
    const equipment = this.configs?.equipmentById.get(equipmentId);
    if (!equipment || !this.upgradeSystem) {
      return null;
    }

    return this.upgradeSystem.previewEquipment(equipment, this.getCurrentChapter());
  }

  buyEquipmentUpgrade(equipmentId: EquipmentId): boolean {
    const equipment = this.configs?.equipmentById.get(equipmentId);
    if (!equipment || !this.upgradeSystem || !this.saveData) {
      return false;
    }

    const didBuy = this.upgradeSystem.buyEquipment(equipment, this.getCurrentChapter());
    if (didBuy) {
      SaveSystem.save(this.saveData);
      this.refreshView();
    }

    return didBuy;
  }

  previewDishUpgrade(dishId: DishId): UpgradePreview | null {
    const dish = this.configs?.dishById.get(dishId);
    if (!dish || !this.upgradeSystem) {
      return null;
    }

    return this.upgradeSystem.previewDish(dish, this.getCurrentChapter());
  }

  buyDishUpgrade(dishId: DishId): boolean {
    const dish = this.configs?.dishById.get(dishId);
    if (!dish || !this.upgradeSystem || !this.saveData) {
      return false;
    }

    const didBuy = this.upgradeSystem.buyDish(dish, this.getCurrentChapter());
    if (didBuy) {
      SaveSystem.save(this.saveData);
      this.refreshView();
    }

    return didBuy;
  }

  previewStoreUpgrade(storeUpgradeId: StoreUpgradeId): UpgradePreview | null {
    const storeUpgrade = this.configs?.storeUpgradeById.get(storeUpgradeId);
    if (!storeUpgrade || !this.upgradeSystem) {
      return null;
    }

    return this.upgradeSystem.previewStoreUpgrade(storeUpgrade, this.getCurrentChapter());
  }

  buyStoreUpgrade(storeUpgradeId: StoreUpgradeId): boolean {
    const storeUpgrade = this.configs?.storeUpgradeById.get(storeUpgradeId);
    if (!storeUpgrade || !this.upgradeSystem || !this.saveData) {
      return false;
    }

    const didBuy = this.upgradeSystem.buyStoreUpgrade(storeUpgrade, this.getCurrentChapter());
    if (didBuy) {
      SaveSystem.save(this.saveData);
      this.refreshView();
    }

    return didBuy;
  }

  previewCosmetic(cosmeticId: CosmeticItemId): UpgradePreview | null {
    const cosmetic = this.configs?.cosmeticById.get(cosmeticId);
    if (!cosmetic || !this.upgradeSystem) {
      return null;
    }

    return this.upgradeSystem.previewCosmetic(cosmetic);
  }

  buyCosmetic(cosmeticId: CosmeticItemId): boolean {
    const cosmetic = this.configs?.cosmeticById.get(cosmeticId);
    if (!cosmetic || !this.upgradeSystem || !this.saveData) {
      return false;
    }

    const didBuy = this.upgradeSystem.buyCosmetic(cosmetic);
    if (didBuy) {
      SaveSystem.save(this.saveData);
      this.refreshView();
    }

    return didBuy;
  }

  equipCosmetic(cosmeticId: CosmeticItemId): boolean {
    const cosmetic = this.configs?.cosmeticById.get(cosmeticId);
    if (!cosmetic || !this.upgradeSystem || !this.saveData) {
      return false;
    }

    const didEquip = this.upgradeSystem.equipCosmetic(cosmetic);
    if (didEquip) {
      SaveSystem.save(this.saveData);
      this.refreshView();
    }

    return didEquip;
  }

  unequipCosmetic(cosmeticId: CosmeticItemId): boolean {
    const cosmetic = this.configs?.cosmeticById.get(cosmeticId);
    if (!cosmetic || !this.upgradeSystem || !this.saveData) {
      return false;
    }

    const didUnequip = this.upgradeSystem.unequipCosmetic(cosmetic);
    if (didUnequip) {
      SaveSystem.save(this.saveData);
      this.refreshView();
    }

    return didUnequip;
  }

  selectAvatar(avatarId: AvatarId): boolean {
    const avatar = this.configs?.avatarById.get(avatarId);
    if (!avatar || !this.saveData) {
      return false;
    }

    if (this.saveData.avatarSelectionLocked) {
      return false;
    }

    this.saveData.selectedAvatarId = avatar.id;
    this.saveData.selectedGender = avatar.gender;
    this.saveData.avatarSelectionLocked = true;
    SaveSystem.save(this.saveData);
    this.refreshView();
    return true;
  }

  selectGender(gender: AvatarGender): boolean {
    const avatar = this.configs?.avatars.find((item) => item.gender === gender);
    return avatar ? this.selectAvatar(avatar.id) : false;
  }

  getSnapshot(): UpgradeSceneSnapshot | null {
    if (!this.configs || !this.upgradeSystem || !this.saveData) {
      return null;
    }

    return {
      coins: this.saveData.coins,
      currentLevelId: this.saveData.currentLevelId,
      currentChapter: this.getCurrentChapter(),
      viewMode: GameContext.instance.growthViewMode,
      selectedAvatar: this.getSelectedAvatarSnapshot(),
      avatarSelectionLocked: this.saveData.avatarSelectionLocked,
      equippedCosmetics: this.getEquippedCosmetics().map((cosmetic) => ({
        id: cosmetic.id,
        name: cosmetic.name,
        slot: cosmetic.slot,
      })),
      activeCosmeticSets: this.getActiveCosmeticSetNames(),
      commercialStreetShops: this.getCommercialStreetShops(),
      personalGrowth: this.getPersonalGrowthPreviews(),
      equipments: [...this.configs.equipments]
        .sort((a, b) => a.unlockLevel - b.unlockLevel)
        .map((equipment) => this.upgradeSystem?.previewEquipment(equipment, this.getCurrentChapter()))
        .filter((preview): preview is UpgradePreview => preview !== undefined),
      dishes: [...this.configs.dishes]
        .sort((a, b) => a.unlockLevel - b.unlockLevel)
        .map((dish) => this.upgradeSystem?.previewDish(dish, this.getCurrentChapter()))
        .filter((preview): preview is UpgradePreview => preview !== undefined),
      storeUpgrades: [...this.configs.storeUpgrades]
        .sort((a, b) => a.unlockLevel - b.unlockLevel)
        .map((storeUpgrade) => this.upgradeSystem?.previewStoreUpgrade(storeUpgrade, this.getCurrentChapter()))
        .filter((preview): preview is UpgradePreview => preview !== undefined),
      cosmetics: [...this.configs.cosmetics]
        .sort((a, b) => a.unlockLevel - b.unlockLevel)
        .map((cosmetic) => this.upgradeSystem?.previewCosmetic(cosmetic))
        .filter((preview): preview is UpgradePreview => preview !== undefined),
      storeStage: EconomySystem.getStoreVisualStageSummary(this.configs, this.saveData, this.saveData.currentLevelId),
    };
  }

  goHome(): void {
    director.loadScene(SceneName.Home);
  }

  private async bootstrap(): Promise<void> {
    this.configs = GameContext.instance.configs ?? (await ConfigLoader.load({ kind: 'ts' }));
    GameContext.instance.setConfigs(this.configs);
    this.saveData = SaveSystem.load();
    this.upgradeSystem = new UpgradeSystem(this.saveData);
    this.refreshView();
  }

  private refreshView(): void {
    const snapshot = this.getSnapshot();
    if (!snapshot) {
      return;
    }

    if (this.avatarLabel) {
      this.avatarLabel.string = snapshot.selectedAvatar.name;
    }

    if (this.equippedCosmeticsLabel) {
      const outfitText = snapshot.equippedCosmetics.map((item) => item.name).join(' / ') || '未装备装扮';
      const setText = snapshot.activeCosmeticSets.length > 0 ? `（${snapshot.activeCosmeticSets.join(' / ')}）` : '';
      this.equippedCosmeticsLabel.string = `${outfitText}${setText}`;
    }

    if (this.storeStageLabel) {
      this.storeStageLabel.string = `Lv.${snapshot.storeStage.level} ${snapshot.storeStage.name}`;
    }

    if (this.storeEffectLabel) {
      this.storeEffectLabel.string = snapshot.storeStage.mainEffectText;
    }

    if (this.storeNextStageLabel) {
      this.storeNextStageLabel.string = snapshot.storeStage.nextStageGapText;
    }

    if (this.storeUpgradeHintLabel) {
      this.storeUpgradeHintLabel.string = snapshot.storeStage.recommendationText ?? '';
    }
  }

  private getSelectedAvatarSnapshot(): UpgradeSceneSnapshot['selectedAvatar'] {
    const fallback = this.configs?.avatars[0];
    const avatar = this.configs?.avatarById.get(this.saveData?.selectedAvatarId ?? '') ?? fallback;
    return {
      id: avatar?.id ?? 'avatar_male_boss',
      name: avatar?.name ?? '男老板',
      gender: avatar?.gender ?? 'male',
      portraitPath: avatar?.portraitPath ?? 'placeholders/avatar/male_boss.svg',
    };
  }

  private getEquippedCosmetics(): CosmeticItemConfig[] {
    if (!this.configs || !this.saveData) {
      return [];
    }

    return Object.values(this.saveData.equippedCosmeticIds)
      .map((cosmeticId) => (cosmeticId ? this.configs?.cosmeticById.get(cosmeticId) : undefined))
      .filter((cosmetic): cosmetic is CosmeticItemConfig => {
        return Boolean(cosmetic && this.saveData?.ownedCosmeticIds.includes(cosmetic.id));
      })
      .sort((a, b) => a.slot.localeCompare(b.slot));
  }

  private getActiveCosmeticSetNames(): string[] {
    if (!this.configs) {
      return [];
    }

    const equippedIds = new Set(this.getEquippedCosmetics().map((cosmetic) => cosmetic.id));
    return this.configs.cosmeticSets
      .filter((cosmeticSet) => cosmeticSet.requiredCosmeticIds.every((cosmeticId) => equippedIds.has(cosmeticId)))
      .map((cosmeticSet) => cosmeticSet.name);
  }

  private getCommercialStreetShops(): UpgradeSceneSnapshot['commercialStreetShops'] {
    if (!this.configs || !this.upgradeSystem) {
      return [];
    }

    return [
      {
        id: 'outfitShop',
        name: '装扮铺',
        items: [...this.configs.cosmetics]
          .sort((a, b) => a.unlockLevel - b.unlockLevel)
          .map((cosmetic) => this.upgradeSystem?.previewCosmetic(cosmetic))
          .filter((preview): preview is UpgradePreview => preview !== undefined),
      },
      {
        id: 'applianceShop',
        name: '电器铺',
        items: [...this.configs.equipments]
          .sort((a, b) => a.unlockLevel - b.unlockLevel)
          .map((equipment) => this.upgradeSystem?.previewEquipment(equipment, this.getCurrentChapter()))
          .filter((preview): preview is UpgradePreview => preview !== undefined),
      },
      {
        id: 'kitchenMall',
        name: '厨具商场',
        items: [...this.configs.storeUpgrades]
          .sort((a, b) => a.unlockLevel - b.unlockLevel)
          .map((storeUpgrade) => this.upgradeSystem?.previewStoreUpgrade(storeUpgrade, this.getCurrentChapter()))
          .filter((preview): preview is UpgradePreview => preview !== undefined),
      },
    ];
  }

  private getPersonalGrowthPreviews(): UpgradePreview[] {
    if (!this.configs || !this.upgradeSystem) {
      return [];
    }

    return [...this.configs.dishes]
      .sort((a, b) => a.unlockLevel - b.unlockLevel)
      .map((dish) => this.upgradeSystem?.previewDish(dish, this.getCurrentChapter()))
      .filter((preview): preview is UpgradePreview => preview !== undefined);
  }

  private getCurrentChapter(): number {
    if (!this.configs || !this.saveData) {
      return 1;
    }

    const currentLevel =
      this.configs.levelById.get(this.saveData.currentLevelId) ?? this.configs.levels[this.configs.levels.length - 1];
    return currentLevel?.chapter ?? 1;
  }
}
