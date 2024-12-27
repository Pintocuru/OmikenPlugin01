// src/Modules/TaskOmikujiSelect.js
import { OmikujiSelectType, OmikujiType, RulesType, TimeConfigType, TypesType, VisitType } from '@type';
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
    return { ...omikuji, selectRuleId };
   }
  }
  return null;
 }

 private processRule(rule: RulesType, omikujis: Record<string, OmikujiType>): OmikujiType | null {
  const { timeConfig, comment, visit } = this.options;
  const checker = new ThresholdChecker(rule, timeConfig, comment, visit);

  // ルールが有効でない場合は null を返す
  if (!checker.checkAll(rule.threshold)) return null;

  // 有効なおみくじをフィルタリング
  const validOmikujis = rule.enableIds
   .map((id) => omikujis[id])
   .filter((omikuji) => checker.checkAll(omikuji.threshold));

  return validOmikujis.length > 0 ? this.selectByWeight(validOmikujis) : null;
 }
}

// timer:
export class TimerBasedSelector extends BaseOmikujiSelector {
 private timers: NodeJS.Timeout[] = [];

 constructor() {
  super();
  this.clearAllTimers();
 }

 // タイマーをすべてクリア
 private clearAllTimers(): void {
  this.timers.forEach((timer) => clearInterval(timer));
  this.timers = [];
 }

 // 全ルールに対するおみくじ選択
 selectOmikuji(rules: RulesType[], omikujis: Record<string, OmikujiType>): OmikujiSelectType | null {
  for (const rule of rules) {
   const result = this.selectOmikujiForRule(rule, omikujis);
   console.log(result);
   if (result) return result;
  }
  return null;
 }

 // 次の実行時刻までの待機時間を計算（ミリ秒）
 private calculateNextInterval(minutes: number, isBaseZero: boolean): number {
  const now = new Date();
  let nextTime: Date;

  if (isBaseZero) {
   const currentMinutes = now.getMinutes();
   const minutesToNext = minutes - (currentMinutes % minutes);
   nextTime = new Date(now);
   nextTime.setMinutes(currentMinutes + minutesToNext);
   nextTime.setSeconds(0);
   nextTime.setMilliseconds(0);
  } else {
   nextTime = new Date(now.getTime() + minutes * 60000);
  }

  const delay = nextTime.getTime() - now.getTime();
  console.log(`Calculated next interval: ${delay}ms (BaseZero: ${isBaseZero})`);
  return delay;
 }

 // タイマーを設定して定期実行を開始（複数ルール対応）
 setupTimers(
  rules: RulesType[],
  omikujis: Record<string, OmikujiType>,
  callback: (result: OmikujiSelectType) => void
 ): void {
  rules.forEach((rule) => {
   // バリデーション 1分以上60分以下の間でない場合はスキップ
   if (!rule.timerConfig) return;
   const { minutes, isBaseZero } = rule.timerConfig;
   if (minutes < 1 || minutes > 60) return;

   // 即時実行を追加
   const immediateResult = this.selectOmikujiForRule(rule, omikujis);
   // テストswitch(本番は0にすること)
   if (0 && immediateResult) callback(immediateResult);

   // 最初の実行までの待機時間を計算
   const initialDelay = this.calculateNextInterval(minutes, isBaseZero);
   console.log(`Setting up timer for rule ${rule.id}: initial delay ${initialDelay}ms, interval ${minutes} minutes`);

   // 最初の実行のタイマーをセット
   setTimeout(() => {
    console.log(`Initial execution for rule ${rule.id}`);
    const timer = setInterval(() => {
     console.log(`Executing periodic check for rule ${rule.id}`);
     const result = this.selectOmikujiForRule(rule, omikujis);
     if (result) {
      console.log(`Omikuji selected for rule ${rule.id}:`, result);
      callback(result);
     }
    }, minutes * 60000);

    this.timers.push(timer);

    // 初回実行
    const result = this.selectOmikujiForRule(rule, omikujis);
    if (result) {
     console.log(`Omikuji selected (initial) for rule ${rule.id}:`, result);
     callback(result);
    }
   }, initialDelay);
  });
 }

 // 単一ルールに対するおみくじ選択
 private selectOmikujiForRule(rule: RulesType, omikujis: Record<string, OmikujiType>): OmikujiSelectType | null {
  const validOmikujis = rule.enableIds.map((id) => omikujis[id]).filter(Boolean);
  const selectedOmikuji = this.selectByWeight(validOmikujis);

  if (selectedOmikuji) {
   console.log(`Omikuji selected for rule ${rule.id}:`, selectedOmikuji);
   return { ...selectedOmikuji, selectRuleId: rule.id };
  }

  console.log(`No valid omikuji found for rule ${rule.id}`);
  return null;
 }

 destroy(): void {
  this.clearAllTimers();
 }
}
