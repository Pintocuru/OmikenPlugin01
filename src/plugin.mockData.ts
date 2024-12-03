// src/plugin.mockData.ts

import ElectronStore from "electron-store";
import { StoreType } from "./types";


// プラグインデータモック
export const defaultStateMock: StoreType = {
  Visits: {
    hoge: {
      name: "hoge",
      userId: "hoge",
      status: "nullpo",
      lastPluginTime: 1733023706798,
      visitData: {
        "1729669868469-531k4": {
          id: "1729669868469-531k4",
          draws: 1,
          totalDraws: 1,
          count: [0, 0, 0],
          items: [],
        },
      },
    },
  },
  Games: {
    "1729669868469-531k4": {
      id: "1729669868469-531k4",
      draws: 1,
      totalDraws: 1,
      gameData: {},
    },
  },
  TimeConfig: {
    pluginTime: 1733023706798,
    defaultFrameId: "26c434d4-db3b-4975-9061-093cf7cdb5b2",
    lastTime: 0,
    lastUserId: "",
  },
};

// ElectronStoreモックの作成
export const storeMock = {
  get: jest.fn((key: string) => {
    const keys = key.split('.');
    let value = defaultStateMock;
    for (const k of keys) {
      value = value[k];
    }
    return value;
  }),
  set: jest.fn((key: string, value: any) => {
    const keys = key.split('.');
    let current = defaultStateMock;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }),
} as unknown as ElectronStore<StoreType>;


// ElectronStore の代替品
export class MockElectronStore {
  private storeData: Record<string, any>;

  constructor(initialData: StoreType = defaultStateMock) {
    // 初期データをstoreDataにセット
    this.storeData = { ...initialData };
  }

  get<T>(key: string, defaultValue: T): T {
    // キーをドット区切りで探索
    const keys = key.split(".");
    let value = this.storeData;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return (value as T) || defaultValue;
  }

  set<T>(key: string, value: T): void {
    // キーをドット区切りで探索し、最終キーに値をセット
    const keys = key.split(".");
    let current = this.storeData;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== "object") {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
  }
}