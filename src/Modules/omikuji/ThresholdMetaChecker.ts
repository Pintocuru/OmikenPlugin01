// src/Modules/omikuji/ThresholdMetaChecker.ts

import { MetaCriterion, MetaCountCondition, MetaDynamicCondition, DrawsCondition } from '@type';
import { ServiceMeta } from '@onecomme.com/onesdk/types/Service';
import { TimeConfigType } from '@type';
import { matchIsCountHelper } from './ThresholdHelpers';

export class ThresholdMetaChecker {
 constructor(private readonly meta: ServiceMeta | undefined, private readonly timeConfig: TimeConfigType) {}

 checkMetaCriterion(criterion: MetaCriterion): boolean {
  const conditionMap = {
   draws: () => this.matchIsDraws(criterion.draws),
   metaCount: () => this.matchIsMetaCount(criterion.metaCount),
   dynamic: () => this.matchIsDynamic(criterion.dynamic)
  } as const;

  const result = conditionMap[criterion.conditionType]?.() ?? false;
  return criterion.isNot === true ? !result : result;
 }

 private matchIsDraws(draws: DrawsCondition = { comparison: 'max', unit: 'draws', value: 1 }): boolean {
  return matchIsCountHelper(this.game?.draws ?? 0, draws);
 }

 private matchIsMetaCount(count?: MetaCountCondition): boolean {
  if (!count || !this.meta) return false;
  const valueMap = {
   streamDuration: () => {
    const startTime = this.meta?.startTime;
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / (60 * 1000));
   },
   totalGifts: () => this.meta?.points?.gift ?? 0,
   followers: () => this.meta?.follower ?? 0
  };
  const currentValue = valueMap[count.unit]();
  return this.compareValues(currentValue, count.comparison, count.value);
 }

 private matchIsDynamic(dynamic?: MetaDynamicCondition): boolean {
  if (!dynamic || !this.meta || !this.timeConfig) return false;
  const previousMeta: Record<string, number> = {};

  const valueMap = {
   upVote: () => {
    const upVote = this.meta?.upVote ?? '0';
    return parseInt(upVote, 10);
   },
   viewer: () => this.meta?.viewer ?? 0
  };

  const currentValue = valueMap[dynamic.unit]();
  const previousValue = previousMeta[dynamic.unit] ?? 0;

  const maxValueMap = {
   upVote: this.timeConfig.meta.maxLikes,
   viewer: this.timeConfig.meta.maxViewers
  };

  previousMeta[dynamic.unit] = currentValue;

  switch (dynamic.comparison) {
   case 'min':
    return currentValue <= dynamic.value;
   case 'max':
    return currentValue >= dynamic.value;
   case 'different':
    return currentValue !== previousValue;
   case 'increasing':
    return currentValue > previousValue;
   case 'newMaximum':
    return currentValue > maxValueMap[dynamic.unit];
   default:
    return false;
  }
 }

 private compareValues(current: number, comparison: string, target: number): boolean {
  switch (comparison) {
   case 'min':
    return current <= target;
   case 'max':
    return current >= target;
   case 'equal':
    return current === target;
   case 'loop':
    return target !== 0 && current % target === 0;
   default:
    return false;
  }
 }
}
