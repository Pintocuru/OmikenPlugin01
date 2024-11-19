// src/types.ts

import { CHARAType, OmikenType, OmikujiPostType } from "./index";

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
}
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

// APIの型定義
interface PluginResponse {
  code: number;
  response: string;
}
// ---------------------------------------------------

// OmikenアプリでのdefaultState の型定義
interface defaultStateOmikenType {
  AppState: {
    Omiken: OmikenType;
    CHARA: CHARAType;
    Visits: VisitsType;
    Games: GanesType;
    nowSlotId: string; // 現在の配信枠のID
    lastCommentTime: DataTransfer; // 最後にコメントを通したTime
  };
}

// ユーザーデータ
interface VisitsType {
  [key: string]: {
    name: string; // ユーザー名(ニックネーム)
    nowSlotId: string; // (前回コメントした配信枠のid)
    visitData: {
      [key: string]: {
        id: string;
        draws: number; // 該当するおみくじを行った配信枠での回数:取得対象
        totalDraws: number; // 該当するおみくじを行った総回数:取得対象
        count: [number, number, number]; // 任意で保存する数値(3つまで):取得対象
        items: string[]; // 任意で保存する文字列:取得対象
      };
    };
  };
}

// 個別のおみくじデータ
interface GanesType {
  [key: string]: {
    id: string;
    draws: number; // 該当するおみくじを行った配信枠での回数
    totalDraws: number; // 該当するおみくじを行った総回数
    gamesData: any; // scriptで自由に使えるObject
  };
}

// ---------------------------------------------------

// 追加:各ジェネレーターで使用するキー集
export interface OneCommeOmikenType {
  toast?: OmikujiPostType[];
  [key: string]: any;
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
  // 追加:
  omiken: OneCommeOmikenType;
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
// YouTube.CommentResponse を入れてます
interface CommentResponse {
  autoModerated: boolean;
  badges: BaseBadge[];
  colors?: Colors;
  comment: string;
  commentVisible?: boolean;
  displayName?: string;
  giftType?:
    | "superchat"
    | "supersticker"
    | "sponsorgift"
    | "giftreceived"
    | "milestonechat";
  hasGift: boolean;
  id: string;
  isFirstTime?: boolean;
  isMember: boolean;
  isModerator: boolean;
  isOwner: boolean;
  isQuestion?: boolean;
  isRepeater?: boolean;
  isSponsorshipGiftReceiver?: boolean;
  isSponsorshipGiftSender?: boolean;
  liveId: string;
  membership?: MemberShip;
  meta?: CommentMeta;
  name: string;
  nickname?: string;
  originalProfileImage?: string;
  paidText?: string;
  price?: number;
  profileImage: string;
  speechText?: string;
  tier?: number;
  timestamp: string;
  unit?: string;
  userId: string;
  // Twitch追加分
  subscriber?: "0" | "1";
}
interface BaseBadge {
  label: string;
  url: string;
}
interface Colors {
  authorNameTextColor?: string;
  bodyBackgroundColor: string;
  bodyTextColor: string;
  headerBackgroundColor: string;
  headerTextColor: string;
  timestampColor?: string;
}
interface MemberShip {
  primary: string;
  sub: string;
}
interface CommentMeta {
  anonymity?: boolean;
  hasMemo?: boolean;
  hasNickname?: boolean;
  label?: string;
}
