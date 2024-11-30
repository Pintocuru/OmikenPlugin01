// src/main.ts
import { Service } from "@onecomme.com/onesdk/types/Service";
// プラグインの型定義 : https://types.onecomme.com/interfaces/types_Plugin.OnePlugin
import { OnePlugin } from "@onecomme.com/onesdk/types/Plugin";
import { Comment } from "@onecomme.com/onesdk/types/Comment";
import { UserNameData } from "@onecomme.com/onesdk/types/UserData";
import ElectronStore from "electron-store";
import { CommentInstance } from "./scripts/CommentInstance";
import {
  StoreType,
  OmikenType,
  CharaType,
  VisitType,
  GameType,
  RulesType,
  PresetType,
  PresetCharaType,
  PresetScriptType,
  OmikujiType,
  PlaceType,
  OnePluginOmiken,
  TimeConfigType,
} from "./types/index";

const plugin: OnePluginOmiken = {
  name: "おみくじBOTプラグイン", // プラグイン名
  uid: "OmikenPlugin01", // プラグイン固有の一意のID
  version: "0.0.6", // プラグインのバージョン番号
  author: "Pintocuru", // 開発者名
  url: "https://onecomme.com", // サポートページのURL
  permissions: ["filter.comment"], // データタイプ

  // プラグインの初期状態
  defaultState: {
    Omiken: {
      rules: {},
      rulesOrder: [],
      omikuji: {},
      place: {},
    },
    Charas: {},
    Scripts: {},
    Visits: {},
    Games: {},
    TimeConfig: {
      defaultFrameId: "", // わんコメの一番上の枠ID
      pluginTime: 0, // プラグインを起動した時刻
      lastTime: 0, // 最後におみくじ機能が実行された時刻
      lastUserId: "", // 最後におみくじを行ったuserId
    },
  },

  // プラグインの初期化
  init({ store }: { store: ElectronStore<StoreType> }, initialData) {
    // データ読み込み
    this.store = store;
    this.initLoadData();

    // 枠情報の更新
    const now = Date.now();
    this.store.set(`TimeConfig.pluginTime`, now);
    // わんコメの一番上の枠IDを取得し、defaultFrameIdにする
    const servicesId = initialData.services[0].id;
    console.warn(servicesId); // TODO ちゃんとID取得できてる?
    this.store.set(`TimeConfig.defaultFrameId`, servicesId);

    // プリセットデータの読み込み
    this.initPresetLoad();

    // 初期化時、Gamesのdrawsをすべて0にする
    this.initGamesinitialize();
  },

  // データ読み込み
  initLoadData() {
    // データの読み込み
    const storeKeys = {
      OmikenOmikuji: "Omiken.omikuji",
      OmikenPlace: "Omiken.place",
      Visits: "Visits",
      Games: "Games",
      TimeConfig: "TimeConfig",
    };
    Object.entries(storeKeys).forEach(([prop, key]) => {
      this[prop] = this.store.get(key);
    });

    // ruleTypeごとにOmiken.rulesのデータを分別する
    const rules = this.store.get("Omiken.rules") as Record<string, RulesType>;
    const rulesOrder = this.store.get("Omiken.rulesOrder") as string[];

    const ruleTypes = ["comment", "timer"] as const;
    ruleTypes.forEach((type) => {
      const propertyName = `OmikenRules${
        type.charAt(0).toUpperCase() + type.slice(1)
      }`;
      this[propertyName] = rulesOrder
        .map((key) => rules[key])
        .filter((rule) => rule.ruleType === type);
    });
  },

  // プリセットデータの読み込み
  initPresetLoad() {
    const preset: Record<
      string,
      PresetType
    > = require("./data/preset/index.json");
    this.Charas = {};
    this.Scripts = {};

    Object.entries(preset).forEach(([key, value]) => {
      if (value.type === "Chara") {
        this.Charas[key] = value as PresetCharaType;
      } else if (value.type === "Script") {
        this.Scripts[key] = value as PresetScriptType;
      }
    });
  },

  // 初期化時、Gamesのdrawsをすべて0にする
  initGamesinitialize() {
    const Games = this.store.get("Games") as Record<string, GameType>;
    const GamesNew = Object.fromEntries(
      Object.entries(Games).map(([key, game]) => [key, { ...game, draws: 0 }])
    );
    this.store.set("Games", GamesNew);
  },

  /**
   * コメントフィルタ関数
   * コメント受信時に実行され、コメントを加工・変更できます
   * 'filter.comment' 権限が必要
   *
   * @param  comment - 受信したコメントデータ
   * @param  service - コメントが投稿されたサービス情報
   * @param  userData - コメント投稿者のユーザーデータ
   * @returns Promise<Comment | false> - コメント。falseでコメントを無効化
   */
  async filterComment(
    comment: Comment,
    service: Service,
    userData: UserNameData
  ): Promise<Comment | false> {
    // このプラグインが投稿したコメントを除く
    if (comment.data.userId === "FirstCounter") return comment;

    // 初期化
    const rulesArray = this.OmikenRulesComment as RulesType[];
    const omikujis = this.OmikenOmikuji as Record<string, OmikujiType>;
    const places = this.OmikenPlace as Record<string, PlaceType>;
    const userId = comment.data.userId;
    const visit = this.Visits[userId] as VisitType; // ユーザーのvisit
    const TimeConfig = this.TimeConfig as TimeConfigType; // 前回データ

    // インスタンスの発行
    const Instance = new CommentInstance(comment, visit, TimeConfig);
    try {
      // おみくじCHECK
      if (!Instance.omikenSelect(rulesArray, omikujis)) return comment;

      // おみくじがあるなら、おみくじを実行
      const ruleId = Instance.getDATA("ruleId") as string;
      const game = this.Games[ruleId] as GameType;

      // 編集したコメントかfalseを返す
      return Instance.omikujiProcess(game, places, this.Charas, this.Scripts);
    } finally {
      const ruleId = Instance.getDATA("ruleId") as string;
      // おみくじを実行した場合
      if (ruleId) {
        // lastTime と lastUserId を更新
        const now = Date.now();
        this.store.set("TimeConfig.lastTime", now);
        this.store.set("TimeConfig.lastUserId", userId);

        // 相違がある時、gameを書き換える
        const game = this.Games[ruleId] as GameType;
        const gameNew = Instance.getDATA("game") as GameType;
        if (JSON.stringify(game) !== JSON.stringify(gameNew)) {
          this.store.set(`Games.${ruleId}`, gameNew);
        }

        // 相違がある時、visitを書き換える
        const visitNew = Instance.getDATA("visit") as VisitType;
        if (JSON.stringify(visit) !== JSON.stringify(visitNew)) {
          this.store.set(`Visits.${userId}`, visitNew);
        }
      }
    }
  },

  /**
   * called when a request is made to the plugin-specific RestAPI
   * @param {
   *   url: string // request url
   *   method: 'GET' | 'POST' | 'PUT' | 'DELETE'
   *   params: {[key: string]: string} // querystrings
   *   body?: any // request body
   * } req
   * @returns {
   *   code: number // status code
   *   response: Object or Array // response data
   * }
   */
  async request(req) {
    // [GET, POST, PUT, DELETE]
    // endpoint: localhost:11180/api/plugins/com.onecomme.plugin-sample
    const path = new URL(req.url).pathname;
    const segments = path.split("/").filter(Boolean);
    const endpoint = segments[segments.length - 1]; // 最後のパスセグメントをエンドポイントとして使用

    return new Promise((resolve) => {
      switch (req.method) {
        case "GET":
          switch (endpoint) {
            // エディター用
            case "editor":
              resolve({
                code: 200,
                response: JSON.stringify({
                  ...this.store.Omiken,
                  ...this.store.CHARA,
                }),
              });
              break;
            // ジェネレーター用
            // TODO 何をGETできればいい？
            case "display":
              resolve({
                code: 200,
                response: JSON.stringify({ score: this.score }), // TODO thisが放置されてる
              });
              break;

            default:
              resolve({
                code: 404,
                response: "Not Found",
              });
          }
          break;
        // POST
        case "POST":
          switch (endpoint) {
            // 保存:Omiken
            case "omiken":
              try {
                const data = JSON.parse(req.body) as OmikenType;
                this.store.Omiken = data;
                resolve({
                  code: 200,
                  response: "Omiken updated successfully",
                });
              } catch (error) {
                resolve({
                  code: 400,
                  response: "Invalid data format",
                });
              }
              break;

            // 保存:CHARA
            case "chara":
              try {
                const data = JSON.parse(req.body) as CharaType;
                this.store.CHARA = data;
                resolve({
                  code: 200,
                  response: "CHARA updated successfully",
                });
              } catch (error) {
                resolve({
                  code: 400,
                  response: "Invalid data format",
                });
              }
              break;

            default:
              resolve({
                code: 404,
                response: "Unknown endpoint",
              });
          }
          break;
      }
    });
  },
};

module.exports = plugin;
