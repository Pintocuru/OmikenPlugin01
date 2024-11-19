// src/scripts/CommentInstance.ts

import {
  BaseComment,
  GameType,
  OmikenType,
  OmikujiPostType,
  OmikujiType,
  PlaceType,
  PlaceValueType,
  RulesType,
  visitDataType,
  VisitType,
} from "../../src/types/index";
import { postOneComme, postWordParty, postSpeech } from "./PostOmikuji";
import { thresholdCheck } from "./ThresholdCheck";

//////////////////////////////////
// コメントのインスタンス化
//////////////////////////////////
export class CommentInstance {
  comment: BaseComment;
  selectOmikuji: OmikujiType;
  visit: Partial<VisitType>;
  Game: GameType;
  visitData: visitDataType;
  Tester: boolean;

  constructor(comment: BaseComment, visit: VisitType) {
    this.comment = comment;
    // 配信サイトでないコメントはVisitに入れない
    this.Tester =
      comment.service === "external" || comment.id === "COMMENT_TESTER";
    // コメントテスターであれば、仮のmetaデータを入れる
    this.comment.meta =
      comment.id === "COMMENT_TESTER"
        ? { interval: 999999, tc: 10, no: 2, lc: 10 }
        : this.comment.meta;
    // ギフトが存在し、かつunitが$ならpriceを100倍(えっ、1ドル100円ですか?)
    if (this.comment.data?.unit === "$") {
      this.comment.data.price *= 100;
      this.comment.data.unit = "¥";
    }
    // visitData // TODO visitはリセットしなくなったので、作り直さないといけない
    this.visit = visit || {
      name: comment.data.displayName,
      isSyoken: comment.meta.interval === 0, // 初見なら、visitに初見をつける
    };
  }

  // データを返す
  getDATA(data: string) {
    const dataMap = {
      // テスターでないなら、comment.data.userIdを返す
      userId: () => this.comment.data.userId,
      // おみくじのidを返す
      omikujiId: () => this.selectOmikuji.id,
      // Gameを返す
      Game: () => this.Game,
      // visit情報を返す
      visit: () => this.visit,
    };
    return dataMap[data] && dataMap[data]();
  }

  // おみくじCheck・実行の全体の処理
  handleOmiken() {
    // ルールとおみくじの処理
    const selectedOmikuji = this.omikenSelect(Omiken);
    if (!selectedOmikuji) return null;

    // メッセージの処理と投稿
    const toast = this.postProcess(selectedOmikuji, this.comment, Omiken);
    if (!toast) return null;
    return toast;
  }

  // ---

  // ルールとおみくじの処理
  omikenSelect(Omiken: OmikenType): boolean {
    // rulesOrderに基づいて配列にする
    const rules = this.omikenRulesSort(Omiken.rules, Omiken.rulesOrder);

    // 各ルールに対して処理を実行
    const selectedOmikuji = rules
      .map((rule) => this.omikenProcessRule(this.comment, rule, Omiken))
      .find((result) => result !== null);

    if (selectedOmikuji) {
      this.selectOmikuji = selectedOmikuji;
      this.visitData = this.visit.visitData[selectedOmikuji.id];
      this.omikenVisitDraws();
      return true;
    }
    return false;
  }

  // visitDataのdrawsをインクリメント
  omikenVisitDraws() {
    this.visitData = {
      ...this.visitData,
      id: this.selectOmikuji.id,
      draws: (this.visitData.draws || 0) + 1, // TODO 枠変更時に初期化したい
      totalDraws: (this.visitData.totalDraws || 0) + 1,
    };
  }

  // ルールの並び替え処理
  omikenRulesSort(
    rules: Record<string, RulesType>,
    rulesOrder: string[]
  ): RulesType[] {
    // 優先順位
    const conditionTypeOrder = ["match", "gift", "syoken", "access", "count"];

    return rulesOrder
      .map((key) => rules[key])
      .filter((rule) => rule.threshold.conditionType !== "timer")
      .sort((a, b) => {
        const indexA = conditionTypeOrder.indexOf(a.threshold.conditionType);
        const indexB = conditionTypeOrder.indexOf(b.threshold.conditionType);
        return indexA - indexB;
      });
  }

  // 単一ルールの処理
  omikenProcessRule(
    comment: BaseComment,
    rule: RulesType,
    Omiken: OmikenType
  ): OmikujiType | null {
    if (!thresholdCheck(comment, rule.threshold)) return null;

    const validOmikuji = this.omikenValidOmikuji(comment, rule, Omiken);
    if (validOmikuji.length === 0) return null;

    return this.omikenSelectItem(validOmikuji);
  }

  // 有効なおみくじの取得
  omikenValidOmikuji(
    comment: BaseComment,
    rule: RulesType,
    Omiken: OmikenType
  ): OmikujiType[] {
    return rule.enabledIds
      .map((id) => Omiken.omikuji[id])
      .filter((omikuji) => thresholdCheck(comment, omikuji.threshold));
  }

