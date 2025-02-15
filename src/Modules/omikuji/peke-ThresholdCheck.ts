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

// 条件
export class ThresholdChecker {
 comment: Comment | undefined;
 visit: VisitType | undefined;
 meta: ServiceMeta | undefined;
 timeConfig: TimeConfigType;
 constructor(
  private readonly options: SelectOmikujiOptions,
  private readonly rule: OmikenRulesType,
  private readonly game?: GameType
 ) {
  // 型に応じたプロパティの初期化
  this.comment = options.type === 'comment' ? options.comment : undefined;
  this.visit = options.type === 'comment' ? options.visit : undefined;
  this.meta = options.type === 'meta' ? options.meta : undefined;
  this.timeConfig = options.timeConfig;
 }

 // 条件チェック（配列全体）
 checkAll(threshold: ThresholdType): boolean {
  return threshold.criteria.reduce(
   (accumulator, criterion) => {
    const result = this.check(criterion);

    if (threshold.isAnd === false) {
     return accumulator || result; // OR 条件 (threshold.isAnd が false の場合)
    } else {
     return accumulator && result; // AND 条件 (デフォルト)
    }
   },
   threshold.isAnd === false ? false : true
  ); // 初期値は threshold.isAnd が false なら false、それ以外は true
 }

 check(criterion: CriterionType): boolean {
  // 型に応じた条件チェックの振り分け
  switch (this.options.type) {
   case 'comment':
    return this.checkCommentCriterion(criterion as CommentCriterion);
   case 'timer':
    return this.checkTimerCriterion(criterion as TimerCriterion);
   case 'meta':
    return this.checkMetaCriterion(criterion as MetaCriterion);
   default:
    return false;
  }
 }

 // comment
 checkCommentCriterion(criterion: CommentCriterion): boolean {
  const conditionMap = {
   target: () => this.matchIsTarget(criterion.target),
   coolDown: () => this.matchIsCoolDown(criterion.coolDown),
   syoken: () => this.matchIsSyoken(criterion.syoken),
   access: () => this.matchIsAccess(criterion.access),
   gift: () => this.matchIsGift(criterion.gift),
   draws: () => this.matchIsDraws(criterion.draws),
   count: () => this.matchIsCount(criterion.count),
   match: () => this.matchIsMatch(criterion.match)
  } as const;

  const result = conditionMap[criterion.conditionType]?.() ?? false;
  return criterion.isNot === true ? !result : result; // isNot を適用
 }

 // timer
 checkTimerCriterion(criterion: TimerCriterion): boolean {
  const conditionMap = {
   draws: () => this.matchIsDraws(criterion.draws)
  } as const;

  const result = conditionMap[criterion.conditionType]?.() ?? false;
  return criterion.isNot === true ? !result : result; // isNot を適用
 }

 // meta
 checkMetaCriterion(criterion: MetaCriterion): boolean {
  const conditionMap = {
   draws: () => this.matchIsDraws(criterion.draws),
   metaCount: () => this.matchIsMetaCount(criterion.metaCount),
   dynamic: () => this.matchIsDynamic(criterion.dynamic)
  } as const;

  const result = conditionMap[criterion.conditionType]?.() ?? false;
  return criterion.isNot === true ? !result : result; // isNot を適用
 }

 // 連続投稿が数値以上なら適用
 private matchIsTarget(target: number = 2): boolean {
  const { currentUserIds = [] } = this.game ?? {};

  const targetUser = currentUserIds[0];
  const consecutiveCount = currentUserIds.findIndex((id) => id !== targetUser);

  return (consecutiveCount === -1 ? currentUserIds.length : consecutiveCount) >= target;
 }

 // クールダウンのチェック
 private matchIsCoolDown(coolDown: number = 3): boolean {
  return Date.now() < this.timeConfig.lastTime + coolDown * 1000;
 }

 // 初見・久しぶりのチェック
 private matchIsSyoken(syoken: SyokenCondition = SyokenCondition.SYOKEN): boolean {
  // (仕様書とは異なる)meta.free は配信枠1コメめかどうか
  if (!this.comment) return false;

  const currentComment = this.comment; // this.comment の状態を保存

  const conditions: Record<SyokenCondition, () => boolean> = {
   [SyokenCondition.SYOKEN]: () => currentComment.meta?.interval === 0 || currentComment.meta?.interval === undefined,
   [SyokenCondition.AGAIN]: () => (currentComment.meta?.interval ?? 0) > 7 * 24 * 60 * 60 * 1000,
   [SyokenCondition.HI]: () => !conditions[SyokenCondition.SYOKEN]() && !conditions[SyokenCondition.AGAIN](),
   [SyokenCondition.ALL]: () => true
  };

  return conditions[syoken]?.() ?? false;
 }

 // ユーザーの役職
 private matchIsAccess(access: AccessCondition = 2): boolean {
  if (!this.comment) return false;

  const { isOwner, isModerator, isMember } = this.comment.data as {
   isOwner: boolean;
   isModerator?: boolean;
   isMember?: boolean;
  };

  return (access <= 4 && isOwner) || (access <= 3 && isModerator) || (access <= 2 && isMember) || false;
 }

 // ギフトを参照する
 private matchIsGift(gift: GiftCondition = 0): boolean {
  if (!this.comment) return false;

  const { hasGift } = this.comment.data;
  // ギフトがない場合、false
  if (!hasGift) return false;

  const price = 'price' in this.comment.data ? this.comment.data.price : null;
  const tier = 'tier' in this.comment.data ? this.comment.data.tier : null;

  // 指定したTier以上のギフトがあるならtrue
  const calTier = tier ?? this.matchIsGiftHelper(price);
  return calTier >= gift;
 }

