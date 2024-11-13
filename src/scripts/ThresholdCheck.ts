// src/scripts/ThresholdCheck.js

import {
  BaseComment,
  ThresholdType,
  SyokenCondition,
  AccessCondition,
  ClockCondition,
  GiftCondition,
  CountCondition,
  ElapsedCondition,
  ComparisonType,
} from "../../src/types/types";

// threshold判定(rules/omikuji)
export const thresholdCheck = (comment: BaseComment, threshold: ThresholdType) => {

  switch (threshold.conditionType) {
    case "none":
      return true;
    case "match":
      return matchCommentText(comment.data.comment, threshold.match);
    case "gift":
      return matchIsGift(comment, threshold.gift);
    case "syoken":
      return matchIsSyoken(comment, threshold.syoken);
    case "access":
      return matchIsAccess(comment, threshold.access);
    case "count":
      return matchIsCount(comment, threshold.count);
    case "clock":
      return matchIsClock(comment, threshold.clock);
    case "elapsed":
      return matchIsElapsed(comment.meta.interval, threshold.elapsed);
    default:
      return false;
  }
};

// match:キーワードと一致するか
function matchCommentText(commentText: string, match: string[]) {
  return ["matchExact", "matchStartsWith", "matchIncludes"].some(
    (matchType) => {
      const words = match[matchType];
      return (
        words?.some((word: string) => {
          const isEmoji = /\p{Emoji}/u.test(word);
          const compareWord = isEmoji ? word : word.toLowerCase();
          const compareComment = isEmoji
            ? commentText
            : commentText.toLowerCase();

          switch (matchType) {
            case "matchExact":
              return compareWord === compareComment;
            case "matchStartsWith":
              return compareComment.startsWith(compareWord);
            case "matchIncludes":
              return compareComment.includes(compareWord);
            default:
              return false;
          }
        }) || false
      );
    }
  );
}

// 初見判定ちゃん
function matchIsSyoken(comment: BaseComment, syoken: SyokenCondition): boolean {
  // tc:個人総コメント数/no:該当枠内の個人コメント数
  const { tc, no, interval } = comment.meta;

  const SYOKEN_COMMENT_LIMIT = 5;
  const SYOKEN_INTERVAL = 60 * 60 * 1000; // 1時間
  const AGAIN_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7日

  // 早期リターンで簡潔に
  if (syoken === "syoken")
    return tc <= SYOKEN_COMMENT_LIMIT && interval < SYOKEN_INTERVAL;
  if (syoken === "again") return interval > AGAIN_INTERVAL;
  if (syoken === "hi") return no === 1;
  return false;
}

// 役職チェック
function matchIsAccess(comment: BaseComment, access: AccessCondition): boolean {
  // インライン型定義を使用し、`isModerator` と `isMember` の存在チェックを追加
  const isOwner = comment.data.isOwner; // 配信者
  const isModerator = (comment.data as { isModerator?: boolean }).isModerator; // モデレーター
  const isMember = (comment.data as { isMember?: boolean }).isMember; // メンバー

  // 条件判定
  if (access === 1) return true;
  if (access <= 4 && isOwner) return true;
  if (access <= 3 && isModerator) return true;
  if (access <= 2 && isMember) return true;

  return false;
}

// 時計
function matchIsClock(comment: BaseComment, clock: ClockCondition): boolean {
  const startHour = clock.startHour; // 開始時刻 (0-23)
  const durationHours = clock.durationHours; // 有効な時間の継続時間

  // 現在時刻 (日本時間) を取得し、時間のみを取得
  const now = new Date().getHours(); // 仮に 19:33 の場合、19 が返る

  // 開始時刻からの有効範囲の終了時刻を計算
  const endHour = (startHour + durationHours) % 24;

  // 範囲チェック
  if (startHour < endHour) {
    // 開始時刻から終了時刻が同日内の場合
    return now >= startHour && now < endHour;
  } else {
    // 開始時刻から終了時刻が翌日にまたがる場合
    return now >= startHour || now < endHour;
  }
}

// ギフト関数
function matchIsGift(comment: BaseComment, gift: GiftCondition): boolean {
  const giftObj = comment.data.gift;
  console.log(giftObj); // TODO gift の値がわからない
  return false;

  // 数値比較用ヘルパー関数を呼び出し、結果を返す
  //return matchNumberHelper(count.comparison, value, count.value1, count.value2);
}

// カウントチェック関数
function matchIsCount(comment: BaseComment, count: CountCondition): boolean {
  // tc:個人総コメント数/no:該当枠内の個人コメント数/lc:該当枠内のコメント数
  const { tc, no, lc } = comment.meta;
  const value = count.unit === "tc" ? tc : count.unit === "no" ? no : lc;

  // 数値比較用ヘルパー関数を呼び出し、結果を返す
  return matchNumberHelper(count.comparison, value, count.value1, count.value2);
}

// 経過時間を見る関数
function matchIsElapsed(interval: number, elapsed: ElapsedCondition): boolean {
  // tc:個人総コメント数/no:該当枠内の個人コメント数/lc:該当枠内のコメント数
  const unit = elapsed.unit;
  let bai = 1000;
  if (unit === "minute") bai *= 60;
  if (unit === "hour") bai *= 60 * 60;
  if (unit === "day") bai *= 60 * 60 * 24;

  // 数値比較用ヘルパー関数を呼び出し、結果を返す
  return matchNumberHelper(
    elapsed.comparison,
    interval,
    elapsed.value1 * bai,
    elapsed.value2 * bai
  );
}

// 数値比較ヘルパー関数
function matchNumberHelper(
  comparison: ComparisonType, // 型を明確に指定
  value: number,
  limit1: number,
  limit2?: number
): boolean {
  switch (comparison) {
    case "range":
      if (limit2 === undefined) return false; // 早期リターン
      const [lower, upper] =
        limit1 < limit2 ? [limit1, limit2] : [limit2, limit1];
      return value >= lower && value <= upper;
    case "loop":
      return limit1 !== 0 && value % limit1 === 0;
    case "min":
      return value >= limit1;
    case "max":
      return value <= limit1;
    case "equal":
      return value === limit1;
    default:
      return false;
  }
}
