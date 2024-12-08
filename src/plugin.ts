// src/plugin.ts
// プラグインの型定義 : https://types.onecomme.com/interfaces/types_Plugin.OnePlugin
import { OnePlugin, PluginResponse } from "@onecomme.com/onesdk/types/Plugin";
import { Comment } from "@onecomme.com/onesdk/types/Comment";
import ElectronStore from "electron-store";
import { CommentInstance } from "./scripts/CommentInstance";
import {
  StoreType,
  OmikenType,
  VisitType,
  GameType,
  RulesType,
  TimeConfigType,
} from "./types";
import { filterTypes, InitDataLoader } from "./scripts/InitDataLoader";
import { configs } from "./config";
import { BackupService } from "./scripts/BackupService";
const fs = require("fs");
const path = require("path");


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
    const TimeConfig = this.TimeConfig as TimeConfigType; // 前回データ

    // undefinedの場合にエラーを投げたい:
    if (!Omiken) console.error("Omiken is undefined");
    if (!rulesArray) console.error("OmikenRulesComment is undefined");
    if (!userId) console.error("User ID is undefined");
    if (!visit) console.error(`Visit data for user ${userId} is undefined`);
    if (!TimeConfig) console.error("TimeConfig is undefined");

    // インスタンスの発行
    const Instance = new CommentInstance(comment, visit, TimeConfig);
    try {
      // おみくじCHECK
      const isOmikuji = Instance.omikenSelect(rulesArray, Omiken.omikujis);
      console.log("おみくじ選択結果: ", isOmikuji);

      if (!isOmikuji) {
        console.log("おみくじ未選択のため終了: ", comment);
        return comment;
      }

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
   * called when a request is made to the plugin-specific
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
  async request(req): Promise<PluginResponse> {
    const { method, params, body } = req;

    // データ型のマッピング
    const responseMap = {
      Omiken: this.Omiken,
      Presets: this.Presets,
      Charas: this.Charas,
      Scripts: this.Scripts,
      Visits: this.Visits,
      Games: this.Games,
    };

    // エラーレスポンスの共通関数
    const createErrorResponse = (code: number, message: string) => ({
      code,
      response: message,
    });

    // 成功レスポンスの共通関数
    const createSuccessResponse = (data: string, code: number = 200) => ({
      code,
      response: data,
    });

    try {
      switch (method) {
        case "GET":
          // データ取得モード
          if (params.mode === "data") {
            if (!params.type) {
              return createErrorResponse(400, "タイプパラメータが必要です");
            }

            const response = responseMap[params.type];

            return response
              ? createSuccessResponse(response)
              : createErrorResponse(400, "無効なタイプ");
          }

          // バックアップモード
          if (params.mode === "backup") {
            // TODO: バックアップの取得実装
            return createErrorResponse(501, "バックアップの取得は未実装");
          }

          return createErrorResponse(400, "無効なリクエストモード");

        case "POST":
          // データ書き込みモード
          if (params.mode === "writing") {
            const data = JSON.parse(body) as OmikenType;

            // Node.jsのfs (file system)モジュールを使用してファイル保存
            const fs = require("fs");
            const horuda = path.join(configs.dataRoot, "Omiken");
            const filePath = path.join(horuda, "index.json");

            // Omiken フォルダが存在しない場合は作成
            if (!fs.existsSync(horuda)) {
              fs.mkdirSync(horuda, { recursive: true });
            }

            // JSON データをファイルに書き込み
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`File saved at ${filePath}`);

            // バックアップ
            const backupService = new BackupService("Omiken");
            backupService.createBackup(data);

            // 現在展開しているOmikenを書き換える
            const hogeData = {
              Omiken: data,
              OmikenTypesArray: filterTypes(data.types, data.rules),
            };
            Object.assign(this, hogeData);

            return createSuccessResponse("ファイルが正常に保存されました");
          }

          return createErrorResponse(400, "無効なタイプパラメータ");

        default:
          return createErrorResponse(404, "サポートされていないメソッド");
      }
    } catch (error) {
      console.error("リクエスト処理中にエラーが発生:", error);
      return createErrorResponse(500, "データ処理中にエラーが発生しました");
    }
  },
};

module.exports = plugin;
