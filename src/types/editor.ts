// src/types/editor.ts
// ! 古いタイプです

import { ListTypeMap, ListItemTypeMap, OmikenType } from "./index";
import { CharaType, PresetOmikenType } from "./index";

// エディター用型定義

// AppState
export interface AppEditerType {
  Omiken: OmikenType;
  Chara: Record<string, CharaType>;
  Preset: Record<string, PresetOmikenType>; // プリセットデータ
  Script:any;
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
    ?
        | (Partial<ListTypeMap[T]> & { rulesId?: string })
        | (Partial<ListTypeMap[T]> & { rulesId?: string })[]
    : T extends ListCategory
    ? Partial<ListTypeMap[T]> | Partial<ListTypeMap[T]>[]
    : never;
  delKeys?: string | string[]; // 削除するアイテムのキー名
  reorder?: T extends ListCategory ? string[] : never; // 順番の指定
  preset?: T extends "preset" ? PresetOmikenType : never; // プリセット用
} | null;
