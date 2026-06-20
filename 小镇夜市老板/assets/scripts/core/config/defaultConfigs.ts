import {
  ConfigBundle,
  CosmeticItemConfig,
  CosmeticSetConfig,
  CustomerConfig,
  DishConfig,
  EquipmentConfig,
  LevelConfig,
  PlayerAvatarConfig,
  StoreUpgradeConfig,
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
    ],
    "ingredientCostRate": 0.28,
    "maxLevel": 15,
    "priceBonusPerLevel": 0.05,
    "upgradeMilestones": [
      {
        "level": 5,
        "name": "加蛋烤冷面",
        "effectText": "产品升级，售价+8%，小费+2%",
        "effects": {
          "priceBonus": 0.08,
          "tipBonus": 0.02
        }
      },
      {
        "level": 10,
        "name": "招牌烤冷面",
        "effectText": "招牌口味，售价再+12%，口碑+1",
        "effects": {
          "priceBonus": 0.12,
          "rating": 1
        }
      },
      {
        "level": 15,
        "name": "夜市霸王冷面",
        "effectText": "大份招牌，售价再+18%，小费+3%",
        "effects": {
          "priceBonus": 0.18,
          "tipBonus": 0.03
        }
      }
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
    ],
    "ingredientCostRate": 0.24,
    "maxLevel": 15,
    "priceBonusPerLevel": 0.05,
    "upgradeMilestones": [
      {
        "level": 5,
        "name": "鸭屎香柠檬水",
        "effectText": "茶香升级，售价+12%，小费+2%",
        "effects": {
          "priceBonus": 0.12,
          "tipBonus": 0.02
        },
        "unlocks": [
          "drink_yashixiang_lemonade"
        ]
      },
      {
        "level": 10,
        "name": "霸王柠檬水",
        "effectText": "大杯爆款，售价再+16%，顾客满意+3%",
        "effects": {
          "priceBonus": 0.16,
          "tipBonus": 0.03
        },
        "unlocks": [
          "drink_king_lemonade"
        ]
      },
      {
        "level": 15,
        "name": "招牌桶装柠檬水",
        "effectText": "桶装分享，售价再+20%，口碑+1",
        "effects": {
          "priceBonus": 0.2,
          "rating": 1
        },
        "unlocks": [
          "drink_bucket_lemonade"
        ]
      }
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
    ],
    "ingredientCostRate": 0.3,
    "maxLevel": 15,
    "priceBonusPerLevel": 0.05,
    "upgradeMilestones": [
      {
        "level": 5,
        "name": "火腿鸡蛋炒饭",
        "effectText": "加料升级，售价+10%，小费+2%",
        "effects": {
          "priceBonus": 0.1,
          "tipBonus": 0.02
        }
      },
      {
        "level": 10,
        "name": "锅气黄金炒饭",
        "effectText": "锅气提升，售价再+14%，口碑+1",
        "effects": {
          "priceBonus": 0.14,
          "rating": 1
        }
      },
      {
        "level": 15,
        "name": "招牌夜市炒饭",
        "effectText": "招牌主食，售价再+18%，小费+3%",
        "effects": {
          "priceBonus": 0.18,
          "tipBonus": 0.03
        }
      }
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
    ],
    "ingredientCostRate": 0.34,
    "maxLevel": 15,
    "priceBonusPerLevel": 0.05,
    "upgradeMilestones": [
      {
        "level": 5,
        "name": "爆汁炸鸡排",
        "effectText": "爆汁配方，售价+10%，小费+2%",
        "effects": {
          "priceBonus": 0.1,
          "tipBonus": 0.02
        }
      },
      {
        "level": 10,
        "name": "芝士炸鸡排",
        "effectText": "高价配料，售价再+15%，口碑+1",
        "effects": {
          "priceBonus": 0.15,
          "rating": 1
        }
      },
      {
        "level": 15,
        "name": "霸王炸鸡排",
        "effectText": "大份招牌，售价再+20%，小费+3%",
        "effects": {
          "priceBonus": 0.2,
          "tipBonus": 0.03
        }
      }
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
    ],
    "ingredientCostRate": 0.28,
    "maxLevel": 15,
    "priceBonusPerLevel": 0.05,
    "upgradeMilestones": [
      {
        "level": 5,
        "name": "珍珠奶茶",
        "effectText": "加珍珠，售价+10%，小费+2%",
        "effects": {
          "priceBonus": 0.1,
          "tipBonus": 0.02
        }
      },
      {
        "level": 10,
        "name": "厚乳奶茶",
        "effectText": "厚乳升级，售价再+16%，顾客满意+3%",
        "effects": {
          "priceBonus": 0.16,
          "tipBonus": 0.03
        }
      },
      {
        "level": 15,
        "name": "招牌桶装奶茶",
        "effectText": "桶装爆款，售价再+20%，口碑+1",
        "effects": {
          "priceBonus": 0.2,
          "rating": 1
        }
      }
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
    ],
    "ingredientCostRate": 0.32,
    "maxLevel": 15,
    "priceBonusPerLevel": 0.05,
    "upgradeMilestones": [
      {
        "level": 5,
        "name": "芝士热狗",
        "effectText": "芝士加料，售价+10%，小费+2%",
        "effects": {
          "priceBonus": 0.1,
          "tipBonus": 0.02
        }
      },
      {
        "level": 10,
        "name": "双肠热狗",
        "effectText": "双肠大份，售价再+15%，口碑+1",
        "effects": {
          "priceBonus": 0.15,
          "rating": 1
        }
      },
      {
        "level": 15,
        "name": "夜市霸王热狗",
        "effectText": "高客单招牌，售价再+20%，小费+3%",
        "effects": {
          "priceBonus": 0.2,
          "tipBonus": 0.03
        }
      }
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
    ],
    "ingredientCostRate": 0.34,
    "maxLevel": 15,
    "priceBonusPerLevel": 0.05,
    "upgradeMilestones": [
      {
        "level": 5,
        "name": "进阶口味",
        "effectText": "进阶配方，售价+10%，小费+2%",
        "effects": {
          "priceBonus": 0.1,
          "tipBonus": 0.02
        }
      },
      {
        "level": 10,
        "name": "招牌口味",
        "effectText": "招牌升级，售价再+15%，口碑+1",
        "effects": {
          "priceBonus": 0.15,
          "rating": 1
        }
      },
      {
        "level": 15,
        "name": "霸王口味",
        "effectText": "高客单升级，售价再+20%，小费+3%",
        "effects": {
          "priceBonus": 0.2,
          "tipBonus": 0.03
        }
      }
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
    ],
    "ingredientCostRate": 0.31,
    "maxLevel": 15,
    "priceBonusPerLevel": 0.05,
    "upgradeMilestones": [
      {
        "level": 5,
        "name": "进阶口味",
        "effectText": "进阶配方，售价+10%，小费+2%",
        "effects": {
          "priceBonus": 0.1,
          "tipBonus": 0.02
        }
      },
      {
        "level": 10,
        "name": "招牌口味",
        "effectText": "招牌升级，售价再+15%，口碑+1",
        "effects": {
          "priceBonus": 0.15,
          "rating": 1
        }
      },
      {
        "level": 15,
        "name": "霸王口味",
        "effectText": "高客单升级，售价再+20%，小费+3%",
        "effects": {
          "priceBonus": 0.2,
          "tipBonus": 0.03
        }
      }
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
    ],
    "ingredientCostRate": 0.3,
    "maxLevel": 15,
    "priceBonusPerLevel": 0.05,
    "upgradeMilestones": [
      {
        "level": 5,
        "name": "进阶口味",
        "effectText": "进阶配方，售价+10%，小费+2%",
        "effects": {
          "priceBonus": 0.1,
          "tipBonus": 0.02
        }
      },
      {
        "level": 10,
        "name": "招牌口味",
        "effectText": "招牌升级，售价再+15%，口碑+1",
        "effects": {
          "priceBonus": 0.15,
          "rating": 1
        }
      },
      {
        "level": 15,
        "name": "霸王口味",
        "effectText": "高客单升级，售价再+20%，小费+3%",
        "effects": {
          "priceBonus": 0.2,
          "tipBonus": 0.03
        }
      }
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
    ],
    "ingredientCostRate": 0.26,
    "maxLevel": 15,
    "priceBonusPerLevel": 0.05,
    "upgradeMilestones": [
      {
        "level": 5,
        "name": "进阶口味",
        "effectText": "进阶配方，售价+10%，小费+2%",
        "effects": {
          "priceBonus": 0.1,
          "tipBonus": 0.02
        }
      },
      {
        "level": 10,
        "name": "招牌口味",
        "effectText": "招牌升级，售价再+15%，口碑+1",
        "effects": {
          "priceBonus": 0.15,
          "rating": 1
        }
      },
      {
        "level": 15,
        "name": "霸王口味",
        "effectText": "高客单升级，售价再+20%，小费+3%",
        "effects": {
          "priceBonus": 0.2,
          "tipBonus": 0.03
        }
      }
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
    ],
    "ingredientCostRate": 0.36,
    "maxLevel": 15,
    "priceBonusPerLevel": 0.05,
    "upgradeMilestones": [
      {
        "level": 5,
        "name": "进阶口味",
        "effectText": "进阶配方，售价+10%，小费+2%",
        "effects": {
          "priceBonus": 0.1,
          "tipBonus": 0.02
        }
      },
      {
        "level": 10,
        "name": "招牌口味",
        "effectText": "招牌升级，售价再+15%，口碑+1",
        "effects": {
          "priceBonus": 0.15,
          "rating": 1
        }
      },
      {
        "level": 15,
        "name": "霸王口味",
        "effectText": "高客单升级，售价再+20%，小费+3%",
        "effects": {
          "priceBonus": 0.2,
          "tipBonus": 0.03
        }
      }
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
    ],
    "ingredientCostRate": 0.38,
    "maxLevel": 15,
    "priceBonusPerLevel": 0.05,
    "upgradeMilestones": [
      {
        "level": 5,
        "name": "进阶口味",
        "effectText": "进阶配方，售价+10%，小费+2%",
        "effects": {
          "priceBonus": 0.1,
          "tipBonus": 0.02
        }
      },
      {
        "level": 10,
        "name": "招牌口味",
        "effectText": "招牌升级，售价再+15%，口碑+1",
        "effects": {
          "priceBonus": 0.15,
          "rating": 1
        }
      },
      {
        "level": 15,
        "name": "霸王口味",
        "effectText": "高客单升级，售价再+20%，小费+3%",
        "effects": {
          "priceBonus": 0.2,
          "tipBonus": 0.03
        }
      }
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
    "speedBonusPerLevel": 0.04,
    "maxSpeedBonus": 0.36,
    "tags": [
      "mvp",
      "hot_surface"
    ],
    "maxLevel": 12,
    "slotUnlockLevels": [
      3,
      7
    ],
    "upgradeMilestones": [
      {
        "level": 3,
        "name": "双面铁板",
        "effectText": "解锁第2工位，烤冷面高峰不堵单",
        "effects": {
          "speedBonus": 0.02
        }
      },
      {
        "level": 7,
        "name": "宽面铁板",
        "effectText": "解锁第3工位，支持多份并行",
        "effects": {
          "speedBonus": 0.03
        }
      },
      {
        "level": 10,
        "name": "明火铁板",
        "effectText": "铁板类制作速度再+6%，口碑+1",
        "effects": {
          "speedBonus": 0.06,
          "rating": 1
        }
      }
    ]
  },
  {
    "id": "station_drink",
    "name": "饮品台",
    "unlockLevel": 3,
    "slotCountBase": 1,
    "slotCountMax": 3,
    "baseUpgradeCost": 100,
    "speedBonusPerLevel": 0.04,
    "maxSpeedBonus": 0.36,
    "tags": [
      "mvp",
      "drink"
    ],
    "maxLevel": 12,
    "slotUnlockLevels": [
      3,
      7
    ],
    "upgradeMilestones": [
      {
        "level": 3,
        "name": "双杯饮品台",
        "effectText": "同时排队2杯饮品",
        "effects": {
          "speedBonus": 0.02
        }
      },
      {
        "level": 5,
        "name": "茶香萃取器",
        "effectText": "支撑鸭屎香柠檬水，饮品小费+2%",
        "effects": {
          "tipBonus": 0.02
        },
        "unlocks": [
          "drink_yashixiang_lemonade"
        ]
      },
      {
        "level": 7,
        "name": "三杯饮品台",
        "effectText": "同时排队3杯饮品",
        "effects": {
          "speedBonus": 0.03
        }
      },
      {
        "level": 10,
        "name": "霸王杯封口机",
        "effectText": "支撑霸王饮品，制作速度再+6%",
        "effects": {
          "speedBonus": 0.06
        },
        "unlocks": [
          "drink_king_series"
        ]
      }
    ]
  },
  {
    "id": "station_wok",
    "name": "炒锅",
    "unlockLevel": 6,
    "slotCountBase": 1,
    "slotCountMax": 3,
    "baseUpgradeCost": 150,
    "speedBonusPerLevel": 0.04,
    "maxSpeedBonus": 0.36,
    "tags": [
      "main_food"
    ],
    "maxLevel": 12,
    "slotUnlockLevels": [
      3,
      7
    ],
    "upgradeMilestones": [
      {
        "level": 3,
        "name": "双灶炒锅",
        "effectText": "解锁第2工位，主食高峰更稳",
        "effects": {
          "speedBonus": 0.02
        }
      },
      {
        "level": 7,
        "name": "猛火双灶",
        "effectText": "解锁第3工位，炒饭产能提升",
        "effects": {
          "speedBonus": 0.03
        }
      },
      {
        "level": 10,
        "name": "锅气猛火灶",
        "effectText": "炒锅制作速度再+6%，小费+2%",
        "effects": {
          "speedBonus": 0.06,
          "tipBonus": 0.02
        }
      }
    ]
  },
  {
    "id": "station_fryer",
    "name": "油锅",
    "unlockLevel": 12,
    "slotCountBase": 1,
    "slotCountMax": 3,
    "baseUpgradeCost": 180,
    "speedBonusPerLevel": 0.04,
    "maxSpeedBonus": 0.36,
    "tags": [
      "fried"
    ],
    "maxLevel": 12,
    "slotUnlockLevels": [
      3,
      7
    ],
    "upgradeMilestones": [
      {
        "level": 3,
        "name": "双篮油锅",
        "effectText": "解锁第2工位，炸鸡排不压单",
        "effects": {
          "speedBonus": 0.02
        }
      },
      {
        "level": 7,
        "name": "控温油锅",
        "effectText": "解锁第3工位，减少炸制等待",
        "effects": {
          "speedBonus": 0.03
        }
      },
      {
        "level": 10,
        "name": "酥脆油锅",
        "effectText": "油炸制作速度再+6%，小费+2%",
        "effects": {
          "speedBonus": 0.06,
          "tipBonus": 0.02
        }
      }
    ]
  },
  {
    "id": "station_grill",
    "name": "烤炉",
    "unlockLevel": 24,
    "slotCountBase": 1,
    "slotCountMax": 3,
    "baseUpgradeCost": 220,
    "speedBonusPerLevel": 0.04,
    "maxSpeedBonus": 0.36,
    "tags": [
      "grill"
    ],
    "maxLevel": 12,
    "slotUnlockLevels": [
      3,
      7
    ],
    "upgradeMilestones": [
      {
        "level": 3,
        "name": "双排烤炉",
        "effectText": "解锁第2工位，热狗放学潮更稳",
        "effects": {
          "speedBonus": 0.02
        }
      },
      {
        "level": 7,
        "name": "三排烤炉",
        "effectText": "解锁第3工位，高峰可并行",
        "effects": {
          "speedBonus": 0.03
        }
      },
      {
        "level": 10,
        "name": "炭香烤炉",
        "effectText": "烧烤制作速度再+6%，口碑+1",
        "effects": {
          "speedBonus": 0.06,
          "rating": 1
        }
      }
    ]
  },
  {
    "id": "station_takoyaki",
    "name": "丸子炉",
    "unlockLevel": 70,
    "slotCountBase": 1,
    "slotCountMax": 2,
    "baseUpgradeCost": 320,
    "speedBonusPerLevel": 0.04,
    "maxSpeedBonus": 0.36,
    "tags": [
      "specialty"
    ],
    "maxLevel": 10,
    "slotUnlockLevels": [
      4
    ],
    "upgradeMilestones": [
      {
        "level": 4,
        "name": "丸子炉扩容",
        "effectText": "解锁额外工位，减少高峰堵单",
        "effects": {
          "speedBonus": 0.02
        }
      },
      {
        "level": 8,
        "name": "丸子炉强化",
        "effectText": "制作速度再+5%",
        "effects": {
          "speedBonus": 0.05
        }
      }
    ]
  }
];

