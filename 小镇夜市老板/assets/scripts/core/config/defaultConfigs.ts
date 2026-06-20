import {
  ConfigBundle,
  CustomerConfig,
  DishConfig,
  EquipmentConfig,
  LevelConfig,
} from './types';

export const mvpDishConfigs: DishConfig[] = [
  {
    "id": "dish_001",
    "name": "烤冷面",
    "unlockLevel": 1,
    "stationId": "station_griddle",
    "basePrice": 12,
    "baseCookTime": 4,
    "complexity": 1,
    "ingredients": [
      "冷面",
      "鸡蛋",
      "酱料"
    ],
    "baseUpgradeCost": 80,
    "tags": [
      "chapter_1",
      "mvp"
    ]
  },
  {
    "id": "dish_002",
    "name": "柠檬水",
    "unlockLevel": 3,
    "stationId": "station_drink",
    "basePrice": 8,
    "baseCookTime": 3,
    "complexity": 1,
    "ingredients": [
      "柠檬",
      "糖浆",
      "冰水"
    ],
    "baseUpgradeCost": 70,
    "tags": [
      "chapter_1",
      "mvp"
    ]
  },
  {
    "id": "dish_003",
    "name": "鸡蛋炒饭",
    "unlockLevel": 6,
    "stationId": "station_wok",
    "basePrice": 15,
    "baseCookTime": 5,
    "complexity": 2,
    "ingredients": [
      "米饭",
      "鸡蛋",
      "葱花"
    ],
    "baseUpgradeCost": 120,
    "tags": [
      "chapter_1",
      "mvp"
    ]
  },
  {
    "id": "dish_004",
    "name": "炸鸡排",
    "unlockLevel": 12,
    "stationId": "station_fryer",
    "basePrice": 18,
    "baseCookTime": 6,
    "complexity": 2,
    "ingredients": [
      "鸡排",
      "炸粉",
      "调味料"
    ],
    "baseUpgradeCost": 150,
    "tags": [
      "chapter_1",
      "front30"
    ]
  },
  {
    "id": "dish_005",
    "name": "奶茶",
    "unlockLevel": 18,
    "stationId": "station_drink",
    "basePrice": 16,
    "baseCookTime": 5,
    "complexity": 2,
    "ingredients": [
      "茶汤",
      "牛奶",
      "珍珠"
    ],
    "baseUpgradeCost": 140,
    "tags": [
      "chapter_1",
      "front30"
    ]
  },
  {
    "id": "dish_006",
    "name": "热狗",
    "unlockLevel": 24,
    "stationId": "station_grill",
    "basePrice": 20,
    "baseCookTime": 6,
    "complexity": 2,
    "ingredients": [
      "面包",
      "香肠",
      "酱料"
    ],
    "baseUpgradeCost": 170,
    "tags": [
      "chapter_2",
      "front30"
    ]
  },
  {
    "id": "dish_007",
    "name": "烤串",
    "unlockLevel": 32,
    "stationId": "station_grill",
    "basePrice": 24,
    "baseCookTime": 7,
    "complexity": 3,
    "ingredients": [
      "肉串",
      "孜然",
      "辣椒面"
    ],
    "baseUpgradeCost": 220,
    "tags": [
      "chapter_2"
    ]
  },
  {
    "id": "dish_008",
    "name": "炒面",
    "unlockLevel": 42,
    "stationId": "station_wok",
    "basePrice": 28,
    "baseCookTime": 7.5,
    "complexity": 3,
    "ingredients": [
      "面条",
      "青菜",
      "酱油"
    ],
    "baseUpgradeCost": 250,
    "tags": [
      "chapter_3"
    ]
  },
  {
    "id": "dish_009",
    "name": "铁板豆腐",
    "unlockLevel": 52,
    "stationId": "station_griddle",
    "basePrice": 30,
    "baseCookTime": 8,
    "complexity": 3,
    "ingredients": [
      "豆腐",
      "蒜蓉",
      "酱料"
    ],
    "baseUpgradeCost": 270,
    "tags": [
      "chapter_3"
    ]
  },
  {
    "id": "dish_010",
    "name": "冰粉",
    "unlockLevel": 63,
    "stationId": "station_drink",
    "basePrice": 26,
    "baseCookTime": 6,
    "complexity": 2,
    "ingredients": [
      "冰粉",
      "红糖水",
      "花生碎"
    ],
    "baseUpgradeCost": 230,
    "tags": [
      "chapter_4"
    ]
  },
  {
    "id": "dish_011",
    "name": "章鱼小丸子",
    "unlockLevel": 70,
    "stationId": "station_takoyaki",
    "basePrice": 34,
    "baseCookTime": 9,
    "complexity": 4,
    "ingredients": [
      "面糊",
      "章鱼粒",
      "木鱼花"
    ],
    "baseUpgradeCost": 340,
    "tags": [
      "chapter_4"
    ]
  },
  {
    "id": "dish_012",
    "name": "铁板鱿鱼",
    "unlockLevel": 86,
    "stationId": "station_griddle",
    "basePrice": 40,
    "baseCookTime": 10,
    "complexity": 4,
    "ingredients": [
      "鱿鱼",
      "洋葱",
      "秘制酱"
    ],
    "baseUpgradeCost": 400,
    "tags": [
      "chapter_5"
    ]
  }
];

