// src/Modules/omikuji/ThresholdCommentChecker.ts
import {
 CommentCriterion,
 SyokenCondition,
 AccessCondition,
 GiftCondition,
 DrawsCondition,
 CountCondition,
 MatchCondition,
 TimeConfigType,
 GameType
} from '@type';
import { Comment } from '@onecomme.com/onesdk/types/Comment';
import { matchRegexPattern } from './ThresholdRegexUtils';
import { matchIsCountHelper, matchIsGiftHelper } from './ThresholdHelpers';

export class ThresholdCommentChecker {
 constructor(
  private readonly comment: Comment | undefined,
  private readonly timeConfig: TimeConfigType,
  private readonly game?: GameType
 ) {}

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
  return criterion.isNot === true ? !result : result;
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
  const calTier = tier ?? matchIsGiftHelper(price);
  return calTier >= gift;
 }

 // Drawsを参照する
 private matchIsDraws(draws: DrawsCondition = { comparison: 'max', unit: 'draws', value: 1 }): boolean {
  // drawsはインクリメント前なので+1しておく
  const userId = this.comment?.data.userId ?? '';
  const unitMap: Record<DrawsCondition['unit'], number> = {
   draws: (this.game?.userStats[userId]?.draws ?? 0) + 1,
   gameDraws: (this.game?.draws ?? 0) + 1
  };

  return matchIsCountHelper(unitMap[draws.unit], draws);
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

  return matchIsCountHelper(unitMap[count.unit], count);
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
}
