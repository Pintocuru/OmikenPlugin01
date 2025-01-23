// src/plugin.ts
// プラグインの型定義 : https://types.onecomme.com/interfaces/types_Plugin.OnePlugin
import { StoreType, StoreAllType, StoreApiType } from '@type';
import { InitDataLoader, startReadyCheck, timerSetup } from '@core/InitDataLoader';
import { commentTreatment } from '@core/commentTreatment';
import { systemMessage } from '@core/ErrorHandler';
import { RequestHandler } from '@api/ApiRequest';
import { CommentBotProcessor } from '@tasks/CommentBotProcessor';
import { SETTINGS } from '@/Modules/settings';
import ElectronStore from 'electron-store';
import { Comment } from '@onecomme.com/onesdk/types/Comment';
import { UserNameData } from '@onecomme.com/onesdk/types/UserData';
import { OnePlugin, PluginResponse } from '@onecomme.com/onesdk/types/Plugin';

const plugin: OnePlugin = {
 name: 'おみくじBOTプラグイン', // プラグイン名
 uid: SETTINGS.PLUGIN_UID, // プラグイン固有の一意のID
 version: '0.0.13', // プラグインのバージョン番号
 author: 'Pintocuru', // 開発者名
 url: '', // サポートページのURL
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

   // 初期化
   Object.assign(this, new InitDataLoader(store).load());
   // timerのセットアップ
   await timerSetup(this);

   // プラグインの起動メッセージ
   systemMessage('info', `【おみくじBOTプラグイン】が起動したよ`);
  } catch (e) {
   systemMessage('error', `【おみくじBOTプラグイン】の初期化に失敗`, e);
   throw new Error();
  }
 },

 // filterComment:コメントを加工・変更する
 async filterComment(this: StoreAllType, comment, service, userData) {
  // 自身のプラグインの投稿（botの投稿）はおみくじを行わない
  if (comment.data.userId === SETTINGS.BOT_USER_ID) {
   return commentTreatment(comment);
  }
  // おみくじBOT処理
  this.filterCommentProcess(comment, userData);
  return comment;
 },

 // filterCommentProcess:おみくじBOT処理
 async filterCommentProcess(this: StoreAllType, comment: Comment, userData: UserNameData) {
  try {
   const COMMENT_EXPIRY_MS = 5000; // 5秒以上経過したコメントはおみくじの対象外
   this.TimeConfig.lc++; // TimeConfig.lcをインクリメント

   // インスタンスの発行
   const botProcessor = new CommentBotProcessor(this, comment, userData);
   // ユーザー情報の更新
   this.Visits[comment.data.userId] = botProcessor.returnVisit();

   // 期限切れコメントの早期リターン
   const commentAge = Date.now() - new Date(comment.data.timestamp).getTime();
   if (commentAge > COMMENT_EXPIRY_MS) return;

   // おみくじの処理
   const result = await botProcessor.process();
   Object.entries(result).forEach(([key, value]) => {
    if (value && this[key]) this[key] = value;
   });
  } catch (e) {
   systemMessage('error', `おみくじBOTの処理ができませんでした`, e);
   throw new Error();
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

 // Rest APIを使った送受信
 async request(this: StoreAllType, req): Promise<PluginResponse> {
  // データ型のマッピング
  const responseMap: StoreApiType = {
   store: this.store,
   Omiken: this.Omiken,
   Presets: this.Presets,
   Charas: this.Charas,
   Scripts: this.Scripts,
   Visits: this.Visits,
   Games: this.Games
  };

  const result = await new RequestHandler(responseMap).request(req);
  if (result.data) Object.assign(this, result.data);
  return result.response;
 }
};

module.exports = plugin;
