// src/types/chara.ts
// TODO src/types/preset.ts に変更したい

import { BaseType, OmikenType } from "./index";


// presetデータ
export type PresetType = PresetOmikenType | PresetCharaType | PresetScriptType;
interface PresetBaseType extends BaseType {
  type: "Omiken" | "Chara" | "Script";
  path: string;
  banner: string;
}

// preset用Omikenデータ
export interface PresetOmikenType extends PresetBaseType {
  item: OmikenType; // キャラデータ
  mode?: "overwrite" | "append"; // 追加方法(上書き/追加)
}

// preset用キャラデータ
export interface PresetCharaType extends PresetBaseType {
  item: CharaType; // キャラデータ
}

// preset用外部スクリプトデータ
export interface PresetScriptType extends PresetBaseType {
}

// ---

// Chara:キャラクターJSONの型定義
export interface CharaType extends BaseType {
  frameId: string | null; // わんコメの枠
  color: {
    "--lcv-name-color": string; // 名前の色
    "--lcv-text-color": string; // コメントの色
    "--lcv-background-color": string; // 背景色
  };
  image: {
    Default: string; // defaultは必須
    [key: string]: string; // 追加のキーに対応
  };
  party: string[]; // キャラクター表示時、WordPartyを発動させるキー群
}

// Script:外部スクリプトの型定義
export interface ScriptType extends BaseType {
  frameId: string | null; // わんコメの枠
  color: {
    "--lcv-name-color": string; // 名前の色
    "--lcv-text-color": string; // コメントの色
    "--lcv-background-color": string; // 背景色
  };
  image: {
    Default: string; // defaultは必須
    [key: string]: string; // 追加のキーに対応
  };
  party: string[]; // キャラクター表示時、WordPartyを発動させるキー群
}