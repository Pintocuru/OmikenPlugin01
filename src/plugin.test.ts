// src/plugin.test.ts

import ElectronStore from "electron-store";
import { StoreType } from "./types";
import { commentMock, MockElectronStore, storeMock } from "./plugin.mockData";

const plugin = require("./plugin"); 

jest.mock("electron-store", () => {
  return jest.fn(() => new MockElectronStore());
});


describe.skip("plugin.init テスト", () => {
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

  test('filterComment: ', () => {
    const result = plugin.filterComment(commentMock, null, null);
    expect(result).toBe(commentMock);
  });

});