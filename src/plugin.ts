// src/plugin.ts
// プラグインの型定義 : https://types.onecomme.com/interfaces/types_Plugin.OnePlugin
import { OnePlugin } from "@onecomme.com/onesdk/types/Plugin";
import { Comment } from "@onecomme.com/onesdk/types/Comment";
import ElectronStore from "electron-store";
import { CommentInstance } from "./scripts/CommentInstance";
import {
  StoreType,
  OmikenType,
  CharaType,
  VisitType,
  GameType,
  RulesType,
  OmikujiType,
  PlaceType,
  TimeConfigType,
} from "./types";
import { InitDataLoader } from "./scripts/InitDataLoader";
import { configs } from "./config";

const PLUGIN_UID = "OmikenPlugin01"; // プラグイン固有の一意のID

const plugin: OnePlugin = {
  name: "おみくじBOTプラグイン", // プラグイン名
  uid: PLUGIN_UID, // プラグイン固有の一意のID
  version: "0.0.8", // プラグインのバージョン番号
  author: "Pintocuru", // 開発者名
  url: "https://onecomme.com", // サポートページのURL
  // services:枠情報,filter.comment:コメント
  permissions: ["services", "filter.comment"],

  // プラグインの初期状態
  defaultState: {
    Visits: {},
    Games: {},
    TimeConfig: {
      pluginTime: 0, // プラグインを起動した時刻
      lastTime: 0, // 最後におみくじ機能が実行された時刻
      lastUserId: "", // 最後におみくじを行ったuserId
    },
  },
  // プラグインの初期化
  init({ store }: { store: ElectronStore<StoreType> }) {
    console.log("プラグイン初期化開始");
    this.store = store;

    const loader = new InitDataLoader(store, configs.dataRoot);

    const loadedData = loader.loadPluginData();
    loader.initializeTimeConfig();
    loader.initializeGames();

    Object.assign(this, loadedData);
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
  async filterComment(comment: Comment): Promise<Comment | false> {
    // 自身のプラグインの投稿は除外
    if (comment.data.userId === "FirstCounter") return comment;

    // 初期化
    const rulesArray = this.OmikenRulesComment as RulesType[];
    const omikujis = this.OmikenOmikuji as Record<string, OmikujiType>;
    const places = this.OmikenPlace as Record<string, PlaceType>;
    const userId = comment.data.userId;
    const visit = this.Visits?.[userId] as VisitType; // ユーザーのvisit
    const TimeConfig = this.TimeConfig as TimeConfigType; // 前回データ

    // undefinedの場合にエラーを投げたい:
    if (!rulesArray) console.error("OmikenRulesComment is undefined");
    if (!omikujis) console.error("OmikenOmikuji is undefined");
    if (!places) console.error("OmikenPlace is undefined");
    if (!userId) console.error("User ID is undefined");
    if (!visit) console.error(`Visit data for user ${userId} is undefined`);
    if (!TimeConfig) console.error("TimeConfig is undefined");

    // インスタンスの発行
    const Instance = new CommentInstance(comment, visit, TimeConfig);
    try {
      // おみくじCHECK
      const isOmikuji = Instance.omikenSelect(rulesArray, omikujis);
      console.log("おみくじ選択結果: ", isOmikuji);

      if (!isOmikuji) {
        console.log("おみくじ未選択のため終了: ", comment);
        return comment;
      }

      // おみくじがあるなら、おみくじを実行
      console.log("おみくじ処理を開始");
      const processResult = await Instance.omikujiProcess(
        this.Games,
        places,
        this.Charas,
        this.Scripts
      );
      console.log("おみくじ処理完了: ", processResult);
      return processResult;
    } finally {
      const ruleId = Instance.getDATA("ruleId") as string;
      console.log("ルールID: ", ruleId);

      // おみくじを実行した場合
      if (ruleId) {
        // lastTime と lastUserId を更新
        this.store.set("TimeConfig.lastTime", Date.now());
        this.store.set("TimeConfig.lastUserId", userId);
        console.log("TimeConfig 更新: ", {
          lastTime: Date.now(),
          lastUserId: userId,
        });

        // 相違がある時、gameを書き換える
        const game = this.Games[ruleId] as GameType;
        const gameNew = Instance.getDATA("game") as GameType;
        if (JSON.stringify(game) !== JSON.stringify(gameNew)) {
          this.store.set(`Games.${ruleId}`, gameNew);
          console.log("Game 更新: ", { old: game, new: gameNew });
        }
      }

      // 相違がある時、visitを書き換える
      const visitNew = Instance.getDATA("visit") as VisitType;
      if (JSON.stringify(visit) !== JSON.stringify(visitNew)) {
        this.store.set(`Visits.${userId}`, visitNew);
        console.log("Visit 更新: ", { old: visit, new: visitNew });
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
    const baseUrl = "http://localhost:11180";
    const fullUrl = new URL(req.url, baseUrl).href;
    const { searchParams } = new URL(fullUrl);
    const typeParam = searchParams.get("type");

    return new Promise((resolve) => {
      switch (req.method) {
        case "GET":
          if (typeParam === "editor") {
            resolve({
              code: 200,
              response: JSON.stringify(this.Omiken),
            });
          }
          break;
        case "POST":
          try {
            const data = JSON.parse(req.body);
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
        default:
          resolve({
            code: 404,
            response: "Not Found",
          });
      }
    });
  },
};

module.exports = plugin;
