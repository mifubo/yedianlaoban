# 小镇夜市老板

轻量 IAA 广告小游戏《小镇夜市老板》的 Cocos Creator 3.x + TypeScript 项目骨架与 MVP 玩法预览。

当前目标是 MVP 可验收闭环；配置已覆盖前 30 关、12 个菜品、6 个顾客和 6 个设备，预览版已支持首页进关、前 10 关营业、顾客下单、制作上菜、超时、金币和星级结算、设备/菜品升级、本地存档和广告 mock。

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

配置校验：

```bash
npm run validate:configs
npm run test:mvp
```

脚本会检查重复 id、前 30 关连续性、关卡引用菜品/顾客、目标菜品、目标权重、菜品引用设备、顾客偏好菜品和星级线递增。
`test:mvp` 会自动模拟前 10 关的完美玩家路径，确保当前奖励和关卡目标可达。

## 本地预览

```bash
npm run preview
```

打开 `http://localhost:5173/preview/index.html`。预览页包含首页、营业关卡、结算弹窗和升级页，使用 `localStorage` 保存金币、星级、当前关卡、设备/菜品等级和广告 mock 状态。

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
- `GameScene.ts`：核心营业循环。支持开始/暂停/继续/结束、按关卡配置生成顾客、生成订单、设备制作、点击顾客上菜、耐心倒计时、金币/连击/超时统计和自动结算。
- `ResultScene.ts`：读取 `GameContext.lastResult`，处理基础金币、广告翻倍 mock、重玩、下一关。
- `UpgradeScene.ts`：读取配置和存档，预览/购买铁板升级与菜品升级。

场景间共享少量状态使用 `GameContext`，长期数据使用 `SaveSystem` 写入本地存档。

## GameScene 按钮绑定

`GameScene` 不依赖具体美术节点，先暴露可直接挂到 Cocos Button 的方法：

- 开始/暂停/继续/结束：`startBusiness`、`pauseBusiness`、`resumeBusiness`、`endBusiness`。
- 点击设备自动制作当前最需要的菜：`clickGriddle`、`clickDrinkStation`。
- 通用设备按钮：`clickEquipment`，Button 的 CustomEventData 填 `station_griddle`、`station_drink`、`station_wok`、`station_fryer`、`station_grill` 等设备 id。
- 指定菜品按钮：`clickDish`，CustomEventData 填 `dish_001` 到 `dish_012` 中当前关卡已启用的菜品 id。
- 顾客槽位按钮：`serveCustomerSlot1`、`serveCustomerSlot2`、`serveCustomerSlot3`、`serveCustomerSlot4`。
- 通用顾客按钮：`clickCustomer`，CustomEventData 可填槽位下标 `0`-`3` 或运行时顾客 id。

运行时 UI 可以轮询 `getSnapshot()` 刷新倒计时、金币、顾客订单、设备工位和成品库存。

## 后续模块接入

1. `OrderSystem`：当前内置在 `GameScene`，后续可拆出读取 `LevelConfig.dishPool` 和 `customerMix` 的订单生成逻辑。
2. `CookingSystem`：当前内置在 `GameScene`，后续可拆出设备工位、倒计时、成品产出。
3. `EconomySystem`：当前由 `GameScene` 汇总金币、满意顾客、连击、错误上菜，并通过 `GameSession` 生成结算结果。
4. `UpgradeSystem`：当前已有成本公式和购买接口，后续把 UI 列表绑定到 `previewEquipment` / `previewDish`。
5. `AdSystem`：先用 `MockAdService`，微信/抖音接入时实现同一个 `IAdService` 接口。
6. `AnalyticsSystem`：在 `GameScene.startBusiness`、结算、广告完成、升级购买处打点。

## MVP 注意点

- 设计分辨率按竖屏 `750x1334`。
- 前 30 关来自 `关卡参数表_前30关.tsv`，菜品、顾客和设备 id 按项目规划书固化。
- 前 10 关可作为轻量 MVP 节奏单独调试；按关卡表第 6 关会引入鸡蛋炒饭和炒锅，所以首 10 关实际使用 3 个设备、3 个菜品和 2 个顾客。
- 第 11-30 关会逐步用到油锅、烤炉和第 2 章学生客流。
- 当前商业化只接入 IAA 广告相关能力。
