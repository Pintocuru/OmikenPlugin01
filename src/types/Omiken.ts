// src/types/Omiken.ts

///////////////////////////////////
// Omiken
///////////////////////////////////

// Omiken:おみくじ&初見判定ちゃんBOT用型定義
export interface OmikenType {
  rules: Record<string, RulesType>; // おみくじのルールを管理
  rulesOrder: string[]; // ルールの順序
  omikujis: Record<string, OmikujiType>; // おみくじ関連のメッセージ
  places: Record<string, PlaceType>; // プレースホルダー
}

// コンテンツの型マッピング
export type ListTypeMap = {
  rule: RulesType;
  omikuji: OmikujiType;
  place: PlaceType;
};
export type ListItemTypeMap = Omit<OmikenType, "rulesOrder">;

///////////////////////////////////
// rules/omikuji/place 共通
///////////////////////////////////

// 基本となる項目のインターフェース
export interface BaseType {
  id: string; // キー名
  name: string; // ルール名
  description: string; // 説明文
}

///////////////////////////////////
// rules
///////////////////////////////////

// rules:おみくじルールの型定義
export interface RulesType extends BaseType {
  color: string; // エディターでの識別用カラー
  ruleType:
    | false // 無効
    | "comment" // コメントでの起動
    | "timer"; // タイマー(定期的な起動)
  enableIds: string[]; // このrulesで使用する、omikujiリスト
  threshold: ThresholdType[]; //発動条件(2件まで)
  timerConfig?: {
    // タイマー用設定リスト
    minutes: number;
    isBaseZero: boolean;
  };
}

///////////////////////////////////
// omikuji
///////////////////////////////////

// おみくじメッセージの型定義
export interface OmikujiType extends BaseType {
  rank: number; // 優先度
  weight: number; // 出現割合
  threshold: ThresholdType[]; // 発動条件
  status?: string; // ユーザーに対するステータスの付与
  isDelete: boolean; // コメントを無効にするか
  isSilent: boolean; // 読み上げを無効にするか
  script?: {
    scriptId: string; // 使用する外部スクリプトのid
    parameter: string; // 外部スクリプトに渡す引数
  };
  placeIds: string[]; // 使用するプレースホルダーのid
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
  party: string; // 発動するWordParty
  delaySeconds: number; // メッセージを送信するまでの遅延時間
  content: string; // メッセージ内容
}

///////////////////////////////////
// Place
///////////////////////////////////
// プレースホルダー項目の型定義
export interface PlaceType extends BaseType {
  values: PlaceValueType[];
}

export type PlaceValueType = {
  weight: number; // 出現割合
  value: string; // 値（他のプレースホルダーへの参照可能: <<place_name>>）
};

///////////////////////////////////
// Threshold(rules,omikuji)
///////////////////////////////////

// 共通の条件型
export interface ThresholdType {
  conditionType: ConditionType;
  target?: null; // 前回のコメントと今回のコメントが同一人物なら適用
  cooldown?: number; // おみくじ機能が機能してから指定した時間(秒)が経過していない場合に適用
  syoken?: SyokenCondition; // 初見・久しぶり
  access?: AccessCondition; // ユーザーの役職
  count?: CountCondition; // 数値を参照する
  match?: MatchCondition; // 文字列を参照する
}

// condition選択用
export type ConditionType =
  | "target"
  | "cooldown"
  | "syoken"
  | "access"
  | "count"
  | "match";

// 初見・コメント履歴の種別
export enum SyokenCondition {
  SYOKEN = 1, // 初見
  AGAIN = 2, // 前回のコメントから7日以上経過
  HI = 3, // その配信枠で1回目のコメント
}

// ルールの有効/無効 0:OFF/1:だれでも/2:メンバー/3:モデレーター/4:管理者
export enum AccessCondition {
  MEMBER = 2,
  MODERATOR = 3,
  ADMIN = 4,
}

// count:数値を参照する
export interface CountCondition {
  comparison:
    | "min" // 数値以下(未満、～より上はありません)
    | "max" // 数値以上
    | "range" // value1以上 value2以下
    | "equal" // 等しい
    | "loop"; // 数値をvalue1で割った数
  unit:
    | "draws" // その枠でrulesに該当した回数(個人)
    | "totalDraws" // その枠でrulesに該当した回数(合計)
    | "gameDraws" // rulesに該当した総回数(個人)
    | "gameTotalDraws" // rulesに該当した総回数(合計)
    | "gift" // ギフトの金額(comment.data.price)
    | "lc" // 配信枠の全体コメ数(comment.meta.lc)
    | "no" // 配信枠の個人コメ数(comment.meta.no)
    | "tc" // 総数の個人コメ数(comment.meta.tc)
    | "interval"; // そのユーザーの前回のコメントからの経過時間(ミリ秒)(comment.meta.interval)
  value1: number;
  value2: number;
}

// match:文字列を参照する
export interface MatchCondition {
  target:
    | "status" // ユーザーごとのstatus
    | "comment" // コメント(comment.data.comment)
    | "name" // 名前(comment.data.name)
    | "displayName"; // ニックネーム(comment.data.displayName)
  case:
    | "exact" // 完全一致
    | "starts" // 前方一致
    | "include"; // 部分一致
  value: string[]; // 検索ワード
}
