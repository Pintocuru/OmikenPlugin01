// src/Modules/bots/BotComment.ts
import { PluginUpdateData, VisitType, PluginAllType, SelectOmikujiOptionsComment } from '@type';
import { OmikujiSelector } from '@omikuji/OmikujiSelector';
import { OmikujiProcess } from '@omikuji/OmikujiProcess';
import { UserNameData } from '@onecomme.com/onesdk/types/UserData';
import { Comment } from '@onecomme.com/onesdk/types/Comment';

export class BotComment {
 private visit: VisitType = {} as VisitType;
 private isFirstVisit: boolean = false;
 private isTester: boolean = false;

 // 初期化
 constructor(private storeAll: PluginAllType, private comment: Comment, private userData: UserNameData) {
  this.initializeVisit();
  this.storeAll.Visits[comment.data.userId] = this.visit;
  this.processComment();
 }

 // ユーザーの枠情報が空白または異なるなら、Visitを初期化
 private initializeVisit(): void {
  const currentVisit = this.storeAll.Visits[this.comment.data.userId] || ({} as VisitType);
  const pluginTime = this.storeAll.TimeConfig.pluginTime;

  this.visit = {
   name: this.comment.data.name,
   userId: this.comment.data.userId,
   round: currentVisit.round || 0,
   status: currentVisit.status || '',
   point: currentVisit.point || 0,
   lastPluginTime: currentVisit.lastPluginTime || 0
  };

  // 1回目のコメントかどうか
  this.isFirstVisit = this.visit.lastPluginTime !== pluginTime;

  // visitの初期化
  if (this.isFirstVisit) {
   this.visit.round++;
   this.visit.lastPluginTime = pluginTime;
   this.visit.status = '';
  }
 }

 // コメントの前処理
 private processComment(): void {
  this.isTester = this.comment.id === 'COMMENT_TESTER';

  // 擬似メタデータ
  // メタデータはプラグインの解決後に生成される仕様です
  this.comment.meta = this.isTester
   ? { interval: 999999, tc: 10, no: 2, lc: 2 }
   : {
      interval: this.userData?.interval || 0,
      tc: this.userData?.tc + 1 || 1, // カウント前なのでインクリメント
      lc: this.storeAll.TimeConfig?.lc || 1, // プラグインが起動してからカウントしたコメント数
      no: this.visit.round || 1, // (仕様とは異なる)round:コメントした枠数
      free: !!this.isFirstVisit // (仕様とは異なる)初回かどうか
     };
 }

 // ユーザー情報の永続化
 returnVisit(): VisitType {
  this.storeAll.store.set(`Visits.${this.comment.data.userId}`, this.visit);
  return this.visit;
 }

 // おみくじの処理
 async process(): Promise<PluginUpdateData> {
  // コメントモードでの使用
  const options: SelectOmikujiOptionsComment = {
   type: 'comment',
   comment: this.comment,
   visit: this.visit,
   timeConfig: this.storeAll.TimeConfig
  };
  // おみくじを抽選
  const selectOmikujiIds = OmikujiSelector(options, this.storeAll.Omiken.comment, this.storeAll.Games);

  // おみくじがない場合はvisitだけ返す
  if (!selectOmikujiIds) {
   return {
    Visits: this.storeAll.Visits,
    Games: this.storeAll.Games,
    TimeConfig: this.storeAll.TimeConfig
   };
  }

  const { ruleId, omikujiId } = selectOmikujiIds;
  const rule = this.storeAll.Omiken[options.type][ruleId];
  const omikuji = this.storeAll.Omiken.omikujis[omikujiId];

  // Omikujiの処理
  return new OmikujiProcess(rule, omikuji, this.storeAll, options).process();
 }
}
