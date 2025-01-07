// src/Modules/PlaceProcess.ts
import { PlaceType, PlaceValueType, OmikujiType } from '@type';

export class PlaceProcess {
 private placeholders: Record<string, string | number> = {};

 constructor(private selectOmikuji: OmikujiType) {
  this.selectOmikuji = JSON.parse(JSON.stringify(selectOmikuji));
 }

 // placeholdersに入れる
 updatePlace(data: Record<string, string | number>): void {
  this.placeholders = { ...this.placeholders, ...data };
 }

 // プレースホルダーの処理
 placeDataHandle(places: Record<string, PlaceType>): void {
  const result: Record<string, string> = {};
  // placeIds に入っているidだけ処理を行う
  for (const placeId of this.selectOmikuji.placeIds) {
   const place = places[placeId];
   if (!place || !place.values.length) continue;
   const selectedValue = this.selectPlaceValue(place.values);

   if (selectedValue) {
    result[place.name] = this.resolvePlaceholder(selectedValue.value, places);
   }
  }

  this.updatePlace(result);
 }

 // プレースホルダーを再帰的に解決するメソッド
 private resolvePlaceholder(value: string, places: Record<string, PlaceType>): string {
  // まず、既存のplaceholdersに該当する値があるか確認
  const directMatch = value.match(/^<<(.+?)>>$/);
  if (directMatch && directMatch[1] in this.placeholders) {
   return String(this.placeholders[directMatch[1]]);
  }

  // placesからの解決を試みる
  const match = value.match(/^<<(.+?)>>$/);
  if (!match) return value;

  const referencedId = match[1];
  if (!places[referencedId]) return value;

  const selectedValue = this.selectPlaceValue(places[referencedId].values);
  if (!selectedValue) return value;

  // 解決した値をplaceholdersに保存
  const resolvedValue = selectedValue.value;
  this.placeholders[referencedId] = resolvedValue;

  // 解決した値に更にプレースホルダーがあれば再帰的に解決
  return this.resolvePlaceholder(resolvedValue, places);
 }

 // 重み付きランダム選択メソッド
 private selectPlaceValue(values: PlaceValueType[]): PlaceValueType | null {
  const totalWeight = values.reduce((sum, { weight }) => sum + Math.max(weight, 0), 0);
  if (totalWeight <= 0) return null;

  let rand = Math.random() * totalWeight;

  for (const value of values) {
   rand -= Math.max(value.weight, 0);
   if (rand < 0) return value;
  }

  return null;
 }

 // プレースホルダーを置き換えし、selectOmikujiを返す
 replacementPlace(): OmikujiType {
  const replacer = (template: string | undefined): string => {
   if (!template) return '';

   let result = template;
   let previous: string;

   // 値が変化しなくなるまで置換を続ける（最大1回の再帰）
   do {
    previous = result;
    result = result.replace(/<<(.*?)>>/g, (_, key) => {
     if (key in this.placeholders) {
      const value = this.placeholders[key];
      return value !== undefined ? String(value) : `<<${key}>>`;
     }
     return `<<${key}>>`;
    });
   } while (result !== previous && result.includes('<<') && result !== template);

   return result;
  };

  this.selectOmikuji.post = this.selectOmikuji.post.map((post) => ({
   ...post,
   content: replacer(post.content),
   party: replacer(post.party)
  }));

  return this.selectOmikuji;
 }
}
