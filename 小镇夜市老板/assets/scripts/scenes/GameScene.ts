import { _decorator, Component, director } from 'cc';
import { ConfigLoader } from '../core/config/ConfigLoader';
import {
  CustomerConfig,
  CustomerId,
  DishConfig,
  DishId,
  EquipmentConfig,
  EquipmentId,
  LevelConfig,
  RuntimeConfig,
} from '../core/config/types';
import { GameContext, GameResumeState } from '../core/game/GameContext';
import { buildLevelResult } from '../core/game/GameSession';
import { SceneName } from '../core/game/SceneNames';
import { SaveSystem, PlayerSaveData } from '../core/save/SaveSystem';
import { EconomySystem } from '../systems/EconomySystem';

const { ccclass, property } = _decorator;

type BusinessPhase = 'idle' | 'running' | 'paused' | 'ended';
type CustomerStatus = 'waiting' | 'served' | 'left';
type CookingSlotStatus = 'idle' | 'cooking';

interface SpawnPlanItem {
  spawnAtSec: number;
  customerId: CustomerId;
  orderDishIds: DishId[];
}

interface RuntimeCustomer {
  runtimeId: string;
  configId: CustomerId;
  name: string;
  orderDishIds: DishId[];
  maxPatienceSec: number;
  patienceRemainingSec: number;
  status: CustomerStatus;
}

interface CookingSlot {
  slotIndex: number;
  status: CookingSlotStatus;
  dishId: DishId | null;
  timeRemainingSec: number;
  totalCookTimeSec: number;
}

interface RuntimeEquipment {
  configId: EquipmentId;
  name: string;
  slots: CookingSlot[];
}

interface CustomerSnapshot {
  runtimeId: string;
  name: string;
  orderNames: string[];
  patienceRemainingSec: number;
  maxPatienceSec: number;
}

interface CookingSlotSnapshot {
  slotIndex: number;
  status: CookingSlotStatus;
  dishName: string | null;
  timeRemainingSec: number;
  totalCookTimeSec: number;
}

interface EquipmentSnapshot {
  id: EquipmentId;
  name: string;
  slots: CookingSlotSnapshot[];
}

export interface GameSceneSnapshot {
  phase: BusinessPhase;
  levelId: number | null;
  timeRemainingSec: number;
  earnedCoins: number;
  servedCustomers: number;
  angryLeaveCount: number;
  wrongServeCount: number;
  combo: number;
  maxCombo: number;
  cookedInventory: Record<DishId, number>;
  customers: CustomerSnapshot[];
  equipments: EquipmentSnapshot[];
  pendingSpawnCount: number;
}

@ccclass('GameScene')
export class GameScene extends Component {
  @property
  autoStart = true;

  @property
  autoLoadResultScene = true;

  @property
  maxWaitingCustomers = 4;

  @property
  debugLogging = false;

  private configs: RuntimeConfig | null = null;
  private level: LevelConfig | null = null;
  private saveData: PlayerSaveData | null = null;
  private phase: BusinessPhase = 'idle';
  private elapsedSec = 0;
  private bonusTimeSec = 0;
  private timeRemainingSec = 0;
  private earnedCoins = 0;
  private servedCustomers = 0;
  private angryLeaveCount = 0;
  private wrongServeCount = 0;
  private combo = 0;
  private maxCombo = 0;
  private customerSerial = 0;
  private spawnQueue: SpawnPlanItem[] = [];
  private activeCustomers: RuntimeCustomer[] = [];
  private equipments: RuntimeEquipment[] = [];
  private cookedInventory: Partial<Record<DishId, number>> = {};
  private targetDishServedCounts: Partial<Record<DishId, number>> = {};
  private rngState = 1;

  onLoad(): void {
    void this.bootstrap();
  }

  update(deltaTime: number): void {
    if (this.phase !== 'running' || !this.level) {
      return;
    }

    const safeDelta = Math.max(0, deltaTime);
    this.elapsedSec += safeDelta;
    this.timeRemainingSec = Math.max(0, this.getTotalDurationSec() - this.elapsedSec);

    this.spawnDueCustomers();
    this.updateCooking(safeDelta);
    this.updateCustomerPatience(safeDelta);

    if (this.timeRemainingSec <= 0) {
      this.endBusiness();
      return;
    }

    if (this.shouldEndBecauseQueueFinished()) {
      this.endBusiness();
    }
  }

