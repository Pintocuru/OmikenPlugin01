// src/types/OmikenSchemas.ts
import { z } from 'zod';
import { commentThresholdSchema, metaThresholdSchema, timerThresholdSchema } from './OmikenThresholdSchemas';

// ユニークキーの生成
export const generateUniqueKey = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// BaseType:基本となる項目
export const baseSchema = z.object({
 id: z
  .string()
  .catch('')
  .transform((val) => (val === '' ? generateUniqueKey() : val)), // キー名
 name: z.string().default('').catch(''), // ルール名
 description: z.string().default('').catch('') // 説明文
});

// rules:おみくじルールの型定義
const ruleDefault = {
 color: '#66FFFF',
 thresholdComment: {
  type: 'comment' as const,
  criteria: [
   {
    conditionType: 'match' as const,
    match: { target: 'comment' as const, case: 'starts' as const, value: ['おみくじ'] }
   }
  ]
 },
 thresholdTimer: {
  type: 'timer' as const,
  criteria: []
 },
 thresholdMeta: {
  type: 'meta' as const,
  criteria: [
   {
    conditionType: 'dynamic' as const,
    dynamic: { comparison: 'newMaximum' as const, unit: 'upVote' as const, value: 0 }
   }
  ]
 }
};

// ScriptParam スキーマ
const ScriptParamSchema = z
 .object({
  ...baseSchema.shape, // BaseType を継承
  type: z.enum(['string', 'number', 'boolean']),
  value: z.union([z.string(), z.number(), z.boolean()]) // ここでジェネリックの代用
 })
 .refine(
  (data) => {
   if (data.type === 'string') return typeof data.value === 'string';
   if (data.type === 'number') return typeof data.value === 'number';
   if (data.type === 'boolean') return typeof data.value === 'boolean';
   return false;
  },
  {
   message: 'typeとvalueの型が一致していません'
  }
 );

// 共通部分のスキーマ
const CommonRuleSchema = z.object({
 ...baseSchema.shape,
 isValid: z.boolean().default(true).catch(true),
 order: z.number().int().nonnegative().default(0).catch(0),
 color: z.string().default(ruleDefault.color).catch(ruleDefault.color),
 script: z
  .object({
   scriptId: z.string(),
   settings: z.array(ScriptParamSchema)
  })
  .nullable()
  .default(null)
  .catch(null)
});

// コメントルールのスキーマ
export const CommentRulesSchema = CommonRuleSchema.extend({
 ruleType: z.literal('comment'),
 threshold: commentThresholdSchema.catch(ruleDefault.thresholdComment),
 enables: z
  .array(z.object({ threshold: commentThresholdSchema, rank: z.number(), weight: z.number(), omikujiId: z.string() }))
  .default([])
  .catch([])
});

// タイマールールのスキーマ（timerConfig を必須）
export const TimerRulesSchema = CommonRuleSchema.extend({
 ruleType: z.literal('timer'),
 threshold: timerThresholdSchema.catch(ruleDefault.thresholdTimer),
 enables: z
  .array(z.object({ threshold: timerThresholdSchema, rank: z.number(), weight: z.number(), omikujiId: z.string() }))
  .default([])
  .catch([]),
 timerConfig: z.object({
  minutes: z.number().int().nonnegative(),
  isBaseZero: z.boolean()
 })
});

// メタルールのスキーマ
export const MetaRulesSchema = CommonRuleSchema.extend({
 ruleType: z.literal('meta'),
 threshold: metaThresholdSchema.catch(ruleDefault.thresholdMeta),
 enables: z
  .array(z.object({ threshold: metaThresholdSchema, rank: z.number(), weight: z.number(), omikujiId: z.string() }))
  .default([])
  .catch([])
});

// 最終的なルールスキーマ
export const ruleSchema = z.union([CommentRulesSchema, TimerRulesSchema, MetaRulesSchema]);

//---

// わんコメに渡す投稿情報
export const OneCommePostSchema = z.object({
 type: z
  .enum([
   'onecomme', // わんコメへの投稿
   'party', // WordPartyの投稿
   'speech', // わんコメのスピーチ機能
   'system' // わんコメの投稿をコメントテスターで行う
  ])
  .default('system')
  .catch('system'),
 botKey: z.string().optional().catch(undefined), // ボットキー
 iconKey: z.string().optional().catch(undefined), // アイコンキー
 party: z.string().optional().catch(undefined), // 発動するWordParty
 isSilent: z.boolean().optional().catch(undefined), // BOTのメッセージを読み上げない
 generatorParam: z.string().optional().catch(undefined), // ジェネレーターに渡す引数
 delaySeconds: z.number().default(0).catch(0), // メッセージを送信するまでの遅延時間
 content: z.string().default('').catch('新しいメッセージ') // メッセージ内容
});

// バリデーション時にソート
const omikujiPostArraySchema = OneCommePostSchema.array()
 .transform((posts) =>
  posts.sort((a, b) => {
   // delaySecondsで昇順ソート
   if (a.delaySeconds !== b.delaySeconds) {
    return a.delaySeconds - b.delaySeconds;
   }
   // delaySecondsが同じ場合はtypeの順序でソート
   const typeOrder = ['onecomme', 'party', 'speech', 'system'];
   return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
  })
 )
 .default([]);

// omikuji:おみくじの型定義

export const omikujiSchema = z.object({
 ...baseSchema.shape,
 addStatus: z.union([z.string(), z.null()]).optional().catch(undefined), // visit.statusの変更(nullで消去)
 addPoints: z.union([z.string(), z.null()]).optional().catch(undefined), // visit.pointの変更(nullで消去)
 isRunScript: z.boolean().default(false).catch(false), // スクリプトを実行するか
 scriptParams: z.record(z.string(), z.array(ScriptParamSchema)).nullable().default(null).catch(null), // Record<string, ScriptParam<ParamType>[]> | null に対応
 placeIds: z.array(z.string()).default([]).catch([]), // 使用するプレースホルダーのid
 post: omikujiPostArraySchema.catch((error) => {
  console.warn('Invalid omikuji.post:', error);
  return [];
 })
});

//---

// placeのZodスキーマ
export const placeSchema = z.object({
 ...baseSchema.shape,
 placeIds: z.array(z.string()).default([]).catch([]), // 使用するプレースホルダーのid
 values: z
  .array(
   z.object({
    weight: z.number().int().nonnegative().default(1).catch(1), // 出現割合
    value: z.string().default('').catch('') // 値（他のプレースホルダーへの参照可能: <<place_name>>）
   })
  )
  .default([{ weight: 1, value: '' }])
  .catch((error) => {
   console.warn('Invalid place.values:', error);
   return [{ weight: 1, value: '' }];
  })
});
//---

// typesのZodスキーマ(廃止)
const TypesTypeSchema = z.enum([
 'comment', // コメントでの起動
 'timer', // タイマー(定期的な起動)
 'meta', // 枠情報からの起動
 'waitingList', // 参加リストからの起動
 'setList', // セットリストでの起動
 'reactions', // WordPartyでの起動
 'unused' // 無効
]);

//---

// Omikenのスキーマ
export const OmikenSchema = z.object({
 comments: z.record(CommentRulesSchema).default({}),
 timers: z.record(TimerRulesSchema).default({}),
 metas: z.record(MetaRulesSchema).default({}),
 omikujis: z.record(omikujiSchema).default({}),
 places: z.record(placeSchema).default({})
});
