// src/plugin.ts
// プラグインの型定義 : https://types.onecomme.com/interfaces/types_Plugin.OnePlugin
import { StoreType, StoreAllType, StoreApiType, PluginUpdateData } from '@type';
import { configs } from '@/config';
import { InitDataLoader, startReadyCheck, timerSetup } from '@/Modules/InitDataLoader';
import { RequestHandler } from '@/Modules/ApiRequest';
import { TaskCommentInstance } from '@/Modules/TaskCommentInstance';
import { postErrorMessage } from '@/Modules/PostOmikuji';
import ElectronStore from 'electron-store';
import { Comment } from '@onecomme.com/onesdk/types/Comment';
import { UserNameData } from '@onecomme.com/onesdk/types/UserData';
import { OnePlugin, PluginResponse } from '@onecomme.com/onesdk/types/Plugin';

const plugin: OnePlugin = {
 name: 'おみくじBOTプラグイン', // プラグイン名
 uid: configs.PLUGIN_UID, // プラグイン固有の一意のID
 version: '0.0.10', // プラグインのバージョン番号
 author: 'Pintocuru', // 開発者名
 url: 'https://onecomme.com', // サポートページのURL
 // services:枠情報,filter.comment:コメント
 permissions: ['services', 'filter.comment'],

 // プラグインの初期状態
 defaultState: {
  Omiken: {},
  Visits: {},
  Games: {}
 },
 // プラグインの初期化
 async init(this: StoreAllType, { store }: { store: ElectronStore<StoreType> }) {
  try {
   // わんコメの枠データが取得できる(=セットアップ完了)まで待つ
   await startReadyCheck();

   // 初期化してthisに上書き
   const loader = new InitDataLoader(store);
   Object.assign(this, loader.loadPluginData());
   await timerSetup(this); // timerのセットアップ

   // プラグインの起動メッセージ
   postErrorMessage('おみくじBOTプラグインが起動したよ', 'info');
  } catch (error) {
   console.error('Failed to initialize due to timeout or API error:', error);
   return;
  }
 },

 // filterComment:コメントを加工・変更する
 async filterComment(this: StoreAllType, comment, service, userData) {
  // 自身のプラグインの投稿はおみくじを行わない
  if (comment.data.userId === configs.botUserId) {
   // isOwner(isSilent) なら読み上げを行わない
   if (comment.data.isOwner) comment.data.speechText = ' ';
  } else {
   // 残りの処理を非同期で実行
   this.filterCommentProcess(comment, userData);
  }
  return comment;
 },

 // filterCommentProcess:BOT処理
 async filterCommentProcess(this: StoreAllType, comment: Comment, userData: UserNameData) {
  try {
   this.TimeConfig.lc++; // TimeConfig.lcをインクリメント

   // インスタンスの発行
   const Instance = new TaskCommentInstance(this, comment, userData);
   // ユーザー情報の更新
   this.Visits[comment.data.userId] = Instance.returnVisit();

   // 5秒以上経過したコメントはおみくじの対象外
   const isRecent = Date.now() < new Date(comment.data.timestamp).getTime() + 5000;
   if (!isRecent) return

   // おみくじの処理
   const result: PluginUpdateData = await Instance.process();
   Object.entries(result).forEach(([key, value]) => {
    if (value && this[key]) this[key] = value;
   });
  } catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('Error in background processing:', errorMessage);
  postErrorMessage('処理にエラーが起きたみたい。' + errorMessage);
  }
 },

 // 終了時の処理
 destroy(this: StoreAllType): void {
  // タイマーが存在する場合のみ破棄
  if (this.timerSelector) {
   this.timerSelector.destroy();
   this.timerSelector = undefined;
  }
 },

 // called when a request is made to the plugin-specific
 async request(this: StoreAllType, req): Promise<PluginResponse> {
  // データ型のマッピング
  const responseMap: StoreApiType = {
   Omiken: this.Omiken,
   Presets: this.Presets,
   Charas: this.Charas,
   Scripts: this.Scripts,
   Visits: this.Visits,
   Games: this.Games
  };

  const handler = new RequestHandler(responseMap);
  const result = await handler.handleRequest(req);
  Object.assign(this, result.data);
  return result.response;
 }
};

module.exports = plugin;