  startBusiness(): void {
    if (!this.level || !this.configs) {
      return;
    }

    this.resetRuntime();
    this.phase = 'running';
    this.log(`Level ${this.level.id} started.`);
  }

  pauseBusiness(): void {
    if (this.phase !== 'running') {
      return;
    }

    this.phase = 'paused';
  }

  resumeBusiness(): void {
    if (this.phase !== 'paused') {
      return;
    }

    this.phase = 'running';
  }

  endBusiness(): void {
    if (this.phase === 'ended' || !this.level) {
      return;
    }

    const outcome = this.hasMetMainGoal() ? 'success' : 'fail';
    this.phase = 'ended';
    GameContext.instance.lastResult = buildLevelResult({
      level: this.level,
      outcome,
      earnedCoins: this.earnedCoins,
      servedCustomers: this.servedCustomers,
      maxCombo: this.maxCombo,
      angryLeaveCount: this.angryLeaveCount,
      wrongServeCount: this.wrongServeCount,
    });
    if (outcome === 'fail') {
      GameContext.instance.setFailedLevelResumeState(this.createResumeState());
    } else {
      GameContext.instance.clearFailedLevelResumeState();
    }
    this.log(`Level ${this.level.id} ended with ${outcome}, coins=${this.earnedCoins}.`);

    if (this.autoLoadResultScene) {
      director.loadScene(SceneName.Result);
    }
  }

  clickGriddle(): void {
    this.cookByEquipmentId('station_griddle');
  }

  clickDrinkStation(): void {
    this.cookByEquipmentId('station_drink');
  }

  clickEquipment(eventOrEquipmentId?: unknown, customEventData?: string): void {
    const equipmentId = this.readCustomString(eventOrEquipmentId, customEventData);
    if (!equipmentId) {
      return;
    }

    this.cookByEquipmentId(equipmentId);
  }

  clickDish(eventOrDishId?: unknown, customEventData?: string): void {
    const dishId = this.readCustomString(eventOrDishId, customEventData);
    if (!dishId) {
      return;
    }

    this.cookDishById(dishId);
  }

  cookByEquipmentId(equipmentId: EquipmentId): boolean {
    if (!this.canAcceptPlayerInput()) {
      return false;
    }

    const equipment = this.equipments.find((item) => item.configId === equipmentId);
    if (!equipment || !this.findIdleSlot(equipment)) {
      return false;
    }

    const dishId = this.pickNextDishForEquipment(equipmentId);
    if (!dishId) {
      return false;
    }

    return this.startCooking(equipmentId, dishId);
  }

  cookDishById(dishId: DishId): boolean {
    if (!this.canAcceptPlayerInput() || !this.level || !this.configs) {
      return false;
    }

    if (!this.level.dishPool.includes(dishId)) {
      return false;
    }

    const dish = this.configs.dishById.get(dishId);
    if (!dish) {
      return false;
    }

    return this.startCooking(dish.stationId, dishId);
  }

  serveCustomerSlot1(): void {
    this.serveCustomerBySlot(0);
  }

  serveCustomerSlot2(): void {
    this.serveCustomerBySlot(1);
  }

  serveCustomerSlot3(): void {
    this.serveCustomerBySlot(2);
  }

  serveCustomerSlot4(): void {
    this.serveCustomerBySlot(3);
  }

  clickCustomer(eventOrCustomerKey?: unknown, customEventData?: string): void {
    const customerKey = this.readCustomString(eventOrCustomerKey, customEventData);
    if (!customerKey) {
      return;
    }

    const slotIndex = Number(customerKey);
    if (Number.isInteger(slotIndex)) {
      this.serveCustomerBySlot(slotIndex);
      return;
    }

    this.serveCustomerById(customerKey);
  }

  serveCustomerBySlot(slotIndex: number): boolean {
    const customer = this.activeCustomers[slotIndex];
    if (!customer) {
      return false;
    }

    return this.serveCustomer(customer);
  }

  serveCustomerById(runtimeId: string): boolean {
    const customer = this.activeCustomers.find((item) => item.runtimeId === runtimeId);
    if (!customer) {
      return false;
    }

    return this.serveCustomer(customer);
  }

