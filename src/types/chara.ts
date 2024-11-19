// src/types/chara.ts

// CHARA:キャラクターJSONの型定義
export interface CHARAType {
  id: string; // キー名
  name: string; // キャラクターの名前
  frameId?: string; // わんコメの枠
  color: {
    "--lcv-name-color": string; // 名前の色
    "--lcv-text-color": string; // コメントの色
    "--lcv-background-color": string; // 背景色
  };
  image: {
    Default: string; // defaultは必須
    [key: string]: string; // 追加のキーに対応
  };
}