export const mvpCustomerConfigs: CustomerConfig[] = [
  {
    "id": "customer_001",
    "name": "老街居民",
    "unlockChapter": 1,
    "basePatience": 28,
    "tipMultiplier": 1,
    "preferredDishes": [
      "dish_001",
      "dish_003"
    ],
    "maxOrderItems": 1,
    "traits": [
      "standard"
    ]
  },
  {
    "id": "customer_002",
    "name": "学生",
    "unlockChapter": 2,
    "basePatience": 24,
    "tipMultiplier": 0.95,
    "preferredDishes": [
      "dish_004",
      "dish_005",
      "dish_006"
    ],
    "maxOrderItems": 1,
    "traits": [
      "dense_flow",
      "lower_ticket"
    ]
  },
  {
    "id": "customer_003",
    "name": "夜班工人",
    "unlockChapter": 3,
    "basePatience": 32,
    "tipMultiplier": 1.1,
    "preferredDishes": [
      "dish_003",
      "dish_007",
      "dish_008"
    ],
    "maxOrderItems": 2,
    "traits": [
      "main_food",
      "large_order"
    ]
  },
  {
    "id": "customer_004",
    "name": "游客",
    "unlockChapter": 4,
    "basePatience": 30,
    "tipMultiplier": 1.2,
    "preferredDishes": [
      "dish_010",
      "dish_011",
      "dish_012"
    ],
    "maxOrderItems": 2,
    "traits": [
      "combo_order",
      "high_income"
    ]
  },
  {
    "id": "customer_005",
    "name": "急性子",
    "unlockChapter": 1,
    "basePatience": 18,
    "tipMultiplier": 1.25,
    "preferredDishes": [
      "dish_001",
      "dish_002",
      "dish_006"
    ],
    "maxOrderItems": 1,
    "traits": [
      "low_patience",
      "pressure_intro"
    ]
  },
  {
    "id": "customer_006",
    "name": "老熟客",
    "unlockChapter": 3,
    "basePatience": 36,
    "tipMultiplier": 1.35,
    "preferredDishes": [
      "dish_001",
      "dish_005",
      "dish_009"
    ],
    "maxOrderItems": 1,
    "traits": [
      "combo_bonus",
      "loyal"
    ]
  }
];

