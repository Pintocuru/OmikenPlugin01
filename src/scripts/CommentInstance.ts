// src/scripts/CommentInstance.ts

import {
  CharaType,
  GameType,
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
import { PlaceProcess } from "./PlaceProcess";
import {
  postOneComme,
  postWordParty,
  postSpeech,
  PostMessages,
} from "./PostOmikuji";
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
    Games: Record<string, GameType>,
    places: Record<string, PlaceType>,
    Charas: Record<string, PresetCharaType>,
    Scripts: Record<string, PresetScriptType>
  ): Promise<Comment | false> {
    this.visitData = this.visit.visitData[this.selectRule.id]; // visitDataを取得
    this.game = Games[this.selectRule.id]; // Gameをthisに入れる
    this.omikenDraws(); // drawsのインクリメント
    // statusがあるなら書き換え
    if (this.selectOmikuji.status)
      this.visit.status = this.selectOmikuji.status;

    // class生成
    const placeClass = new PlaceProcess(this.selectOmikuji);

    // scriptがあるなら、外部スクリプトを実行、返り値を取得する
    // TODO visitData,gameを忘れてませんか!!
    if (this.selectOmikuji.script) {
      const { scriptId } = this.selectOmikuji.script;
      await placeClass.loadScript(Scripts[scriptId].path);
    }
    // placeIds があるなら、該当する内容をplacesから取得
    if (this.selectOmikuji.placeIds) placeClass.placeDataHandle(places);

    // おみくじの回数(個人・総合) / コメント(名前・コメントの回数)
    placeClass.updatePlace({
      draws: this.visitData.draws.toString(),
      totalDraws: this.visitData.totalDraws.toString(),
      gameDraws: this.game.draws.toString(),
      gameTotalDraws: this.game.totalDraws.toString(),
      user: this.comment.data.displayName,
      tc: this.comment.meta.tc.toString(),
      no: this.comment.meta.no.toString(),
      lc: this.comment.meta.lc.toString(),
    });

    // プレースホルダーを置き換えし、selectOmikujiを返す
    this.selectOmikuji = placeClass.replacementPlace();

    // メッセージ投稿(わんコメ/他の何らかのサービス)
    new PostMessages(
      this.selectOmikuji.post,
      Charas,
      this.TimeConfig.defaultFrameId
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
}
