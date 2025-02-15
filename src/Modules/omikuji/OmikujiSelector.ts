// src/Modules/tasks/OmikujiSelector.ts
import { GameType, OmikenRulesType, RulesSubType, SelectOmikujiIds, SelectOmikujiOptions } from '@type';
import { ThresholdChecker } from '@omikuji/ThresholdCheck';
import { PlayOmikuji } from '@omikuji/PlayOmikuji';

// おみくじセレクト
export function OmikujiSelector(
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
