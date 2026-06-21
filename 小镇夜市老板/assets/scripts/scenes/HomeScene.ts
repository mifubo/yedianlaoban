import { _decorator, Component, director, Label } from 'cc';
import { ConfigLoader } from '../core/config/ConfigLoader';
import {
  AvatarGender,
  AvatarId,
  CosmeticItemConfig,
  CosmeticItemId,
  RuntimeConfig,
  StoreVisualStageSummary,
} from '../core/config/types';
import { GameContext } from '../core/game/GameContext';
import { SceneName } from '../core/game/SceneNames';
import { PlayerSaveData, SaveSystem } from '../core/save/SaveSystem';
import { EconomySystem } from '../systems/EconomySystem';

const { ccclass, property } = _decorator;

export interface HomeSceneSnapshot {
  isReady: boolean;
  currentLevelId: number;
  coins: number;
  completedLevelCount: number;
  totalStars: number;
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
  storeStage: StoreVisualStageSummary | null;
}

@ccclass('HomeScene')
export class HomeScene extends Component {
  @property
  preferJsonConfig = false;

  @property(Label)
  currentLevelLabel: Label | null = null;

  @property(Label)
  coinLabel: Label | null = null;

  @property(Label)
  starLabel: Label | null = null;

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

  private isReady = false;
  private configs: RuntimeConfig | null = null;
  private saveData: PlayerSaveData = SaveSystem.load();

  onLoad(): void {
    void this.bootstrap();
  }

  playCurrentLevel(): void {
    if (!this.isReady) {
      return;
    }

    const saveData = SaveSystem.load();
    GameContext.instance.selectLevel(this.getPlayableLevelId(saveData));
    director.loadScene(SceneName.Game);
  }

  openUpgrade(): void {
    this.openCommercialStreet();
  }

  openCommercialStreet(): void {
    GameContext.instance.selectGrowthView('commercialStreet');
    director.loadScene(SceneName.Upgrade);
  }

  openPersonalGrowth(): void {
    GameContext.instance.selectGrowthView('personalGrowth');
    director.loadScene(SceneName.Upgrade);
  }

  openOutfit(): void {
    GameContext.instance.selectGrowthView('outfit');
    director.loadScene(SceneName.Upgrade);
  }

  openEquipmentManagement(): void {
    GameContext.instance.selectGrowthView('equipmentManagement');
    director.loadScene(SceneName.Upgrade);
  }

  getSnapshot(): HomeSceneSnapshot {
    this.saveData = SaveSystem.load();

    return {
      isReady: this.isReady,
      currentLevelId: this.getPlayableLevelId(this.saveData),
      coins: this.saveData.coins,
      completedLevelCount: this.saveData.completedLevels.length,
      totalStars: SaveSystem.getTotalStars(this.saveData),
      selectedAvatar: this.getSelectedAvatarSnapshot(),
      avatarSelectionLocked: this.saveData.avatarSelectionLocked,
      equippedCosmetics: this.getEquippedCosmetics().map((cosmetic) => ({
        id: cosmetic.id,
        name: cosmetic.name,
        slot: cosmetic.slot,
      })),
      storeStage: this.getStoreStageSnapshot(),
    };
  }

  private async bootstrap(): Promise<void> {
    this.configs = await ConfigLoader.load({
      kind: this.preferJsonConfig ? 'hybrid' : 'ts',
    });
    GameContext.instance.setConfigs(this.configs);
    this.isReady = true;
    this.refreshView();
  }

  private refreshView(): void {
    const snapshot = this.getSnapshot();

    if (this.currentLevelLabel) {
      this.currentLevelLabel.string = `第 ${snapshot.currentLevelId} 关`;
    }

    if (this.coinLabel) {
      this.coinLabel.string = `${snapshot.coins}`;
    }

    if (this.starLabel) {
      this.starLabel.string = `${snapshot.totalStars}`;
    }

    if (this.avatarLabel) {
      this.avatarLabel.string = snapshot.selectedAvatar.name;
    }

    if (this.equippedCosmeticsLabel) {
      this.equippedCosmeticsLabel.string = snapshot.equippedCosmetics.map((item) => item.name).join(' / ') || '未装备装扮';
    }

    if (this.storeStageLabel) {
      this.storeStageLabel.string = snapshot.storeStage ? `Lv.${snapshot.storeStage.level} ${snapshot.storeStage.name}` : '';
    }

    if (this.storeEffectLabel) {
      this.storeEffectLabel.string = snapshot.storeStage?.mainEffectText ?? '';
    }

    if (this.storeNextStageLabel) {
      this.storeNextStageLabel.string = snapshot.storeStage?.nextStageGapText ?? '';
    }

    if (this.storeUpgradeHintLabel) {
      this.storeUpgradeHintLabel.string = snapshot.storeStage?.recommendationText ?? '';
    }
  }

  private getPlayableLevelId(saveData: PlayerSaveData): number {
    if (!this.configs || this.configs.levelById.has(saveData.currentLevelId)) {
      return saveData.currentLevelId;
    }

    return this.configs.levels[this.configs.levels.length - 1]?.id ?? 1;
  }

  private getSelectedAvatarSnapshot(): HomeSceneSnapshot['selectedAvatar'] {
    const fallback = this.configs?.avatars[0];
    const avatar = this.configs?.avatarById.get(this.saveData.selectedAvatarId) ?? fallback;
    return {
      id: avatar?.id ?? 'avatar_male_boss',
      name: avatar?.name ?? '男老板',
      gender: avatar?.gender ?? 'male',
      portraitPath: avatar?.portraitPath ?? 'placeholders/avatar/male_boss.svg',
    };
  }

  private getEquippedCosmetics(): CosmeticItemConfig[] {
    if (!this.configs) {
      return [];
    }

    return Object.values(this.saveData.equippedCosmeticIds)
      .map((cosmeticId) => (cosmeticId ? this.configs?.cosmeticById.get(cosmeticId) : undefined))
      .filter((cosmetic): cosmetic is CosmeticItemConfig => {
        return Boolean(cosmetic && this.saveData.ownedCosmeticIds.includes(cosmetic.id));
      })
      .sort((a, b) => a.slot.localeCompare(b.slot));
  }

  private getStoreStageSnapshot(): StoreVisualStageSummary | null {
    if (!this.configs) {
      return null;
    }

    const currentLevelId = this.getPlayableLevelId(this.saveData);
    return EconomySystem.getStoreVisualStageSummary(this.configs, this.saveData, currentLevelId);
  }
}
