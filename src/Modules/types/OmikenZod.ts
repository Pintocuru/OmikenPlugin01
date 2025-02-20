// src/types/OmikenZod.ts
import { z } from 'zod';
import {
 omikujiSchema,
 placeSchema,
 CommentRulesSchema,
 TimerRulesSchema,
 MetaRulesSchema,
 baseSchema,
 OneCommePostSchema
} from './OmikenSchemas';
import { commentThresholdSchema, timerThresholdSchema, metaThresholdSchema } from './OmikenThresholdSchemas';

// おみくじデータの型定義
export type OmikenType = {
 [K in OmikenCategory]: Record<string, OmikenTypeMap<K>>;
};

// 基本的なカテゴリー定義
export type OmikenCategory = RuleCategory | EventCategory;
export type EventCategory = 'omikujis' | 'places';
export type OmikenTypeMap<T extends OmikenCategory> = {
 comments: CommentRulesType;
 timers: TimerRulesType;
 metas: MetaRulesType;
 omikujis: OmikujiType;
 places: PlaceType;
}[T];

// BaseType
export type BaseType = z.infer<typeof baseSchema>;

// rules
export const ruleCategories = ['comments', 'timers', 'metas'] as const;
export type RuleCategory = (typeof ruleCategories)[number];

export type RulesTypeMap<T extends RuleCategory> = OmikenTypeMap<T>;
// comment:コメントからおみくじを判定・抽選する
export type CommentRulesType = z.infer<typeof CommentRulesSchema>;
// timer:定期的におみくじを判定する
export type TimerRulesType = z.infer<typeof TimerRulesSchema>;
// meta:配信枠の情報からおみくじを判定する
export type MetaRulesType = z.infer<typeof MetaRulesSchema>;

// omikujis/places
export type OmikujiType = z.infer<typeof omikujiSchema>;
export type OneCommePostType = z.infer<typeof OneCommePostSchema>;
export type PlaceType = z.infer<typeof placeSchema>;
export type PlaceValueType = PlaceType['values'][number];

// Threshold関連の型定義
export type ThresholdSchemas<T extends RuleCategory> = {
 comments: typeof commentThresholdSchema;
 timers: typeof timerThresholdSchema;
 metas: typeof metaThresholdSchema;
}[T];

export type ThresholdTypesMap<T extends RuleCategory> = z.infer<ThresholdSchemas<T>>;
export type CriterionTypesMap<T extends RuleCategory> = z.infer<ThresholdSchemas<T>>['criteria'][number];
