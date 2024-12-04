// src/plugin.test.ts

import axios from "axios";
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

  test.skip("filterComment: ", () => {
    const result = plugin.filterComment(commentMock, null, null);
    expect(result).toBe(commentMock);
  });

  // GET - エディター用エンドポイントのテスト
  test.skip("GET /editor エンドポイントは正常にデータを返す", async () => {
    const hoge = plugin.Omiken;

    const req = {
      method: "GET",
      url: "http://localhost:11180/api/plugins/OmikenPlugin01/editor",
    };

    const result = await plugin.request(req);
    console.log("リクエスト結果:", result);

    expect(result).toEqual({
      code: 200,
      response: JSON.stringify(hoge),
    });
  });

  test("GET /editor エンドポイントは正常にデータを返す", async () => {
    const apiBase = "http://localhost:11180/api/plugins/OmikenPlugin01/editor";
    const endpoint = "/api/plugins/OmikenPlugin01/editor";

    const response = await axios.get(`${apiBase}`);
    console.log("リクエスト結果:", response.data);

    // 実サーバーから返ってくるデータの形式を確認
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("someData");
  });
});


