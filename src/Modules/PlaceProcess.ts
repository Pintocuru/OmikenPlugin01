// src/Modules/PlaceProcess.ts

import { PlaceType, PlaceValueType, OmikujiType } from "../../src/types";

export class PlaceProcess {
 private placeholders: Record<string, string> = {};

 constructor(private selectOmikuji: OmikujiType) {
  this.selectOmikuji = JSON.parse(JSON.stringify(selectOmikuji));
 }

 // placeholdersに入れる
 updatePlace(data: Record<string, string>): void {
  this.placeholders = { ...this.placeholders, ...data };
 }

 // プレースホルダーの処理
 placeDataHandle(places: Record<string, PlaceType>): void {
  console.log('Processing places for placeIds:', this.selectOmikuji.placeIds);
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

  console.log('Final place results:', result);
  this.updatePlace(result);
 }

 // プレースホルダーを再帰的に解決するメソッド
 private resolvePlaceholder(value: string, places: Record<string, PlaceType>): string {
  const match = value.match(/^<<(.+?)>>$/);
  if (!match) return value;

  const referencedId = match[1];
  if (!places[referencedId]) return value;

  const selectedValue = this.selectPlaceValue(places[referencedId].values);
  return selectedValue ? this.resolvePlaceholder(selectedValue.value, places) : value;
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
  const replacer = (template: string | undefined): string =>
   template
    ? template.replace(/<<(.*?)>>/g, (_, key) => (key in this.placeholders ? this.placeholders[key] : `<<${key}>>`))
    : '';

  this.selectOmikuji.post = this.selectOmikuji.post.map((post) => ({
   ...post,
   content: replacer(post.content),
   party: replacer(post.party)
  }));

  console.log('Final processed omikuji:', this.selectOmikuji);
  return this.selectOmikuji;
 }
}
