// src/types/editor.ts
import { BaseType, EventCategory, OmikenCategory, OmikenType, OmikenTypeMap, RuleCategory } from './OmikenZod';
import { ParamType, PresetCategory, PresetType, ScriptParam } from './preset';

// エディター用型定義

// AppEditor
export type AppEditorType = PresetType & {
 Omiken: OmikenType;
 settings: EditorSettingsType;
};

// メインカテゴリーの型
export type CategoryMain = 'rules' | 'omikujis' | 'places' | 'presets' | 'settings';
export type CategorySub = {
 rules: RuleCategory;
 omikujis: never;
 places: never;
 presets: PresetCategory;
 settings: never;
};

export type NaviCategoryType<T extends CategoryMain = CategoryMain> = {
 main: T; // 現在選択されているメインカテゴリー
 sub?: CategorySub[T]; // メインカテゴリーに対応するサブカテゴリー（オプショナル）
};

// リスト用カテゴリー
export type ListEntryType<T extends EventCategory> = {
 type: T;
 id: string | null; // id
 isOpen?: boolean; // ダイアログの開閉状態
};

// listEntry全体の型(TODO:不要)
export type ListEntryCollect = {
 [K in EventCategory]: ListEntryType<K>;
};

// ファイル操作用
export type OmikenEntry<T extends OmikenCategory> = {
 type: T;
 updates?: OmikenTypeMap<T>[];
 addKeys?: Partial<OmikenTypeMap<T>>[];
 delKeys?: string[];
};

// エディター用設定ファイル
export type EditorSettingsType = {
 party: string[]; // キャラクター表示時、WordPartyを発動させるキー群
};

// ダイアログ用 omikujis/places のタブの型定義
export type DialogTabValue = 'post' | 'addStatus' | 'places' | 'scriptParams';

// プレースホルダーの説明文
export type PlaceExplainType = BaseType & {
 value: string | number | boolean;
 dialogPlaceId: string | null;
};
