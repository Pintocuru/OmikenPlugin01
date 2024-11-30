// src/scripts/CommentInstance.ts

import {
  GameType,
  OmikenType,
  OmikujiPostType,
  OmikujiType,
  PlaceType,
  PlaceValueType,
  PresetCharaType,
  PresetScriptType,
  RulesType,
  visitDataType,
  VisitType,
} from "../../src/types/index";
import { postOneComme, postWordParty, postSpeech } from "./PostOmikuji";
import { ThresholdChecker } from "./ThresholdCheck";
import { Comment } from "@onecomme.com/onesdk/types/Comment";

//////////////////////////////////
// コメントのインスタンス化
//////////////////////////////////
export class CommentInstance {
  private comment: Comment;
  private AppSettings: any; // TODO あとで型指定
  private selectRule: RulesType;
  private selectOmikuji: OmikujiType;
  private visit: VisitType;
  private game: GameType;
  private visitData: visitDataType;
  private isTester: boolean;

  // TODO 配信枠のデータも取得する
  constructor(comment: Comment, visit: VisitType, AppSettings: any) {
    this.comment = this.thisComment(comment);
    this.AppSettings = AppSettings;
    this.visit = visit || {
      name: comment.data.displayName,
      userId: comment.data.userId,
      status: "syoken",
      serviceId: "",
      visitData: {},
    };
  }

  // コメントの前処理
  private thisComment(comment: Comment): Comment {
    this.isTester =
      comment.service === "external" || comment.id === "COMMENT_TESTER";

    // コメントテスター用の擬似メタデータ
    comment.meta =
      comment.id === "COMMENT_TESTER"
        ? { interval: 999999, tc: 10, no: 2, lc: 10 }
        : comment.meta;

    // ギフト価格の通貨変換(えっ、1ドル100円ですか?)
    if (comment.data && "unit" in comment.data) {
      if (comment.data.unit === "$") {
        comment.data.price *= 100;
        comment.data.unit = "¥";
      }
    }
    return comment;
  }

  // データを返す
  getDATA(data: string) {
    const dataMap = {
      // テスターでないなら、comment.data.userIdを返す
      userId: () => this.comment.data.userId,
      // おみくじのidを返す
      ruleId: () => this.selectRule.id,
      // Gameを返す
      Game: () => this.game,
      // visit情報を返す
      visit: () => this.visit,
    };
    return dataMap[data] && dataMap[data]();
  }

  // ユーザーの枠情報が空白または異なるなら、Visitを初期化
  resetVisit(nowServiceId: string) {
    if (this.visit.serviceId === nowServiceId) return;

    // statusを空白にし、drawsを0にする
    this.visit.status = "";
    Object.values(this.visit.visitData).forEach((data) => {
      data.draws = 0;
    });
  }

  // ---

  // rulesとomikujiから該当するおみくじを抽選する
  omikenSelect(Omiken: OmikenType): boolean {
    // rulesOrderに基づいて配列にする
    const rules = Omiken.rulesOrder.map((key) => Omiken.rules[key]);

    // 各ルールに対して処理を実行し、ruleも一緒に返す
    const result = rules
      .map((rule) => ({
        rule,
        omikuji: this.omikenProcessRule(rule, Omiken.omikuji),
      }))
      .find(({ omikuji }) => omikuji !== null);

    if (result) {
      this.selectRule = result.rule; // ヒットしたruleを設定
      this.selectOmikuji = result.omikuji; // ヒットしたomikujiを設定
      this.visitData = this.visit.visitData[result.rule.id]; // visitDataを取得
      return true;
    }
    return false;
  }

  // 単一ルールの処理
  omikenProcessRule(
    rule: RulesType,
    omikujis: Record<string, OmikujiType>
  ): OmikujiType | null {
    // thresholdチェック(New)
    const checker = new ThresholdChecker(
      rule,
      this.comment,
      this.visit,
      this.AppSettings
    );
    const isValid = rule.threshold.every((threshold) =>
      checker.check(threshold)
    );
    if (!isValid) return null;

    // 有効なおみくじの取得
    const validOmikuji = rule.enableIds
      .map((id) => omikujis[id])
      .filter((omikuji) =>
        omikuji.threshold.every((threshold) => checker.check(threshold))
      );
    if (validOmikuji.length === 0) return null;

    return this.omikenSelectItem(validOmikuji);
  }

