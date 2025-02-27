// src/types/preset.ts
import { BaseType, OmikenType, OneCommePostType, RuleCategory } from './OmikenTypes';
import { GameType, PluginStoreType, SelectOmikujiOptions } from './pluginType';

// preset全体の型定義
export type PresetType = {
 [K in PresetCategory]: Record<string, PresetTypeMap<K>>;
};
export type PresetCategory = 'Presets' | 'Charas' | 'Scripts';
export type PresetTypeMap<T extends PresetCategory> = {
 Presets: PresetOmikenType; // preset:Omiken
 Charas: CharaType; // preset:Chara
 Scripts: ScriptType; // preset:Script
}[T];

// ---

// presetデータ
interface PresetBaseType extends BaseType {
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
export interface PresetOmikenType extends PresetBaseType {
 item: OmikenType;
 isOverwrite?: boolean; // 追加方法(true:上書き/false:追加)
}

// Chara:キャラクターJSONの型定義
export interface CharaType extends PresetBaseType {
 isIconDisplay: boolean; // ジェネレーターでアイコンを表示させるか
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
}

// ---

// Scripts:アドオン用型定義
export interface ScriptType extends PresetBaseType {
 OmikujiFunc?: OmikujiFuncParamType; // おみくじ実行時の関数
 ApiCall?: ApiCallParamType; // API呼び出し時の関数
 settings: ScriptParam<ParamType>[];
 params: ScriptParam<ParamType>[];
 placeholders: ScriptParam<ParamType>[];
}

// funcの引数の型定義
export type OmikujiFuncParamType = (
 options: SelectOmikujiOptions<RuleCategory>,
 game: GameType,
 settings: ScriptParam<ParamType>[],
 params: ScriptParam<ParamType>[]
) => OmikujiFuncReturnType;

// funcの返り値
export interface OmikujiFuncReturnType {
 postArray?: OneCommePostType[];
 placeholder: Record<string, string | number>;
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

export const paramConst = ['string', 'number', 'boolean'] as const;
export type ParamType = (typeof paramConst)[number]; // 型エイリアス
export interface ScriptParam<T extends ParamType> extends BaseType {
 type: T;
 value: T extends 'string' ? string : T extends 'number' ? number : boolean;
}
