// src/Modules/TaskCommentInstance.ts

import { PluginUpdateData, StoreMainType, TimeConfigType, VisitType } from '@type';
import { OmikujiSelector } from './TaskOmikujiSelector';
import { OmikujiProcessor } from './TaskOmikujiProcess';
import { UserNameData } from '@onecomme.com/onesdk/types/UserData';
import { Comment } from '@onecomme.com/onesdk/types/Comment';

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
  // 初期化したVisitを即座にstoreAllに反映
  this.storeAll.Visits[this.comment.data.userId] = this.visit;

  // commentに擬似的なmetaデータを付与
  this.thisComment();

  // 更新したTimeConfigをstoreAllに保存
  this.storeAll.TimeConfig = this.TimeConfig;
 }

 // ユーザーの枠情報が空白または異なるなら、Visitを初期化
 private resetVisit() {
  // ユーザーのvisit初期化・更新
  const visit = this.storeAll.Visits[this.comment.data.userId] || ({} as VisitType);
  // visit初期化・更新
  this.visit = {
   name: this.comment.data.name,
   userId: this.comment.data.userId,
   round: visit?.round || 0,
   status: visit?.status || '',
   point: visit?.point || 0,
   lastPluginTime: visit?.lastPluginTime || 0,
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
      interval: this.userData?.interval || 0,
      tc: this.userData?.tc + 1 || 1, // カウント前なのでインクリメント
      lc: this.TimeConfig?.lc || 1, // プラグインが起動してからカウントしたコメント数
      no: this.storeAll.Visits?.[this.comment.data.userId]?.round || 1, // (仕様とは異なる)round:コメントした枠数
      free: !!this.isFirstVisit // (仕様とは異なる)初回かどうか
     };
 }

 // ユーザー情報の更新
 returnVisit(): VisitType {
  this.storeAll.store.set(`Visits.${this.comment.data.userId}`, this.visit);
  return this.visit;
 }

 // おみくじの処理
 async process(): Promise<Partial<PluginUpdateData>> {
  // コメントモードでの使用
  const commentSelector = OmikujiSelector.create('comment', {
   comment: this.comment,
   visit: this.visit,
   timeConfig: this.TimeConfig
  });

  // commentのrules からおみくじを抽選
  const omikujiSelect = commentSelector.selectOmikuji(
   this.storeAll.OmikenTypesArray.comment,
   this.storeAll.Omiken.omikujis,
   this.storeAll.Games
  );

  // おみくじがない場合はvisitだけ返す
  if (!omikujiSelect) {
   return {
    Visits: this.storeAll.Visits,
    Games: this.storeAll.Games,
    TimeConfig: this.TimeConfig
   };
  }

  // Omikujiの処理
  const processor = new OmikujiProcessor(this.storeAll, omikujiSelect, this.comment);
  return await processor.process();
 }
}