export const mvpStoreUpgradeConfigs: StoreUpgradeConfig[] = [
  {
    "id": "store_signboard",
    "name": "灯牌招牌",
    "unlockLevel": 1,
    "maxLevel": 8,
    "baseUpgradeCost": 160,
    "effectsPerLevel": {
      "priceBonus": 0.012,
      "rating": 0.25
    },
    "upgradeMilestones": [
      {
        "level": 3,
        "name": "亮灯招牌",
        "effectText": "全菜品售价+3.6%，高消费顾客开始注意摊位",
        "effects": {
          "rating": 1
        }
      },
      {
        "level": 6,
        "name": "霓虹灯牌",
        "effectText": "全菜品售价继续成长，口碑+1",
        "effects": {
          "rating": 1
        }
      }
    ],
    "tags": [
      "store",
      "revenue"
    ]
  },
  {
    "id": "store_tables",
    "name": "桌椅排队区",
    "unlockLevel": 4,
    "maxLevel": 8,
    "baseUpgradeCost": 140,
    "effectsPerLevel": {
      "patienceBonus": 0.02
    },
    "upgradeMilestones": [
      {
        "level": 3,
        "name": "塑料桌椅",
        "effectText": "顾客耐心明显提升，急性子流失降低",
        "effects": {
          "patienceBonus": 0.03
        }
      },
      {
        "level": 6,
        "name": "遮阳排队区",
        "effectText": "顾客耐心继续提升，客诉减免+3%",
        "effects": {
          "patienceBonus": 0.03,
          "complaintReduce": 0.03
        }
      }
    ],
    "tags": [
      "store",
      "patience"
    ]
  },
  {
    "id": "store_fridge",
    "name": "冰柜备货",
    "unlockLevel": 8,
    "maxLevel": 8,
    "baseUpgradeCost": 180,
    "effectsPerLevel": {
      "costReduce": 0.018
    },
    "upgradeMilestones": [
      {
        "level": 3,
        "name": "冷藏备货",
        "effectText": "食材损耗下降，成本再-3%",
        "effects": {
          "costReduce": 0.03
        }
      },
      {
        "level": 6,
        "name": "分区冰柜",
        "effectText": "成本控制继续提升，客诉减免+2%",
        "effects": {
          "costReduce": 0.03,
          "complaintReduce": 0.02
        }
      }
    ],
    "tags": [
      "store",
      "cost_control"
    ]
  },
  {
    "id": "store_cleanliness",
    "name": "清洁台",
    "unlockLevel": 12,
    "maxLevel": 6,
    "baseUpgradeCost": 170,
    "effectsPerLevel": {
      "complaintReduce": 0.025,
      "rating": 0.15
    },
    "upgradeMilestones": [
      {
        "level": 3,
        "name": "明亮灶台",
        "effectText": "挑剔顾客流失下降，口碑+1",
        "effects": {
          "complaintReduce": 0.04,
          "rating": 1
        }
      },
      {
        "level": 5,
        "name": "整洁摊位",
        "effectText": "客诉惩罚继续下降，高消费顾客更稳定",
        "effects": {
          "complaintReduce": 0.05
        }
      }
    ],
    "tags": [
      "store",
      "complaint"
    ]
  }
];

