// src/Modules/omikuji/ThresholdHelpers.ts
import { DrawsCondition, CountCondition, GiftCondition } from '@type';

// ギフトの色を返す(Youtube基準)
export const matchIsGiftHelper = (price?: number | null): GiftCondition => {
 if (!price || price <= 0) return GiftCondition.All;
 const giftRanges = new Map([
  [200, GiftCondition.Blue],
  [500, GiftCondition.LightBlue],
  [1000, GiftCondition.Green],
  [2000, GiftCondition.Yellow],
  [5000, GiftCondition.Orange],
  [10000, GiftCondition.Pink],
  [20000, GiftCondition.Red],
  [Infinity, GiftCondition.Purple]
 ]);
 for (const [threshold, condition] of giftRanges) {
  if (price < threshold) return condition;
 }
 return GiftCondition.Purple;
};

// 数値比較ヘルパー関数
export const matchIsCountHelper = (valueNow: number, count: DrawsCondition | CountCondition): boolean => {
 const { comparison, value } = count;

 const comparisonStrategies = {
  loop: () => value !== 0 && valueNow % value === 0,
  min: () => valueNow <= value,
  max: () => valueNow >= value,
  equal: () => valueNow === value
 } as const;

 return comparisonStrategies[comparison]?.() ?? false;
};
