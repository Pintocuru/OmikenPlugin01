// src/types/Omiken.ts
import { CommentCriterion } from './OmikenThresholdType';

// Omiken:おみくじ&初見判定ちゃんBOT用型定義
export interface OmikenType {
 types: Record<TypesType, string[]>;
 rules: Record<string, RulesType>; // おみくじのルールを管理
 omikujis: Record<string, OmikujiType>; // おみくじ関連のメッセージ
 places: Record<string, PlaceType>; // プレースホルダー
}

// コンテンツの型マッピング
export type OmikenTypeMap = {
 types: string[];
 rules: RulesType;
 omikujis: OmikujiType;
 places: PlaceType;
};

///////////////////////////////////
// types
///////////////////////////////////

export type TypesType =
 | 'comment' // コメントでの起動
 | 'timer' // タイマー(定期的な起動)
 | 'meta'
 | 'waitingList'
 | 'setList'
 | 'reactions'
 | 'unused'; // 無効;

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
 enableIds: string[]; // このrulesで使用する、omikujiリスト
 threshold: CommentCriterion[]; //発動条件
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
 threshold: CommentCriterion[]; // 発動条件
 status?: string; // ユーザーに対するステータスの付与
 script?: {
  scriptId: string; // 使用する外部スクリプトのid
  params: Record<string, string | number | boolean>; // 外部スクリプトに渡す引数(Scriptから取得する)
 };
 placeIds: string[]; // 使用するプレースホルダーのid
 post: OneCommePostType[];
}

// メッセージの投稿情報を管理する型
export interface OneCommePostType {
 type:
  | 'onecomme' // わんコメへの投稿
  | 'party' // WordPartyの投稿
  | 'speech' // わんコメのスピーチ機能
  | 'error'; // わんコメへの投稿(プラグインのエラーメッセージ用)
 botKey?: string; // ボットキー
 iconKey?: string; // アイコンキー
 party?: string; // 発動するWordParty
 isSilent?: boolean; // BOTのメッセージを読み上げない
 generatorParam?: string; // ジェネレーターに渡す引数
 delaySeconds: number; // メッセージを送信するまでの遅延時間
 content: string; // メッセージ内容
}

///////////////////////////////////
// Place
///////////////////////////////////
// プレースホルダー項目の型定義
export interface PlaceType extends BaseType {
 placeIds: string[];
 values: PlaceValueType[];
}

export type PlaceValueType = {
 weight: number; // 出現割合
 value: string; // 値（他のプレースホルダーへの参照可能: <<place_name>>）
};