export const mvpAvatarConfigs: PlayerAvatarConfig[] = [
  {
    "id": "avatar_male_boss",
    "name": "男老板",
    "gender": "male",
    "portraitPath": "placeholders/avatar/male_boss.svg",
    "previewSpritePath": "placeholders/avatar/male_boss.svg",
    "actionAnchor": {
      "x": 0.5,
      "y": 0.2
    },
    "tags": [
      "boss",
      "avatar"
    ]
  },
  {
    "id": "avatar_female_boss",
    "name": "女老板",
    "gender": "female",
    "portraitPath": "placeholders/avatar/female_boss.svg",
    "previewSpritePath": "placeholders/avatar/female_boss.svg",
    "actionAnchor": {
      "x": 0.5,
      "y": 0.18
    },
    "tags": [
      "boss",
      "avatar"
    ]
  }
];

export const mvpCosmeticSetConfigs: CosmeticSetConfig[] = [
  {
    "id": "night_market_veteran",
    "name": "夜市老手套装",
    "requiredCosmeticIds": [
      "cosmetic_straw_hat",
      "cosmetic_canvas_apron",
      "cosmetic_light_shoes",
      "cosmetic_bamboo_tongs"
    ],
    "effects": {
      "complaintReduce": 0.015,
      "rating": 1
    },
    "tags": [
      "set",
      "stable_service"
    ]
  },
  {
    "id": "fresh_service_set",
    "name": "清爽招待套装",
    "requiredCosmeticIds": [
      "cosmetic_tidy_hair",
      "cosmetic_mint_tee",
      "cosmetic_lemon_apron",
      "cosmetic_anti_slip_sneakers"
    ],
    "effects": {
      "patienceBonus": 0.01,
      "tipBonus": 0.02
    },
    "tags": [
      "set",
      "tip"
    ]
  }
];

