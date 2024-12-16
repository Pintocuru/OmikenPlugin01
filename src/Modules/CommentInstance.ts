// src/scripts/CommentInstance.ts

import { UserNameData } from "@onecomme.com/onesdk/types/UserData";
import {
  CharaType,
  GameType,
  OmikujiType,
  PlaceType,
  PresetType,
  RulesType,
  ScriptsParamType,
  ScriptsReturnType,
  TimeConfigType,
  visitDataType,
  VisitType,
} from "../../src/types/index";
import { PlaceProcess } from "./PlaceProcess";
import { PostMessages } from "./PostOmikuji";
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
  private userData: UserNameData;
  private isFirstVisit: boolean;
  private isTester: boolean;

  // 初期化
  constructor(
    comment: Comment,
    visit: VisitType,
    TimeConfig: TimeConfigType,
    userData: UserNameData
  ) {
    this.TimeConfig = TimeConfig;
    this.userData = userData;
    this.visit = visit || {
      name: comment.data.displayName,
      userId: comment.data.userId,
      status: "",
      lastPluginTime: 0,
      visitData: {},
    };
    // ユーザーの枠情報が空白または異なるなら、Visitを初期化
    this.resetVisit();
    // commentに擬似的なmetaデータを付与
    this.comment = this.thisComment(comment);
  }

  // ユーザーの枠情報が空白または異なるなら、Visitを初期化
  resetVisit() {
    // pluginTimeが現在の枠と同じなら、2回目以降のコメント
    const pluginTime = this.TimeConfig.pluginTime;
    if (this.visit.lastPluginTime === pluginTime) {
      this.isFirstVisit = false;
    } else {
      // 1回目のコメントなら、statusを空白にし、drawsを0にする
      this.visit.lastPluginTime = pluginTime;
      this.isFirstVisit = true;
      this.visit.status = "";
      Object.values(this.visit.visitData).forEach((data) => {
        data.draws = 0;
      });
    }
  }

  // コメントの前処理
  private thisComment(comment: Comment): Comment {
    // コメントテスターであればtrue
    this.isTester = comment.id === "COMMENT_TESTER";

    // 擬似メタデータ
    // メタデータはプラグインの解決後に生成される仕様です
    comment.meta = this.isTester
      ? // コメントテスター用
        { interval: 999999, tc: 10, no: 2, lc: 2 }
      : {
          interval: this.userData.interval || 0,
          tc: this.userData.tc + 1 || 1, // カウント前なのでインクリメント
          no: this.isFirstVisit ? 1 : 2, // 初回なら1、そうでないなら2
          lc: this.TimeConfig.lc, // プラグインが起動してからカウントしたコメント数
        };

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
      ruleId: () => this.selectRule?.id ?? null,
      // Gameを返す
      game: () => this.game,
      // visit情報を返す
      visit: () => this.visit,
    };
    return dataMap[data] && dataMap[data]();
  }

  // ---
  // rulesとomikujiから該当するおみくじを抽選する
  omikenSelect(
    rulesArray: RulesType[],
    omikujis: Record<string, OmikujiType>
  ): boolean {
    console.log("omikenSelect 開始: ", { rulesArray, omikujis });

    // 各ルールに対して処理を実行し、ruleも一緒に返す
    const result = rulesArray
      .map((rule) => {
        console.log("ruleProcess 呼び出し: ", { rule });
        const omikuji = this.ruleProcess(rule, omikujis);
        console.log("ruleProcess 結果: ", { rule, omikuji });
        return { rule, omikuji };
      })
      .find(({ omikuji }) => omikuji !== null);

    if (result) {
      this.selectRule = result.rule; // ヒットしたruleを設定
      this.selectOmikuji = result.omikuji; // ヒットしたomikujiを設定
      console.log("omikenSelect ヒット: ", {
        selectRule: this.selectRule,
        selectOmikuji: this.selectOmikuji,
      });
      return true;
    }

    console.log("omikenSelect 結果なし");
    return false;
  }

  // 単一ルールの処理
  ruleProcess(
    rule: RulesType,
    omikujis: Record<string, OmikujiType>
  ): OmikujiType | null {
    console.log("ruleProcess 開始: ", { rule });

    // thresholdチェック(New)
    const checker = new ThresholdChecker(
      rule,
      this.comment,
      this.visit,
      this.TimeConfig
    );
    const isValid = rule.threshold.every((threshold) => {
      const result = checker.check(threshold);
      console.log("Threshold チェック: ", { threshold, result });
      return result;
    });
    if (!isValid) {
      console.log("ruleProcess 結果: Threshold 無効");
      return null;
    }

    // 有効なおみくじの取得
    const validOmikujis = rule.enableIds
      .map((id) => omikujis[id])
      .filter((omikuji) => {
        const isValidOmikuji = omikuji.threshold.every((threshold) =>
          checker.check(threshold)
        );
        console.log("Omikuji チェック: ", { omikuji, isValidOmikuji });
        return isValidOmikuji;
      });

    if (validOmikujis.length === 0) {
      console.log("ruleProcess 結果: 有効なおみくじなし");
      return null;
    }

    const selectedOmikuji = this.omikujisLottery(validOmikujis);
    console.log("ruleProcess 抽選結果: ", { selectedOmikuji });
    return selectedOmikuji;
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
    Charas: Record<string, CharaType>,
    Scripts: Record<string, ScriptsParamType>
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
    if (this.selectOmikuji.script) {
      const { scriptId, parameter } = this.selectOmikuji.script;
      const result = scriptsCall(
        Scripts,
        scriptId,
        this.comment,
        this.game,
        this.visitData,
        parameter
      );

      // placeholderの値を追加
      placeClass.updatePlace(result.placeholder);
      // comment,game,visit を更新
      this.comment = result.comment;
      this.game = result.game;
      this.visitData = result.visit;
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
      lc: this.comment.meta.lc.toString(),
    });

    // プレースホルダーを置き換えし、selectOmikujiを返す
    this.selectOmikuji = placeClass.replacementPlace();

    // メッセージ投稿(わんコメ/他の何らかのサービス)
    new PostMessages(this.selectOmikuji.post, Charas);

    // omikuji.delete = trueなら、コメントを消す
    if (this.selectOmikuji.isSilent) this.comment.data.speechText = " ";

    // TODO 将来、コメント編集機能も追加したいな
    return this.selectOmikuji.isDelete ? false : this.comment;
  }

  // visitDataのdrawsをインクリメント
  private omikenDraws() {
    this.visitData = {
      ...this.visitData,
      id: this.selectRule.id,
      draws: (this.visitData?.draws || 0) + 1,
      totalDraws: (this.visitData?.totalDraws || 0) + 1,
    };
    // 該当するrules.idのvisitDataにデータを入れる
    this.visit = {
      ...this.visit,
      visitData: {
        ...this.visit.visitData,
        [this.selectRule.id]: this.visitData,
      },
    };
    this.game = {
      ...this.game,
      id: this.selectRule.id,
      draws: (this.game?.draws || 0) + 1,
      totalDraws: (this.game?.totalDraws || 0) + 1,
    };
  }
}


// 関数を動的に呼び出す
// TODO これ、どこに置けばいい?
export function scriptsCall(
  Scripts:Record<string, ScriptsParamType> ,
  funcName: string,
  comment: Comment,
  game: GameType,
  visit: visitDataType,
  param = "0"
): ScriptsReturnType | undefined {
  const func = Scripts[funcName];
  if (typeof func === 'function') {
    return func(comment, game, visit, param);
  } else {
    console.error(`Function ${funcName} is not registered.`);
    return undefined;
  }
}