export const mvpEquipmentConfigs: EquipmentConfig[] = [
  {
    "id": "station_griddle",
    "name": "铁板",
    "unlockLevel": 1,
    "slotCountBase": 1,
    "slotCountMax": 3,
    "baseUpgradeCost": 120,
    "speedBonusPerLevel": 0.05,
    "maxSpeedBonus": 0.35,
    "tags": [
      "mvp",
      "hot_surface"
    ]
  },
  {
    "id": "station_drink",
    "name": "饮品台",
    "unlockLevel": 3,
    "slotCountBase": 1,
    "slotCountMax": 3,
    "baseUpgradeCost": 100,
    "speedBonusPerLevel": 0.05,
    "maxSpeedBonus": 0.35,
    "tags": [
      "mvp",
      "drink"
    ]
  },
  {
    "id": "station_wok",
    "name": "炒锅",
    "unlockLevel": 6,
    "slotCountBase": 1,
    "slotCountMax": 3,
    "baseUpgradeCost": 150,
    "speedBonusPerLevel": 0.05,
    "maxSpeedBonus": 0.35,
    "tags": [
      "main_food"
    ]
  },
  {
    "id": "station_fryer",
    "name": "油锅",
    "unlockLevel": 12,
    "slotCountBase": 1,
    "slotCountMax": 3,
    "baseUpgradeCost": 180,
    "speedBonusPerLevel": 0.05,
    "maxSpeedBonus": 0.35,
    "tags": [
      "fried"
    ]
  },
  {
    "id": "station_grill",
    "name": "烤炉",
    "unlockLevel": 24,
    "slotCountBase": 1,
    "slotCountMax": 3,
    "baseUpgradeCost": 220,
    "speedBonusPerLevel": 0.05,
    "maxSpeedBonus": 0.35,
    "tags": [
      "grill"
    ]
  },
  {
    "id": "station_takoyaki",
    "name": "丸子炉",
    "unlockLevel": 70,
    "slotCountBase": 1,
    "slotCountMax": 2,
    "baseUpgradeCost": 320,
    "speedBonusPerLevel": 0.05,
    "maxSpeedBonus": 0.35,
    "tags": [
      "specialty"
    ]
  }
];

