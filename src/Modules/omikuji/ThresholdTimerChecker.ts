// src/Modules/omikuji/ThresholdTimerChecker.ts
import { TimerCriterion, DrawsCondition } from '@type';
import { TimeConfigType, GameType } from '@type';
import { matchIsCountHelper } from './ThresholdHelpers';

export class ThresholdTimerChecker {
 constructor(private readonly timeConfig: TimeConfigType, private readonly game?: GameType) {}

 checkTimerCriterion(criterion: TimerCriterion): boolean {
  const conditionMap = {
   draws: () => this.matchIsDraws(criterion.draws)
  } as const;

  const result = conditionMap[criterion.conditionType]?.() ?? false;
  return criterion.isNot === true ? !result : result;
 }

 private matchIsDraws(draws: DrawsCondition = { comparison: 'max', unit: 'draws', value: 1 }): boolean {
  const unitMap: Record<DrawsCondition['unit'], number> = {
   draws: (this.game?.userStats['']?.draws ?? 0) + 1,
   gameDraws: (this.game?.draws ?? 0) + 1
  };
  return matchIsCountHelper(unitMap[draws.unit], draws);
 }
}
