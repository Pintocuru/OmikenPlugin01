// src/scripts/PlaceProcess.ts

import { PlaceType, PlaceValueType, OmikujiType } from "../../src/types";

type ScriptModule = {
  default: (parameter: any) => Record<string, string>;
};

export class PlaceProcess {
  private placeholders: Record<string, string> = {};

  constructor(private selectOmikuji: OmikujiType) {}

  // placeholdersに入れる
  updatePlace(data: Record<string, string>): void {
    this.placeholders = { ...this.placeholders, ...data };
  }

  // スクリプトを読み込み、返り値を取得
  // TODO visitData,gameを忘れてませんか!!
  async loadScript(path: string): Promise<void> {
    const { parameter } = this.selectOmikuji.script;
    try {
      const module = (await import(`./${path}`)) as ScriptModule;

      if (typeof module.default !== "function") {
        throw new Error("スクリプトに実行可能な関数が見つかりません。");
      }

      const placeholderResult = module.default(parameter) || {};
      this.updatePlace(placeholderResult);
    } catch (err) {
      console.error(`スクリプトの読み込みに失敗しました: ${err}`);
      throw err;
    }
  }

  // プレースホルダーを処理するメソッド
  placeDataHandle(places: Record<string, PlaceType>): void {
    const result: Record<string, string> = {};

    for (const placeId of this.selectOmikuji.placeIds) {
      const place = places[placeId];
      if (!place || !place.values.length) continue;

      const selectedValue = this.selectPlaceValue(place.values);
      if (selectedValue) {
        result[placeId] = this.resolvePlaceholder(selectedValue.value, places);
      }
    }
    this.updatePlace(result);
  }

  // プレースホルダーを再帰的に解決するメソッド
  private resolvePlaceholder(
    value: string,
    places: Record<string, PlaceType>
  ): string {
    const match = value.match(/^<<(.+?)>>$/);
    if (!match) return value;

    const referencedId = match[1];
    if (!places[referencedId]) return value;

    const selectedValue = this.selectPlaceValue(places[referencedId].values);
    return selectedValue
      ? this.resolvePlaceholder(selectedValue.value, places)
      : value;
  }

  // 重み付きランダム選択メソッド
  private selectPlaceValue(values: PlaceValueType[]): PlaceValueType | null {
    const totalWeight = values.reduce(
      (sum, { weight }) => sum + Math.max(weight, 0),
      0
    );
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
    const replacer = (template: string): string =>
      template.replace(/<<(.*?)>>/g, (_, key) =>
        key in this.placeholders ? this.placeholders[key] : `<<${key}>>`
      );
    this.selectOmikuji.post = this.selectOmikuji.post.map((post) => ({
      ...post,
      content: replacer(post.content),
      party: replacer(post.party),
    }));
    return this.selectOmikuji;
  }
}