export const mvpLevelConfigs: LevelConfig[] = [
  {
    "id": 1,
    "chapter": 1,
    "localIndex": 1,
    "levelType": "tutorial",
    "durationSec": 65,
    "dishPool": [
      "dish_001"
    ],
    "customerMix": {
      "customer_001": 1
    },
    "goals": {
      "mainText": "服务3人",
      "served": 3,
      "coin1": 40,
      "coin2": 60,
      "coin3": 80
    },
    "modifiers": {
      "customerCount": 3,
      "patienceMultiplier": 1.5,
      "rewardMultiplier": 1,
      "rawRuleText": "顾客耐心x1.50;只教学点击备菜/烹饪/上菜"
    }
  },
  {
    "id": 2,
    "chapter": 1,
    "localIndex": 2,
    "levelType": "standard",
    "durationSec": 70,
    "dishPool": [
      "dish_001"
    ],
    "customerMix": {
      "customer_001": 1
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 80,
      "coin2": 100,
      "coin3": 120
    },
    "modifiers": {
      "customerCount": 5,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1
    }
  },
  {
    "id": 3,
    "chapter": 1,
    "localIndex": 3,
    "levelType": "tutorial_new_dish",
    "durationSec": 75,
    "dishPool": [
      "dish_001",
      "dish_002"
    ],
    "customerMix": {
      "customer_001": 1
    },
    "goals": {
      "mainText": "服务5人",
      "served": 5,
      "coin1": 90,
      "coin2": 120,
      "coin3": 150
    },
    "modifiers": {
      "customerCount": 5,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1,
      "targetDishWeights": {
        "dish_002": 0.6
      },
      "rawRuleText": "教学饮品台;柠檬水权重60%"
    }
  },
  {
    "id": 4,
    "chapter": 1,
    "localIndex": 4,
    "levelType": "standard",
    "durationSec": 75,
    "dishPool": [
      "dish_001",
      "dish_002"
    ],
    "customerMix": {
      "customer_001": 1
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 120,
      "coin2": 150,
      "coin3": 180
    },
    "modifiers": {
      "customerCount": 6,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1
    }
  },
  {
    "id": 5,
    "chapter": 1,
    "localIndex": 5,
    "levelType": "rush",
    "durationSec": 80,
    "dishPool": [
      "dish_001",
      "dish_002"
    ],
    "customerMix": {
      "customer_001": 1
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 150,
      "coin2": 190,
      "coin3": 230
    },
    "modifiers": {
      "customerCount": 8,
      "patienceMultiplier": 1.1,
      "rewardMultiplier": 1.1,
      "waveCount": 2,
      "rawRuleText": "2个客流波次;顾客耐心x1.10"
    }
  },
  {
    "id": 6,
    "chapter": 1,
    "localIndex": 6,
    "levelType": "tutorial_new_dish",
    "durationSec": 80,
    "dishPool": [
      "dish_001",
      "dish_003"
    ],
    "customerMix": {
      "customer_001": 1
    },
    "goals": {
      "mainText": "做出4份鸡蛋炒饭",
      "targetDishId": "dish_003",
      "targetDishCount": 4,
      "coin1": 150,
      "coin2": 190,
      "coin3": 230
    },
    "modifiers": {
      "customerCount": 7,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1,
      "targetDishWeights": {
        "dish_003": 0.65
      },
      "rawRuleText": "教学炒锅;鸡蛋炒饭权重65%"
    }
  },
  {
    "id": 7,
    "chapter": 1,
    "localIndex": 7,
    "levelType": "standard",
    "durationSec": 85,
    "dishPool": [
      "dish_001",
      "dish_002",
      "dish_003"
    ],
    "customerMix": {
      "customer_001": 1
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 200,
      "coin2": 250,
      "coin3": 300
    },
    "modifiers": {
      "customerCount": 9,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1
    }
  },
  {
    "id": 8,
    "chapter": 1,
    "localIndex": 8,
    "levelType": "combo",
    "durationSec": 85,
    "dishPool": [
      "dish_002",
      "dish_003"
    ],
    "customerMix": {
      "customer_001": 1
    },
    "goals": {
      "mainText": "连续满意5人",
      "combo": 5,
      "coin1": 180,
      "coin2": 230,
      "coin3": 280
    },
    "modifiers": {
      "customerCount": 8,
      "patienceMultiplier": 1.1,
      "rewardMultiplier": 1,
      "rawRuleText": "上错菜/超时会断连"
    }
  },
  {
    "id": 9,
    "chapter": 1,
    "localIndex": 9,
    "levelType": "standard",
    "durationSec": 90,
    "dishPool": [
      "dish_001",
      "dish_002",
      "dish_003"
    ],
    "customerMix": {
      "customer_001": 1
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 260,
      "coin2": 320,
      "coin3": 390
    },
    "modifiers": {
      "customerCount": 10,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1
    }
  },
  {
    "id": 10,
    "chapter": 1,
    "localIndex": 10,
    "levelType": "rush",
    "durationSec": 90,
    "dishPool": [
      "dish_001",
      "dish_002",
      "dish_003"
    ],
    "customerMix": {
      "customer_001": 0.9,
      "customer_005": 0.1
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 320,
      "coin2": 400,
      "coin3": 480
    },
    "modifiers": {
      "customerCount": 12,
      "patienceMultiplier": 0.9,
      "rewardMultiplier": 1.1,
      "waveCount": 2,
      "rawRuleText": "2个客流波次;急性子只点单菜"
    }
  },
  {
    "id": 11,
    "chapter": 1,
    "localIndex": 11,
    "levelType": "standard",
    "durationSec": 90,
    "dishPool": [
      "dish_001",
      "dish_002",
      "dish_003"
    ],
    "customerMix": {
      "customer_001": 0.9,
      "customer_005": 0.1
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 360,
      "coin2": 450,
      "coin3": 540
    },
    "modifiers": {
      "customerCount": 12,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1,
      "rawRuleText": "引导升级铁板1级"
    }
  },
  {
    "id": 12,
    "chapter": 1,
    "localIndex": 12,
    "levelType": "tutorial_new_dish",
    "durationSec": 95,
    "dishPool": [
      "dish_003",
      "dish_004"
    ],
    "customerMix": {
      "customer_001": 0.9,
      "customer_005": 0.1
    },
    "goals": {
      "mainText": "做出6份炸鸡排",
      "targetDishId": "dish_004",
      "targetDishCount": 6,
      "coin1": 380,
      "coin2": 480,
      "coin3": 570
    },
    "modifiers": {
      "customerCount": 12,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1,
      "targetDishWeights": {
        "dish_004": 0.65
      },
      "rawRuleText": "教学油锅;炸鸡排权重65%"
    }
  },
  {
    "id": 13,
    "chapter": 1,
    "localIndex": 13,
    "levelType": "standard",
    "durationSec": 95,
    "dishPool": [
      "dish_002",
      "dish_003",
      "dish_004"
    ],
    "customerMix": {
      "customer_001": 0.85,
      "customer_005": 0.15
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 430,
      "coin2": 540,
      "coin3": 650
    },
    "modifiers": {
      "customerCount": 14,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1
    }
  },
  {
    "id": 14,
    "chapter": 1,
    "localIndex": 14,
    "levelType": "event",
    "durationSec": 95,
    "dishPool": [
      "dish_001",
      "dish_002",
      "dish_003",
      "dish_004"
    ],
    "customerMix": {
      "customer_001": 0.9,
      "customer_005": 0.1
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 460,
      "coin2": 580,
      "coin3": 700
    },
    "modifiers": {
      "customerCount": 14,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1.15,
      "eventId": "event_rain_light",
      "rawRuleText": "下小雨:顾客数-10%;单价+15%"
    }
  },
  {
    "id": 15,
    "chapter": 1,
    "localIndex": 15,
    "levelType": "rush",
    "durationSec": 100,
    "dishPool": [
      "dish_002",
      "dish_003",
      "dish_004"
    ],
    "customerMix": {
      "customer_001": 0.8,
      "customer_005": 0.2
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 520,
      "coin2": 650,
      "coin3": 780
    },
    "modifiers": {
      "customerCount": 16,
      "patienceMultiplier": 0.95,
      "rewardMultiplier": 1.1,
      "waveCount": 3,
      "rawRuleText": "3个客流波次;顾客耐心x0.95"
    }
  },
  {
    "id": 16,
    "chapter": 1,
    "localIndex": 16,
    "levelType": "combo",
    "durationSec": 100,
    "dishPool": [
      "dish_003",
      "dish_004"
    ],
    "customerMix": {
      "customer_001": 0.85,
      "customer_005": 0.15
    },
    "goals": {
      "mainText": "连续满意7人",
      "combo": 7,
      "coin1": 500,
      "coin2": 620,
      "coin3": 750
    },
    "modifiers": {
      "customerCount": 15,
      "patienceMultiplier": 1.1,
      "rewardMultiplier": 1,
      "rawRuleText": "连击奖励+20%"
    }
  },
  {
    "id": 17,
    "chapter": 1,
    "localIndex": 17,
    "levelType": "standard",
    "durationSec": 100,
    "dishPool": [
      "dish_001",
      "dish_002",
      "dish_003",
      "dish_004"
    ],
    "customerMix": {
      "customer_001": 0.8,
      "customer_005": 0.2
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 610,
      "coin2": 760,
      "coin3": 910
    },
    "modifiers": {
      "customerCount": 17,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1
    }
  },
  {
    "id": 18,
    "chapter": 1,
    "localIndex": 18,
    "levelType": "tutorial_new_dish",
    "durationSec": 105,
    "dishPool": [
      "dish_004",
      "dish_005"
    ],
    "customerMix": {
      "customer_001": 0.8,
      "customer_005": 0.2
    },
    "goals": {
      "mainText": "做出6份奶茶",
      "targetDishId": "dish_005",
      "targetDishCount": 6,
      "coin1": 600,
      "coin2": 750,
      "coin3": 900
    },
    "modifiers": {
      "customerCount": 16,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1,
      "targetDishWeights": {
        "dish_005": 0.6
      },
      "rawRuleText": "教学奶茶;奶茶权重60%"
    }
  },
  {
    "id": 19,
    "chapter": 1,
    "localIndex": 19,
    "levelType": "event",
    "durationSec": 105,
    "dishPool": [
      "dish_002",
      "dish_003",
      "dish_004",
      "dish_005"
    ],
    "customerMix": {
      "customer_001": 0.8,
      "customer_005": 0.2
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 760,
      "coin2": 950,
      "coin3": 1140
    },
    "modifiers": {
      "customerCount": 19,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1.15,
      "eventId": "event_influencer_visit",
      "rawRuleText": "网红探店:前30秒客流+30%"
    }
  },
  {
    "id": 20,
    "chapter": 1,
    "localIndex": 20,
    "levelType": "boss",
    "durationSec": 110,
    "dishPool": [
      "dish_001",
      "dish_002",
      "dish_003",
      "dish_004",
      "dish_005"
    ],
    "customerMix": {
      "customer_001": 0.75,
      "customer_005": 0.25
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 900,
      "coin2": 1120,
      "coin3": 1350
    },
    "modifiers": {
      "customerCount": 22,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1,
      "rawRuleText": "Boss营业日;通关解锁学校门口"
    }
  },
  {
    "id": 21,
    "chapter": 2,
    "localIndex": 1,
    "levelType": "tutorial_chapter",
    "durationSec": 100,
    "dishPool": [
      "dish_004",
      "dish_005"
    ],
    "customerMix": {
      "customer_002": 0.7,
      "customer_001": 0.3
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 760,
      "coin2": 950,
      "coin3": 1140
    },
    "modifiers": {
      "customerCount": 18,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1,
      "rawRuleText": "新场景教学;学生顾客耐心较低"
    }
  },
  {
    "id": 22,
    "chapter": 2,
    "localIndex": 2,
    "levelType": "standard",
    "durationSec": 100,
    "dishPool": [
      "dish_004",
      "dish_005",
      "dish_003"
    ],
    "customerMix": {
      "customer_002": 0.7,
      "customer_001": 0.3
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 820,
      "coin2": 1020,
      "coin3": 1230
    },
    "modifiers": {
      "customerCount": 20,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1
    }
  },
  {
    "id": 23,
    "chapter": 2,
    "localIndex": 3,
    "levelType": "target_dish",
    "durationSec": 105,
    "dishPool": [
      "dish_005",
      "dish_004",
      "dish_003"
    ],
    "customerMix": {
      "customer_002": 0.75,
      "customer_001": 0.25
    },
    "goals": {
      "mainText": "卖出8杯奶茶",
      "targetDishId": "dish_005",
      "targetDishCount": 8,
      "coin1": 800,
      "coin2": 1000,
      "coin3": 1200
    },
    "modifiers": {
      "customerCount": 20,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1,
      "targetDishWeights": {
        "dish_005": 0.55
      },
      "rawRuleText": "奶茶权重55%"
    }
  },
  {
    "id": 24,
    "chapter": 2,
    "localIndex": 4,
    "levelType": "tutorial_new_dish",
    "durationSec": 105,
    "dishPool": [
      "dish_006",
      "dish_005",
      "dish_004"
    ],
    "customerMix": {
      "customer_002": 0.75,
      "customer_001": 0.25
    },
    "goals": {
      "mainText": "做出6份热狗",
      "targetDishId": "dish_006",
      "targetDishCount": 6,
      "coin1": 780,
      "coin2": 980,
      "coin3": 1170
    },
    "modifiers": {
      "customerCount": 19,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1,
      "targetDishWeights": {
        "dish_006": 0.6
      },
      "rawRuleText": "教学烤炉;热狗权重60%"
    }
  },
  {
    "id": 25,
    "chapter": 2,
    "localIndex": 5,
    "levelType": "rush",
    "durationSec": 110,
    "dishPool": [
      "dish_006",
      "dish_005",
      "dish_004"
    ],
    "customerMix": {
      "customer_002": 0.8,
      "customer_005": 0.2
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 1050,
      "coin2": 1320,
      "coin3": 1580
    },
    "modifiers": {
      "customerCount": 24,
      "patienceMultiplier": 0.9,
      "rewardMultiplier": 1.1,
      "waveCount": 3,
      "rawRuleText": "午后放学潮;3个客流波次"
    }
  },
  {
    "id": 26,
    "chapter": 2,
    "localIndex": 6,
    "levelType": "standard",
    "durationSec": 110,
    "dishPool": [
      "dish_006",
      "dish_005",
      "dish_004"
    ],
    "customerMix": {
      "customer_002": 0.75,
      "customer_005": 0.15,
      "customer_001": 0.1
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 980,
      "coin2": 1230,
      "coin3": 1470
    },
    "modifiers": {
      "customerCount": 23,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1
    }
  },
  {
    "id": 27,
    "chapter": 2,
    "localIndex": 7,
    "levelType": "combo",
    "durationSec": 110,
    "dishPool": [
      "dish_006",
      "dish_005",
      "dish_004"
    ],
    "customerMix": {
      "customer_002": 0.75,
      "customer_005": 0.25
    },
    "goals": {
      "mainText": "连续满意8人",
      "combo": 8,
      "coin1": 960,
      "coin2": 1200,
      "coin3": 1440
    },
    "modifiers": {
      "customerCount": 22,
      "patienceMultiplier": 1.1,
      "rewardMultiplier": 1,
      "rawRuleText": "连击奖励+25%"
    }
  },
  {
    "id": 28,
    "chapter": 2,
    "localIndex": 8,
    "levelType": "standard",
    "durationSec": 115,
    "dishPool": [
      "dish_006",
      "dish_005",
      "dish_004",
      "dish_003"
    ],
    "customerMix": {
      "customer_002": 0.7,
      "customer_005": 0.2,
      "customer_001": 0.1
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 1120,
      "coin2": 1400,
      "coin3": 1680
    },
    "modifiers": {
      "customerCount": 25,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1
    }
  },
  {
    "id": 29,
    "chapter": 2,
    "localIndex": 9,
    "levelType": "target_dish",
    "durationSec": 115,
    "dishPool": [
      "dish_006",
      "dish_005",
      "dish_004"
    ],
    "customerMix": {
      "customer_002": 0.75,
      "customer_005": 0.2,
      "customer_001": 0.05
    },
    "goals": {
      "mainText": "卖出9份热狗",
      "targetDishId": "dish_006",
      "targetDishCount": 9,
      "coin1": 1100,
      "coin2": 1380,
      "coin3": 1650
    },
    "modifiers": {
      "customerCount": 24,
      "patienceMultiplier": 1,
      "rewardMultiplier": 1,
      "targetDishWeights": {
        "dish_006": 0.55
      },
      "rawRuleText": "热狗权重55%"
    }
  },
  {
    "id": 30,
    "chapter": 2,
    "localIndex": 10,
    "levelType": "rush",
    "durationSec": 115,
    "dishPool": [
      "dish_006",
      "dish_005",
      "dish_004",
      "dish_003"
    ],
    "customerMix": {
      "customer_002": 0.75,
      "customer_005": 0.25
    },
    "goals": {
      "mainText": "赚够金币",
      "coin1": 1450,
      "coin2": 1810,
      "coin3": 2170
    },
    "modifiers": {
      "customerCount": 30,
      "patienceMultiplier": 0.92,
      "rewardMultiplier": 1.1,
      "waveCount": 2,
      "rawRuleText": "放学大高峰;顾客耐心x0.92"
    }
  }
];

export const defaultConfigBundle: ConfigBundle = {
  levels: mvpLevelConfigs,
  dishes: mvpDishConfigs,
  customers: mvpCustomerConfigs,
  equipments: mvpEquipmentConfigs,
};