export const mvpCosmeticItemConfigs: CosmeticItemConfig[] = [
  {
    "id": "cosmetic_tidy_hair",
    "name": "利落短发",
    "slot": "hair",
    "unlockLevel": 1,
    "cost": 120,
    "effects": {
      "tipBonus": 0.005
    },
    "setId": "fresh_service_set",
    "iconPath": "placeholders/avatar/icon_hair_tidy.svg",
    "previewSpritePath": "placeholders/avatar/icon_hair_tidy.svg",
    "tags": [
      "cosmetic",
      "hair"
    ]
  },
  {
    "id": "cosmetic_ponytail_band",
    "name": "清爽发带",
    "slot": "hair",
    "unlockLevel": 4,
    "cost": 240,
    "effects": {
      "patienceBonus": 0.01
    },
    "iconPath": "placeholders/avatar/icon_hair_band.svg",
    "previewSpritePath": "placeholders/avatar/icon_hair_band.svg",
    "tags": [
      "cosmetic",
      "hair"
    ]
  },
  {
    "id": "cosmetic_straw_hat",
    "name": "夜市草编帽",
    "slot": "hat",
    "unlockLevel": 6,
    "cost": 380,
    "effects": {
      "patienceBonus": 0.015
    },
    "setId": "night_market_veteran",
    "iconPath": "placeholders/avatar/icon_hat_straw.svg",
    "previewSpritePath": "placeholders/avatar/icon_hat_straw.svg",
    "tags": [
      "cosmetic",
      "patience"
    ]
  },
  {
    "id": "cosmetic_mint_tee",
    "name": "薄荷条纹衫",
    "slot": "clothes",
    "unlockLevel": 5,
    "cost": 300,
    "effects": {
      "patienceBonus": 0.012
    },
    "setId": "fresh_service_set",
    "iconPath": "placeholders/avatar/icon_clothes_mint.svg",
    "previewSpritePath": "placeholders/avatar/icon_clothes_mint.svg",
    "tags": [
      "cosmetic",
      "clothes"
    ]
  },
  {
    "id": "cosmetic_cooling_shirt",
    "name": "透气工装衫",
    "slot": "clothes",
    "unlockLevel": 18,
    "cost": 820,
    "effects": {
      "speedBonus": 0.018
    },
    "iconPath": "placeholders/avatar/icon_clothes_work.svg",
    "previewSpritePath": "placeholders/avatar/icon_clothes_work.svg",
    "tags": [
      "cosmetic",
      "speed"
    ]
  },
  {
    "id": "cosmetic_canvas_apron",
    "name": "耐脏帆布围裙",
    "slot": "apron",
    "unlockLevel": 10,
    "cost": 520,
    "effects": {
      "costReduce": 0.015,
      "complaintReduce": 0.01
    },
    "setId": "night_market_veteran",
    "iconPath": "placeholders/avatar/icon_apron_canvas.svg",
    "previewSpritePath": "placeholders/avatar/icon_apron_canvas.svg",
    "tags": [
      "cosmetic",
      "cost_control"
    ]
  },
  {
    "id": "cosmetic_lemon_apron",
    "name": "柠檬印花围裙",
    "slot": "apron",
    "unlockLevel": 12,
    "cost": 560,
    "effects": {
      "tipBonus": 0.018
    },
    "setId": "fresh_service_set",
    "iconPath": "placeholders/avatar/icon_apron_lemon.svg",
    "previewSpritePath": "placeholders/avatar/icon_apron_lemon.svg",
    "tags": [
      "cosmetic",
      "tip"
    ]
  },
  {
    "id": "cosmetic_light_shoes",
    "name": "轻便胶鞋",
    "slot": "shoes",
    "unlockLevel": 16,
    "cost": 760,
    "effects": {
      "speedBonus": 0.02
    },
    "setId": "night_market_veteran",
    "iconPath": "placeholders/avatar/icon_shoes_light.svg",
    "previewSpritePath": "placeholders/avatar/icon_shoes_light.svg",
    "tags": [
      "cosmetic",
      "speed"
    ]
  },
  {
    "id": "cosmetic_anti_slip_sneakers",
    "name": "防滑运动鞋",
    "slot": "shoes",
    "unlockLevel": 22,
    "cost": 940,
    "effects": {
      "speedBonus": 0.025
    },
    "setId": "fresh_service_set",
    "iconPath": "placeholders/avatar/icon_shoes_sneakers.svg",
    "previewSpritePath": "placeholders/avatar/icon_shoes_sneakers.svg",
    "tags": [
      "cosmetic",
      "speed"
    ]
  },
  {
    "id": "cosmetic_cashier_gloves",
    "name": "收银防烫手套",
    "slot": "gloves",
    "unlockLevel": 20,
    "cost": 880,
    "effects": {
      "complaintReduce": 0.012,
      "tipBonus": 0.01
    },
    "iconPath": "placeholders/avatar/icon_gloves_cashier.svg",
    "previewSpritePath": "placeholders/avatar/icon_gloves_cashier.svg",
    "tags": [
      "cosmetic",
      "complaint"
    ]
  },
  {
    "id": "cosmetic_bamboo_tongs",
    "name": "竹柄夹子",
    "slot": "tool",
    "unlockLevel": 24,
    "cost": 1080,
    "effects": {
      "speedBonus": 0.03
    },
    "setId": "night_market_veteran",
    "iconPath": "placeholders/avatar/icon_tool_tongs.svg",
    "previewSpritePath": "placeholders/avatar/icon_tool_tongs.svg",
    "tags": [
      "cosmetic",
      "tool"
    ]
  },
  {
    "id": "cosmetic_pro_spatula",
    "name": "顺手铁铲",
    "slot": "tool",
    "unlockLevel": 28,
    "cost": 1380,
    "effects": {
      "speedBonus": 0.045,
      "complaintReduce": 0.015
    },
    "iconPath": "placeholders/avatar/icon_tool_spatula.svg",
    "previewSpritePath": "placeholders/avatar/icon_tool_spatula.svg",
    "tags": [
      "cosmetic",
      "tool"
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
      "coin1": 330,
      "coin2": 400,
      "coin3": 480
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
      "coin1": 360,
      "coin2": 440,
      "coin3": 520
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
      "coin1": 390,
      "coin2": 480,
      "coin3": 570
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
      "coin1": 420,
      "coin2": 510,
      "coin3": 610
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
      "coin1": 490,
      "coin2": 600,
      "coin3": 710
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
      "coin1": 470,
      "coin2": 570,
      "coin3": 680
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
      "coin1": 460,
      "coin2": 560,
      "coin3": 670
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
      "coin1": 540,
      "coin2": 660,
      "coin3": 780
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
      "coin1": 630,
      "coin2": 770,
      "coin3": 910
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
      "coin1": 630,
      "coin2": 770,
      "coin3": 910
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
      "coin1": 560,
      "coin2": 680,
      "coin3": 810
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
      "coin1": 610,
      "coin2": 740,
      "coin3": 880
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
      "coin1": 620,
      "coin2": 760,
      "coin3": 900
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
      "coin1": 620,
      "coin2": 760,
      "coin3": 900
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
      "coin1": 820,
      "coin2": 1000,
      "coin3": 1190
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
      "coin1": 760,
      "coin2": 930,
      "coin3": 1100
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
      "coin1": 740,
      "coin2": 900,
      "coin3": 1070
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
      "coin1": 850,
      "coin2": 1040,
      "coin3": 1230
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
      "coin1": 850,
      "coin2": 1040,
      "coin3": 1230
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
      "coin1": 1120,
      "coin2": 1370,
      "coin3": 1620
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
  storeUpgrades: mvpStoreUpgradeConfigs,
  avatars: mvpAvatarConfigs,
  cosmetics: mvpCosmeticItemConfigs,
  cosmeticSets: mvpCosmeticSetConfigs,
};
