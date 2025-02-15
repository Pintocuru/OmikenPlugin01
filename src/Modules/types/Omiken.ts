// src/types/Omiken.ts
import { CommentThreshold, MetaThreshold, ThresholdType, TimerThreshold } from './OmikenThresholdType';
import { ScriptParam } from './preset';

// Omiken:おみくじ&初見判定ちゃんBOT用型定義
export interface OmikenType {
 comment: Record<string, CommentRulesType>;
 timer: Record<string, TimerRulesType>;
 meta: Record<string, MetaRulesType>;
 omikujis: Record<string, OmikujiType>; // おみくじ関連のメッセージ
 places: Record<string, PlaceType>; // プレースホルダー
}

///////////////////////////////////
// types
///////////////////////////////////

export type RuleTypes =
 | 'comment' // コメントでの起動
 | 'timer' // タイマー(定期的な起動)
 | 'meta'; // 配信枠の情報での起動
// | 'waitingList' // 参加型管理
// | 'setList' // セットリスト
// | 'reactions' // リアクション

///////////////////////////////////
// rules/omikuji/place 共通
///////////////////////////////////

// 基本となる項目のインターフェース
export interface BaseType {
 id: string; // キー名
 name: string; // ルール名
 description: string; // 説明文
}

///////////////////////////////////
// rules
///////////////////////////////////

export type OmikenRulesType = CommentRulesType | TimerRulesType | MetaRulesType;

// 共通のベース型を定義
interface CommonRuleType extends BaseType {
 isValid: boolean; // 有効かどうか
 order: number; // 判定の順番
 color: string; // エディターでの識別用カラー
 script?: {
  scriptId: string; // 使用するアドオンのid
  settings: Array<ScriptParam<string | number | boolean>>; // アドオンの設定
 };
}

// comment:コメントからおみくじを判定・抽選する
export interface CommentRulesType extends CommonRuleType {
 ruleType: 'comment';
 threshold: CommentThreshold[];
 enables: RulesSubType<CommentThreshold>[];
}

// timer:定期的におみくじを判定する
export interface TimerRulesType extends CommonRuleType {
 ruleType: 'timer';
 threshold: TimerThreshold[];
 enables: RulesSubType<TimerThreshold>[];
 timerConfig: {
  minutes: number;
  isBaseZero: boolean;
 };
}

// meta:配信枠の情報からおみくじを判定する
export interface MetaRulesType extends CommonRuleType {
 ruleType: 'meta';
 threshold: MetaThreshold[];
 enables: RulesSubType<MetaThreshold>[];
}

export interface RulesSubType<T extends ThresholdType> {
 rank: number; // 優先度
 weight: number; // 出現割合
 threshold: T[]; //発動条件
 omikujiId: string; // 適用するおみくじのid
}

///////////////////////////////////
// omikuji
///////////////////////////////////

// おみくじメッセージの型定義
export interface OmikujiType extends BaseType {
 addStatus?: `<<${string}>>` | string | null; // visit.statusの変更(nullで消去)
 addPoints?: `<<${string}>>` | string | null; // visit.pointの変更(nullで消去)
 scriptParams: Array<ScriptParam<string | number | boolean>> | null; // 外部スクリプトに渡す引数(Scriptから取得する)
 placeIds: string[]; // 使用するプレースホルダーのid
 post: OneCommePostType[];
}

// メッセージの投稿情報を管理する型
export interface OneCommePostType {
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
}

///////////////////////////////////
// Place
///////////////////////////////////
// プレースホルダー項目の型定義
export interface PlaceType extends BaseType {
 placeIds: string[]; // 他のプレースホルダーを参照するためのIDリスト
 values: PlaceValueType[];
}

export type PlaceValueType = {
 weight: number; // 出現割合
 value: `<<${string}>>` | string; // 値（他のプレースホルダーへの参照可能: <<place_name>>）
};
