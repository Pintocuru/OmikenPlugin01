// src/types/plugin.ts

import { OnePlugin } from '@onecomme.com/onesdk/types/Plugin';
import { Service } from '@onecomme.com/onesdk/types/Service';
import { BaseResponse } from '@onecomme.com/onesdk/types/BaseResponse';
import { OmikenType, RulesType, TypesType } from './Omiken';
import { CharaType, PresetType, ScriptsParamType } from './preset';

// ---------------------------------------------------

// プラグイン:AppPlugin の型定義
export interface StoreType {
 Visits: Record<string, VisitType>;
 Games: Record<string, GameType>;
 TimeConfig: TimeConfigType;
}

// プラグイン:AppPlugin で呼び出すすべての型定義
export interface StoreAllType extends StoreType {
 store?: any; // ElectronStore不具合のためanyにしています。 ElectronStore<StoreType>
 Omiken: OmikenType;
 OmikenTypesArray?: Record<TypesType, RulesType[]>;
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
 lc: number; // プラグインを起動してからカウントしたコメント数
 lastTime: number; // 最後におみくじ機能が実行された時刻
 lastUserId: string; // 最後におみくじを行ったuserId
}

// ---

// わんコメにpostする際の型定義
export interface postOneCommeRequestType {
 service: Pick<Service, 'id' | 'translate'>;
 comment: Pick<
  BaseResponse,
  | 'id' // 一意のID
  | 'userId' //
  | 'name' // 表示名
  | 'nickname' // ユーザーネームの変更、nameを表示させたいが読み上げさせない時に使う
  | 'comment' // コメント
  | 'profileImage' // アイコン
  | 'badges' // メンバーやモデレーター等の表示用バッジ
  | 'liveId' // 【仕様とは異なる】 ジェネレーターに渡す引数(generatorParam)
  | 'isOwner' // 【仕様とは異なる】 BOTの読み上げを行わない(isSilent)
 >;
}
/*
プラグインで使えるキー/仕様変更で使えなくなる可能性あり
service.translate(string[])
comment.isOwner(boolean)
comment.isFirstTime(boolean)
comment.isRepeater(boolean)

・BaseResponse にはないキー
comment.colors(Colors)


timestamp 変更する理由がない
hasGift(boolean): ギフトで使用
commentVisible(boolean): プラグインのfilter.commentでfalseする効果と同じ

効かなかったリスト
speechText
originalProfileImage
meta

*/

// ---------------------------------------------------


// ---

// API用

// パラメータの型定義
export type ParamsType = DataModeParams | BackupModeParams;

// データ取得用型定義
interface DataModeParams {
  mode: Mode.Data;
  type: DataType.Omiken | DataType.Presets | DataType.Charas | DataType.Scripts | DataType.Visits | DataType.Games;
}

// バックアップ用型定義
interface BackupModeParams {
  mode: Mode.Backup;
  type: DataType.Omiken | DataType.Presets | DataType.TimeConfig;
}


// モードを定義
export enum Mode {
  Data = 'data', // データ取得
  Backup = 'backup', // バックアップ(エディター用)
}

// データの種類を定義
export enum DataType {
  Omiken = 'Omiken', // おみくじデータ
  Presets = 'Presets', // preset(おみくじデータ)
  Charas = 'Charas', // キャラデータ
  Scripts = 'Scripts', // スクリプト
  Visits = 'Visits', // 個人データ
  Games = 'Games', // スクリプトデータ
  TimeConfig = 'TimeConfig', // 設定(未使用かも)
}
