// src/Modules/tasks/OmikujiSelector.ts
import {
 CommentRulesType,
 GameType,
 OmikenRulesType,
 OmikujiType,
 RulesSubType,
 SelectOmikujiIds,
 SelectOmikujiOptions,
 TimeConfigType,
 TimerRulesType,
 VisitType
} from '@type';
import { ThresholdChecker } from '@components/ThresholdCheck';
import { PlayOmikuji } from '@components/PlayOmikuji';
import { Comment } from '@onecomme.com/onesdk/types/Comment';

// おみくじセレクト
export function selectOmikuji(
 options: SelectOmikujiOptions,
 rules: Record<string, OmikenRulesType>,
 games: Record<string, GameType>
): SelectOmikujiIds | null {
 // ルールを順序に従ってソート
 const sortedRules = Object.values(rules).sort((a, b) => a.order - b.order);

 for (const rule of sortedRules) {
  // ルールのしきい値をチェック
  const checker = new ThresholdChecker(options, rule, games[rule.id]);
  if (!checker.checkAll(rule.threshold)) continue;

  // 有効なエントリをフィルタリング
  const validEntries = rule.enables.filter((entry) => checker.checkAll(entry.threshold));

  // 共通の抽選ロジックを使用
  const omikuji = new PlayOmikuji(validEntries).draw() as RulesSubType<any>;
  if (omikuji) return { omikujiId: omikuji.omikujiId, ruleId: rule.id };
 }

 return null;
}

// ---

// timerのセットアップ
export class OmikujiSelectorTimer {
 private timers: NodeJS.Timeout[] = [];
 private timeConfig?: TimeConfigType;

 constructor() {
  this.clearAllTimers();
 }

 // 次の実行時刻までの待機時間を計算（ミリ秒）
 private calculateNextInterval(minutes: number, isBaseZero: boolean): number {
  const now = new Date();
  let nextTime: Date;

  if (isBaseZero) {
   const currentMinutes = now.getMinutes();
   const minutesToNext = minutes - (currentMinutes % minutes);
   nextTime = new Date(now);
   nextTime.setMinutes(currentMinutes + minutesToNext);
   nextTime.setSeconds(0);
   nextTime.setMilliseconds(0);
  } else {
   nextTime = new Date(now.getTime() + minutes * 60000);
  }

  const delay = nextTime.getTime() - now.getTime();
  return delay;
 }

 // タイマーを設定して定期実行を開始（複数ルール対応）
 setupTimers(
  rules: Record<string, TimerRulesType>,
  omikujis: Record<string, OmikujiType>,
  callback: (result: OmikujiSelectType) => void
 ): void {
  // 既存のタイマーをクリア
  this.clearAllTimers();

  // ルールを順序に従ってソート
  const sortedRules = Object.values(rules).sort((a, b) => a.order - b.order);

  for (const rule of sortedRules) {
   if (!rule.timerConfig) return;
   const { minutes, isBaseZero } = rule.timerConfig;
   // バリデーション 1分以上60分以下の間でない場合はスキップ
   if (minutes < 1 || minutes > 60) return;

   const immediateResult = this.selectOmikujiForRule(rule, omikujis);
   if (0 && immediateResult) callback(immediateResult);

   const initialDelay = this.calculateNextInterval(minutes, isBaseZero);

   setTimeout(() => {
    const timer = setInterval(() => {
     if (!this.timeConfig) return;
     const hoge = new OmikujiSelector({ type: 'timer', timeConfig: this.timeConfig });
     const result = this.selectOmikujiForRule(rule, omikujis);
     if (result) callback(result);
    }, minutes * 60000);

    this.timers.push(timer);

    const result = this.selectOmikujiForRule(rule, omikujis);
    if (result) callback(result);
   }, initialDelay);
  }
 }

 // 単一ルールに対するおみくじ選択
 private selectOmikujiForRule(rule: RulesType, omikujis: Record<string, OmikujiType>): OmikujiSelectType | null {
  const validOmikujis = rule.enableIds.map((id) => omikujis[id]).filter(Boolean);
  const selectedOmikuji = this.playOmikuji(validOmikujis);
  if (selectedOmikuji) return { ...selectedOmikuji, selectRuleId: rule.id };
  else return null;
 }

 // タイマーをすべてクリア
 private clearAllTimers(): void {
  this.timers.forEach((timer) => clearInterval(timer));
  this.timers = [];
 }

 destroy(): void {
  this.clearAllTimers();
 }
}