  getSnapshot(): GameSceneSnapshot {
    return {
      phase: this.phase,
      levelId: this.level?.id ?? null,
      timeRemainingSec: this.round1(this.timeRemainingSec),
      earnedCoins: this.earnedCoins,
      servedCustomers: this.servedCustomers,
      angryLeaveCount: this.angryLeaveCount,
      wrongServeCount: this.wrongServeCount,
      combo: this.combo,
      maxCombo: this.maxCombo,
      cookedInventory: { ...this.cookedInventory } as Record<DishId, number>,
      customers: this.activeCustomers.map((customer) => ({
        runtimeId: customer.runtimeId,
        name: customer.name,
        orderNames: customer.orderDishIds.map((dishId) => this.getDishName(dishId)),
        patienceRemainingSec: this.round1(customer.patienceRemainingSec),
        maxPatienceSec: this.round1(customer.maxPatienceSec),
      })),
      equipments: this.equipments.map((equipment) => ({
        id: equipment.configId,
        name: equipment.name,
        slots: equipment.slots.map((slot) => ({
          slotIndex: slot.slotIndex,
          status: slot.status,
          dishName: slot.dishId ? this.getDishName(slot.dishId) : null,
          timeRemainingSec: this.round1(slot.timeRemainingSec),
          totalCookTimeSec: this.round1(slot.totalCookTimeSec),
        })),
      })),
      pendingSpawnCount: this.spawnQueue.length,
    };
  }

  completeLevelMock(): void {
    if (!this.level) {
      return;
    }

    GameContext.instance.lastResult = buildLevelResult({
      level: this.level,
      outcome: 'success',
      earnedCoins: Math.max(this.earnedCoins, this.level.goals.coin1),
      servedCustomers: Math.max(this.servedCustomers, this.level.goals.served ?? 0),
      maxCombo: Math.max(this.maxCombo, this.level.goals.combo ?? 0),
    });
    GameContext.instance.clearFailedLevelResumeState();
    director.loadScene(SceneName.Result);
  }

  failLevelMock(): void {
    if (!this.level) {
      return;
    }

    GameContext.instance.lastResult = buildLevelResult({
      level: this.level,
      outcome: 'fail',
      earnedCoins: this.earnedCoins,
      servedCustomers: this.servedCustomers,
      maxCombo: this.maxCombo,
      angryLeaveCount: Math.max(this.angryLeaveCount, 1),
      wrongServeCount: this.wrongServeCount,
    });
    GameContext.instance.setFailedLevelResumeState(this.createResumeState());
    director.loadScene(SceneName.Result);
  }

  extendBusinessTime(extraTimeSec = 15): boolean {
    if (!this.level || extraTimeSec <= 0 || (this.phase !== 'running' && this.phase !== 'paused' && this.phase !== 'ended')) {
      return false;
    }

    this.bonusTimeSec += extraTimeSec;
    this.timeRemainingSec = Math.max(0, this.getTotalDurationSec() - this.elapsedSec);
    if (this.phase === 'ended') {
      this.phase = 'running';
    }

    return true;
  }

  goHome(): void {
    director.loadScene(SceneName.Home);
  }

  private async bootstrap(): Promise<void> {
    this.configs = GameContext.instance.configs ?? (await ConfigLoader.load({ kind: 'ts' }));
    GameContext.instance.setConfigs(this.configs);
    this.saveData = SaveSystem.load();

    const selectedLevelId = GameContext.instance.selectedLevelId;
    this.level = this.configs.levelById.get(selectedLevelId) ?? this.configs.levels[0] ?? null;

    const resumeState = this.level ? GameContext.instance.consumeFailedLevelResumeState(this.level.id) : null;
    if (resumeState) {
      this.restoreRuntime(resumeState);
      return;
    }

    if (this.autoStart) {
      this.startBusiness();
    }
  }

  private resetRuntime(): void {
    if (!this.level || !this.configs) {
      return;
    }

    this.saveData = SaveSystem.load();
    this.phase = 'idle';
    this.elapsedSec = 0;
    this.bonusTimeSec = 0;
    this.timeRemainingSec = this.level.durationSec;
    this.earnedCoins = 0;
    this.servedCustomers = 0;
    this.angryLeaveCount = 0;
    this.wrongServeCount = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.customerSerial = 0;
    this.activeCustomers = [];
    this.cookedInventory = {};
    this.targetDishServedCounts = {};
    this.rngState = this.createSeed(this.level.id);
    this.spawnQueue = this.buildSpawnQueue();
    this.equipments = this.buildRuntimeEquipments();
    this.spawnDueCustomers();
  }

