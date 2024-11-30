// src/types/plugin.ts

import { Comment } from "@onecomme.com/onesdk/types/Comment";
import { CharaType, OmikenType, OmikujiPostType } from "./index";

// ---------------------------------------------------

// プラグイン:AppPlugin の型定義
// TODO 修正が必要
export interface StoreType {
  Omiken: OmikenType;
  Chara: Record<string, CharaType>;
  Visits: Record<string, VisitType>;
  Games: Record<string, GameType>;
  nowSlotId: string; // 現在の配信枠のID
  lastCommentTime: number; // 最後にコメントを通したTime
}

// ユーザーデータ(全体)
export interface VisitType {
  name: string; // ユーザー名(ニックネーム)
  userId: string; // ユーザーID
  status: string; // ステータス
  serviceId: string; // (前回コメントした配信枠のid)
  visitData: Record<string, visitDataType>;
}

// draws基礎
interface DrawsBase {
  id: string; // id
  draws: number; // 該当するおみくじを行った配信枠での回数
  totalDraws: number; // 該当するおみくじを行った総回数
}

// ユーザーデータ(個別)
export interface visitDataType extends DrawsBase {
  count: [number, number, number];
  items: string[];
}
// おみくじデータ
export interface GameType extends DrawsBase {
  gameData: any; // scriptで自由に使えるObject
}

// ---------------------------------------------------

// commentの型定義にOmikenを追加
// https://types.onecomme.com/interfaces/types_Comment.BaseComment
export type CommentOmiken = Comment & {
  omiken: OneCommeOmikenType;
};

// 追加:各ジェネレーターで使用するキー集
export interface OneCommeOmikenType {
  toast?: OmikujiPostType[]; // トーストジェネレーター用
  [key: string]: any;
}
