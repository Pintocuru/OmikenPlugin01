// src/plugin.ts
// プラグインの型定義 : https://types.onecomme.com/interfaces/types_Plugin.OnePlugin
import {
  StoreType,
  OmikenType,
  VisitType,
  GameType,
  RulesType,
  TimeConfigType,
  StoreAllType,
} from "./types";
import { configs } from "./config";
import { CommentInstance } from "./Modules/CommentInstance";
import { InitDataLoader } from "./Modules/InitDataLoader";
import { RequestHandler } from "./Modules/ApiRequest";
import { OnePlugin, PluginResponse } from "@onecomme.com/onesdk/types/Plugin";
import { Comment } from "@onecomme.com/onesdk/types/Comment";
import ElectronStore from "electron-store";

const plugin: OnePlugin = {
  name: "おみくじBOTプラグイン", // プラグイン名
  uid: configs.PLUGIN_UID, // プラグイン固有の一意のID
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
      lc: 0, // プラグインを起動してからカウントしたコメント数
      lastTime: 0, // 最後におみくじ機能が実行された時刻
      lastUserId: "", // 最後におみくじを行ったuserId
    },
  },
  // プラグインの初期化
  init({ store }: { store: ElectronStore<StoreType> }) {
    console.log("プラグイン初期化開始");
    this.store = store;

    // JSONからロード
    const loader = new InitDataLoader(store);
    // 初期化してthisに上書き
    Object.assign(this, loader.loadPluginData());
    // 初期化したGamesをstoreに格納
    this.store.set("Games", this.Games);
  },

  // filterComment:コメントを加工・変更する
  async filterComment(comment, service, userData): Promise<Comment | false> {
    // 自身のプラグインの投稿はおみくじを行わない
    if (comment.data.userId === configs.botUserId) {
      // isOwner(isSilent) なら読み上げを行わない
      if (comment.data.isOwner) comment.data.speechText = " ";
      return comment;
    }

    // 初期化
    const Omiken = this.Omiken as OmikenType;
    const rulesArray = this.OmikenTypesArray.comment as RulesType[];
    const userId = comment.data.userId;
    const visit = this.Visits?.[userId] as VisitType; // ユーザーのvisit
    this.store.set("TimeConfig.lc", ++this.TimeConfig.lc); // TimeConfig.lcをインクリメント
    const TimeConfig = this.TimeConfig as TimeConfigType; // 前回データ

    // TODO:test:undefinedの場合にエラーを投げる:
    if (!Omiken) console.error("Omiken is undefined");
    if (!rulesArray) console.error("OmikenRulesComment is undefined");
    if (!userId) console.error("User ID is undefined");
    if (!visit) console.error(`Visit data for user ${userId} is undefined`);
    if (!TimeConfig) console.error("TimeConfig is undefined");

    // インスタンスの発行
    const Instance = new CommentInstance(comment, visit, TimeConfig, userData);
    try {
      // おみくじCHECK
      const isOmikuji = Instance.omikenSelect(rulesArray, Omiken.omikujis);
      console.log("おみくじ選択結果: ", isOmikuji);
      if (!isOmikuji) return comment;

      // おみくじがあるなら、おみくじを実行
      console.log("おみくじ処理を開始");
      const processResult = await Instance.omikujiProcess(
        this.Games,
        Omiken.places,
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

        // gameを書き換える
        const gameNew = Instance.getDATA("game") as GameType;
        this.store.set(`Games.${ruleId}`, gameNew);
        this.Games[ruleId] = gameNew;
        console.warn("Game 更新: ", gameNew);
      }

      // visitを書き換える
      const visitNew = Instance.getDATA("visit") as VisitType;
      this.Visits[userId] = visitNew;
      this.store.set(`Visits.${userId}`, visitNew);
      console.warn("Visit 更新: ", visitNew);
    }
  },

  // called when a request is made to the plugin-specific
  async request(req): Promise<PluginResponse> {
    // データ型のマッピング
    const responseMap: StoreAllType = {
      Omiken: this.Omiken,
      Presets: this.Presets,
      Charas: this.Charas,
      Scripts: this.Scripts,
      Visits: this.Visits,
      Games: this.Games,
      TimeConfig: this.TimeConfig,
    };

    const handler = new RequestHandler(responseMap);
    const result = await handler.handleRequest(req);
    Object.assign(this, result.data);

    // * 将来、Gamesをエディターで編集できるようになったら、
    // * this.store.set を使いたい
    return result.response;
  },
};

module.exports = plugin;
