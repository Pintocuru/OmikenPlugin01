// src/scripts/TaskCommentInstance.ts

import { UserNameData } from '@onecomme.com/onesdk/types/UserData';
import {
 StoreMainType,
 StoreType,
 TimeConfigType,
 VisitType
} from '../../src/types/index';
import { Comment } from '@onecomme.com/onesdk/types/Comment';
import { OmikujiSelectorFactory } from './TaskOmikujiSelect';
import { OmikujiProcessor } from './TaskOmikujiProcess';

//////////////////////////////////
// コメントのインスタンス化
//////////////////////////////////
export class TaskCommentInstance {
 private storeAll: StoreMainType;
 private comment: Comment;
 private TimeConfig: TimeConfigType;
 private visit: VisitType;
 private userData: UserNameData;
 private isFirstVisit: boolean;
 private isTester: boolean;

 // 初期化
 constructor(storeAll: StoreMainType, comment: Comment, userData: UserNameData) {
  this.storeAll = storeAll;
  this.comment = comment;
  this.TimeConfig = storeAll.TimeConfig;

  this.userData = userData;

  // ユーザーの枠情報が空白または異なるなら、Visitを初期化
  this.resetVisit();
  // commentに擬似的なmetaデータを付与
  this.thisComment();

  // 更新したVisitとTimeConfigをstoreAllに保存
  this.storeAll.Visits[this.comment.data.userId] = this.visit;
  this.storeAll.TimeConfig = this.TimeConfig;
 }

 // ユーザーの枠情報が空白または異なるなら、Visitを初期化
 private resetVisit() {
  // ユーザーのvisit初期化・更新
  const visit = this.storeAll.Visits[this.comment.data.userId];
  const { userId, name } = this.comment.data;
  // visit初期化・更新
  this.visit = {
   ...visit,
   status: visit.status || '',
   lastPluginTime: visit.lastPluginTime || 0,
   round: visit.round || 0,
   visitData: visit.visitData || {},
   name,
   userId
  };

  // pluginTimeが現在の枠と同じなら、2回目以降のコメント
  const pluginTime = this.TimeConfig.pluginTime;
  if (this.visit.lastPluginTime === pluginTime) {
   this.isFirstVisit = false;
  } else {
   // 1回目のコメントなら、roundの回数を増やし、statusを空白にする
   this.visit.round++;
   this.visit.lastPluginTime = pluginTime;
   this.isFirstVisit = true;
   this.visit.status = '';
   // visitData内のdrawsをリセット
   Object.values(this.visit.visitData).forEach((data) => {
    data.draws = 0;
   });
  }
 }

 // コメントの前処理
 private thisComment() {
  // コメントテスターであればtrue
  this.isTester = this.comment.id === 'COMMENT_TESTER';

  // 擬似メタデータ
  // メタデータはプラグインの解決後に生成される仕様です
  this.comment.meta = this.isTester
   ? // コメントテスター用
     { interval: 999999, tc: 10, no: 2, lc: 2 }
   : {
      interval: this.userData.interval || 0,
      tc: this.userData.tc + 1 || 1, // カウント前なのでインクリメント
      lc: this.TimeConfig.lc, // プラグインが起動してからカウントしたコメント数
      no: this.storeAll.Visits[this.comment.data.userId].round, // (仕様とは異なる)round:コメントした枠数
      free: !!this.isFirstVisit // (仕様とは異なる)初回かどうか
     };

  // ギフト価格の通貨変換(えっ、1ドル100円ですか?)
  if (this.comment.data && 'unit' in this.comment.data) {
   if (this.comment.data.unit === '$') {
    this.comment.data.price *= 100;
    this.comment.data.unit = '¥';
   }
  }
 }

 // ユーザー情報の更新
 returnVisit(): VisitType {
  this.storeAll.store.set(`Visits.${this.comment.data.userId}`, this.visit);
  return this.visit;
 }

 // おみくじの処理
 async process(): Promise<Partial<StoreType>> {
  // コメントモードでの使用
  const commentSelector = OmikujiSelectorFactory.create('comment', {
   comment: this.comment,
   visit: this.visit,
   timeConfig: this.TimeConfig
  });

  // commentのrules からおみくじを抽選
  const omikujiSelect = commentSelector.selectOmikuji(
   this.storeAll.OmikenTypesArray.comment,
   this.storeAll.Omiken.omikujis
  );

  // Omikujiの処理
  const processor = new OmikujiProcessor(this.storeAll, omikujiSelect, this.comment);
  return await processor.process();
 }
}
