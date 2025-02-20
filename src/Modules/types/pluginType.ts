// src/types/pluginType.ts
import { OmikenType, RuleCategory } from './OmikenTypes';
import { CharaType, ScriptType } from './preset';
import { EditorSettingsType } from './editor';
import { Service, ServiceMeta } from '@onecomme.com/onesdk/types/Service';
import { BaseResponse } from '@onecomme.com/onesdk/types/BaseResponse';
import { Colors, Comment } from '@onecomme.com/onesdk/types/Comment';
import { UserNameData } from '@onecomme.com/onesdk/types/UserData';

// ---------------------------------------------------

// ElectronStore用の型
export interface PluginStoreType {
 Omiken: OmikenType;
 Visits: Record<string, VisitType>;
 Games: Record<string, GameType>;
 EditorSettings: EditorSettingsType;
}

// おみくじBOT用の型
export interface PluginMainType extends PluginStoreType {
 store: any; // ElectronStore不具合のためany ElectronStore<StoreType>
 Charas: Record<string, CharaType>;
 Scripts: Record<string, ScriptType>;
 TimeConfig: TimeConfigType;
}

// API用の型
export interface PluginApiType extends PluginStoreType {
 store: any; // ElectronStore不具合のためany ElectronStore<StoreType>
 Presets: Record<string, OmikenType>;
 Charas: Record<string, CharaType>;
 Scripts: Record<string, ScriptType>;
}

// 全体設定用の型
export interface PluginAllType extends PluginMainType {
 Presets: Record<string, OmikenType>;
 filterCommentProcess(comment: Comment, userData: UserNameData): Promise<void>;
 TimerSelector: any; // プラグイン専用の型なのでany
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

// おみくじ抽選で使用するデータ群
export type SelectOmikujiOptions<T extends RuleCategory> = SelectOmikujiOptionsMap[T];

export interface SelectOmikujiOptionsMap {
 comments: {
  type: 'comment';
  comment: Comment;
  visit: VisitType;
  meta?: never;
  timeConfig: never;
 };
 timers: {
  type: 'timer';
  comment?: never;
  visit?: never;
  meta?: never;
  timeConfig: TimeConfigType;
 };
 metas: {
  type: 'meta';
  comment?: never;
  visit?: never;
  meta: ServiceMeta;
  timeConfig: never;
 };
}

// 選択したおみくじ
export interface SelectOmikujiIds {
 omikujiId: string;
 ruleId: string; // 選択されたルールのid
}

// TimeConfig
export interface TimeConfigType {
 pluginTime: number; // プラグインを起動した時刻
 lc: number; // プラグインを起動してからカウントしたコメント数
 lastTime: number; // 最後におみくじ機能が実行された時刻
 meta: {
  initFollowers: number; // 配信開始時のフォロワー数
  maxLikes: number; // 配信時の高評価数の最大値
  maxViewers: number; // 配信時の視聴数の最大値
 };
}

// ---

// わんコメSend Commentの型定義
export interface SendCommentType {
 service: Pick<Service, 'id'>;
 comment: Pick<
  BaseResponse,
  | 'id' // SendCommentParamsType で使用
  | 'userId' // ユーザー識別ID
  | 'name' // 表示名
  | 'nickname' // ユーザーネームの読み上げ変更
  | 'comment' // コメント
  | 'profileImage' // アイコン
  | 'badges' // メンバーやモデレーター等の表示用バッジ
 > & { color?: Colors };
}

// わんコメSend Commentでidを利用したパラメータ受け渡しに使う型定義
export interface SendCommentParamsType {
 id: string; // 一意のID
 charaId: string; // キャラID
 param?: string; // ジェネレーターに渡す引数(omikuji.generatorParam)
 isSilent?: string; // BOTの読み上げを行わない(omikuji.isSilent)
 [key: string]: string | undefined;
}

// わんコメSend Test Comment型定義
export interface SendTestCommentType {
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
