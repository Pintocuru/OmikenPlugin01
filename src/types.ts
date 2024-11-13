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
  defaultState: DefaultState | CharaStyles; // プラグインの初期状態
  init?(api, initialData): void; // 初期化関数
  subscribe?(type, ...args): void; // permissions依存の汎用関数
  filterComment?(comment, service, userData): Promise<false | BaseComment>; // コメントフィルタ関数
  filterSpeech?(text, userData, config): Promise<string | false>; // 読み上げフィルタ
  subscribe?(type, ...args): void; // サブスクライブ関数
  request?(req): Promise<PluginResponse>; // リクエスト処理関数
  destroy?(): void; // プラグイン終了時の処理関数
  [key: string]: any;

  // 以下ユーザーで追加した型
  functionOmikuji(displayName: string, modes: string | number, comment: any): any; // おみくじ
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

// キャラクターJSONの型定義
interface CharaStyles {
  character: {
    [key: string]: {
      id: string; // ?キー名(必要だろうか?)
      name: string; // キャラクターの名前
      frameId?: string; // わんコメの枠を指定
      "--lcv-name-color": string; // 名前の色
      "--lcv-text-color": string; // コメントの色
      "--lcv-background-color": string; // 背景色
    };
  }
  characterImage: {
    [key: string]: {
      Default: string; // defaultは必須
      [key: string]: string; // 追加のキーに対応
    };
  }
}

// ---------------------------------------------------

// 追加コメント[omiken]の型定義
interface omikenList {
  isOverlapping?: boolean;
  omikujiName?: string;
  message?: string[];
  party?: string[];
  toast?: string[];
  speech?: string[];
}

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
  omikenData?: omikenList;
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