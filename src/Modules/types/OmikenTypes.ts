// src/types/OmikenTypes.ts
import { CommentThreshold, MetaThreshold, ThresholdTypesMap, TimerThreshold } from './OmikenThresholdTypes';
import { ParamType, ScriptParam } from './preset';

// おみくじデータの型定義
export type OmikenType = {
 [K in OmikenCategory]: Record<string, OmikenTypeMap<K>>;
};

// 基本的なカテゴリー定義
export type OmikenCategory = RuleCategory | 'omikujis' | 'places';
export type OmikenTypeMap<T extends OmikenCategory> = {
 comments: CommentRulesType;
 timers: TimerRulesType;
 metas: MetaRulesType;
 omikujis: OmikujiType;
 places: PlaceType;
}[T];

// BaseType
export type BaseType = {
 id: string;
 name: string;
 description: string;
};

// rules
export const ruleCategories = ['comments', 'timers', 'metas'] as const;
export type RuleCategory = (typeof ruleCategories)[number];

export type RulesTypeMap<T extends RuleCategory> = OmikenTypeMap<T>;

// 共通rules
type CommonRulesType = BaseType & {
 isValid: boolean;
 order: number;
 color: string;
 script: {
  scriptId: string;
  settings: ScriptParam<ParamType>[]; // アドオンに渡す引数(Scriptから取得する)
 } | null;
};

// comment:コメントからおみくじを判定・抽選する
export type CommentRulesType = CommonRulesType & {
 ruleType: 'comments';
 threshold: CommentThreshold;
 enables: RulesSubType<CommentThreshold>[];
};

// timer:定期的におみくじを判定する
export type TimerRulesType = CommonRulesType & {
 ruleType: 'timers';
 threshold: TimerThreshold;
 enables: RulesSubType<TimerThreshold>[];
 timerConfig: {
  minutes: number;
  isBaseZero: boolean;
 };
};

// meta:配信枠の情報からおみくじを判定する
export type MetaRulesType = CommonRulesType & {
 ruleType: 'metas';
 threshold: MetaThreshold;
 enables: RulesSubType<MetaThreshold>[];
};

// 抽選するおみくじ
export type RulesSubType<Condition extends ThresholdTypesMap<RuleCategory>> = {
 rank: number; // 優先度
 weight: number; // 出現割合
 threshold: Condition; //発動条件
 omikujiId: string; // 適用するおみくじのid
};

// おみくじ型
export type OmikujiType = BaseType & {
 addStatus?: string | null; // visit.statusの変更(nullで消去)
 addPoints?: string | null; // visit.pointの変更(nullで消去)
 isRunScript: boolean; // スクリプトを実行するか
 scriptParams: Record<string, ScriptParam<ParamType>[]> | null; // アドオンに渡す引数(Scriptから取得する)
 placeIds: string[]; // 使用するプレースホルダーのid
 post: OneCommePostType[];
};

// わんコメへの投稿情報
export type OneCommePostType = {
 type:
  | 'onecomme' // わんコメへの投稿
  | 'party' // WordPartyの投稿
  | 'speech' // わんコメのスピーチ機能
  | 'system'; // わんコメの投稿をコメントテスターで行う
 botKey?: string; // ボットキー
 iconKey?: string; // アイコンキー
 party?: string; // 投稿と同時に発動するWordParty
 isSilent?: boolean; // BOTのメッセージを読み上げない
 generatorParam?: string; // ジェネレーターに渡す引数
 delaySeconds: number; // メッセージを送信するまでの遅延時間
 content: string; // メッセージ内容
};

// プレースホルダー型
export type PlaceType = BaseType & {
 placeIds: string[];
 values: PlaceValueType[];
};

export type PlaceValueType = {
 weight: number; // 出現割合
 value: `<<${string}>>` | string; // 値（他のプレースホルダーへの参照可能: <<place_name>>）
};
