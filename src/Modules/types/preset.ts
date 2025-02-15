// src/types/preset.ts
import { BaseType, OmikenType, OneCommePostType } from './Omiken';
import { GameType, PluginStoreType, SelectOmikujiOptions } from './plugin';
import { Comment } from '@onecomme.com/onesdk/types/Comment';

// presetデータ
export interface PresetType extends BaseType {
 version: string; // バージョン番号
 author?: string; // 開発者名
 order?: number; // 並び順
 tags: string[]; // 内容を表すタグ
 url?: string; // サポートページのURL
 banner?: string; // 紹介用画像
 path?: string; // データのパス(Presetsをルートとする)
}

// ---

// おみくじデータ付きpresetデータ
export interface PresetOmikenType extends PresetType {
 item: OmikenType;
 isOverwrite?: boolean; // 追加方法(true:上書き/false:追加)
}

// Chara:キャラクターJSONの型定義
export interface CharaType extends PresetType {
 isIconDisplay: boolean; // アイコンを表示するか
 displayName?: string; // 読み上げ時の名前の読ませ方
 frameId: string | null; // わんコメの枠
 color: {
  '--lcv-name-color': string; // 名前の色
  '--lcv-text-color': string; // コメントの色
  '--lcv-background-color': string; // 背景色
 };
 image: {
  Default: string; // defaultは必須
  [key: string]: string; // 追加のキーに対応
 };
 party: string[]; // キャラクター表示時、WordPartyを発動させるキー群
}

// ---

export interface ScriptsType extends PresetType {
 OmikujiFunc: OmikujiFuncParamType; // おみくじ実行時の関数
 ApiCall?: ApiCallParamType; // API呼び出し時の関数
 settings: Array<ScriptParam<string | number | boolean>>;
 params: Array<ScriptParam<string | number | boolean>>;
 placeholders: Array<ScriptParam<string | number | boolean>>;
}

// funcの引数の型定義
export type OmikujiFuncParamType = (
 options: SelectOmikujiOptions,
 game: GameType,
 settings: Array<ScriptParam<string | number | boolean>>,
 params: Array<ScriptParam<string | number | boolean>>
) => OmikujiFuncReturnType;

// funcの返り値
export interface OmikujiFuncReturnType {
 postArray?: OneCommePostType[];
 placeholder: { [id: string]: string | number };
 game: GameType;
}

// ScriptのAPI呼び出しの引数
export type ApiCallParamType = (
 game: GameType | null,
 method: 'GET' | 'POST' | 'PUT' | 'DELETE',
 body?: any
) => Promise<ApiCallReturnType>;

// API呼び出しの返り値
export interface ApiCallReturnType {
 status: 'success' | 'error';
 message: string;
 data?: Partial<PluginStoreType>;
}

// gameのパラメータ設定用
export interface ScriptParam<T> extends BaseType {
 type: 'string' | 'number' | 'boolean';
 value: T;
}
