// src/types/editor.ts

import { ListTypeMap, ListItemTypeMap, OmikenType, PreferencesType } from "./Omiken";
import { CHARAType } from "./chara";


// エディター用型定義

// AppState
export interface AppStateType {
  Omiken: OmikenType;
  CHARA: Record<string, CHARAEditType>;
  Preset: Record<string, PresetOmikenEditType>; // プリセットデータ
}

// xxxOrder用の型
export type OrderKey = "rulesOrder";

// ナビゲーション用カテゴリー
export type NaviCategory = ListCategory | "preset" | "preferences";

// リスト用カテゴリー
export type ListCategory = "rules" | "omikuji" | "place";
export type ListType = ListTypeMap[ListCategory];
export type ListEntry<T extends ListCategory> = {
  isOpen: boolean; // ダイアログの開閉状態
  type: T;
  mode: string | null; // 表示モード
  key: string | string[] | null;
};
// listEntry全体の型
export type ListEntryCollect = {
  [K in ListCategory]: ListEntry<K>;
};

// ファイル操作用
export type OmikenCategory = ListCategory | "preset" | "preferences";
export type OmikenEntry<T extends OmikenCategory> = {
  type: T;
  update?: T extends ListCategory ? ListItemTypeMap[T] : never; // 更新アイテム
  addKeys?: // 新規追加アイテム(部分入力可)
  T extends "omikuji"
  ? (Partial<ListTypeMap[T]> & { rulesId?: string }) | (Partial<ListTypeMap[T]> & { rulesId?: string })[]
  : T extends ListCategory
  ? Partial<ListTypeMap[T]> | Partial<ListTypeMap[T]>[]
  : never;
  delKeys?: string | string[]; // 削除するアイテムのキー名
  reorder?: T extends ListCategory ? string[] : never; // 順番の指定
  preset?: T extends "preset" ? Record<string, PresetOmikenEditType> : never; // プリセット用
  preferences?: T extends "preferences" ? PreferencesType : never; // 設定用
} | null;


// JSON読み込み用
export interface fetchJSONType {
  id: string;
  name: string;
  description: string;
  type: "Omiken" | "CHARA";
  path: string;
  banner: string;
}

// Edit用キャラデータ
export interface CHARAEditType extends fetchJSONType {
  item: CHARAType; // キャラデータ
}
export interface PresetOmikenEditType extends fetchJSONType {
  item: Omit<OmikenType, "preferences">; // キャラデータ(preferences抜き)
  mode: "overwrite" | "append"; // 追加方法(上書き/追加)
}
