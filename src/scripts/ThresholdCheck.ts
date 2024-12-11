// src/scripts/ThresholdCheck.ts

import {
  AccessCondition,
  CountCondition,
  MatchCondition,
  RulesType,
  SyokenCondition,
  ThresholdType,
  TimeConfigType,
  VisitType,
} from "../../src/types/index";
import { Comment } from "@onecomme.com/onesdk/types/Comment";

// 条件
export class ThresholdChecker {
  private rule: RulesType;
  private comment?: Comment;
  private visit: VisitType;
  private TimeConfig: TimeConfigType;

  constructor(
    rule: RulesType,
    comment: Comment | undefined,
    visit: VisitType,
    TimeConfig: TimeConfigType
  ) {
    this.rule = rule;
    this.comment = comment;
    this.visit = visit;
    this.TimeConfig = TimeConfig;
  }

  /**
   * 閾値条件をチェックする主要メソッド
   * @param threshold 閾値の条件オブジェクト
   * @returns 条件に合致するかどうかのブール値
   */
  check(threshold: ThresholdType): boolean {
    const conditionMap = {
      target: () => this.matchIsTarget(),
      cooldown: () => this.matchIsCooldown(threshold.cooldown),
      syoken: () => this.matchIsSyoken(threshold.syoken),
      access: () => this.matchIsAccess(threshold.access),
      count: () => this.matchIsCount(threshold.count),
      match: () => this.matchIsMatch(threshold.match),
    };

    return conditionMap[threshold.conditionType]?.() ?? false;
  }

  // 前回のコメントと今回のコメントが同一人物なら適用
  private matchIsTarget(): boolean {
    return this.TimeConfig.lastUserId === this.comment.data.userId;
  }

  // クールダウンのチェック
  private matchIsCooldown(cooldown: number): boolean {
    const now = Date.now();
    const lastTime = this.TimeConfig.lastTime;
    return lastTime > now + cooldown * 1000;
  }

  // 初見・久しぶりのチェック
  private matchIsSyoken(syoken: SyokenCondition): boolean {
    // コメントがない、または1回目でない場合はfalse
    if (!this.comment || this.comment.meta.no !== 1) return false;

    const { interval } = this.comment.meta;
    const conditions: Record<SyokenCondition, () => boolean> = {
      [SyokenCondition.SYOKEN]: () => interval === 0, // 初見
      [SyokenCondition.AGAIN]: () => interval > 7 * 24 * 60 * 60 * 1000, // 久しぶり
      [SyokenCondition.HI]: () => true, // こんにちは
      [SyokenCondition.ALL]: () => true, // 1回目のコメント全員
    };

    return conditions[syoken]?.() ?? false;
  }

  // ユーザーの役職
  private matchIsAccess(access: AccessCondition): boolean {
    if (!this.comment) return false; // コメントがない場合はfalse

    const isOwner = this.comment.data.isOwner; // 配信者
    // isModerator isMember はすべてのdataにあるわけではない
    const isModerator = (this.comment.data as { isModerator?: boolean })
      .isModerator; // モデレーター
    const isMember = (this.comment.data as { isMember?: boolean }).isMember; // メンバー

    // 条件判定
    if (access <= 4 && isOwner) return true;
    if (access <= 3 && isModerator) return true;
    if (access <= 2 && isMember) return true;
    return false;
  }
  // 数値を参照する
  private matchIsCount(count: CountCondition): boolean {
    console.log("matchIsCount 開始: ", {
      count,
      comment: this.comment,
      ruleId: this.rule.id,
    });

    // draws以外が選ばれていてcommentがundefinedならfalse
    if (!this.comment && count.unit !== "draws") {
      console.log("matchIsCount 結果: commentがundefinedでdraws以外", false);
      return false;
    }

    // giftはすべてのdataにあるわけではない
    let gift = 0;
    if (this.comment?.data && "price" in this.comment.data) {
      gift = this.comment.data.price;
    }

    const unitMap = {
      draws: this.visit.visitData[this.rule.id].draws || 0,
      gift,
      lc: this.comment.meta?.lc,
      tc: this.comment.meta?.tc,
      interval: this.comment.meta?.interval,
    };
    console.log("matchIsCount unitMap: ", { unitMap });

    const unitValue = unitMap[count.unit] || 0;
    const result = matchIsCountHelper(unitValue, count);
    console.log("matchIsCount 結果: ", {
      unit: count.unit,
      unitValue,
      result,
    });

    return result;
  }

  // 文字列を参照する
  private matchIsMatch(match: MatchCondition): boolean {
    console.log("matchIsMatch 開始: ", { match, comment: this.comment });

    // status以外が選ばれていてcommentがundefinedならfalse
    if (!this.comment && match.target !== "status") {
      console.log("matchIsMatch 結果: commentがundefinedでstatus以外", false);
      return false;
    }

    // マッチング対象のテキストを安全に取得
    const targetMap = {
      status: this.visit.status,
      comment: this.comment.data?.comment,
      name: this.comment.data?.name,
      displayName: this.comment.data?.displayName,
    };
    console.log("matchIsMatch targetMap: ", { targetMap });

    const text = targetMap[match.target] || "";
    console.log("matchIsMatch テキスト取得: ", { text });

    const result = match.value.some((word) => {
      // 絵文字の特別扱い
      const isEmoji = /\p{Emoji}/u.test(word);
      const normalizedWord = isEmoji ? word : word.toLowerCase();
      const normalizedText = isEmoji ? text : text.toLowerCase();
      console.log("matchIsMatch 比較: ", {
        word,
        isEmoji,
        normalizedWord,
        normalizedText,
      });

      const matchMethods = {
        exact: () => normalizedWord === normalizedText,
        starts: () => normalizedText.startsWith(normalizedWord),
        include: () => normalizedText.includes(normalizedWord),
      };

      const methodResult = matchMethods[match.case]();
      console.log("matchIsMatch メソッド結果: ", {
        case: match.case,
        methodResult,
      });
      return methodResult;
    });

    console.log("matchIsMatch 結果: ", { result });
    return result;
  }
}

// 数値比較ヘルパー関数
function matchIsCountHelper(value: number, count: CountCondition): boolean {
  const { comparison, value1, value2 } = count;

  const comparisonStrategies = {
    range: () =>
      value2 !== undefined &&
      value >= Math.min(value1, value2) &&
      value <= Math.max(value1, value2),
    loop: () => value1 !== 0 && value % value1 === 0,
    min: () => value >= value1,
    max: () => value <= value1,
    equal: () => value === value1,
  };

  return comparisonStrategies[comparison]?.() ?? false;
}
