// src/scripts/CommentInstance.ts

import {
  CharaType,
  GameType,
  OmikenType,
  OmikujiPostType,
  OmikujiType,
  PlaceType,
  PlaceValueType,
  postOneCommeRequestType,
  PresetCharaType,
  PresetScriptType,
  RulesType,
  TimeConfigType,
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
  private TimeConfig: TimeConfigType;
  private selectRule: RulesType;
  private selectOmikuji: OmikujiType;
  private visit: VisitType;
  private game: GameType;
  private visitData: visitDataType;
  private isTester: boolean;

  // 初期化
  constructor(comment: Comment, visit: VisitType, TimeConfig: TimeConfigType) {
    this.comment = this.thisComment(comment);
    this.TimeConfig = TimeConfig;
    this.visit = visit || {
      name: comment.data.displayName,
      userId: comment.data.userId,
      status: "syoken",
      lastPluginTime: this.TimeConfig.pluginTime,
      visitData: {},
    };
    // ユーザーの枠情報が空白または異なるなら、Visitを初期化
    this.resetVisit();
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
      // comment.data.userIdを返す
      userId: () => this.comment.data.userId,
      // おみくじのidを返す
      ruleId: () => this.selectRule.id,
      // Gameを返す
      game: () => this.game,
      // visit情報を返す
      visit: () => this.visit,
    };
    return dataMap[data] && dataMap[data]();
  }

  // ユーザーの枠情報が空白または異なるなら、Visitを初期化
  resetVisit() {
    const pluginTime = this.TimeConfig.pluginTime;
    if (this.visit.lastPluginTime === pluginTime) return;

    // statusを空白にし、drawsを0にする
    this.visit.status = "";
    Object.values(this.visit.visitData).forEach((data) => {
      data.draws = 0;
    });
  }

  // ---

  // rulesとomikujiから該当するおみくじを抽選する
  omikenSelect(
    rulesArray: RulesType[],
    omikujis: Record<string, OmikujiType>
  ): boolean {
    // 各ルールに対して処理を実行し、ruleも一緒に返す
    const result = rulesArray
      .map((rule) => ({
        rule,
        omikuji: this.ruleProcess(rule, omikujis),
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
  ruleProcess(
    rule: RulesType,
    omikujis: Record<string, OmikujiType>
  ): OmikujiType | null {
    // thresholdチェック(New)
    const checker = new ThresholdChecker(
      rule,
      this.comment,
      this.visit,
      this.TimeConfig
    );
    const isValid = rule.threshold.every((threshold) =>
      checker.check(threshold)
    );
    if (!isValid) return null;

    // 有効なおみくじの取得
    const validOmikujis = rule.enableIds
      .map((id) => omikujis[id])
      .filter((omikuji) =>
        omikuji.threshold.every((threshold) => checker.check(threshold))
      );
    if (validOmikujis.length === 0) return null;

    return this.omikujisLottery(validOmikujis);
  }

  // おみくじ(アイテム抽選)
  omikujisLottery(items: OmikujiType[]): OmikujiType | null {
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

  // おみくじの処理と投稿
  async omikujiProcess(
    game: GameType,
    places: Record<string, PlaceType>,
    Charas: Record<string, PresetCharaType>,
    Scripts: Record<string, PresetScriptType>
  ): Promise<Comment | false> {
    this.game = game; // Gameをthisに入れる
    this.omikenDraws(); // drawsのインクリメント

    // statusがあるなら書き換え
    if (this.selectOmikuji.status)
      this.visit.status = this.selectOmikuji.status;

    // scriptがあるなら、外部スクリプトを実行、返り値を取得する
    const placeScript = await this.placeScriptHandle(Scripts);

    // placeIds があるなら、該当する内容をplacesから取得
    const placeData = this.placeDataHandle(places);

    // おみくじの回数(個人・総合)
    const placeDraws = {
      draws: this.visitData.draws,
      totalDraws: this.visitData.totalDraws,
      gameDraws: this.game.draws,
      gameTotalDraws: this.game.totalDraws,
    };

    // コメント(名前・コメントの回数)
    const placeComment = {
      user: this.comment.data.displayName,
      tc: this.comment.meta.tc.toString(),
      no: this.comment.meta.no.toString(),
      lc: this.comment.meta.lc.toString(),
    };

    // this.selectOmikuji.postにある content と party に対して、プレースホルダーを置き換えする
    // プレースホルダーの置き換え処理を共通化
    const replacePlaceholders = (template: string): string => {
      return template.replace(/<<(.*?)>>/g, (_, key) => {
        // スクリプト優先
        if (key in placeScript) return placeScript[key];
        if (key in placeData) return placeData[key];
        if (key in placeDraws) return placeDraws[key].toString();
        if (key in placeComment) return placeComment[key];
        return `<<${key}>>`; // 未解決のプレースホルダーはそのまま残す
      });
    };

    // 配列内の全要素に対してcontentとpartyを置き換え
    this.selectOmikuji.post = this.selectOmikuji.post.map((post) => ({
      ...post,
      content: replacePlaceholders(post.content),
      party: replacePlaceholders(post.party),
    }));

    // メッセージ投稿(わんコメ/他の何らかのサービス)
    this.selectOmikuji.post.map((post) =>
      this.postMessage(post, Charas[post.botKey].item)
    );

    // omikuji.delete = trueなら、コメントを消す
    // TODO 将来、コメント編集機能も追加したいな
    return this.selectOmikuji.delete ? false : this.comment;
  }

  // visitDataのdrawsをインクリメント
  private omikenDraws() {
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

  // スクリプトを読み込み、返り値を取得
  private async placeScriptHandle(
    Scripts: Record<string, PresetScriptType>
  ): Promise<Record<string, string>> {
    if (!this.selectOmikuji.script) return {};
    const { scriptId, parameter } = this.selectOmikuji.script;
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

  // placeIdsから使用されているプレースホルダーを探し、抽選を行い返り値を渡す
  private placeDataHandle(
    places: Record<string, PlaceType>
  ): Record<string, string> {
    if (!this.selectOmikuji.placeIds) return {};

    const result: Record<string, string> = {};

    // プレースホルダー解決関数
    const resolvePlaceholder = (value: string): string => {
      const match = value.match(/^<<(.+?)>>$/);
      if (!match) return value; // プレースホルダー形式でなければそのまま返す

      const referencedId = match[1];
      if (!places[referencedId]) return value; // 対応するplaceがなければそのまま返す

      const selectedValue = this.selectPlaceValue(places[referencedId].values);
      return selectedValue ? resolvePlaceholder(selectedValue.value) : value;
    };

    // 各placeIdに対して処理を実行
    for (const placeId of this.selectOmikuji.placeIds) {
      const place = places[placeId];
      if (!place || !place.values.length) continue;

      const selectedValue = this.selectPlaceValue(place.values);
      if (selectedValue) {
        result[placeId] = resolvePlaceholder(selectedValue.value);
      }
    }
    return result;
  }

  // selectPlaceValue関数
  private selectPlaceValue(values: PlaceValueType[]): PlaceValueType | null {
    const totalWeight = values.reduce(
      (sum, { weight }) => sum + Math.max(weight, 0), // 負のweightは0として扱う
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

  // メッセージ投稿(現在はわんコメのみ、toast 機能は未実装)
  postMessage(post: OmikujiPostType, chara: CharaType) {
    const { type, iconKey, content, party, delaySeconds } = post;
    if (!content?.trim()) return; // 空のメッセージは処理しない

    switch (type) {
      case "onecomme":
        // キャラデータを取得
        const charaImage = chara.image[iconKey] || chara.image.Default;

        const Request: postOneCommeRequestType = {
          service: {
            id: chara.frameId || this.TimeConfig.defaultFrameId,
          },
          comment: {
            id: Date.now() + Math.random().toString().slice(2, 12),
            userId: "FirstCounter",
            name: chara.name,
            comment: content,
            profileImage: charaImage ? charaImage : "",
          },
        };
        postOneComme(delaySeconds, Request);
        break;
      case "party":
        postWordParty(delaySeconds, content);
        break;
      case "speech":
        postSpeech(delaySeconds, content);
        break;
    }
    return null;
  }
}
