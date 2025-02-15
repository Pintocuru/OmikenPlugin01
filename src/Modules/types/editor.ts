// src/types/editor.ts
import {
 CommentRulesType,
 MetaRulesType,
 OmikenType,
 OmikujiType,
 PlaceType,
 RuleTypes,
 TimerRulesType
} from './Omiken';
import { CharaType, PresetOmikenType, ScriptsType } from './preset';

// エディター用型定義

// AppEditor
export interface AppEditorType {
 Omiken: OmikenType;
 Presets: Record<string, PresetOmikenType>; // preset:Omiken
 Charas: Record<string, CharaType>; // preset:Chara
 Scripts: Record<string, ScriptsType>; // preset:Script
}

// コンテンツの型マッピング
export type OmikenTypeMap = {
 comment: CommentRulesType;
 timer: TimerRulesType;
 meta: MetaRulesType;
 omikujis: OmikujiType;
 places: PlaceType;
};

// メインカテゴリーの型
export type CategoryMain = ListCategory | 'presets';
export type CategorySub = {
 types: never;
 rules: never;
 omikujis: never;
 places: never;
 presets: 'Omiken' | 'Chara' | 'Script';
};
export type CategoryActive<T extends CategoryMain = CategoryMain> = {
 main: T; // 現在選択されているメインカテゴリー
 sub?: CategorySub[T]; // メインカテゴリーに対応するサブカテゴリー（オプショナル）
};

// リスト用カテゴリー
export type ListCategory = RuleTypes | 'omikujis' | 'places';
export type ListType = OmikenTypeMap[ListCategory];
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
export type OmikenEntry<T extends ListCategory> = {
 type: T;
 update?: OmikenTypeMap[T];
 addKeys?: AddKeysCategory[T];
 delKeys?: string | string[];
};

type AddKeysCategory = {
 types: never;
 rules: PartialListItem<'rules'> & { types?: TypesType };
 omikujis:
  | (PartialListItem<'omikujis'> & { rulesId?: string })
  | (PartialListItem<'omikujis'> & { rulesId?: string })[];
 places: PartialListItem<'places'> | PartialListItem<'places'>[];
};

// addItem用のPartial型(一部のキーだけでデータを作成できる)
type PartialListItem<T extends ListCategory> = Partial<OmikenTypeMap[T]>;
