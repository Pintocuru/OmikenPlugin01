// src/index.ts

// 必要な型定義をインポート
import { OnePlugin, Comment, Service, UserData, Store, PluginInitParams, PluginRequest } from './types';

// プラグインオブジェクトの定義
const plugin: OnePlugin = {
  // プラグインの基本情報
  name: 'おみくじプラグイン', // プラグイン名（必須）
  uid: 'OmiKen999-CORE', // プラグイン固有の一意のID（必須）
  version: '0.0.1', // プラグインのバージョン番号（必須）
  author: 'Pintocuru', // 開発者名（必須）
  url: 'https://onecomme.com', // ドキュメントやサポートページのURL（任意）

  // プラグインで使用するデータタイプの指定（必須）
  permissions: ['filter.comment'],
  // "filter.comment" コメントデータ
  // "waitingList" 参加者管理

  // プラグインの初期状態
  defaultState: {
    count: 0  // コメントカウンターの初期値
    // 他の初期状態も必要に応じて追加可能
    // callPlayers: true,
    // joinedPlayers: true,
  },

  // プラグインの初期化関数
  // プラグインが有効化された際に実行される
  // 引数のstoreオブジェクトを使い、データの保存と永続化が可能
  init({ store }: PluginInitParams, initialData: any) {
    (this as any).store = store;  // storeオブジェクトをプラグインに保存
    // 初期データの処理が必要な場合は以下のように追加可能
    // const { newWaitingMap, newPlayerMap } = this.parseOrders(initialData.waitingList);
    // this.waitings = newWaitingMap;
    // this.players = newPlayerMap;
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
    // storeから現在のカウント値を取得し、コメントごとに1増加させる
    const store = (this as any).store as Store;
    const currentScore = store.get('count') || 0;
    const newScore = currentScore + 1;
    store.set('count', newScore);  // 更新されたカウント値を保存

    return comment;  // コメントをそのまま返す（加工なし）
  },

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

};

// プラグインオブジェクトをエクスポートし、わんコメが読み込めるようにする
module.exports = plugin;