  // アイテム抽選
  omikenSelectItem(items: OmikujiType[]): OmikujiType | null {
    if (items.length === 0) return null;

    // 1. rankが最も高い値を取得
    const maxRank = Math.max(...items.map((item) => item.rank));

    // 2. rankが最も高いアイテムだけをフィルタリング
    const filteredItems = items.filter((item) => item.rank === maxRank);

    // 3. 合計ウェイトを計算
    const totalWeight = filteredItems.reduce(
      (sum, { weight }) => sum + (weight >= 0 ? weight : 1),
      0
    );
    if (totalWeight <= 0) return null;

    // 4. 抽選処理
    let rand = Math.random() * totalWeight;
    return (
      filteredItems.find(
        (item) => (rand -= item.weight >= 0 ? item.weight : 1) < 0
      ) ?? null
    );
  }

  // ---

  // メッセージの処理と投稿
  async postProcess(
    game: GameType,
    place: PlaceType,
    Charas: Record<string, PresetCharaType>,
    Scripts: Record<string, PresetScriptType>
  ): Promise<any> {
    this.game = game; // Gameをthisに入れる
    this.omikenDraws(); // drawsのインクリメント
    const omikuji = this.selectOmikuji;

    // statusがあるなら書き換え
    if (omikuji.status) this.visit.status = omikuji.status;

    // omikuji.delete = trueなら、コメントを消す
    const isComment = !omikuji.delete;

    // scriptがあるなら、外部スクリプトを実行、返り値を取得する
    const placeScript = await this.postScriptPlace(omikuji, Scripts);

    // メッセージ処理とトースト生成
    const toastArray = await this.processOmikujiPosts(
      omikuji,
      place,
      placeScript
    );
    // toast:toastArray[], // コメントにtoastを付与するときのデータ
    // isComment : Boolean, // コメント削除ならfalseにする
    return { toastArray, isComment };
  }

  // visitDataのdrawsをインクリメント
  omikenDraws() {
    this.visitData = {
      ...this.visitData,
      id: this.selectOmikuji.id,
      draws: (this.visitData.draws || 0) + 1,
      totalDraws: (this.visitData.totalDraws || 0) + 1,
    };
    this.game = {
      ...this.game,
      id: this.selectRule.id,
      draws: (this.visitData.draws || 0) + 1,
      totalDraws: (this.visitData.totalDraws || 0) + 1,
    };
  }

  // スクリプト読み込み
  private async postScriptPlace(
    omikuji: OmikujiType,
    Scripts: Record<string, PresetScriptType>
  ): Promise<Record<string, string>> {
    if (!omikuji.script) return {};
    const { scriptId, parameter } = omikuji.script;
    try {
      const module = await import(`./${Scripts[scriptId].path}`);

      if (typeof module.default === "function") {
        return module.default(parameter) || {};
      }

      console.error("スクリプトに実行可能な関数が見つかりません。");
      return {};
    } catch (err) {
      console.error(`スクリプトの読み込みに失敗しました: ${err}`);
      return {};
    }
  }

  // メッセージ処理とトースト生成
  private async processOmikujiPosts(
    omikuji: OmikujiType,
    place: PlaceType,
    placeScript: Record<string, string>
  ): Promise<OmikujiPostType[]> {
    const toastArray: OmikujiPostType[] = [];

    // postの処理
    for (const post of omikuji.post) {
      const contentProcess = await this.postPlaceholder(
        post.content,
        place,
        placeScript
      );

      const finalPost = { ...post, content: contentProcess };
      const toast = this.postMessage(finalPost);

      if (toast) toastArray.push(toast);
    }

    return toastArray;
  }

  // メッセージ内容の処理
  postPlaceholder(
    content: string,
    place: PlaceType,
    placeScript: Record<string, string> = {}
  ): Promise<string> {
    // コメントの値(user/lcなど)を置き換え
    let contentProcess = this.postPlaceholderComment(content);
    if (placeScript) contentProcess = this.hoge(contentProcess, placeScript);
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

  // プレースホルダー:外部スクリプトの値を置換
  hoge(content: string, placeScript: Record<string, string>): string {
    // プレースホルダーのパターンを正規表現でマッチ
    return content.replace(/<<(\w+)>>/g, (_, key) => {
      // placeScript にキーが存在する場合はその値に置き換える
      return placeScript[key] ?? `<<${key}>>`; // 存在しない場合は元のプレースホルダーを維持
    });
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
    if (!placeData.values?.length) return null;
    const selectedValue = this.selectPlaceValue(placeData.values);
    return selectedValue?.value ?? null;
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
}
