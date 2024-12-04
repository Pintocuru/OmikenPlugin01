// src/plugin.mockData.ts

import ElectronStore from "electron-store";
import { StoreType } from "./types";
import { Comment } from "@onecomme.com/onesdk/types/Comment";


// テストコメント
  export const commentMock: Comment = {
    id: "COMMENT_TESTER",
    service: "external",
    name: "CommentTester",
    url: "",
    color: { r: 0, g: 0, b: 0 },
    data: {
      comment: "おみくじ",
      id: "yt-1733023389806",
      liveId: "youtube-test",
      userId: "テストユーザー",
      name: "テストユーザー",
      isOwner: false,
      timestamp: "2024-12-01T03:23:09.806Z",
      badges: [],
      hasGift: false,
      profileImage: "",
      displayName: "テストユーザー",
      originalProfileImage: "",
      meta: {},
      speechText: "テ",
    },
    meta: { interval: 999999, tc: 10, no: 2, lc: 10 },
  };

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