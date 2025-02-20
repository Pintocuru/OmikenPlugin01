// src/types/OmikenThresholdSchemas.ts
import { z } from 'zod';

// comparison の定数化
export const COMPARISON_TYPES = [
 'min', // 数値以下(未満、～より上はありません)
 'max', // 数値以上
 'equal', // 等しい
 'loop' // 数値をvalueで割った数
] as const;
export type ComparisonType = (typeof COMPARISON_TYPES)[number];

// syoken:初見・コメント履歴の種別
const SYOKEN_CONDITION = {
 SYOKEN: 1, // 初見
 AGAIN: 2, // 前回のコメントから7日以上経過
 HI: 3, // 上記以外の、その配信枠で1回目のコメント
 ALL: 4 // 上記すべての、その配信枠で1回目のコメント
} as const;
export type SyokenCondition = (typeof SYOKEN_CONDITION)[keyof typeof SYOKEN_CONDITION];

// access:ユーザーの役職 0:OFF/1:だれでも/2:メンバー/3:モデレーター/4:管理者
const ACCESS_CONDITION = {
 MEMBER: 2,
 MODERATOR: 3,
 ADMIN: 4
} as const;
export type AccessCondition = (typeof ACCESS_CONDITION)[keyof typeof ACCESS_CONDITION];

// gift:ギフトのRank
const GIFT_CONDITION = {
 All: 0, // 全て(メンバー加入含む)
 Blue: 1, // 200円未満
 LightBlue: 2, // 200円〜499円
 Green: 3, // 500円〜999円
 Yellow: 4, // 1,000円〜1,999円
 Orange: 5, // 2,000円〜4,999円
 Pink: 6, // 5,000円〜9,999円
 Red: 7, // 10,000円以上
 Purple: 8 // 20,000円以上
} as const;
export type GiftCondition = (typeof GIFT_CONDITION)[keyof typeof GIFT_CONDITION];

// 数値変換
const thresholdValueTransform = z.number().transform((val) => (typeof val !== 'number' || val < 0 ? 0 : val));

// count:数値を参照する
const thresholdCountSchema = z.object({
 comparison: z.enum(COMPARISON_TYPES),
 unit: z.enum([
  'lc', // 配信枠のコメント数(プラグインで独自に付与)
  'tc', // 総数の個人コメ数(userData.tc)
  'intvlSec' // そのユーザーの前回のコメントからの経過時間(ミリ秒)(userData.interval)
 ]),
 value: thresholdValueTransform
});
export type CountCondition = z.infer<typeof thresholdCountSchema>;

// match:文字列を参照する
const thresholdMatchSchema = z.object({
 target: z.enum([
  'status', // ユーザーごとのstatus
  'comment', // コメント(comment.data.comment)
  'name', // 名前(comment.data.name)
  'displayName' // ニックネーム(comment.data.displayName)
 ]),
 value: z.array(z.string()).default([])
});
export type MatchCondition = z.infer<typeof thresholdMatchSchema>;

// draws:これまでに行われたおみくじ回数を参照する
const drawsConditionSchema = z.object({
 comparison: z.enum(COMPARISON_TYPES),
 unit: z.enum(['draws', 'gameDraws']),
 value: thresholdValueTransform
});
export type DrawsCondition = z.infer<typeof drawsConditionSchema>;

// metaCount:配信用metaタグを参照する
const metaCountSchema = z.object({
 comparison: z.enum(COMPARISON_TYPES),
 unit: z.enum(['streamDuration', 'totalGifts', 'followers']),
 value: thresholdValueTransform
});
export type MetaCountCondition = z.infer<typeof metaCountSchema>;

// dynamic:配信用metaタグのうち、常に変動する高評価数・視聴数を参照する
const dynamicSchema = z.object({
 comparison: z.enum(['min', 'max', 'different', 'increasing', 'newMaximum']),
 unit: z.enum(['upVote', 'viewer']),
 value: thresholdValueTransform
});
export type DynamicCondition = z.infer<typeof dynamicSchema>;

//---

// コメント条件用スキーマ
export const commentCriterionSchema = z.object({
 conditionType: z.union([
  z.literal('match'),
  z.literal('target'),
  z.literal('coolDown'),
  z.literal('syoken'),
  z.literal('access'),
  z.literal('gift'),
  z.literal('draws'),
  z.literal('count')
 ]),
 isNot: z.boolean().optional(),
 target: z.number().optional(),
 coolDown: z.number().optional(),
 syoken: z.nativeEnum(SYOKEN_CONDITION).optional(),
 access: z.nativeEnum(ACCESS_CONDITION).optional(),
 gift: z.nativeEnum(GIFT_CONDITION).optional(),
 draws: drawsConditionSchema.optional(),
 count: thresholdCountSchema.optional(),
 match: thresholdMatchSchema.optional()
});

// タイマー条件用スキーマ
export const timerCriterionSchema = z.object({
 conditionType: z.literal('draws'),
 isNot: z.boolean().optional(),
 draws: drawsConditionSchema.optional()
});

// メタ条件用スキーマ
export const metaCriterionSchema = z.object({
 conditionType: z.enum(['draws', 'metaCount', 'dynamic']),
 isNot: z.boolean().optional(),
 draws: drawsConditionSchema.optional(),
 metaCount: metaCountSchema.optional(),
 dynamic: dynamicSchema.optional()
});

// 3種類のThresholdスキーマ
export const commentThresholdSchema = z.object({
 type: z.literal('comment'),
 isAnd: z.boolean().optional(),
 criteria: z.array(commentCriterionSchema)
});

export const timerThresholdSchema = z.object({
 type: z.literal('timer'),
 isAnd: z.boolean().optional(),
 criteria: z.array(timerCriterionSchema)
});

export const metaThresholdSchema = z.object({
 type: z.literal('meta'),
 isAnd: z.boolean().optional(),
 criteria: z.array(metaCriterionSchema)
});

// 統合されたThresholdスキーマ
export const thresholdSchema = z.discriminatedUnion('type', [
 commentThresholdSchema,
 timerThresholdSchema,
 metaThresholdSchema
]);

// ---

// commentのthresholdデフォルト値
export const commentCriterionInit = {
 conditionType: 'match' as const,
 isNot: false as const,
 target: 2 as const,
 coolDown: 3 as const,
 syoken: SYOKEN_CONDITION.SYOKEN,
 access: ACCESS_CONDITION.MEMBER,
 gift: GIFT_CONDITION.All,
 draws: {
  comparison: 'max' as const,
  unit: 'draws' as const,
  value: 0 as const
 },
 count: {
  comparison: 'max' as const,
  unit: 'draws' as const,
  value: 0 as const
 },
 match: {
  target: 'comment' as const,
  case: 'starts' as const,
  value: ['^おみくじ']
 }
};

// timer の thresholdデフォルト値
export const timerCriterionInit = {
 conditionType: 'draws' as const,
 isNot: false as const,
 draws: {
  comparison: 'max' as const,
  unit: 'gameDraws' as const,
  value: 0 as const
 }
};

// meta の thresholdデフォルト値
export const metaCriterionInit = {
 conditionType: 'dynamic' as const,
 isNot: false as const,
 draws: {
  comparison: 'newMaximum' as const,
  unit: 'upVote' as const,
  value: 0 as const
 }
};
