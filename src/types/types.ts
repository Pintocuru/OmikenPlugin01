// src/types.ts


// プラグインの型定義
// https://types.onecomme.com/interfaces/types_Plugin.OnePlugin
export interface OnePlugin {
  name: string; // プラグイン名
  uid: string; // 一意のプラグインID
  version: string; // バージョン番号
  url?: string; // ドキュメントやサポートページのURL
  author?: string; // 開発者名
  permissions: (PluginFilterEvent | SendType)[]; // 必要な権限
  defaultState: Record<string, any>; // プラグインの初期状態
  init?(api, initialData): void; // 初期化関数
  subscribe?(type, ...args): void; // permissions依存の汎用関数
  filterComment?(comment, service, userData): Promise<false | BaseComment>; // コメントフィルタ関数
  filterSpeech?(text, userData, config): Promise<string | false>; // 読み上げフィルタ
  subscribe?(type, ...args): void; // サブスクライブ関数
  request?(req): Promise<PluginResponse>; // リクエスト処理関数
  destroy?(): void; // プラグイン終了時の処理関数
  [key: string]: any;

  // 以下ユーザーで追加した型
  functionOmikuji(
    displayName: string,
    modes: string | number,
    comment: any
  ): any; // おみくじ
}

// ---------------------------------------------------

// permissions の指定
type PluginFilterEvent = "filter.comment" | "filter.speech";
type SendType =
  | "connected"
  | "comments"
  | "systemComment"
  | "clear"
  | "deleted"
  | "meta"
  | "meta.clear"
  | "config"
  | "userDatas"
  | "services"
  | "notification"
  | "pinned"
  | "waitingList"
  | "bookmarked"
  | "setList"
  | "reactions"
  | "wp.update"
  | "wp.exec"
  | "setList.request"
  | "yt.survey.start"
  | "yt.survey.update"
  | "yt.survey.finish"
  | "ni.survey.start"
  | "ni.survey.finish"
  | "toast";

// ---------------------------------------------------


// DefaultStateインターフェース: 全体の設定を管理する
interface DefaultState {
  defaultRules: omikujiRule[];  // プリセットルール
  rules: omikujiRule[];  // おみくじのルールを管理
  botMessage: {
    omikuji: OmikujiMessage[];  // おみくじ関連のメッセージ
    random: RandomItem[];  // 
  };
}

// おみくじルールの型定義
export interface omikujiRule {
  name: string;  // ルール名（例: "おみくじ"）
  modes: string;  // モード
  modeSelect: string[]; // モードセレクト
  switch: 0 | 1 | 2 | 3 | 4;  // ルールの有効/無効 0:OFF/1:だれでも/2:メンバー以上/3:モデレーター/4:管理者
  matchExact?: string[];  // 完全一致するキーワードの配列（省略可）
  matchStartsWith?: string[];  // 特定のフレーズで始まるキーワード（省略可）
  matchIncludes?: string[];  // 部分一致するキーワード（省略可）
}

// おみくじメッセージの型定義
export interface OmikujiMessage {
  name: string;  // 結果名
  weight: number;  // メッセージの重み付け
  threshold: { // フィルタリング基準
    // none:基準なし lc:配信枠のコメント番号 no:配信枠の個人コメント数 tc:総数の個人コメント数
    // hour:投稿してからの時間(interval*1000*60*60) price:ギフト金額 custom:その他(script参照)
    type: 'none' | 'lc' | 'no' | 'tc' | 'hour' | 'price' | 'custom';
    value: number;  // 基準となる数値
    comparison: -1 | 0 | 1 | 2; // 比較方法（-1:以下 0:等しい 1:以上 2:ループ）
  };
  message?: Post[];  // 通常メッセージ（省略可）
  party?: Post[];  // パーティーメッセージ（省略可）
  toast?: Post[];  // トースト通知メッセージ（省略可）
  speech?: Post[];  // スピーチ用メッセージ（省略可）
}

// メッセージの投稿情報を管理する型
interface Post {
  botKey?: number;  // ボットキー（省略可）
  iconKey?: string;  // アイコンキー（省略可）
  delaySeconds: number;  // メッセージを送信するまでの遅延時間
  content: string;  // メッセージ内容
}

// ランダムメッセージ項目の型定義
interface RandomItem {
  placeholder: string; // プレースホルダー名
  weight: number;  // ランダム選択時の重み付け
  group: number;  // グループ番号
  content: string;  // メッセージ内容
}

// ---------------------------------------------------


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

