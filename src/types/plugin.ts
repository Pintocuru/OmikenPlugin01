// src/types/plugin.ts

import { Comment } from "@onecomme.com/onesdk/types/Comment";
import { CharaType, OmikenType, OmikujiPostType, PresetScriptType } from "./index";
import { OnePlugin } from "@onecomme.com/onesdk/types/Plugin";
import ElectronStore from "electron-store";
import { Service } from "@onecomme.com/onesdk/types/Service";

// ---------------------------------------------------

// プラグイン:AppPlugin の型定義
// TODO 修正が必要
export interface StoreType {
  Omiken: OmikenType;
  Charas: Record<string, CharaType>;
  Scripts: Record<string, PresetScriptType>;
  Visits: Record<string, VisitType>;
  Games: Record<string, GameType>;
  TimeConfig: TimeConfigType;
}

// ユーザーデータ(全体)
export interface VisitType {
  name: string; // ユーザー名(ニックネーム)
  userId: string; // ユーザーID
  status: string; // ステータス
  lastPluginTime: number; // 前回コメントした配信枠のactiveTime
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

// TimeConfig
export interface TimeConfigType {
  defaultFrameId: string; // わんコメの一番上の枠ID(わんコメの投稿で使用)
  pluginTime: number; // プラグインを起動した時刻
  lastTime: number; // 最後におみくじ機能が実行された時刻
  lastUserId: string; // 最後におみくじを行ったuserId
}


// ---

// わんコメにpostする際の型定義
export interface postOneCommeRequestType {
  service: Pick<Service, "id">;
  comment: {
    id: string;
    userId: string;
    name: string;
    comment: string;
    profileImage?: string;
  };
}

// ---------------------------------------------------

// commentの型定義にOmikenを追加
// ! この仕様は実現できなそう…(コメントを非表示にできれば別だけど)
// https://types.onecomme.com/interfaces/types_Comment.BaseComment
export type CommentOmiken = Comment & {
  omiken: OneCommeOmikenType;
};

// 追加:各ジェネレーターで使用するキー集
interface OneCommeOmikenType {
  toast?: OmikujiPostType[]; // トーストジェネレーター用
  [key: string]: any;
}

// 既存のOnePluginに追加する拡張型
export interface OnePluginOmiken extends OnePlugin {
  defaultState: Partial<StoreType>;

  // プラグイン固有の追加メソッドや属性も必要に応じて定義可能
  initLoadData?(): void;
}