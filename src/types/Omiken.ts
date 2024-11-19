// src/types/Omiken.ts

///////////////////////////////////
// Omiken
///////////////////////////////////

// Omibot:おみくじボット用型定義
export interface OmikenType {
  rules: Record<string, ListTypeMap["rules"]>; // おみくじのルールを管理
  rulesOrder: string[]; // ルールの順序
  omikuji: Record<string, ListTypeMap["omikuji"]>; // おみくじ関連のメッセージ
  place: Record<string, ListTypeMap["place"]>; // プレースホルダー
  preferences: PreferencesType;
}

// コンテンツの型マッピング
export type ListTypeMap = {
  rules: RulesType;
  omikuji: OmikujiType;
  place: PlaceType;
};
export type ListItemTypeMap = {
  rules: Record<string, RulesType>;
  omikuji: Record<string, OmikujiType>;
  place: Record<string, PlaceType>;
  rulesOrder: string[]; // 追加
};

// 基本となる項目のインターフェース
interface BaseType {
  id: string; // キー名
  name: string; // ルール名
  description: string; // 説明文
}

///////////////////////////////////
// rules
///////////////////////////////////

// rules:おみくじルールの型定義
export interface RulesType extends BaseType {
  color: string; // edit時、識別する際に付ける色
  threshold: RuleThresholdType; // 発動条件
  enabledIds: string[]; // omikujiの適用するIDリスト
}

///////////////////////////////////
// omikuji
///////////////////////////////////

// おみくじメッセージの型定義
export interface OmikujiType extends BaseType {
  weight: number; // 出現割合
  threshold: OmikujiThresholdType; // 発動条件
  post: OmikujiPostType[];
}

// メッセージの投稿情報を管理する型
export interface OmikujiPostType {
  type:
    | "onecomme" // わんコメへの投稿
    | "party" // WordPartyの投稿
    | "toast" // トースト投稿
    | "speech"; // わんコメのスピーチ機能
  botKey: string; // ボットキー
  iconKey: string; // アイコンキー
  delaySeconds: number; // メッセージを送信するまでの遅延時間
  content: string; // メッセージ内容
}

///////////////////////////////////
// Threshold(rules,omikuji)
///////////////////////////////////

// 共通の条件型
export interface ThresholdTypeCommon {
  match?: string[]; // キーワード
  access?: AccessCondition; // ユーザーの役職
  count?: CountCondition; // コメント数
  gift?: GiftCondition; // ギフト
}

// ルール用の条件型
export interface RuleThresholdType extends ThresholdTypeCommon {
  conditionType: ConditionRulesType;
  syoken?: SyokenCondition; // 初見・久しぶり
  timer?: TimerCondition; // タイマー(number,時報ありか
}

// おみくじ用の条件型
export interface OmikujiThresholdType extends ThresholdTypeCommon {
  conditionType: ConditionOmikujiType;
  clock?: ClockCondition; // 時刻
  elapsed?: ElapsedCondition; // 経過時間
}

// ThresholdType
export type ThresholdType = RuleThresholdType | OmikujiThresholdType;

export type ConditionType = ConditionRulesType | ConditionOmikujiType;
// condition選択用
export type ConditionRulesType =
  | "match"
  | "count"
  | "gift"
  | "access"
  | "syoken"
  | "timer";
export type ConditionOmikujiType =
  | "none"
  | "access"
  | "match"
  | "clock"
  | "elapsed"
  | "count"
  | "gift";

// 初見・コメント履歴の種別
export enum SyokenCondition {
  SYOKEN = "syoken", // 初見
  HI = "hi", // その配信枠で1回目のコメント
  AGAIN = "again", // 前回のコメントから7日以上経過
}

// ルールの有効/無効 0:OFF/1:だれでも/2:メンバー/3:モデレーター/4:管理者
export enum AccessCondition {
  OFF = 0,
  ANYONE = 1,
  MEMBER = 2,
  MODERATOR = 3,
  ADMIN = 4,
}

// タイマー
export interface TimerCondition {
  type: "timer";
  minutes: number;
  isBaseZero: boolean;
}

// clock:時間指定(0-23時)
export interface ClockCondition {
  type: "clock";
  startHour: number;
  durationHours: number;
}

// 共通の定義
export type ComparisonType = "min" | "max" | "range" | "equal" | "loop";
export interface BaseCondition {
  value1: number;
  value2?: number;
}

// Elapsed: 投稿してからの時間(interval:ミリ秒)
export interface ElapsedCondition extends BaseCondition {
  type: "elapsed";
  comparison: Extract<ComparisonType, "min" | "max" | "range">;
  unit: "second" | "minute" | "hour" | "day";
}

// lc:配信枠の全体コメ数 / no:配信枠の個人コメ数 / tc:総数の個人コメ数
export interface CountCondition extends BaseCondition {
  type: "count";
  comparison: ComparisonType;
  unit: "lc" | "no" | "tc";
}

// Gift:ギフト金額
export interface GiftCondition extends BaseCondition {
  type: "gift";
  comparison: Extract<ComparisonType, "min" | "max" | "range" | "equal">;
}

///////////////////////////////////
// Place
///////////////////////////////////

// プレースホルダー項目の型定義
export interface PlaceType extends BaseType {
  type: "single" | "weight" | "script"; // モード
  values?: PlaceValueType[]; // 値の配列
  script?: {
    // 外部スクリプト（optional）
    url: string;
    returnData: object;
  };
}
// プレースホルダーの値
export type PlaceValueType = {
  weight: number; // 出現割合
  value: string; // 値（他のプレースホルダーへの参照可能: <<place_name>>）
};

///////////////////////////////////
// Preferences
///////////////////////////////////

// 設定の型定義
export interface PreferencesType {
  basicDelay: number; // コメントしてからBotが反応するまでの遅延(秒)
  omikujiCooldown: number; // おみくじ機能のクールダウン時間（秒)
  commentDuration: number; // コメントしてからおみくじを有効とする時間(秒)
  BotUserIDname: string; // このスクリプトBOTのcomment.data.userId
}
