// src/plugin.test.ts

import axios from "axios";
import ElectronStore from "electron-store";
import { StoreAllType, StoreType } from "./types";
import { commentMock, MockElectronStore, storeMock } from "./plugin.mockData";
import { configs } from "./config";
import { PluginRequest } from "@onecomme.com/onesdk/types/Plugin";
import { RequestHandler } from "./Modules/ApiRequest";

const plugin = require("./plugin");

jest.mock("electron-store", () => {
  return jest.fn(() => new MockElectronStore());
});

describe.skip("plugin.init:初期化テスト", () => {
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

describe("各種関数のテスト", () => {
  beforeEach(() => {
    // 初期化を実行
    plugin.init({ store: storeMock }, { store: ElectronStore<StoreType> });
  });

  test("filterComment:おみくじができる ", () => {
    const result = plugin.filterComment(commentMock, null, null);
    expect(result).toBe(commentMock);
  });

  test.skip("RequestHandler:データ取得が成功する場合", async () => {
    const request: PluginRequest = {
      url: "/test",
      method: "GET",
      params: { mode: "data", type: "Omiken" },
      body: "",
    };
    const responseMap: StoreAllType = {
      Omiken: plugin.Omiken,
      Presets: plugin.Presets,
      Charas: plugin.Charas,
      Scripts: plugin.Scripts,
      Visits: plugin.Visits,
      Games: plugin.Games,
      TimeConfig: plugin.TimeConfig,
    };
    const requestHandler = new RequestHandler(responseMap);
    const result = await requestHandler.handleRequest(request);
    console.log(result);
  });

  test.skip("GET /editor エンドポイントは正常にデータを返す", async () => {
    const apiBase = "http://localhost:11180/api/plugins/" + configs.PLUGIN_UID;

    const response = await axios.get(`${apiBase}`);
    console.log("リクエスト結果:", response.data);

    // 実サーバーから返ってくるデータの形式を確認
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("someData");
  });
});
