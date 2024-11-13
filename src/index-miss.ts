// src/index.ts

import { OnePlugin, Comment, Service, UserData, Store, PluginInitParams,  PluginRequest } from './types';
const path = require('path');

// 環境に応じてomikujiUtils.jsのパスを動的に解決
const isTest = process.env.NODE_ENV === 'test';
const parentDir = isTest ? path.resolve(__dirname, '../scripts') : path.resolve(__dirname, '../');
const omikujiUtilsPath = path.join(parentDir, 'omikujiUtils.js');
const { checkOverlapping, wordCheck } = require(omikujiUtilsPath);


// プラグインオブジェクトの定義 CommonJS
const plugin = {
  // プラグインの基本情報
  name: 'おみくじプラグイン22222', // プラグイン名（必須）
  uid: 'OmiKen100-test', // プラグイン固有の一意のID（必須）
  version: '0.0.1', // プラグインのバージョン番号（必須）
  author: 'Pintocuru', // 開発者名（必須）
  url: 'https://onecomme.com', // ドキュメントやサポートページのURL（任意）


  // プラグインで使用するデータタイプの指定（必須）
  permissions: ['filter.comment'],
  // "filter.comment" コメントデータ
  // "waitingList" 参加者管理
  
  // プラグインの初期状態
  defaultState: {
    rules: [
      {
        name: "おみくじ",
        modes: 0,
        switch: true,
        isModerator: false,
        isMember: false,
        matchExact: ["🥠"],
        matchStartsWith: ["おみくじ", "御神籤", "omikuji"],
        matchIncludes: ["【おみくじ】"],
      },
    ],
    omikuji: [
      {
        weight: 18,
        botKey: 0,
        iconKey: "joy02",
        party: [["!レベルアップ", 1]],
        message: [["<<user>>さんの運勢は【大吉】<<random>>", 1]],
        random: [
          "人との縁が幸運を呼び込みそう。感謝の気持ちを忘れないことが大事よ。",
          "健康運が特に好調ね。心身ともに充実した日々になるわ。",
          "努力が実を結び、幸運が訪れるって。積極的に行動すると良いことがあるわ。",
          "新しい挑戦が成功をもたらす予感。勇気を出して一歩踏み出してみて。",
          "良い知らせが届くかも。ポジティブな気持ちを持ち続けてね。",
          "困難な状況も乗り越えられるわ。自信を持って進んで大丈夫よ。"
        ],
        toast: [["toast", 1]],
        speech: [["speech", 1]],
      },
    ],
  },

  // プラグインの初期化関数
  init({ store }: PluginInitParams, initialData: any) {
    console.log('Initializing plugin...');

    // storeが正しく渡されているか確認
    if (!store) {
      console.error('Store is not provided');
      return; // エラー処理
    }

    (this as any).store = store; // storeを保存
    console.log('Store has been saved:', this.store);

    // storeが未定義の場合は初期化
    if (!this.store) {
      this.store = {};
    }

    // ルールを取得してストアに保存
    const rules = store.get('rules') || []; // デフォルト値を空配列にする
    console.log('Fetched rules from store:', rules);
    this.store.rules = rules; // ストアにルールを保存
    console.log('Rules have been saved to store:', this.store.rules);
  },

  /**
   * コメントフィルタ関数
   * コメント受信時に実行され、コメントを加工・変更できます
   * 'filter.comment' 権限が必要
   *
   * @param {Comment} comment - 受信したコメントデータ
   * @param {Service} service - コメントが投稿されたサービス情報
   * @param {UserData | null} userData - コメント投稿者のユーザーデータ（ない場合もあり）
   * @returns Promise<Comment | false> - コメントデータをそのまま返すか、falseでコメントを無効化
   */
  async filterComment(comment: Comment, service: Service, userData: UserData): Promise<Comment | false> {
    console.log('Filtering comment:', comment);

    // store呼び出し
    const store = (this as any).store as Store;
    const rules = store.get('rules') || [];
    console.log('Current rules:', rules);

    // comment.omikenDataがなければ生成
    if (!comment.omikenData) {
      comment.omikenData = {};
    }

    // 重複チェック
    const isOverlapping = await checkOverlapping(comment);
    comment.omikenData.isOverlapping = isOverlapping;
    console.log('Is overlapping:', isOverlapping);

    // おみくじチェック
    for (const rule of rules) {
      const result = wordCheck(comment, rule, isOverlapping);
      console.log('Checking rule:', rule, 'Result:', result);
      if (result) {
        const omikujiResult = this.functionExecutor(comment.data.displayName, rule.modes, comment);
        console.log('Omikuji result:', omikujiResult);
        Object.assign(comment.omikenData, omikujiResult);
        break;
      }
    }

    console.log('Final comment data:', comment);
    return comment;
  },


  functionExecutor(user: string, mode: string, comment: Comment) {
    // おみくじの結果を生成するロジックをここに実装
    return {
      message: `結果です！`,
      party: `!結果`,
      toast: `おみくじが実行されました`,
    };
  },

  /**
   * プラグイン用のREST APIリクエストを処理する関数
   * @param {PluginRequest} req - リクエストデータ
   * @returns Promise<{ code: number, response: Object | Array }>
   */
  async request(req: PluginRequest) {
    switch (req.method) {
      case 'GET':
        return {
          code: 200,
          response: { ...this.store.store }
        };
      case 'POST': {
        const data = JSON.parse(req.body);
        this.store.set('omikuji', data.omikuji); 
        return {
          code: 200,
          response: data
        };
      }
    }
    return {
      code: 404,
      response: {}
    };
  },

  // よくわからないオマケ（ないとエラー）
  store: undefined
};

