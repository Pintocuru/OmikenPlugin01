// src/Modules/components/PlayOmikuji.ts
import crypto from 'crypto';

export class PlayOmikuji {
 constructor(private items: any[]) {}

 /**
  * おみくじを引くメインロジック
  * @returns 当選したアイテムまたはnull
  */
 draw(): any | null {
  if (!this.isValidItems()) return null;

  // rankが最も高い値を取得し、該当アイテムのみフィルタリング
  const maxRank = Math.max(...this.items.map((item) => item.rank ?? 0));
  const filteredItems = this.items.filter((item) => (item.rank ?? 0) === maxRank);

  const totalWeight = filteredItems.reduce((sum, item) => sum + (item.weight > 0 ? item.weight : 1), 0);
  if (totalWeight <= 0) return null;

  const random = (crypto.randomInt(2 ** 32) / 2 ** 32) * totalWeight;
  let currentWeight = 0;

  for (const item of filteredItems) {
   currentWeight += item.weight > 0 ? item.weight : 1;
   if (random < currentWeight) return item;
  }

  return null;
 }

 /**
  * 指定回数の抽選結果を集計して分布を返す
  * @param iterations 抽選回数（デフォルト: 1000）
  * @returns アイテムごとの当選率（%）
  */
 getDistribution(iterations = 1000): Map<any, string> {
  if (!this.isValidItems()) return new Map();

  const distribution = new Map<any, number>();
  for (let i = 0; i < iterations; i++) {
   const result = this.draw();
   if (result) {
    const key = result.id || result;
    distribution.set(key, (distribution.get(key) || 0) + 1);
   }
  }

  return new Map(
   Array.from(distribution.entries()).map(([key, count]) => [key, `${((count / iterations) * 100).toFixed(2)}%`])
  );
 }

 /**
  * アイテムが有効かどうかをチェック
  * @returns 配列かつ非空であればtrue
  */
 private isValidItems(): boolean {
  return Array.isArray(this.items) && this.items.length > 0;
 }
}
