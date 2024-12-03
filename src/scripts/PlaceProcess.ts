// src/scripts/PlaceProcess.ts

import { PlaceType, PlaceValueType, OmikujiType } from "../../src/types";

type ScriptModule = {
  default: (parameter: any) => Record<string, string>;
};

export class PlaceProcess {
  private placeholders: Record<string, string> = {};

  constructor(private selectOmikuji: OmikujiType) {
    console.log(
      "PlaceProcess constructor - initial omikuji:",
      this.selectOmikuji
    );
  }

  // placeholdersに入れる
  updatePlace(data: Record<string, string>): void {
    console.log("updatePlace - before:", this.placeholders);
    this.placeholders = { ...this.placeholders, ...data };
    console.log("updatePlace - after:", this.placeholders);
  }

  // スクリプトを読み込み、返り値を取得
  // TODO visitData,gameを忘れてませんか!!
  async loadScript(path: string): Promise<void> {
    const { parameter } = this.selectOmikuji.script;
    console.log("loadScript - path:", path, "parameter:", parameter);
    try {
      const module = (await import(`./${path}`)) as ScriptModule;

      if (typeof module.default !== "function") {
        console.error("loadScript - No executable function found in script");
        throw new Error("スクリプトに実行可能な関数が見つかりません。");
      }

      const placeholderResult = module.default(parameter) || {};
      console.log("loadScript - placeholderResult:", placeholderResult);
      this.updatePlace(placeholderResult);
    } catch (err) {
      console.error(`スクリプトの読み込みに失敗しました: ${err}`);
      throw err;
    }
  }

  // プレースホルダーを処理するメソッド
  placeDataHandle(places: Record<string, PlaceType>): void {
    console.log("placeDataHandle - places:", places);
    console.log(
      "placeDataHandle - selectOmikuji placeIds:",
      this.selectOmikuji.placeIds
    );

    const result: Record<string, string> = {};

    for (const placeId of this.selectOmikuji.placeIds) {
      const place = places[placeId];
      console.log(`placeDataHandle - Processing placeId: ${placeId}`, place);

      if (!place || !place.values.length) {
        console.warn(
          `placeDataHandle - No place found or empty values for placeId: ${placeId}`
        );
        continue;
      }

      const selectedValue = this.selectPlaceValue(place.values);
      console.log(
        `placeDataHandle - Selected value for ${placeId}:`,
        selectedValue
      );

      if (selectedValue) {
        result[place.name] = this.resolvePlaceholder(selectedValue.value, places);
      }
    }

    console.log("placeDataHandle - result:", result);
    this.updatePlace(result);
  }

  // プレースホルダーを再帰的に解決するメソッド
  private resolvePlaceholder(
    value: string,
    places: Record<string, PlaceType>
  ): string {
    console.log("resolvePlaceholder - input value:", value);
    const match = value.match(/^<<(.+?)>>$/);
    if (!match) return value;

    const referencedId = match[1];
    console.log("resolvePlaceholder - referencedId:", referencedId);

    if (!places[referencedId]) {
      console.warn(
        `resolvePlaceholder - No place found for referencedId: ${referencedId}`
      );
      return value;
    }

    const selectedValue = this.selectPlaceValue(places[referencedId].values);
    console.log("resolvePlaceholder - selectedValue:", selectedValue);

    return selectedValue
      ? this.resolvePlaceholder(selectedValue.value, places)
      : value;
  }

  // 重み付きランダム選択メソッド
  private selectPlaceValue(values: PlaceValueType[]): PlaceValueType | null {
    console.log("selectPlaceValue - input values:", values);

    const totalWeight = values.reduce(
      (sum, { weight }) => sum + Math.max(weight, 0),
      0
    );
    console.log("selectPlaceValue - totalWeight:", totalWeight);

    if (totalWeight <= 0) return null;

    let rand = Math.random() * totalWeight;
    console.log("selectPlaceValue - random value:", rand);

    for (const value of values) {
      rand -= Math.max(value.weight, 0);
      if (rand < 0) {
        console.log("selectPlaceValue - selected value:", value);
        return value;
      }
    }

    console.log("selectPlaceValue - no value selected");
    return null;
  }

  // プレースホルダーを置き換えし、selectOmikujiを返す
  replacementPlace(): OmikujiType {
    console.log("replacementPlace - initial placeholders:", this.placeholders);

  const replacer = (template: string | undefined): string =>
    template
      ? template.replace(/<<(.*?)>>/g, (_, key) => {
          const replacement =
            key in this.placeholders ? this.placeholders[key] : `<<${key}>>`;
          console.log(`replacementPlace - replacing ${key}: ${replacement}`);
          return replacement;
        })
      : '';

    this.selectOmikuji.post = this.selectOmikuji.post.map((post) => ({
      ...post,
      content: replacer(post.content),
      party: replacer(post.party),
    }));

    console.log("replacementPlace - final omikuji:", this.selectOmikuji);
    return this.selectOmikuji;
  }
}