// エクスポート
module.exports = {
  plugin, // ここでpluginをエクスポート
};



/**
     * プラグインが無効化された際に実行される
     * @optional
     */
    // destroy() {
    //   // プラグインの終了時に行いたい処理を記述
    // },
    /**
     * 他のイベント受信時に実行される購読関数
     * @optional
     * @param {string} type - イベントの種類
     * @param {...any[]} args - イベントに渡されるデータ
     */
    // subscribe(type, ...args) {
    //   switch (type) {
    //     case 'waitingList': {
    //       const newWaitingList = args[0];
    //       const { newOrders, newPlayers, newWaitingMap, newPlayerMap } = this.parseOrders(newWaitingList);
    //       this.waitings = newWaitingMap;
    //       this.players = newPlayerMap;
    //     }
    //   }
    // },
    /**
     * プラグイン用のREST APIリクエストを処理する関数
     * @param {PluginRequest} req - リクエストデータ
     * @returns Promise<{ code: number, response: Object | Array }>
     */
    // async request(req: PluginRequest) {
    //   switch (req.method) {
    //     case 'GET':
    //       return {
    //         code: 200,
    //         response: { ...this.store.store }
    //       };
    //     case 'PUT': {
    //       const data = JSON.parse(req.body);
    //       this.store.store = data;
    //       return {
    //         code: 200,
    //         response: data
    //       };
    //     }
    //   }
    //   return {
    //     code: 404,
    //     response: {}
    //   };
    // },
    /**
     * 待機リストやプレイヤー情報を解析する関数
     * 将来、待機リストやプレイヤーリストの管理に使用することができます
     * @param {any[]} newWaitingList - 新しい待機リスト
     * @returns {Object} - 待機リストとプレイヤーリストのマップ
     */
    // parseOrders(newWaitingList: any[]) {
    //   const newOrders: any[] = [];
    //   const newPlayers: any[] = [];
    //   const newWaitingMap = new Map();
    //   const newPlayerMap = new Map();
    //   newWaitingList.forEach((item) => {
    //     newWaitingMap.set(item.id, item);
    //     if (!this.waitings.has(item.id)) {
    //       newOrders.push(item);
    //     }
    //     if (item.playing) {
    //       newPlayerMap.set(item.id, item);
    //       if (!this.players.has(item.id)) {
    //         newPlayers.push(item);
    //       }
    //     }
    //   });
    //   return { newOrders, newPlayers, newWaitingMap, newPlayerMap };
    // },
  
/**
 * プラグインが無効化された際に実行される
 * @optional
 */
// destroy() {
//   // プラグインの終了時に行いたい処理を記述
// },
/**
 * 他のイベント受信時に実行される購読関数
 * @optional
 * @param {string} type - イベントの種類
 * @param {...any[]} args - イベントに渡されるデータ
 */
// subscribe(type, ...args) {
//   switch (type) {
//     case 'waitingList': {
//       const newWaitingList = args[0];
//       const { newOrders, newPlayers, newWaitingMap, newPlayerMap } = this.parseOrders(newWaitingList);
//       this.waitings = newWaitingMap;
//       this.players = newPlayerMap;
//     }
//   }
// },
/**
 * プラグイン用のREST APIリクエストを処理する関数
 * @param {PluginRequest} req - リクエストデータ
 * @returns Promise<{ code: number, response: Object | Array }>
 */
// async request(req: PluginRequest) {
//   switch (req.method) {
//     case 'GET':
//       return {
//         code: 200,
//         response: { ...this.store.store }
//       };
//     case 'PUT': {
//       const data = JSON.parse(req.body);
//       this.store.store = data;
//       return {
//         code: 200,
//         response: data
//       };
//     }
//   }
//   return {
//     code: 404,
//     response: {}
//   };
// },
/**
 * 待機リストやプレイヤー情報を解析する関数
 * 将来、待機リストやプレイヤーリストの管理に使用することができます
 * @param {any[]} newWaitingList - 新しい待機リスト
 * @returns {Object} - 待機リストとプレイヤーリストのマップ
 */
// parseOrders(newWaitingList: any[]) {
//   const newOrders: any[] = [];
//   const newPlayers: any[] = [];
//   const newWaitingMap = new Map();
//   const newPlayerMap = new Map();
//   newWaitingList.forEach((item) => {
//     newWaitingMap.set(item.id, item);
//     if (!this.waitings.has(item.id)) {
//       newOrders.push(item);
//     }
//     if (item.playing) {
//       newPlayerMap.set(item.id, item);
//       if (!this.players.has(item.id)) {
//         newPlayers.push(item);
//       }
//     }
//   });
//   return { newOrders, newPlayers, newWaitingMap, newPlayerMap };
// },