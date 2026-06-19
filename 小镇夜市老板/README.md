# 小镇夜市老板

轻量 IAA 广告小游戏《小镇夜市老板》的 Cocos Creator 3.x + TypeScript 项目骨架。

当前目标是 MVP 架构，不实现完整玩法：10 关、3 个菜品、2 个设备、2 个顾客、金币结算、设备升级、广告 mock。

## 目录结构

```text
小镇夜市老板/
├── assets/
│   ├── resources/
│   │   └── configs/              # 可由 Cocos resources.load 读取的 JSON 配置
│   ├── scenes/                   # Cocos 场景资源目录，编辑器内创建 .scene 后放这里
│   └── scripts/
│       ├── core/
│       │   ├── ad/               # 广告接口与 mock
│       │   ├── config/           # 配置类型、默认 TS 配置、配置加载器
│       │   ├── game/             # 场景名、运行上下文、结算结果模型
│       │   └── save/             # 本地存档模型
│       ├── scenes/               # Home/Game/Result/Upgrade 场景脚本
│       └── systems/              # 可复用业务系统，当前包含升级系统
├── settings/
│   └── project.json              # 竖屏 750x1334 和 MVP 范围说明
├── package.json
├── tsconfig.json
└── README.md
```

## 配置类型

核心类型在 `assets/scripts/core/config/types.ts`：

- `LevelConfig`：关卡 id、章节、类型、时长、菜品池、顾客配比、目标、修正参数。
- `DishConfig`：菜品 id、名称、解锁关、设备、基础售价、制作时间、复杂度、配方、升级成本。
- `CustomerConfig`：顾客 id、名称、解锁章节、耐心、小费倍率、偏好菜、最大订单数量。
- `EquipmentConfig`：设备 id、名称、解锁关、工位数量、升级成本、速度加成。

MVP 的 TS 默认配置在 `assets/scripts/core/config/defaultConfigs.ts`。
同一份数据也放在 `assets/resources/configs/*.json`，用于 JSON 配置加载和后续远程表替换。

## 配置加载

`ConfigLoader` 支持三种入口：

```ts
await ConfigLoader.load({ kind: 'ts' });
await ConfigLoader.load({ kind: 'json' });
await ConfigLoader.load({ kind: 'hybrid' });
```

- `ts`：直接读取 `defaultConfigs.ts`，适合早期开发和编辑器调试。
- `json`：读取 `resources/configs/levels_mvp`、`dishes`、`customers`、`equipments`。
- `hybrid`：优先读取 JSON，失败时回退 TS 默认配置。

加载后会得到 `RuntimeConfig`，包含数组和索引表：`levelById`、`dishById`、`customerById`、`equipmentById`。加载器会校验重复 id、菜品引用设备、关卡引用菜品/顾客。

## 场景划分

编辑器中创建同名场景资源并把脚本挂到根节点：

- `HomeScene.ts`：加载配置、读取存档、进入当前关、打开升级页。
- `GameScene.ts`：关卡运行入口，保留开始/暂停/继续/模拟成功/模拟失败接口。
- `ResultScene.ts`：读取 `GameContext.lastResult`，处理基础金币、广告翻倍 mock、重玩、下一关。
- `UpgradeScene.ts`：读取配置和存档，预览/购买铁板升级与菜品升级。

场景间共享少量状态使用 `GameContext`，长期数据使用 `SaveSystem` 写入本地存档。

## 后续模块接入

1. `OrderSystem`：读取 `LevelConfig.dishPool` 和 `customerMix`，按权重生成顾客订单。
2. `CookingSystem`：读取 `DishConfig.stationId` 和 `EquipmentConfig`，管理设备队列、倒计时、成品产出。
3. `EconomySystem`：接入 `GameSession.calculateStars`，把金币、满意顾客、连击、错误上菜统一结算。
4. `UpgradeSystem`：当前已有成本公式和购买接口，后续把 UI 列表绑定到 `previewEquipment` / `previewDish`。
5. `AdSystem`：先用 `MockAdService`，微信/抖音接入时实现同一个 `IAdService` 接口。
6. `AnalyticsSystem`：在 `GameScene.startBusiness`、结算、广告完成、升级购买处打点。

## MVP 注意点

- 设计分辨率按竖屏 `750x1334`。
- MVP 只保留铁板和饮品台两个设备；鸡蛋炒饭暂时复用铁板工位，后续扩展炒锅时只改配置。
- 当前不包含充值、内购、提现、付费去广告相关接口。
- 前 10 关来自 `关卡参数表_前30关.tsv`，只落地第一章早期节奏。