  // アイテム抽選
  omikenSelectItem(items: OmikujiType[]): OmikujiType | null {
    const totalWeight = items.reduce(
      (sum, { weight }) => sum + (weight >= 0 ? weight : 1),
      0
    );
    if (totalWeight <= 0) return null;

    let rand = Math.random() * totalWeight;
    return (
      items.find((item) => (rand -= item.weight >= 0 ? item.weight : 1) < 0) ??
      null
    );
  }

  // ---

  // メッセージの処理と投稿
  async postProcess(Game: GameType, place: PlaceType): Promise<any> {
    // Gameをthisに入れる
    this.Game = Game;

    // postの処理
    const toastArray: OmikujiPostType[] = [];
    for (const post of this.selectOmikuji.post) {
      const contentProcess = await this.postPlaceholder(post.content, place);
      const finalPost = { ...post, content: contentProcess };
      const toast = postMessage(finalPost);
      // toast投稿があるなら蓄える
      if (toast) toastArray.push(toast);
    }
    return toastArray.length !== 0 ? toastArray : null;
  }

  // メッセージ内容の処理
  postPlaceholder(content: string, place: PlaceType): Promise<string> {
    // コメントの値(user/lcなど)を置き換え
    let contentProcess = this.postPlaceholderComment(content);
    // place の置き換え
    return this.postPlaceholderPlace(contentProcess, place);
  }

  // プレースホルダー:コメントの値を置換
  postPlaceholderComment(content: string): string {
    const commentPlaceholders = {
      "<<user>>": this.comment.data.displayName,
      "<<tc>>": this.comment.meta.tc.toString(),
      "<<no>>": this.comment.meta.no.toString(),
      "<<lc>>": this.comment.meta.lc.toString(),
    };

    return Object.entries(commentPlaceholders).reduce(
      (acc, [placeholder, value]) =>
        acc.replace(new RegExp(placeholder, "g"), value),
      content
    );
  }

  // 通常プレースホルダーの置換
  async postPlaceholderPlace(
    content: string,
    place: PlaceType
  ): Promise<string> {
    const placeholders = content.match(/<<([^>>]+)>>/g);
    if (!placeholders) return content;

    let result = content;
    for (const placeholder of placeholders) {
      // TODO placeDataの取得方法は、たぶん違う気がする
      const placeName = placeholder.slice(2, -2);
      const placeData = place[placeName];
      if (!placeData) continue;

      const value = await this.placeValueGet(placeData);
      if (value) {
        result = result.replace(placeholder, value);
      }
    }
    return result;
  }

  // プレースホルダー値の取得を修正
  private async placeValueGet(placeData: PlaceType): Promise<string | null> {
    try {
      switch (placeData.type) {
        case "single":
          // values が undefined の場合のガード
          if (!placeData.values?.length) return null;
          return placeData.values[0].value;

        case "weight":
          if (!placeData.values?.length) return null;
          const selectedValue = this.selectPlaceValue(placeData.values);
          return selectedValue?.value ?? null;

        case "script":
          if (!placeData.script) return null;
          return await this.executeScript(placeData);

        default:
          const _exhaustiveCheck: never = placeData.type; // 型の網羅性チェック
          return null;
      }
    } catch (error) {
      console.error("Error in placeValueGet:", error);
      return null;
    }
  }

  // ネストされたプレースホルダーの処理
  processNestedPlaceholder(value: string, Omiken: OmikenType): string {
    const nestedPlaceholder = value.match(/<<([^>>]+)>>/);
    if (!nestedPlaceholder) return value;

    const nestedPlaceName = nestedPlaceholder[1];
    const nestedPlaceData = Omiken.place[nestedPlaceName];
    if (!nestedPlaceData) return value;

    const nestedValue = this.selectPlaceValue(nestedPlaceData.values);
    return nestedValue ? value.replace(/<<[^>>]+>>/, nestedValue.value) : value;
  }

  // メッセージの投稿 toast ならそのまま返し、それ以外はわんコメへ投稿
  postMessage(post: OmikujiPostType) {
    const { type, botKey, iconKey } = post;

    switch (type) {
      case "toast":
        return post;
      case "onecomme":
        postOneComme(post);
        break;
      case "party":
        postWordParty(post);
        break;
      case "speech":
        postSpeech(post);
        break;
    }
    return null;
  }

  // プレースホルダー値の抽選ヘルパー関数
  selectPlaceValue(values: PlaceValueType[]): PlaceValueType | null {
    const totalWeight = values.reduce(
      (sum, { weight }) => sum + (weight >= 0 ? weight : 1),
      0
    );
    if (totalWeight <= 0) return null;

    let rand = Math.random() * totalWeight;
    return (
      values.find(
        (value) => (rand -= value.weight >= 0 ? value.weight : 1) < 0
      ) ?? null
    );
  }

  // スクリプト実行処理を追加
  private async executeScript(placeData: PlaceType): Promise<string | null> {
    if (!placeData.script?.url) return null;
    try {
      const scriptModule = await import(placeData.script.url);
      const result = await scriptModule.default(this.visit);
      return String(result);
    } catch (error) {
      console.error("Script execution error:", error);
      return null;
    }
  }
}
