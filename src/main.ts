// src/main.ts
import { handleFilterComment } from "./scripts/CommentCheck";
import { CommentInstance } from "./scripts/CommentInstance";
import {
  OnePlugin,
  BaseComment,
  OmikenType,
  CHARAType,
  defaultStateOmikenType,
  AppStateType,
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
    AppState: {
      Omiken: {
        rules: {},
        rulesOrder: [],
        omikuji: {},
        place: {},
        preferences: {
          omikujiCooldown: 2,
          basicDelay: 0,
          commentDuration: 0,
          BotUserIDname: "",
        },
      },
      CHARA: {},
      Visits: {},
      Games: {},
      nowSlotId: "", // 現在の配信枠のID
      lastCommentTime: 0, // 最後におみくじ機能が実行された時刻
    },
  },

  /** プラグインの初期化関数
   *
   * @param { dir: string, filepath: string, store: ElectronStore} param
   * dir: plugin directory path
   * filepath: this script's path
   * store: ElectronStore Instance  https://github.com/sindresorhus/electron-store?tab=readme-ov-file#instance
   */
  init({ dir, store }, initialData) {
    // AppStateの呼び出し
    this.AppState = store.get("AppState");
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
  async filterComment(comment: BaseComment, service, userData) {
    const AppState = this.AppState as defaultStateOmikenType;
    const Omiken = AppState.Omiken;

    // インスタンスの発行
    const Instance = new CommentInstance(
      comment,
      AppState.Visits[comment.data.userId]
    );
    try {
      // 前回のコメントからn秒以内ならスルーする
      const cooldown = Omiken.preferences.omikujiCooldown;
      if (this.skipIfRecent(cooldown)) return comment;

      // おみくじCHECK
      if (!Instance.omikenSelect(Omiken)) return comment;

      // おみくじがあるなら、おみくじを実行
      const omikujiId = Instance.getDATA("omikujiId");
      const Game = AppState.Games[omikujiId];
      const result = this.postProcess(Game, Omiken.place);



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

    /**

     * Q.
     * handleFilterComment(
     * comment, // コメント
     * this.AppState.Omiken, // おみくじデータ
     * this.AppState.Visits[comment.data.userId].visitData, // 個人データ
     * this.AppState.Games, // おみくじデータ
     * )
     *
     */

    // 前回のコメントからn秒以内ならスルーする
    const cooldown = this.Omiken.preferences.omikujiCooldown;
    if (this.skipIfRecent(cooldown)) {
      return comment;
    } else {
      const result = handleFilterComment(comment, this.AppState.Omiken);
      // resultは、visitData(個別)、Gamesが返る
      if (result.toast) {
        comment.omiken.toast = toast;
      }
      return comment;
    }
  },

  // クールダウンチェック関数
  skipIfRecent(cooldownSeconds: number = 2): boolean {
    const now = Date.now();
    const elapsed = (now - this.AppState.lastOmikujiTime) / 1000; // 経過秒数

    // 時刻を更新
    this.AppState.lastOmikujiTime = now;
    return elapsed <= cooldownSeconds;
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
                  ...this.AppState.Omiken,
                  ...this.AppState.CHARA,
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
                this.AppState.Omiken = data;
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
                const data = JSON.parse(req.body) as CHARAType;
                this.AppState.CHARA = data;
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
