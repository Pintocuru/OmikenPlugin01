// src/types/plugin.ts

import { OmikenType, OmikujiType, RulesType, TypesType } from './Omiken';
import { CharaType, ScriptParam, ScriptsParamType, ScriptsType } from './preset';
import { Service } from '@onecomme.com/onesdk/types/Service';
import { BaseResponse } from '@onecomme.com/onesdk/types/BaseResponse';
import { Comment } from '@onecomme.com/onesdk/types/Comment';
import { UserNameData } from '@onecomme.com/onesdk/types/UserData';

// ---------------------------------------------------

// ElectronStore用の型
export interface StoreType {
 store: any; // ElectronStore不具合のためany ElectronStore<StoreType>
 Omiken: OmikenType;
 Visits: Record<string, VisitType>;
 Games: Record<string, GameType>;
}

// おみくじBOT用の型
export interface StoreMainType extends StoreType {
 OmikenTypesArray?: Record<TypesType, RulesType[]>;
 Charas: Record<string, CharaType>;
 Scripts: Record<string, ScriptsType>;
 TimeConfig: TimeConfigType;
}

// API用の型
export interface StoreApiType extends StoreType {
 Presets: Readonly<Record<string, OmikenType>>;
 Charas: Record<string, CharaType>;
 Scripts: Record<string, ScriptsType>;
}

// 全体設定用の型
export interface StoreAllType extends StoreMainType {
 Presets: Record<string, OmikenType>;
 filterCommentProcess(comment: Comment, userData: UserNameData): void;
 timerSelector: any; // プラグイン専用の型なのでany
}

// プラグインのデータを更新するreturn用の型
export interface PluginUpdateData {
 Games?: Record<string, GameType>;
 Visits?: Record<string, VisitType>;
 TimeConfig?: TimeConfigType;
}

// ---

// ユーザーデータ(全体)
export interface VisitType {
 name: string; // ユーザー名(ニックネーム)
 userId: string; // ユーザーID
 round: number; // コメントした配信枠の数
 status: string; // 任意のステータス(共通)
 point: number; // 任意のポイント(共通)
 lastPluginTime: number; // 前回コメントした配信枠のactiveTime
}

interface DrawsType {
 draws: number; // 配信枠での、おみくじ回数
 totalDraws: number; // おみくじの総回数
}

// おみくじデータ
export interface GameType extends DrawsType {
 ruleId: string; // rulesのID(key)
 settings: ScriptParam[]; // scriptParamsで設定したisEverのデータが入る
 userStats: Record<string, UserStatsType>;
 currentUserIds: string[]; // ユーザー履歴
 [key: string]: any; // scriptで自由に使えるObject
}

// ユーザーデータ
export interface UserStatsType extends DrawsType {
 userId: string;
 name?: string; // 名前
 wins?: number; // 配信枠での、おみくじ勝利数
 totalWins?: number; // おみくじの総勝利数
 points?: number; // 配信枠での、おみくじポイント数
 totalPoints?: number; // おみくじの総ポイント数
 status?: string; // おみくじのステータス
 items?: Record<string, string>; // おみくじで得たアイテム
 lastPlayed?: string; // 最終プレイ日時
}

// ---

// 選択したおみくじ
export interface OmikujiSelectType extends OmikujiType {
 selectRuleId: string; // 選択されたルールのid
}

// TimeConfig
export interface TimeConfigType {
 pluginTime: number; // プラグインを起動した時刻
 lc: number; // プラグインを起動してからカウントしたコメント数
 lastTime: number; // 最後におみくじ機能が実行された時刻
 lastUserId: string; // TODO 廃止(Gamesが担う) 最後におみくじを行ったuserId
}

// ---

// わんコメSend Commentの型定義
export interface SendCommentType {
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

// わんコメSend Test Comment型定義
export interface SendTestCommentType{
 platform: string;
 hasGift: boolean;
 unit: string;
 price: number;
 giftType: string;
 newComment: boolean;
 repeater: boolean;
 subscribe: boolean;
 speech: boolean;
 username: string;
 comment: string;
}

// ---

// API用

// パラメータの型定義
export type ParamsType = PingModeParams | DataModeParams | AllDataModeParams | BackupModeParams;

// Ping用型定義
interface PingModeParams {
 method: 'GET';
 mode: Mode.Ping;
 type?: never;
}

// データ取得用型定義
interface DataModeParams {
 method: 'GET';
 mode: Mode.Data;
 type: DataType.Omiken | DataType.Presets | DataType.Charas | DataType.Scripts | DataType.Visits | DataType.Games;
}

// 一括でのデータ取得用型定義
interface AllDataModeParams {
 method: 'GET';
 mode: Mode.AllData;
 type?: never;
}

// バックアップ用型定義
interface BackupModeParams {
 method: 'POST';
 mode: Mode.Backup;
 type: DataType.Omiken | DataType.Presets;
}

// モードを定義
export enum Mode {
 Ping = 'ping', // データ取得
 Data = 'data', // データ取得
 Backup = 'backup', // バックアップ(エディター用)
 AllData = 'allData' // すべてのデータ取得
}

// データの種類を定義
export enum DataType {
 Omiken = 'Omiken', // おみくじデータ
 Presets = 'Presets', // preset(おみくじデータ)
 Charas = 'Charas', // キャラデータ
 Scripts = 'Scripts', // スクリプト
 Visits = 'Visits', // 個人データ
 Games = 'Games' // スクリプトデータ
}
