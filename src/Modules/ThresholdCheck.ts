// src/Modules/ThresholdCheck.ts

import {
 AccessCondition,
 CountCondition,
 MatchCondition,
 RulesType,
 SyokenCondition,
 ThresholdType,
 TimeConfigType,
 VisitType
} from '../types/index';
import { Comment } from '@onecomme.com/onesdk/types/Comment';

// 条件
export class ThresholdChecker {
 constructor(
  private readonly rule: RulesType,
  private readonly TimeConfig: TimeConfigType,
  private readonly comment?: Comment | undefined,
  private readonly visit?: VisitType | undefined
 ) {}

 // 条件チェック（配列全体）
 checkAll(thresholds: ThresholdType[]): boolean {
  return thresholds.every((threshold) => this.check(threshold));
 }

 // 条件チェック(単独)
 check(threshold: ThresholdType): boolean {
  const conditionMap = {
   target: () => this.matchIsTarget(),
   cooldown: () => this.matchIsCooldown(threshold.cooldown),
   syoken: () => this.matchIsSyoken(threshold.syoken),
   access: () => this.matchIsAccess(threshold.access),
   count: () => this.matchIsCount(threshold.count),
   match: () => this.matchIsMatch(threshold.match)
  } as const;

  return conditionMap[threshold.conditionType]?.() ?? false;
 }

 // 前回のコメントと今回のコメントが同一人物なら適用
 private matchIsTarget(): boolean {
  return this.comment?.data.userId === this.TimeConfig.lastUserId || false;
 }

 // クールダウンのチェック
 private matchIsCooldown(cooldown: number): boolean {
  return this.TimeConfig.lastTime > Date.now() + cooldown * 1000;
 }

 // 初見・久しぶりのチェック
 private matchIsSyoken(syoken: SyokenCondition): boolean {
  if (!this.comment?.meta.free) return false;

  const conditions: Record<SyokenCondition, () => boolean> = {
   [SyokenCondition.SYOKEN]: () => this.comment!.meta.interval === 0,
   [SyokenCondition.AGAIN]: () => this.comment!.meta.interval > 7 * 24 * 60 * 60 * 1000,
   [SyokenCondition.HI]: () => true,
   [SyokenCondition.ALL]: () => true
  };
  return conditions[syoken]?.() ?? false;
 }

 // ユーザーの役職
 private matchIsAccess(access: AccessCondition): boolean {
  if (!this.comment?.data) return false;

  const { isOwner, isModerator, isMember } = this.comment.data as {
   isOwner: boolean;
   isModerator?: boolean;
   isMember?: boolean;
  };

  return (access <= 4 && isOwner) || (access <= 3 && isModerator) || (access <= 2 && isMember) || false;
 }

 // 数値を参照する
 private matchIsCount(count: CountCondition): boolean {
  if (!this.comment && count.unit !== 'draws') return false;

  const unitMap = {
   draws: this.visit.visitData[this.rule.id].draws || 0,
   gift: this.comment?.data && 'price' in this.comment.data ? this.comment.data.price : 0,
   lc: this.comment?.meta?.lc ?? 0,
   tc: this.comment?.meta?.tc ?? 0,
   interval: this.comment?.meta?.interval ?? 0
  };
  return this.matchIsCountHelper(unitMap[count.unit], count);
 }

 // 数値比較ヘルパー関数
 private matchIsCountHelper(value: number, count: CountCondition): boolean {
  const { comparison, value1, value2 } = count;

  const comparisonStrategies = {
   range: () => value2 !== undefined && value >= Math.min(value1, value2) && value <= Math.max(value1, value2),
   loop: () => value1 !== 0 && value % value1 === 0,
   min: () => value >= value1,
   max: () => value <= value1,
   equal: () => value === value1
  } as const;

  return comparisonStrategies[comparison]?.() ?? false;
 }

 // 文字列を参照する
 private matchIsMatch(match: MatchCondition): boolean {
  if (!this.comment && match.target !== 'status') return false;

  const targetMap = {
   status: this.visit.status,
   comment: this.comment?.data?.comment,
   name: this.comment?.data?.name,
   displayName: this.comment?.data?.displayName
  };

  const text = targetMap[match.target] || '';

  return match.value.some((word) => {
   const isEmoji = /\p{Emoji}/u.test(word);
   const [normalizedWord, normalizedText] = isEmoji ? [word, text] : [word.toLowerCase(), text.toLowerCase()];

   const matchMethods = {
    exact: () => normalizedWord === normalizedText,
    starts: () => normalizedText.startsWith(normalizedWord),
    include: () => normalizedText.includes(normalizedWord)
   };
   return matchMethods[match.case]();
  });
 }
}
