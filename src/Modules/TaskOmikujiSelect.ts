// src/Modules/TaskOmikujiSelect.js
import { OmikujiSelectType, OmikujiType, RulesType, TimeConfigType, TypesType, VisitType } from '@/types';
import { ThresholdChecker } from './ThresholdCheck';
import { Comment } from '@onecomme.com/onesdk/types/Comment';

interface OmikujiSelectorOptions {
 comment: Comment;
 visit: VisitType;
 timeConfig: TimeConfigType;
}

// omikujiをセレクトする
export class OmikujiSelectorFactory {
 static create(mode: TypesType, options?: OmikujiSelectorOptions): BaseOmikujiSelector {
  switch (mode) {
   case 'comment':
    // optionsがない場合はエラーを返す
    if (!options) {
     throw new Error('Comment mode requires comment, visit, and timeConfig options');
    }
    return new CommentBasedSelector(options);

   case 'timer':
    return new TimerBasedSelector();

   default:
    throw new Error(`Unsupported mode: ${mode}`);
  }
 }
}

// おみくじ(アイテム抽選)
export abstract class BaseOmikujiSelector {
 abstract selectOmikuji(rules: RulesType[], omikujis: Record<string, OmikujiType>): OmikujiSelectType | null;

 protected selectByWeight(items: OmikujiType[]): OmikujiType | null {
  if (items.length === 0) return null;

  // rankが最も高い値を取得しフィルタリング
  const maxRank = Math.max(...items.map((item) => item.rank));
  const highestRankItems = items.filter((item) => item.rank === maxRank);

  // weightを計算し抽選
  const totalWeight = highestRankItems.reduce((sum, item) => sum + Math.max(item.weight, 1), 0);
  if (totalWeight <= 0) return null;
  let random = Math.random() * totalWeight;
  return highestRankItems.find((item) => (random -= Math.max(item.weight, 1)) < 0) ?? null;
 }
}

// comment:
export class CommentBasedSelector extends BaseOmikujiSelector {
 constructor(private readonly options: OmikujiSelectorOptions) {
  super();
 }

 // 各ルールに対して処理を実行し、ruleも一緒に返す
 selectOmikuji(rules: RulesType[], omikujis: Record<string, OmikujiType>): OmikujiSelectType | null {
  for (const rule of rules) {
   const omikuji = this.processRule(rule, omikujis);
   if (omikuji) {
    const selectRuleId = rule.id;
    return { ...omikuji, selectRuleId: selectRuleId };
   }
  }
  return null;
 }

 private processRule(rule: RulesType, omikujis: Record<string, OmikujiType>): OmikujiType | null {
  // ルールのthresholdチェック
  const checker = new ThresholdChecker(rule, this.options.comment, this.options.visit, this.options.timeConfig);
  const isValid = rule.threshold.every((threshold) => checker.check(threshold));
  if (!isValid) return null;

  // 有効なおみくじの取得
  const validOmikujis = rule.enableIds
   .map((id) => omikujis[id])
   .filter((omikuji) => {
    return omikuji.threshold.every((threshold) => checker.check(threshold));
   });

  if (validOmikujis.length === 0) return null;

  return this.selectByWeight(validOmikujis);
 }
}

// timer:
export class TimerBasedSelector extends BaseOmikujiSelector {
 selectOmikuji(rules: RulesType[], omikujis: Record<string, OmikujiType>): OmikujiSelectType | null {
  // rulesにある、それぞれの rule.timerConfig を参照しタイマーをセット
  // timerConfig が存在しない場合、timerConfig.minutes=1未満61以上のときはreturn null

  const rule = rules[0];
  if (!rule) return null;

  const validOmikujis = rule.enableIds.map((id) => omikujis[id]).filter(Boolean);

  const selectedOmikuji = this.selectByWeight(validOmikujis);

  if (selectedOmikuji) {
   const selectRuleId = rule.id;
   const hogeomikuji = { ...selectedOmikuji, selectRuleId: selectRuleId };

   return hogeomikuji;
  }
  return null;
 }
}
