// src/Modules/omikuji/ThresholdCheck.ts
import {
 CriterionTypesMap,
 GameType,
 RuleCategory,
 RulesTypeMap,
 SelectOmikujiOptions,
 ThresholdTypesMap
} from '@type';
import { ThresholdCommentChecker } from './ThresholdCommentChecker';
import { ThresholdTimerChecker } from './ThresholdTimerChecker';
import { ThresholdMetaChecker } from './ThresholdMetaChecker';

export class ThresholdChecker {
 private commentChecker: ThresholdCommentChecker;
 private timerChecker: ThresholdTimerChecker;
 private metaChecker: ThresholdMetaChecker;

 constructor(
  private readonly options: SelectOmikujiOptions<RuleCategory>,
  private readonly rule: RulesTypeMap<RuleCategory>,
  private readonly game?: GameType
 ) {
  // 各チェッカーの初期化
  this.commentChecker = new ThresholdCommentChecker(
   options.type === 'comment' ? options.comment : undefined,
   options.timeConfig,
   game,
   options.visit
  );
  this.timerChecker = new ThresholdTimerChecker(options.timeConfig, game);
  this.metaChecker = new ThresholdMetaChecker(
   options.type === 'meta' ? options.meta : undefined,
   options.timeConfig,
   game
  );
 }

 // 条件チェック（配列全体）
 checkAll(threshold: ThresholdTypesMap<RuleCategory>): boolean {
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
 check(criterion: CriterionTypesMap<RuleCategory>): boolean {
  switch (this.options.type) {
   case 'comment':
    return this.commentChecker.checkCommentCriterion(criterion as CriterionTypesMap<'comments'>);
   case 'timer':
    return this.timerChecker.checkTimerCriterion(criterion as CriterionTypesMap<'timers'>);
   case 'meta':
    return this.metaChecker.checkMetaCriterion(criterion as CriterionTypesMap<'metas'>);
   default:
    return false;
  }
 }
}
