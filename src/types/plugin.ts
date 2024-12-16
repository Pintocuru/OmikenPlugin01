// src/types/plugin.ts

import { OnePlugin } from "@onecomme.com/onesdk/types/Plugin";
import { Service } from "@onecomme.com/onesdk/types/Service";
import { BaseResponse } from "@onecomme.com/onesdk/types/BaseResponse";
import { OmikenType } from "./Omiken";
import { CharaType, PresetType, ScriptsParamType } from "./preset";

// ---------------------------------------------------

// プラグイン:AppPlugin の型定義
export interface StoreType {
  Visits: Record<string, VisitType>;
  Games: Record<string, GameType>;
  TimeConfig: TimeConfigType;
}

// プラグイン:AppPlugin で呼び出すすべての型定義
export interface StoreAllType extends StoreType {
  Omiken: OmikenType;
  Presets: Record<string, OmikenType>;
  Charas: Record<string, CharaType>;
  Scripts: Record<string, ScriptsParamType>;
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
  gameData: Record<string, unknown>; // scriptで自由に使えるObject
}

// TimeConfig
export interface TimeConfigType {
  pluginTime: number; // プラグインを起動した時刻
  lc:number; // プラグインを起動してからカウントしたコメント数
  lastTime: number; // 最後におみくじ機能が実行された時刻
  lastUserId: string; // 最後におみくじを行ったuserId
}


// ---

// わんコメにpostする際の型定義
export interface postOneCommeRequestType {
  service: Pick<Service, "id" | "translate">;
  comment: Pick<
    BaseResponse,
    | "id" // 一意のID
    | "userId" //
    | "name" // 表示名
    | "nickname" // ユーザーネームの変更、nameを表示させたいが読み上げさせない時に使う
    | "comment" // コメント
    | "profileImage" // アイコン
    | "badges" // メンバーやモデレーター等の表示用バッジ
    | "liveId" // 【仕様とは異なる】 ジェネレーターに渡す引数(generatorParam)
    | "isOwner" // 【仕様とは異なる】 BOTの読み上げを行わない(isSilent)
  >;
}
/*
プラグインで使えるキー/仕様変更で使えなくなる可能性あり
service.translate(string[])
comment.liveId(string)
comment.badges(url:string,label:string,) ただしジェネレーターでバッチ部分に空白ができる
comment.isOwner(boolean)
comment.isFirstTime(boolean)
comment.isRepeater(boolean)

・BaseResponse にはないキー
comment.colors(Colors)



timestamp 変更する理由がない
hasGift(boolean): ギフトリストに載るが、priceやunit等が使えなかった
commentVisible(boolean): プラグインのfilter.commentでfalseする効果と同じ

効かなかったリスト
speechText
originalProfileImage
meta

*/

// ---------------------------------------------------



// 既存のOnePluginに追加する拡張型
export interface OnePluginOmiken extends OnePlugin {
  defaultState: Partial<StoreType>;

  // プラグイン固有の追加メソッドや属性も必要に応じて定義可能
  initLoadData?(): void;
}