  private createResumeState(): GameResumeState {
    if (!this.level) {
      throw new Error('[GameScene] Cannot create resume state before level is ready.');
    }

    return {
      levelId: this.level.id,
      elapsedSec: this.elapsedSec,
      bonusTimeSec: this.bonusTimeSec,
      earnedCoins: this.earnedCoins,
      servedCustomers: this.servedCustomers,
      angryLeaveCount: this.angryLeaveCount,
      wrongServeCount: this.wrongServeCount,
      combo: this.combo,
      maxCombo: this.maxCombo,
      customerSerial: this.customerSerial,
      spawnQueue: this.spawnQueue.map((item) => ({
        spawnAtSec: item.spawnAtSec,
        customerId: item.customerId,
        orderDishIds: [...item.orderDishIds],
      })),
      activeCustomers: this.activeCustomers.map((customer) => ({
        runtimeId: customer.runtimeId,
        configId: customer.configId,
        name: customer.name,
        orderDishIds: [...customer.orderDishIds],
        maxPatienceSec: customer.maxPatienceSec,
        patienceRemainingSec: customer.patienceRemainingSec,
        status: customer.status,
      })),
      equipments: this.equipments.map((equipment) => ({
        configId: equipment.configId,
        name: equipment.name,
        slots: equipment.slots.map((slot) => ({
          slotIndex: slot.slotIndex,
          status: slot.status,
          dishId: slot.dishId,
          timeRemainingSec: slot.timeRemainingSec,
          totalCookTimeSec: slot.totalCookTimeSec,
        })),
      })),
      cookedInventory: { ...this.cookedInventory },
      targetDishServedCounts: { ...this.targetDishServedCounts },
      rngState: this.rngState,
    };
  }

  private restoreRuntime(state: GameResumeState): void {
    this.saveData = SaveSystem.load();
    this.phase = this.autoStart ? 'running' : 'paused';
    this.elapsedSec = Math.max(0, state.elapsedSec);
    this.bonusTimeSec = Math.max(0, state.bonusTimeSec);
    this.earnedCoins = Math.max(0, state.earnedCoins);
    this.servedCustomers = Math.max(0, state.servedCustomers);
    this.angryLeaveCount = Math.max(0, state.angryLeaveCount);
    this.wrongServeCount = Math.max(0, state.wrongServeCount);
    this.combo = Math.max(0, state.combo);
    this.maxCombo = Math.max(0, state.maxCombo);
    this.customerSerial = Math.max(0, state.customerSerial);
    this.spawnQueue = state.spawnQueue.map((item) => ({
      spawnAtSec: item.spawnAtSec,
      customerId: item.customerId,
      orderDishIds: [...item.orderDishIds],
    }));
    this.activeCustomers = state.activeCustomers.map((customer) => ({
      runtimeId: customer.runtimeId,
      configId: customer.configId,
      name: customer.name,
      orderDishIds: [...customer.orderDishIds],
      maxPatienceSec: customer.maxPatienceSec,
      patienceRemainingSec: customer.patienceRemainingSec,
      status: customer.status,
    }));
    this.equipments = state.equipments.map((equipment) => ({
      configId: equipment.configId,
      name: equipment.name,
      slots: equipment.slots.map((slot) => ({
        slotIndex: slot.slotIndex,
        status: slot.status,
        dishId: slot.dishId,
        timeRemainingSec: slot.timeRemainingSec,
        totalCookTimeSec: slot.totalCookTimeSec,
      })),
    }));
    this.cookedInventory = { ...state.cookedInventory };
    this.targetDishServedCounts = { ...state.targetDishServedCounts };
    this.rngState = state.rngState || this.createSeed(state.levelId);
    this.timeRemainingSec = Math.max(0, this.getTotalDurationSec() - this.elapsedSec);
    this.log(`Level ${state.levelId} resumed with ${this.round1(this.timeRemainingSec)}s.`);
  }