// rules:おみくじルールの型定義
export interface RulesType extends BaseType {
  color: string; // edit時、識別する際に付ける色
  threshold: RuleThresholdType; // 発動条件
  enabledIds: string[]; // omikujiの適用するIDリスト
}

// おみくじメッセージの型定義
export interface OmikujiType extends BaseType {
  weight: number; // 出現割合
  threshold: OmikujiThresholdType; // 発動条件
  post: OmikujiPostType[];
}

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
  | "gift"
  | "syoken"
  | "access"
  | "count"
  | "timer";
export type ConditionOmikujiType =
  | "none"
  | "gift"
  | "access"
  | "match"
  | "clock"
  | "elapsed"
  | "count"
  ;

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
  type: 'timer';
  minutes: number;
  isBaseZero: boolean;
}

// clock:時間指定(0-23時)
export interface ClockCondition {
  type: 'clock';
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
  type: 'elapsed';
  comparison: Extract<ComparisonType, "min" | "max" | "range">;
  unit: "second" | "minute" | "hour" | "day";
}

// lc:配信枠の全体コメ数 / no:配信枠の個人コメ数 / tc:総数の個人コメ数
export interface CountCondition extends BaseCondition {
  type: 'count';
  comparison: ComparisonType;
  unit: "lc" | "no" | "tc";
}

// Gift:ギフト金額
export interface GiftCondition extends BaseCondition {
  type: 'gift';
  comparison: Extract<ComparisonType, "min" | "max" | "range" | "equal">;
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

// プレースホルダー項目の型定義
export interface PlaceType extends BaseType {
  isWeight: boolean; // モード
  values: PlaceValueType[]; // 値の配列
}

// プレースホルダーの値
export type PlaceValueType = {
  weight: number; // 出現割合
  value: string; // 値（他のプレースホルダーへの参照可能: <<place_name>>）
};

// 設定の型定義
export interface PreferencesType {
  basicDelay: number; // コメントしてからBotが反応するまでの遅延(秒)
  omikujiCooldown: number; // おみくじ機能のクールダウン時間（秒)
  commentDuration: number; // コメントしてからおみくじを有効とする時間(秒)
  BotUserIDname: string; // このスクリプトBOTのcomment.data.userId
}

// ---------------------------------------------------

// CHARA:キャラクターJSONの型定義
export interface CHARAType {
  id: string; // キー名
  name: string; // キャラクターの名前
  frameId?: string; // わんコメの枠
  color: {
    "--lcv-name-color": string; // 名前の色
    "--lcv-text-color": string; // コメントの色
    "--lcv-background-color": string; // 背景色
  };
  image: {
    Default: string; // defaultは必須
    [key: string]: string; // 追加のキーに対応
  };
}
// ---------------------------------------------------


// ---------------------------------------------------

// commentの型定義
// https://types.onecomme.com/interfaces/types_Comment.BaseComment
export interface BaseComment {
  color: RGBColor;
  id: string;
  data: Partial<CommentResponse>;
  meta?: BaseCommentMeta;
  name: string;
  service: keyof ServiceList;
  url: string;
  omikenToast?: OmikujiPostType[];
}
interface RGBColor {
  b: number;
  g: number;
  r: number;
}
interface BaseCommentMeta {
  free?: boolean;
  interval?: number;
  lc?: number;
  no?: number;
  tc?: number;
}
interface ServiceList {
  bilibili: "bilibili";
  doneru: "doneru";
  external: "external";
  kick: "kick";
  mirrativ: "mirrativ";
  mixch: "mixch";
  niconama: "niconama";
  showroom: "showroom";
  streamlabs: "streamlabs";
  system: "system";
  tiktok: "tiktok";
  twicas: "twicas";
  twitch: "twitch";
  twitter: "twitter";
  vtips: "vtips";
  youtube: "youtube";
}
interface CommentResponse {
  badges: BaseBadge[];
  comment: string;
  commentVisible?: boolean;
  displayName?: string;
  gift?: any;
  giftData?: any;
  hasGift: boolean;
  id: string;
  isFirstTime?: boolean;
  isOwner: boolean;
  isRepeater?: boolean;
  liveId: string;
  meta?: any;
  name: string;
  nickname?: string;
  originalProfileImage?: string;
  price?: number;
  profileImage: string;
  speechText?: string;
  timestamp: string;
  userId: string;
}
interface BaseBadge {
  label: string;
  url: string;
}




// ---------------------------------------------------

// APIの型定義
interface PluginResponse {
  code: number;
  response: string;
}