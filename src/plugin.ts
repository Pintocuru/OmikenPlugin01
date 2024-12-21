// src/plugin.ts
// プラグインの型定義 : https://types.onecomme.com/interfaces/types_Plugin.OnePlugin
import { StoreType, VisitType, GameType, StoreAllType } from './types';
import { configs } from './config';
import { CommentInstance } from './Modules/CommentInstance';
import { InitDataLoader } from './Modules/InitDataLoader';
import { RequestHandler } from './Modules/ApiRequest';
import { OnePlugin, PluginResponse } from '@onecomme.com/onesdk/types/Plugin';
import { Comment } from '@onecomme.com/onesdk/types/Comment';
import ElectronStore from 'electron-store';

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
  Omiken:{},
  Visits: {},
  Games: {},
 },
 // プラグインの初期化
 init(this: StoreAllType, { store }: { store: ElectronStore<StoreType> }) {
  this.store = store;

  // JSONからロード
  const loader = new InitDataLoader(store);
  // 初期化してthisに上書き
  Object.assign(this, loader.loadPluginData());
 },

 // filterComment:コメントを加工・変更する
 async filterComment(this: StoreAllType, comment, service, userData) {
  // 自身のプラグインの投稿はおみくじを行わない
  if (comment.data.userId === configs.botUserId) {
   // isOwner(isSilent) なら読み上げを行わない
   if (comment.data.isOwner) comment.data.speechText = ' ';
   return comment;
  }

  // 初期化
  const Omiken = this.Omiken;
  const rulesArray = this.OmikenTypesArray.comment;
  const userId = comment.data.userId;

  // TimeConfig.lcをインクリメント
  this.store.set('TimeConfig.lc', ++this.TimeConfig.lc);

  // インスタンスの発行
  const Instance = new CommentInstance(comment, this.Visits?.[userId], this.TimeConfig, userData);
  try {
   // おみくじCHECK
   const isOmikuji = Instance.omikenSelect(rulesArray, Omiken.omikujis);
   if (!isOmikuji) return comment;

   // おみくじがあるなら、おみくじを実行
   const processResult = await Instance.omikujiProcess(this.Games, Omiken.places, this.Charas, this.Scripts);
   return processResult;
  } finally {
   const ruleId = Instance.getDATA('ruleId') as string;
   console.log('ルールID: ', ruleId);

   // おみくじを実行した場合
   if (ruleId) {
    // lastTime と lastUserId を更新
    this.store.set('TimeConfig.lastTime', Date.now());
    this.store.set('TimeConfig.lastUserId', userId);

    // gameを書き換える
    const gameNew = Instance.getDATA('game') as GameType;
    this.store.set(`Games.${ruleId}`, gameNew);
    this.Games[ruleId] = gameNew;
    console.warn('Game 更新: ', gameNew);
   }

   // visitを書き換える
   const visitNew = Instance.getDATA('visit') as VisitType;
   this.Visits[userId] = visitNew;
   this.store.set(`Visits.${userId}`, visitNew);
   console.warn('Visit 更新: ', visitNew);
  }
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
