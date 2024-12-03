// src/plugin.ts
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
  OmikujiType,
  PlaceType,
  OnePluginOmiken,
  TimeConfigType,
} from "./types";
import path from "path";

const plugin: OnePlugin = {
  name: "おみくじBOTプラグイン", // プラグイン名
  uid: "OmikenPlugin01", // プラグイン固有の一意のID
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
      defaultFrameId: "", // わんコメの一番上の枠ID
      pluginTime: 0, // プラグインを起動した時刻
      lastTime: 0, // 最後におみくじ機能が実行された時刻
      lastUserId: "", // 最後におみくじを行ったuserId
    },
  },
  // プラグインの初期化
  init({ store }: { store: ElectronStore<StoreType> }, initialData) {
    console.warn("プラグイン初期化開始");

    // データ読み込み
    this.store = store;
    console.warn("ストアの初期化完了: ", { store });

    // 枠情報の更新・初期化
    const defaultFrameId = initialData?.services?.[0]?.id || "";
    this.store.set("TimeConfig", {
      pluginTime: Date.now(),
      defaultFrameId,
      lastTime: 0,
      lastUserId: "",
    });
    console.warn("TimeConfig 初期化完了: ", {
      pluginTime: Date.now(),
      defaultFrameId,
      lastTime: 0,
      lastUserId: "",
    });

    this.initLoadData(); // JSONデータ読み込み
    console.warn("JSONデータの読み込み完了");

    this.initGamesinitialize(); // 初期化時、Gamesのdrawsをすべて0にする
    console.warn("Games の初期化完了");
  },

  // データ読み込み
  initLoadData(): void {
    console.warn("データ読み込み開始");

    // Omikenを外部から読み込み
    const OmikenPath = path.join(__dirname, "data/Omiken/index.json");
    const Omiken = initLoadHelper.loadOmiken(OmikenPath);
    //console.warn("Omiken データ読み込み完了: ", OmikenPath);

    // presetを外部から読み込み
    const presetPath = path.join(__dirname, "data/preset/index.json");
    const { Charas, Scripts } = initLoadHelper.loadPresets(presetPath);
    console.warn("Preset データ読み込み完了: ", presetPath);

    // ストアからデータを読み込み
    const storeData = {
      OmikenOmikuji: Omiken.omikuji,
      OmikenPlace: Omiken.place,
      Visits: this.store.get("Visits", {}) as Record<string, VisitType>,
      Games: this.store.get("Games", {}) as Record<string, GameType>,
      TimeConfig: this.store.get("TimeConfig", {}) as TimeConfigType,
    };
    //console.warn("ストアデータ読み込み完了: ", storeData);

    // rulesは配列に
    const rules = Omiken.rules;
    const rulesOrder = Omiken.rulesOrder;
    //console.warn("Rules データ: ", { rules, rulesOrder });

    // オブジェクトに追加
    Object.assign(
      this,
      storeData,
      initLoadHelper.filterRulesByType(rules, rulesOrder),
      { Charas, Scripts }
    );
    console.warn(
      "RulesArary データ: ",
      initLoadHelper.filterRulesByType(rules, rulesOrder)
    );
    console.warn("データのオブジェクトへの割り当て完了");
  },

  // 初期化時、Gamesのdrawsをすべて0にする
  initGamesinitialize(): void {
    console.warn("Games 初期化開始");

    const Games = this.store.get("Games", {}) as Record<string, GameType>;
    console.warn("現在の Games: ", Games);

    const GamesNew = Object.fromEntries(
      Object.entries(Games).map(([key, game]) => [key, { ...game, draws: 0 }])
    );
    console.warn("初期化された Games: ", GamesNew);

    this.store.set("Games", GamesNew);
    console.warn("Games のストアへの保存完了");
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
    if (comment.data.userId === "FirstCounter") {
      return comment
    };

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
      const isOmikuji = Instance.omikenSelect(rulesArray, omikujis);
      console.warn("おみくじ選択結果: ", isOmikuji);

      if (!isOmikuji) {
        console.warn("おみくじ未選択のため終了: ", comment);
        return comment;
      }

      // おみくじがあるなら、おみくじを実行
      console.warn("おみくじ処理を開始");
      const processResult = await Instance.omikujiProcess(
        this.Games,
        places,
        this.Charas,
        this.Scripts
      );
      console.warn("おみくじ処理完了: ", processResult);
      return processResult;
    } finally {
      const ruleId = Instance.getDATA("ruleId") as string;
      console.warn("ルールID: ", ruleId);

      // おみくじを実行した場合
      if (ruleId) {
        // lastTime と lastUserId を更新
        this.store.set("TimeConfig.lastTime", Date.now());
        this.store.set("TimeConfig.lastUserId", userId);
        console.warn("TimeConfig 更新: ", {
          lastTime: Date.now(),
          lastUserId: userId,
        });

        // 相違がある時、gameを書き換える
        const game = this.Games[ruleId] as GameType;
        const gameNew = Instance.getDATA("game") as GameType;
        if (JSON.stringify(game) !== JSON.stringify(gameNew)) {
          this.store.set(`Games.${ruleId}`, gameNew);
          console.warn("Game 更新: ", { old: game, new: gameNew });
        }
      }

      // 相違がある時、visitを書き換える
      const visitNew = Instance.getDATA("visit") as VisitType;
      if (JSON.stringify(visit) !== JSON.stringify(visitNew)) {
        this.store.set(`Visits.${userId}`, visitNew);
        console.warn("Visit 更新: ", { old: visit, new: visitNew });
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

class initLoadHelper {
  static loadPresets(presetPath: string) {
    try {
      const preset = require(presetPath) as PresetType;
      return {
        Charas: Object.fromEntries(
          Object.entries(preset).filter(([_, value]) => value.type === "Chara")
        ),
        Scripts: Object.fromEntries(
          Object.entries(preset).filter(([_, value]) => value.type === "Script")
        ),
      };
    } catch (error) {
      console.error("プリセットの読み込みに失敗:", error);
      return { Charas: {}, Scripts: {} };
    }
  }

  static loadOmiken(presetPath: string) {
    try {
      const Omiken = require(presetPath) as OmikenType;
      return Omiken;
    } catch (error) {
      console.error("プリセットの読み込みに失敗:", error);
      return {} as OmikenType;
    }
  }

  static filterRulesByType(
    rules: Record<string, RulesType>,
    rulesOrder: string[]
  ) {
    return {
      OmikenRulesComment: rulesOrder
        .map((key) => rules[key])
        .filter((rule) => rule.ruleType === "comment"),
      OmikenRulesTimer: rulesOrder
        .map((key) => rules[key])
        .filter((rule) => rule.ruleType === "timer"),
    };
  }
}
export { OnePluginOmiken };

