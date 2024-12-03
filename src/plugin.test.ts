// src/plugin.test.ts

import ElectronStore from "electron-store";
import { StoreType } from "./types";
import { MockElectronStore, storeMock } from "./plugin.mockData";

const plugin = require("./plugin"); 

jest.mock("electron-store", () => {
  return jest.fn(() => new MockElectronStore());
});


describe("plugin.init テスト", () => {
  let storeMock: MockElectronStore;

  beforeEach(() => {
    storeMock = new MockElectronStore();
  });

  test("正常に初期化される", () => {
    const initialData = { services: [{ id: "default" }] };

    plugin.init({ store: storeMock }, initialData);

    // TimeConfigがストアにセットされたか確認
    const timeConfig = storeMock.get("TimeConfig", {});
    expect(timeConfig).toHaveProperty("pluginTime");
    expect(timeConfig).toHaveProperty("defaultFrameId", "default");
  });
});

describe("サンプルプラグインのテスト", () => {
  beforeEach(() => {
    // 初期化を実行
    plugin.init({ store: storeMock }, { store: ElectronStore<StoreType> });
  });

  test('filterComment: サービスが "sample" の場合は false を返す', () => {
    const comment = { service: "sample" }; // テスト用のコメント
    const result = plugin.filterComment(comment, null, null);
    expect(result).toBe(false);
  });

  test('filterComment: サービスが "sample" 以外の場合はコメントを返す', () => {
    const comment = { service: "other" }; // サンプルコメント
    const result = plugin.filterComment(comment, null, null);
    expect(result).toEqual(comment);
  });

  test("init: 初期化がエラーを発生させない", () => {
    const mockStore = {
      set: jest.fn(),
      get: jest.fn(() => 0),
    };
    expect(() =>
      plugin.init({ dir: "/mock/dir", store: mockStore }, {})
    ).not.toThrow();
  });
});