 private matchIsGiftHelper(price?: number | null): GiftCondition {
  if (!price || price <= 0) return GiftCondition.All;
  const giftRanges = new Map([
   [200, GiftCondition.Blue],
   [500, GiftCondition.LightBlue],
   [1000, GiftCondition.Green],
   [2000, GiftCondition.Yellow],
   [5000, GiftCondition.Orange],
   [10000, GiftCondition.Pink],
   [20000, GiftCondition.Red],
   [Infinity, GiftCondition.Purple]
  ]);
  for (const [threshold, condition] of giftRanges) {
   if (price < threshold) return condition;
  }
  return GiftCondition.Purple;
 }

 // Drawsを参照する
 private matchIsDraws(draws: DrawsCondition = { comparison: 'max', unit: 'draws', value: 1 }): boolean {
  // drawsはインクリメント前なので+1しておく
  const userId = this.comment?.data.userId ?? '';
  const unitMap: Record<DrawsCondition['unit'], number> = {
   draws: (this.game?.userStats[userId]?.draws ?? 0) + 1,
   gameDraws: (this.game?.draws ?? 0) + 1
  };

  return this.matchIsCountHelper(unitMap[draws.unit], draws);
 }

 // 数値を参照する
 private matchIsCount(count: CountCondition = { comparison: 'max', unit: 'lc', value: 1 }): boolean {
  if (this.options.type !== 'comment') return false;

  const { lc = 0, tc = 0, interval = 0 } = this.comment?.meta ?? {};
  const { point = 0 } = this.visit ?? {};

  // drawsはインクリメント前なので+1しておく
  const unitMap: Record<CountCondition['unit'], number> = {
   point,
   lc,
   tc,
   intvlSec: Math.floor(interval / 1000)
  };

  return this.matchIsCountHelper(unitMap[count.unit], count);
 }

 // 数値比較ヘルパー関数
 private matchIsCountHelper(valueNow: number, count: DrawsCondition | CountCondition): boolean {
  const { comparison, value } = count;

  const comparisonStrategies = {
   loop: () => value !== 0 && valueNow % value === 0,
   min: () => valueNow <= value,
   max: () => valueNow >= value,
   equal: () => valueNow === value
  } as const;

  return comparisonStrategies[comparison]?.() ?? false;
 }

 // 文字列を参照する
 private matchIsMatch(match: MatchCondition = { target: 'comment', value: [] }): boolean {
  if (this.options.type !== 'comment') return false;

  const { comment = '', name = '', displayName = '' } = this.comment?.data ?? {};
  const { status = '' } = this.visit ?? {};
  const targetMap = { status, comment, name, displayName };

  const text = targetMap[match.target] || '';
  return matchRegexPattern(text, match.value);
 }

 // Meta用の条件チェックメソッド
 private matchIsMetaCount(count?: MetaCountCondition): boolean {
  if (!count || !this.meta) return false;

  const valueMap = {
   streamDuration: () => {
    const startTime = this.meta?.startTime; // 再度チェック
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / (60 * 1000)); // 分単位に変換
   },
   totalGifts: () => this.meta?.points?.gift ?? 0, // 再度チェック
   followers: () => this.meta?.follower ?? 0 // 再度チェック
  };

  const currentValue = valueMap[count.unit]();
  return this.compareValues(currentValue, count.comparison, count.value);
 }

 private matchIsDynamic(dynamic?: MetaDynamicCondition): boolean {
  if (!dynamic || !this.meta || !this.timeConfig) return false;
  const previousMeta: Record<string, number> = {};

  const valueMap = {
   upVote: () => {
    const upVote = this.meta?.upVote ?? '0';
    return parseInt(upVote, 10);
   },
   viewer: () => this.meta?.viewer ?? 0
  };

  const currentValue = valueMap[dynamic.unit]();
  const previousValue = previousMeta[dynamic.unit] ?? 0;

  // timeConfig.metaから最大値を取得
  const maxValueMap = {
   upVote: this.timeConfig.meta.maxLikes,
   viewer: this.timeConfig.meta.maxViewers
  };

  // 現在値を保存（前回値の比較用）
  previousMeta[dynamic.unit] = currentValue;

  switch (dynamic.comparison) {
   case 'min':
    return currentValue <= dynamic.value;
   case 'max':
    return currentValue >= dynamic.value;
   case 'different':
    return currentValue !== previousValue;
   case 'increasing':
    return currentValue > previousValue;
   case 'newMaximum':
    return currentValue > maxValueMap[dynamic.unit];
   default:
    return false;
  }
 }

 // 汎用的な値比較ヘルパーメソッド
 private compareValues(current: number, comparison: string, target: number): boolean {
  switch (comparison) {
   case 'min':
    return current <= target;
   case 'max':
    return current >= target;
   case 'equal':
    return current === target;
   case 'loop':
    return target !== 0 && current % target === 0;
   default:
    return false;
  }
 }
}

// 正規表現マッチ
export function matchRegexPattern(
 text: string,
 pattern: string | string[],
 options: { ignoreCase?: boolean } = {}
): boolean {
 const patterns = Array.isArray(pattern) ? pattern : [pattern];
 const flags = options.ignoreCase ?? true ? 'ui' : 'u';

 return patterns.some((p) => {
  try {
   // 絵文字の場合は単純一致
   if (/\p{Emoji}/u.test(p)) {
    return text.includes(p);
   }

   // 正規表現マッチング
   const regex = new RegExp(p, flags);
   return regex.test(text);
  } catch (error) {
   console.warn(`Invalid regex pattern: ${p}. Falling back to includes match.`);
   return options.ignoreCase !== false ? text.toLowerCase().includes(p.toLowerCase()) : text.includes(p);
  }
 });
}