  private buildRuntimeEquipments(): RuntimeEquipment[] {
    if (!this.level || !this.configs) {
      return [];
    }

    const equipmentIds = new Set<EquipmentId>();
    for (const dishId of this.level.dishPool) {
      const dish = this.configs.dishById.get(dishId);
      if (dish) {
        equipmentIds.add(dish.stationId);
      }
    }

    return [...equipmentIds]
      .map((equipmentId) => this.configs?.equipmentById.get(equipmentId) ?? null)
      .filter((equipment): equipment is EquipmentConfig => equipment !== null)
      .map((equipment) => {
        const slotCount = this.getEquipmentSlotCount(equipment);
        const slots: CookingSlot[] = [];
        for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
          slots.push({
            slotIndex,
            status: 'idle',
            dishId: null,
            timeRemainingSec: 0,
            totalCookTimeSec: 0,
          });
        }

        return {
          configId: equipment.id,
          name: equipment.name,
          slots,
        };
      });
  }

  private buildSpawnQueue(): SpawnPlanItem[] {
    if (!this.level || !this.configs) {
      return [];
    }

    const totalCustomers = this.level.modifiers.customerCount;
    const waveCount = Math.max(1, this.level.modifiers.waveCount ?? 1);
    const spawnWindowSec = Math.max(1, this.level.durationSec * 0.72);
    const items: SpawnPlanItem[] = [];

    for (let waveIndex = 0; waveIndex < waveCount; waveIndex += 1) {
      const customersInWave = this.getWaveCustomerCount(totalCustomers, waveCount, waveIndex);
      const waveStartSec = (spawnWindowSec / waveCount) * waveIndex;
      const waveDurationSec = (spawnWindowSec / waveCount) * (waveCount > 1 ? 0.58 : 1);

      for (let orderIndex = 0; orderIndex < customersInWave; orderIndex += 1) {
        const spacingSec = customersInWave <= 1 ? 0 : waveDurationSec / customersInWave;
        const jitterSec = waveIndex === 0 && orderIndex === 0 ? 0 : (this.random() - 0.5) * 1.4;
        const customer = this.pickCustomerConfig();
        items.push({
          spawnAtSec: Math.max(0, waveStartSec + orderIndex * spacingSec + jitterSec),
          customerId: customer.id,
          orderDishIds: this.generateOrder(customer),
        });
      }
    }

    this.ensureTargetDishOrders(items);

    return items.sort((a, b) => a.spawnAtSec - b.spawnAtSec);
  }

  private getWaveCustomerCount(totalCustomers: number, waveCount: number, waveIndex: number): number {
    const baseCount = Math.floor(totalCustomers / waveCount);
    const remainder = totalCustomers % waveCount;
    return baseCount + (waveIndex < remainder ? 1 : 0);
  }

  private ensureTargetDishOrders(items: SpawnPlanItem[]): void {
    const targetDishId = this.level?.goals.targetDishId;
    const targetDishCount = this.level?.goals.targetDishCount ?? 0;
    if (!targetDishId || targetDishCount <= 0 || !this.level?.dishPool.includes(targetDishId)) {
      return;
    }

    let currentCount = items.reduce((count, item) => {
      return count + item.orderDishIds.filter((dishId) => dishId === targetDishId).length;
    }, 0);

    for (const item of items) {
      if (currentCount >= targetDishCount) {
        return;
      }

      if (!item.orderDishIds.includes(targetDishId)) {
        item.orderDishIds[0] = targetDishId;
        currentCount += 1;
      }
    }
  }

  private spawnDueCustomers(): void {
    if (!this.level) {
      return;
    }

    while (
      this.spawnQueue.length > 0 &&
      this.spawnQueue[0].spawnAtSec <= this.elapsedSec &&
      this.activeCustomers.length < Math.max(1, this.maxWaitingCustomers)
    ) {
      const spawnItem = this.spawnQueue.shift();
      if (!spawnItem) {
        return;
      }

      const customer = this.createRuntimeCustomer(spawnItem);
      this.activeCustomers.push(customer);
      this.log(`Customer ${customer.name} arrived: ${customer.orderDishIds.map((id) => this.getDishName(id)).join('+')}.`);
    }
  }

  private createRuntimeCustomer(spawnItem: SpawnPlanItem): RuntimeCustomer {
    const customerConfig = this.getCustomerConfig(spawnItem.customerId);
    const maxPatienceSec =
      this.level && this.configs && this.saveData
        ? EconomySystem.getCustomerPatienceSec(customerConfig, this.level, this.configs, this.saveData)
        : customerConfig.basePatience;
    this.customerSerial += 1;

    return {
      runtimeId: `customer_${this.customerSerial}`,
      configId: customerConfig.id,
      name: customerConfig.name,
      orderDishIds: spawnItem.orderDishIds,
      maxPatienceSec,
      patienceRemainingSec: maxPatienceSec,
      status: 'waiting',
    };
  }

  private updateCooking(deltaTime: number): void {
    for (const equipment of this.equipments) {
      for (const slot of equipment.slots) {
        if (slot.status !== 'cooking' || !slot.dishId) {
          continue;
        }

        slot.timeRemainingSec = Math.max(0, slot.timeRemainingSec - deltaTime);
        if (slot.timeRemainingSec <= 0) {
          this.addCookedDish(slot.dishId);
          this.log(`${this.getDishName(slot.dishId)} cooked.`);
          slot.status = 'idle';
          slot.dishId = null;
          slot.totalCookTimeSec = 0;
        }
      }
    }
  }

  private updateCustomerPatience(deltaTime: number): void {
    const leavingCustomers: RuntimeCustomer[] = [];

    for (const customer of this.activeCustomers) {
      customer.patienceRemainingSec = Math.max(0, customer.patienceRemainingSec - deltaTime);
      if (customer.patienceRemainingSec <= 0) {
        leavingCustomers.push(customer);
      }
    }

    for (const customer of leavingCustomers) {
      this.handleCustomerTimeout(customer);
    }
  }

  private startCooking(equipmentId: EquipmentId, dishId: DishId): boolean {
    if (!this.configs) {
      return false;
    }

    const dish = this.configs.dishById.get(dishId);
    const equipment = this.equipments.find((item) => item.configId === equipmentId);
    const slot = equipment ? this.findIdleSlot(equipment) : null;
    if (!dish || !equipment || !slot) {
      return false;
    }

    slot.status = 'cooking';
    slot.dishId = dishId;
    slot.totalCookTimeSec = this.getCookDurationSec(dish);
    slot.timeRemainingSec = slot.totalCookTimeSec;
    this.log(`Started cooking ${dish.name} on ${equipment.name}.`);
    return true;
  }

  private serveCustomer(customer: RuntimeCustomer): boolean {
    if (!this.canAcceptPlayerInput()) {
      return false;
    }

    if (!this.hasCookedDishes(customer.orderDishIds)) {
      this.registerWrongServe(customer);
      return false;
    }

    this.consumeCookedDishes(customer.orderDishIds);
    const rewardCoins = this.calculateCustomerReward(customer);
    this.earnedCoins += rewardCoins;
    this.servedCustomers += 1;
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    customer.status = 'served';

    for (const dishId of customer.orderDishIds) {
      this.targetDishServedCounts[dishId] = (this.targetDishServedCounts[dishId] ?? 0) + 1;
    }

    this.activeCustomers = this.activeCustomers.filter((item) => item.runtimeId !== customer.runtimeId);
    this.spawnDueCustomers();
    this.log(`Served ${customer.name}, +${rewardCoins} coins.`);
    if (this.shouldEndBecauseQueueFinished()) {
      this.endBusiness();
    }
    return true;
  }

  private handleCustomerTimeout(customer: RuntimeCustomer): void {
    customer.status = 'left';
    this.angryLeaveCount += 1;
    this.combo = 0;
    if (this.configs && this.saveData) {
      const penalty = EconomySystem.calculateAngryLeavePenalty(this.configs, this.saveData);
      this.earnedCoins = Math.max(0, this.earnedCoins - penalty);
      if (penalty > 0) {
        this.log(`${customer.name} left angry, complaint penalty -${penalty} coins.`);
      }
    }
    this.activeCustomers = this.activeCustomers.filter((item) => item.runtimeId !== customer.runtimeId);
    this.spawnDueCustomers();
    this.log(`${customer.name} left angry.`);
    if (this.shouldEndBecauseQueueFinished()) {
      this.endBusiness();
    }
  }

  private registerWrongServe(customer: RuntimeCustomer): void {
    this.wrongServeCount += 1;
    this.combo = 0;
    if (this.configs && this.saveData) {
      const penalty = EconomySystem.calculateWrongServePenalty(this.configs, this.saveData);
      this.earnedCoins = Math.max(0, this.earnedCoins - penalty);
    }
    customer.patienceRemainingSec = Math.max(0, customer.patienceRemainingSec - 2);
    this.log(`Wrong serve attempt for ${customer.name}.`);
  }

  private calculateCustomerReward(customer: RuntimeCustomer): number {
    if (!this.configs || !this.saveData || !this.level) {
      return 1;
    }

    const customerConfig = this.getCustomerConfig(customer.configId);
    const patienceRatio = customer.maxPatienceSec <= 0 ? 0 : customer.patienceRemainingSec / customer.maxPatienceSec;
    return EconomySystem.calculateCustomerReward(
      this.configs,
      this.saveData,
      this.level,
      customerConfig,
      customer.orderDishIds,
      patienceRatio,
      this.combo,
    ).netCoins;
  }

  private pickNextDishForEquipment(equipmentId: EquipmentId): DishId | null {
    if (!this.level || !this.configs) {
      return null;
    }

    const cookableDishIds = this.level.dishPool.filter((dishId) => {
      const dish = this.configs?.dishById.get(dishId);
      return dish?.stationId === equipmentId;
    });
    if (cookableDishIds.length === 0) {
      return null;
    }

    let bestDishId: DishId | null = null;
    let bestDemand = 0;
    for (const dishId of cookableDishIds) {
      const demand = this.getWaitingDemandCount(dishId) - this.getSupplyCount(dishId);
      if (demand > bestDemand) {
        bestDemand = demand;
        bestDishId = dishId;
      }
    }

    return bestDishId ?? cookableDishIds[0];
  }

  private getWaitingDemandCount(dishId: DishId): number {
    let count = 0;
    for (const customer of this.activeCustomers) {
      count += customer.orderDishIds.filter((orderDishId) => orderDishId === dishId).length;
    }

    return count;
  }

  private getSupplyCount(dishId: DishId): number {
    return this.getCookedDishCount(dishId) + this.getCookingDishCount(dishId);
  }

  private getCookingDishCount(dishId: DishId): number {
    let count = 0;
    for (const equipment of this.equipments) {
      for (const slot of equipment.slots) {
        if (slot.dishId === dishId) {
          count += 1;
        }
      }
    }

    return count;
  }

  private hasCookedDishes(orderDishIds: DishId[]): boolean {
    const requiredCounts = this.countDishIds(orderDishIds);
    for (const [dishId, requiredCount] of Object.entries(requiredCounts)) {
      if (this.getCookedDishCount(dishId) < (requiredCount ?? 0)) {
        return false;
      }
    }

    return true;
  }

  private consumeCookedDishes(orderDishIds: DishId[]): void {
    const requiredCounts = this.countDishIds(orderDishIds);
    for (const [dishId, requiredCount] of Object.entries(requiredCounts)) {
      this.cookedInventory[dishId] = Math.max(0, this.getCookedDishCount(dishId) - (requiredCount ?? 0));
    }
  }

  private addCookedDish(dishId: DishId): void {
    this.cookedInventory[dishId] = this.getCookedDishCount(dishId) + 1;
  }

  private getCookedDishCount(dishId: DishId): number {
    return this.cookedInventory[dishId] ?? 0;
  }

  private countDishIds(dishIds: DishId[]): Partial<Record<DishId, number>> {
    const counts: Partial<Record<DishId, number>> = {};
    for (const dishId of dishIds) {
      counts[dishId] = (counts[dishId] ?? 0) + 1;
    }

    return counts;
  }

  private generateOrder(customer: CustomerConfig): DishId[] {
    if (!this.level) {
      return [];
    }

    const orderSize = this.getOrderSize(customer);
    const orderDishIds: DishId[] = [];

    for (let index = 0; index < orderSize; index += 1) {
      const availableDishIds = this.level.dishPool.filter((dishId) => !orderDishIds.includes(dishId));
      orderDishIds.push(this.pickDishForCustomer(customer, availableDishIds.length > 0 ? availableDishIds : this.level.dishPool));
    }

    return orderDishIds;
  }

  private getOrderSize(customer: CustomerConfig): number {
    const maxOrderItems = Math.max(1, customer.maxOrderItems);
    if (maxOrderItems <= 1) {
      return 1;
    }

    const multiItemChance = this.level?.levelType === 'bulk_order' || this.level?.levelType === 'boss' ? 0.35 : 0.12;
    return this.random() < multiItemChance ? Math.min(2, maxOrderItems) : 1;
  }

  private pickDishForCustomer(customer: CustomerConfig, dishPool: DishId[]): DishId {
    const weights = dishPool.map((dishId) => ({
      id: dishId,
      weight: this.getDishOrderWeight(customer, dishId),
    }));

    return this.pickWeighted(weights) ?? dishPool[0];
  }

  private getDishOrderWeight(customer: CustomerConfig, dishId: DishId): number {
    const targetWeights = this.level?.modifiers.targetDishWeights ?? {};
    const hasTargetWeights = Object.keys(targetWeights).length > 0;
    let weight = hasTargetWeights ? 0.65 : 1;

    if (customer.preferredDishes.includes(dishId)) {
      weight += 0.35;
    }

    const targetWeight = targetWeights[dishId];
    if (typeof targetWeight === 'number') {
      weight += targetWeight * 4;
    }

    if (this.level?.goals.targetDishId === dishId) {
      weight += 2;
    }

    return Math.max(0.01, weight);
  }

  private pickCustomerConfig(): CustomerConfig {
    if (!this.level || !this.configs) {
      throw new Error('[GameScene] Cannot pick customer before config is ready.');
    }

    const weightedCustomers = Object.entries(this.level.customerMix)
      .map(([customerId, weight]) => ({
        id: customerId,
        weight: weight ?? 0,
      }))
      .filter((item) => item.weight > 0);
    const pickedCustomerId = this.pickWeighted(weightedCustomers);

    return this.getCustomerConfig(pickedCustomerId ?? this.configs.customers[0].id);
  }

  private pickWeighted<T extends string>(items: { id: T; weight: number }[]): T | null {
    const totalWeight = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
    if (totalWeight <= 0) {
      return items[0]?.id ?? null;
    }

    let cursor = this.random() * totalWeight;
    for (const item of items) {
      cursor -= Math.max(0, item.weight);
      if (cursor <= 0) {
        return item.id;
      }
    }

    return items[items.length - 1]?.id ?? null;
  }

  private hasMetMainGoal(): boolean {
    if (!this.level) {
      return false;
    }

    const { goals } = this.level;
    if (goals.targetDishId && goals.targetDishCount) {
      return (this.targetDishServedCounts[goals.targetDishId] ?? 0) >= goals.targetDishCount;
    }

    if (goals.combo) {
      return this.maxCombo >= goals.combo;
    }

    if (goals.served) {
      return this.servedCustomers >= goals.served;
    }

    return this.earnedCoins >= goals.coin1;
  }

  private shouldEndBecauseQueueFinished(): boolean {
    return this.phase === 'running' && this.spawnQueue.length === 0 && this.activeCustomers.length === 0;
  }

  private getDishPrice(dish: DishConfig): number {
    if (!this.configs || !this.saveData) {
      return dish.basePrice;
    }

    const effects = EconomySystem.getTotalEconomyEffects(this.configs, this.saveData);
    return EconomySystem.getDishPriceForSave(dish, this.saveData, effects);
  }

  private getCookDurationSec(dish: DishConfig): number {
    if (!this.configs || !this.saveData) {
      return dish.baseCookTime;
    }

    const equipment = this.configs.equipmentById.get(dish.stationId);
    return EconomySystem.getCookDurationSec(dish, equipment, this.saveData, this.configs);
  }

  private getEquipmentSlotCount(equipment: EquipmentConfig): number {
    const equipmentLevel = this.saveData?.equipmentLevels[equipment.id] ?? 1;
    return EconomySystem.getEquipmentSlotCountAtLevel(equipment, equipmentLevel);
  }

  private getTotalDurationSec(): number {
    return (this.level?.durationSec ?? 0) + this.bonusTimeSec;
  }

  private getCustomerConfig(customerId: CustomerId): CustomerConfig {
    const customer = this.configs?.customerById.get(customerId) ?? this.configs?.customers[0];
    if (!customer) {
      throw new Error(`[GameScene] Missing customer config: ${customerId}`);
    }

    return customer;
  }

  private getDishName(dishId: DishId): string {
    return this.configs?.dishById.get(dishId)?.name ?? dishId;
  }

  private findIdleSlot(equipment: RuntimeEquipment): CookingSlot | null {
    return equipment.slots.find((slot) => slot.status === 'idle') ?? null;
  }

  private canAcceptPlayerInput(): boolean {
    return this.phase === 'running' && this.level !== null && this.configs !== null;
  }

  private readCustomString(eventOrValue?: unknown, customEventData?: string): string | null {
    if (typeof customEventData === 'string' && customEventData.length > 0) {
      return customEventData;
    }

    if (typeof eventOrValue === 'string' && eventOrValue.length > 0) {
      return eventOrValue;
    }

    return null;
  }

  private createSeed(levelId: number): number {
    return (levelId * 2654435761) >>> 0;
  }

  private random(): number {
    let next = this.rngState || 1;
    next ^= next << 13;
    next ^= next >>> 17;
    next ^= next << 5;
    this.rngState = next >>> 0;
    return this.rngState / 0xffffffff;
  }

  private round1(value: number): number {
    return Math.round(value * 10) / 10;
  }

  private log(message: string): void {
    if (this.debugLogging) {
      console.log(`[GameScene] ${message}`);
    }
  }
}
