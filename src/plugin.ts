// src/plugin.ts
// プラグインの型定義 : https://types.onecomme.com/interfaces/types_Plugin.OnePlugin
import { StoreType, VisitType, GameType, StoreAllType } from './types';
import { configs } from './config';
import { InitDataLoader } from './Modules/InitDataLoader';
import { RequestHandler } from './Modules/ApiRequest';
import { OnePlugin, PluginResponse } from '@onecomme.com/onesdk/types/Plugin';
import { Comment } from '@onecomme.com/onesdk/types/Comment';
import ElectronStore from 'electron-store';
import { TaskCommentInstance } from './Modules/TaskCommentInstance';
import { OmikujiSelectorFactory } from './Modules/TaskOmikujiSelect';

const plugin: OnePlugin = {
 name: 'おみくじBOTプラグイン', // プラグイン名
 uid: configs.PLUGIN_UID, // プラグイン固有の一意のID
 version: '0.0.8', // プラグインのバージョン番号
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
 init(this: StoreAllType, { store }: { store: ElectronStore<StoreType> }) {
  this.store = store;

  // JSONからロード
  const loader = new InitDataLoader(store);
  // 初期化してthisに上書き
  Object.assign(this, loader.loadPluginData());

  // Timerインスタンスを生成
  const timerSelector = OmikujiSelectorFactory.create('timer');
  timerSelector.selectOmikuji(this.OmikenTypesArray.timer, this.Omiken.omikujis);
 },

 // filterComment:コメントを加工・変更する
 async filterComment(this: StoreAllType, comment, service, userData) {
  // 自身のプラグインの投稿はおみくじを行わない
  if (comment.data.userId === configs.botUserId) {
   // isOwner(isSilent) なら読み上げを行わない
   if (comment.data.isOwner) comment.data.speechText = ' ';
   return comment;
  }

  // TimeConfig.lcをインクリメント
  this.TimeConfig.lc++;

  // インスタンスの発行
  const Instance = new TaskCommentInstance(this, comment, userData);
  // ユーザー情報の更新
  this.Visits[comment.data.userId] = Instance.returnVisit();

  // おみくじの処理
  const result = await Instance.process();
  if (result.Games) this.Games = result.Games;
  if (result.Visits) this.Visits = result.Visits;
  if (result.TimeConfig) this.TimeConfig = result.TimeConfig;
 },

 // called when a request is made to the plugin-specific
 async request(this: StoreAllType, req): Promise<PluginResponse> {
  // データ型のマッピング
  const responseMap: StoreAllType = {
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

  // * 将来、Gamesをエディターで編集できるようになったら、
  // * this.store.set を使いたい
  return result.response;
 }
};

module.exports = plugin;
