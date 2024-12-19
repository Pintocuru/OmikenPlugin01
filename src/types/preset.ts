// src/types/preset.ts
import { BaseType, GameType, OneCommePostType, visitDataType } from './index';
import { RGBColor } from '@onecomme.com/onesdk/types/Color';
import { Comment } from '@onecomme.com/onesdk/types/Comment';

// presetデータ
export interface PresetType extends BaseType {
 type: 'Omiken' | 'Chara' | 'Script';
 path?: string; // データのパス(Presetsをルートとする)
 banner?: string;
 mode?: 'overwrite' | 'append'; // 追加方法(上書き/追加)
}

// ---

// Chara:キャラクターJSONの型定義
export interface CharaType extends BaseType {
 nickname?: string; // 読み上げ時の名前の読ませ方
 frameId: string | null; // わんコメの枠
 serviceColor: RGBColor; // 枠情報の色{b:number,g:number,r:number,}
 color: {
  '--lcv-name-color': string; // 名前の色
  '--lcv-text-color': string; // コメントの色
  '--lcv-background-color': string; // 背景色
  '--lcv-background-brightness'?: string; // 背景色の明度(ジェネレーター用)
  '--lcv-background-opacity'?: string; // 背景色の不透明度(ジェネレーター用)
 };
 image: {
  Default: string; // defaultは必須
  [key: string]: string; // 追加のキーに対応
 };
 party: string[]; // キャラクター表示時、WordPartyを発動させるキー群
}

// ---

// Script全体の型定義
export type ScriptsParamType = (
 comment: Comment,
 game: GameType,
 visit: visitDataType,
 param?: string
) => ScriptsReturnType;

// Scriptの返り値
export type ScriptsReturnType = {
 gameParam?: ScriptParam[]; // ゲームパラメータ
 postArray?: OneCommePostType[];
 placeholder: Placeholder; // プレースホルダー
 comment: Comment;
 game: GameType;
 visitData: visitDataType;
};

// gameのパラメータ設定用
export interface ScriptParam extends BaseType {
 value: string; // 入る値
}

type Placeholder = {
 message: string; // 全体のメッセージ
 [key: string]: string; // 任意のプレースホルダー（動的キー）
};
