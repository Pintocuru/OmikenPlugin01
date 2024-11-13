// src/main.ts
import { OnePlugin, BaseComment, OmikenType } from "./types/types";

const plugin: OnePlugin = {
  name: "おみくじプラグイン", // プラグイン名
  uid: "OmiKen100-omi", // プラグイン固有の一意のID
  version: "0.0.6", // プラグインのバージョン番号
  author: "Pintocuru", // 開発者名
  url: "https://onecomme.com", // サポートページのURL
  permissions: ["filter.comment"], // データタイプ

  // プラグインの初期状態
  defaultState: {
    defaultRules: [
      {
        name: "おみくじ",
        modes: "none",
        modeSelect: ["none"],
        switch: 1,
        matchExact: ["🥠"],
        matchStartsWith: ["おみくじ", "御神籤", "omikuji"],
        matchIncludes: ["【おみくじ】"],
      },
    ],
    rules: [
      {
        name: "おみくじ",
        modes: "none",
        modeSelect: ["none"],
        switch: 1,
        matchExact: ["🥠"],
        matchStartsWith: ["おみくじ", "御神籤", "omikuji"],
        matchIncludes: ["【おみくじ】"],
      },
    ],
    botMessage: {
      omikuji: [
        {
          name: "大吉",
          weight: 18,
          threshold: {
            type: "none",
            value: 1000,
            comparison: 0,
          },
          message: [
            {
              botKey: 0,
              iconKey: "joy02",
              delaySeconds: 1,
              content: "<<user>>さんの運勢は【大吉】<<random1>>",
            },
          ],
          party: [{ delaySeconds: 1, content: "!レベルアップ" }],
        },
      ],
      random: [
        {
          placeholder: "random1",
          weight: 11,
          group: 0,
          content:
            "人との縁が幸運を呼び込みそう。感謝の気持ちを忘れないことが大事よ。",
        },
        {
          placeholder: "random1",
          weight: 11,
          group: 0,
          content: "健康運が特に好調ね。心身ともに充実した日々になるわ。",
        },
        {
          placeholder: "random1",
          weight: 11,
          group: 0,
          content:
            "努力が実を結び、幸運が訪れるって。積極的に行動すると良いことがあるわ。",
        },
        {
          placeholder: "random1",
          weight: 11,
          group: 0,
          content:
            "新しい挑戦が成功をもたらす予感。勇気を出して一歩踏み出してみて。",
        },
        {
          placeholder: "random1",
          weight: 11,
          group: 0,
          content: "良い知らせが届くかも。ポジティブな気持ちを持ち続けてね。",
        },
        {
          placeholder: "random1",
          weight: 11,
          group: 0,
          content: "困難な状況も乗り越えられるわ。自信を持って進んで大丈夫よ。",
        },
      ],
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
    // 適用する条件
    this.rules = store.get("rules");
    // おみくじ内容
    this.botMessage = store.get("botMessage");
    // 外部関数呼び出し
    this.func = require("../scripts/omikujiUtils");
    // 外部JSON // TODO 書き方とか呼び出し方とかは後で生成AIに任せる
    this.Omiken = require("./state.json");
    // 外部関数:CommentCheck
    this.FuncCommentCheck = require("./scripts/CommentCheck");
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
    // インスタンス化して使用
    const comment = new CommentFilter(
      rules,
      {
        isSkipOmikuji,
        checkOverlapping,
        wordCheck,
      },
      functionOmikuji
    );

    return comment;

    // comment.omikenDataがなければ空のオブジェクトを生成
    if (!comment.omikenData) comment.omikenData = {};
    // 処理スキップcheck
    if (this.func.isSkipOmikuji(comment)) return comment;
    // 重複チェック
    if (comment.omikenData.isOverlapping === undefined) {
      if (await this.func.checkOverlapping(comment)) {
        comment.omikenData.isOverlapping = true;
        return comment;
      }
    }

    // おみくじチェック
    for (const rule of this.rules) {
      const result = this.func.wordCheck(comment, rule);
      // おみくじ適用可能なら、おみくじ実行
      if (result && result.isApplicable) {
        comment.omikenData.omikujiName = result.omikujiName;
        // おみくじを非同期で実行し、結果を待たずに次の処理に進む
        this.functionOmikuji(
          comment.data.displayName,
          rule.modes,
          comment
        ).catch((error) => {
          console.error("おみくじ実行中にエラーが発生しました:", error);
        });
        break;
      }
    }

    return comment;
  },

  // おみくじ
  async functionOmikuji(displayName, modes, comment) {
    // processBotMessage にデータを渡す(渡せば投稿までやってくれる)
    this.func.processBotMessage(displayName, this.botMessage);
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
            //
            case "editor":
              resolve({
                code: 200,
                response: JSON.stringify({ ...this.rules, ...this.botMessage }),
              });
              break;
            // ジェネレーター用
            case "display":
              resolve({
                code: 200,
                response: JSON.stringify({ score: this.score }),
              });
              break;
            default:
              resolve({
                code: 404,
                response: "Not Found",
              });
          }
          break;
        case "POST":
          // data には this.rules, this.botMessage を入れる
          const data = JSON.parse(req.body);
          resolve({
            code: 200,
            response: "Data updated successfully",
          });
          break;
        case "PUT":
          // PUTリクエストの処理
          break;
        case "DELETE":
          // DELETEリクエストの処理
          break;
        default:
          resolve({
            code: 404,
            response: "",
          });
      }
    });
  },
};

module.exports = plugin;
