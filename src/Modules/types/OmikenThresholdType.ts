// src/types/OmikenThresholdType.ts

///////////////////////////////////
// Threshold(rules,omikuji)
///////////////////////////////////

export type ThresholdType = CommentThreshold | TimerThreshold | MetaThreshold;
export type CriterionType = CommentCriterion | TimerCriterion | MetaCriterion;

// コメント用Threshold
export interface CommentThreshold {
 type: 'comment';
 isAnd?: boolean; // 次の条件との関係 (true:AND/false:OR)
 criteria: CommentCriterion[];
}

// タイマー用Threshold
export interface TimerThreshold {
 type: 'timer';
 isAnd?: boolean; // 次の条件との関係 (true:AND/false:OR)
 criteria: TimerCriterion[];
}

// メタ用Threshold
export interface MetaThreshold {
 type: 'meta';
 isAnd?: boolean; // 次の条件との関係 (true:AND/false:OR)
 criteria: MetaCriterion[];
}

// commentの条件型
export interface CommentCriterion {
 conditionType: CommentConditionType;
 isNot?: boolean; // 条件を反転させる
 target?: number; // 連続投稿がこの数値以上なら適用
 coolDown?: number; // おみくじ機能が機能してから指定した時間(秒)が経過していない場合に適用
 syoken?: SyokenCondition; // 初見・久しぶり
 access?: AccessCondition; // ユーザーの役職
 gift?: GiftCondition; // ギフトの有無
 draws?: DrawsCondition; // 過去にヒットしたおみくじの回数を数える
 count?: CountCondition; // 数値を参照する
 match?: MatchCondition; // 文字列を参照する
}

// condition選択用
export const CommentConditionTypes = {
 TARGET: 'target',
 COOL_DOWN: 'coolDown',
 SYOKEN: 'syoken',
 ACCESS: 'access',
 GIFT: 'gift',
 COUNT: 'count',
 MATCH: 'match'
} as const;
export type CommentConditionType = (typeof CommentConditionTypes)[keyof typeof CommentConditionTypes];

// Draws:過去にヒットしたおみくじの回数を数える
export interface DrawsCondition {
 comparison:
  | 'min' // 数値以下
  | 'max' // 数値以上
  | 'equal' // 等しい
  | 'loop'; // 数値をvalueで割った数
 unit:
  | 'draws' // その枠でrulesに該当した回数(個人)
  | 'gameDraws'; // その配信枠でrulesに該当した回数(合計)
 value: number;
}

// syoken:初見・コメント履歴の種別
export const SyokenCondition = {
 SYOKEN: 1, // 初見
 AGAIN: 2, // 前回のコメントから7日以上経過
 HI: 3, // 上記以外の、その配信枠で1回目のコメント
 ALL: 4 // 上記すべての、その配信枠で1回目のコメント
} as const;
export type SyokenCondition = (typeof SyokenCondition)[keyof typeof SyokenCondition];

// access:ユーザーの役職 0:OFF/1:だれでも/2:メンバー/3:モデレーター/4:管理者
export const AccessCondition = {
 MEMBER: 2,
 MODERATOR: 3,
 ADMIN: 4
} as const;
export type AccessCondition = (typeof AccessCondition)[keyof typeof AccessCondition];

// gift:ギフトのRank
export const GiftCondition = {
 All: 0, // 全て(メンバー加入含む)
 Blue: 1, // 200円未満
 LightBlue: 2, // 200円〜499円
 Green: 3, // 500円〜999円
 Yellow: 4, // 1,000円〜1,999円
 Orange: 5, // 2,000円〜4,999円
 Pink: 6, // 5,000円〜9,999円
 Red: 7, // 10,000円以上
 Purple: 8 // 20,000円以上
} as const;
export type GiftCondition = (typeof GiftCondition)[keyof typeof GiftCondition];

// count:数値を参照する
export interface CountCondition {
 comparison:
  | 'min' // 数値以下
  | 'max' // 数値以上
  | 'equal' // 等しい
  | 'loop'; // 数値をvalueで割った数
 unit:
  | 'point' // ユーザーのvisit.point
  | 'lc' // 配信枠のコメント数(プラグインで独自に付与)
  | 'tc' // 総数の個人コメ数(userData.tc)
  | 'intvlSec'; // そのユーザーの前回のコメントからの経過時間(秒)(userData.interval*1000)
 value: number;
}

// match:文字列を参照する
export interface MatchCondition {
 target:
  | 'status' // ユーザーのvisit.status
  | 'comment' // コメント(comment.data.comment)
  | 'name' // 名前(comment.data.name)
  | 'displayName'; // ニックネーム(comment.data.displayName)
 value: string[]; // 検索ワード
}

// Timerの条件型
export interface TimerCriterion {
 conditionType: TimerConditionType;
 isNot?: boolean; // 条件を反転させる
 draws?: DrawsCondition; // 過去にヒットしたおみくじの回数を数える
}
export type TimerConditionType = 'draws';

// metaの条件型
export interface MetaCriterion {
 conditionType: MetaConditionType;
 isNot?: boolean; // 条件を反転させる
 draws?: DrawsCondition; // 過去にヒットしたおみくじの回数を数える
 metaCount?: MetaCountCondition; // 数値を参照する
 dynamic?: MetaDynamicCondition; // 数値の変化しやすい、高評価数・閲覧数を参照
}

export type MetaConditionType = 'draws' | 'metaCount' | 'dynamic';

// metaCount:数値を参照する
export interface MetaCountCondition {
 comparison:
  | 'min' // 数値以下
  | 'max' // 数値以上
  | 'equal' // 等しい
  | 'loop'; // 数値をvalueで割った数
 unit:
  | 'streamDuration' // 配信開始時間から経過した時間(分)
  | 'totalGifts' // 配信枠でのギフト総額
  | 'followers'; // フォロワー数
 value: number;
}

// dynamic:高評価数・閲覧数を参照
export interface MetaDynamicCondition {
 comparison:
  | 'min' // 数値以下
  | 'max' // 数値以上
  | 'different' // 前回の数値とは異なる
  | 'increasing' // 前回の数値よりも大きい
  | 'newMaximum'; // 当配信の最大値よりも大きい
 unit:
  | 'upVote' // 高評価数
  | 'viewer'; // 閲覧数
 value: number;
}
