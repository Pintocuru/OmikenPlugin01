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
} from "./types/index";

const plugin: OnePlugin = {
  name: "おみくじプラグイン", // プラグイン名
  uid: "OmiKen100-omi", // プラグイン固有の一意のID
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
    AppSettings: {
      nowSlotId: "", // 現在の配信枠のID
      lastTime: 0, // 最後におみくじ機能が実行された時刻
      lastUserId: "", // 最後におみくじを行ったuserId
    },
  },

  /** プラグインの初期化関数
   *
   * @param { dir: string, filepath: string, store: ElectronStore} param
   * dir: plugin directory path
   * filepath: this script's path
   * store: ElectronStore Instance  https://github.com/sindresorhus/electron-store?tab=readme-ov-file#instance
   */
  init({ store }: { store: ElectronStore<StoreType> }, initialData) {
    // データ読み込み
    this.store = store;
    this.Omiken = this.store.get("Omiken");
    this.Visits = this.store.get("Visits");
    this.Games = this.store.get("Games");
    this.AppSettings = this.store.get("AppSettings");

    // ruleTypeごとにOmiken.rulesのデータを分別する
    this.OmikenComment = this.Omiken.rules.filter(
      (rule: RulesType) => rule.ruleType === "comment"
    );
    this.OmikenTimer = this.Omiken.rules.filter(
      (rule: RulesType) => rule.ruleType === "timer"
    );

    // Charas Scripts のプリセットデータを読み込み
    const preset: Record<
      string,
      PresetType
    > = require("./data/preset/index.json");
    this.Charas = {};
    this.Scripts = {};
    // presetを振り分ける
    Object.entries(preset).forEach(([key, value]) => {
      if (value.type === "Chara") {
        this.Charas[key] = value as PresetCharaType;
      } else if (value.type === "Script") {
        this.Scripts[key] = value as PresetScriptType;
      }
    });

    // 初期化時、Gamesのdrawsをすべて0にする
    const Games = this.store.get("Games") as Record<string, GameType>;
    Object.values(Games).forEach((game) => {
      game.draws = 0;
    });
    this.store.set("Games", Games);
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
    const Omiken = this.OmikenComment as OmikenType; // おみくじデータ
    const visit = this.Visits[comment.data.userId] as VisitType; // ユーザーのvisit
    const AppSettings = this.AppSettings as any; // 前回データ
    const serviceId = service.id; // 現在の枠ID
    console.warn(serviceId); // TODO 枠のID取れてるか確認して

    // インスタンスの発行
    const Instance = new CommentInstance(comment, visit, AppSettings);
    try {
      // ユーザーの枠情報が空白または異なるなら、Visitを初期化
      Instance.resetVisit(serviceId);

      // 前回のコメントから3秒以内なら、isRecentのフラグ
      const isRecent = this.ifRecent();

      // おみくじCHECK
      if (!Instance.omikenSelect(Omiken)) return comment;

      // おみくじがあるなら、おみくじを実行
      const ruleId = Instance.getDATA("ruleId") as string;
      const game = this.Games[ruleId] as GameType;
      const result = this.postProcess(
        game,
        Omiken.place,
        this.Charas,
        this.Scripts
      );
    } finally {
      // gameStatsを書き換える
      const newGameStats = Instance.getDATA("gameStats");
      if (JSON.stringify(gameStats) !== JSON.stringify(newGameStats)) {
        gameStats = newGameStats;
      }

      // visitを書き換える
      const userId = Instance.getDATA("userId");
      // 相違がある時のみ更新
      if (userId) {
        const newVisit = Instance.getDATA("visit");
        if (JSON.stringify(userVisits[userId]) !== JSON.stringify(newVisit)) {
          userVisits[userId] = newVisit;
        }
      }
    }
  },

  // クールダウンチェック関数
  ifRecent(cooldownSeconds: number = 3): boolean {
    const now = Date.now();
    const lastTime = this.store.get("AppSettings.lastTime");
    const elapsed = (now - lastTime) / 1000; // 経過秒数
    const isOnCooldown = elapsed <= cooldownSeconds;

    // cooldownSecondsより経過してるなら、lastTimeを更新
    if (!isOnCooldown) this.store.set("AppSettings.lastTime", now);
    return isOnCooldown;
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
