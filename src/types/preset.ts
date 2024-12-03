// src/types/preset.ts
import { BaseType } from "./index";
import { RGBColor } from "@onecomme.com/onesdk/types/Color";

// presetデータ
export interface PresetType extends BaseType {
  type: "Omiken" | "Chara" | "Script";
  path: string;
  banner?: string;
  mode?: "overwrite" | "append"; // 追加方法(上書き/追加)
}

// ---

// Chara:キャラクターJSONの型定義
export interface CharaType extends BaseType {
  nickname?: string; // 読み上げ時の名前の読ませ方
  frameId: string | null; // わんコメの枠
  serviceColor: RGBColor; // 枠情報の色{b:number,g:number,r:number,}
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