// src/Modules/omikuji/ThresholdCheck.ts
import {
 AccessCondition,
 CommentCriterion,
 CountCondition,
 CriterionType,
 DrawsCondition,
 GameType,
 GiftCondition,
 MatchCondition,
 MetaCountCondition,
 MetaCriterion,
 MetaDynamicCondition,
 OmikenRulesType,
 SelectOmikujiOptions,
 SyokenCondition,
 ThresholdType,
 TimeConfigType,
 TimerCriterion,
 VisitType
} from '@type';
import { Comment } from '@onecomme.com/onesdk/types/Comment';
import { ServiceMeta } from '@onecomme.com/onesdk/types/Service';
import { ThresholdCommentChecker } from './ThresholdCommentChecker';
import { ThresholdTimerChecker } from './ThresholdTimerChecker';
import { ThresholdMetaChecker } from './ThresholdMetaChecker';

export class ThresholdChecker {
 private commentChecker: ThresholdCommentChecker;
 private timerChecker: ThresholdTimerChecker;
 private metaChecker: ThresholdMetaChecker;

 constructor(
  private readonly options: SelectOmikujiOptions,
  private readonly rule: OmikenRulesType,
  private readonly game?: GameType
 ) {
  // 各チェッカーの初期化
  this.commentChecker = new ThresholdCommentChecker(
   options.type === 'comment' ? options.comment : undefined,
   options.timeConfig,
   game
  );
  this.timerChecker = new ThresholdTimerChecker(options.timeConfig, game);
  this.metaChecker = new ThresholdMetaChecker(options.type === 'meta' ? options.meta : undefined, options.timeConfig);
 }

 // 条件チェック（配列全体）
 checkAll(threshold: ThresholdType): boolean {
  return threshold.criteria.reduce(
   (accumulator, criterion) => {
    const result = this.check(criterion);

    if (threshold.isAnd === false) {
     return accumulator || result; // OR 条件
    } else {
     return accumulator && result; // AND 条件
    }
   },
   threshold.isAnd === false ? false : true
  ); // 初期値
 }

 // 個別の条件チェック
 check(criterion: CriterionType): boolean {
  switch (this.options.type) {
   case 'comment':
    return this.commentChecker.checkCommentCriterion(criterion as CommentCriterion);
   case 'timer':
    return this.timerChecker.checkTimerCriterion(criterion as TimerCriterion);
   case 'meta':
    return this.metaChecker.checkMetaCriterion(criterion as MetaCriterion);
   default:
    return false;
  }
 }
}
