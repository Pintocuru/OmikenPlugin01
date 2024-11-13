// src/scripts/CommentCheck.js
import {
  BaseComment,
  OmikenType,
  OmikujiType,
  PlaceValueType,
} from "../types/types";
import { thresholdCheck } from "./ThresholdCheck";

// メイン処理
const handleFilterComment = (comment: BaseComment, Omiken: OmikenType) => {
  // comment.omikenToastがなければ空のオブジェクトを生成
  if (!comment.omikenToast) comment.omikenToast = [];
  // 処理スキップcheck
  if (isSkipOmikuji(comment)) return comment;
  // 重複チェック
  if (comment.omikenToast.isOverlapping === undefined) {
    if (await checkOverlapping(comment)) {
      comment.omikenToast.isOverlapping = true;
      return comment;
    }
  }

  // おみくじチェック
  const rules = Omiken.rules;
  const rulesOrder = Omiken.rulesOrder;
  const rulesArray = rulesOrder.map((key) => rules[key]);

  // rulesArray を任意の順番に並べる・またはフィルタリング
  // TODO conditionType が"match"　"gift"　"syoken"　"access"　"count"の順番
  // "timer"は除外する

  let huga: OmikujiType;
  for (const rule of rulesArray) {
    // thresholdチェック
    const result = thresholdCheck(comment, rule.threshold);
    if (!result) continue;

    // 有効なおみくじが入る
    const hoge = [] as OmikujiType[];
    const ids = rule.enabledIds;
    const omikuji = Omiken.omikuji;
    const omikujiArray = ids.map((key) => omikuji[key]);

    for (const omi of omikujiArray) {
      const result2 = thresholdCheck(comment, omi.threshold);
      if (result2) hoge.push(omi);
    }
    // 該当するおみくじがないなら終了
    if (hoge.length <= 0) return null;
    // アイテムを抽選
    huga = selectItem(hoge);
  }

  if (!huga) return null;
  // メッセージ処理：placeを置き換え
  for (const post of huga.post) {
    let content = post.content;

    // 特殊プレースホルダーの置換（先に処理）
    const specialPlaceholders = {
      "<<user>>": comment.data.displayName,
      "<<tc>>": comment.meta.tc.toString(),
      "<<no>>": comment.meta.no.toString(),
      "<<lc>>": comment.meta.lc.toString(),
    };

    // 特殊プレースホルダーを置換
    for (const [placeholder, value] of Object.entries(specialPlaceholders)) {
      content = content.replace(new RegExp(placeholder, "g"), value);
    }

    // 通常のプレースホルダーを検出して置換
    const placeholders = content.match(/<<([^>>]+)>>/g);
    if (!placeholders) {
      post.content = content;
      continue;
    }

    for (const placeholder of placeholders) {
      const placeName = placeholder.slice(2, -2);
      const placeData = Omiken.place[placeName];
      if (!placeData) continue;

      // placeから値を抽選
      const selectedValue = selectPlaceValue(placeData.values);
      if (!selectedValue) continue;

      // 2段階目のプレースホルダーがある場合の処理
      let finalValue = selectedValue.value;
      const nestedPlaceholder = finalValue.match(/<<([^>>]+)>>/);
      if (nestedPlaceholder) {
        const nestedPlaceName = nestedPlaceholder[1];
        const nestedPlaceData = Omiken.place[nestedPlaceName];
        if (nestedPlaceData) {
          const nestedValue = selectPlaceValue(nestedPlaceData.values);
          if (nestedValue) {
            finalValue = finalValue.replace(/<<[^>>]+>>/, nestedValue.value);
          }
        }
      }

      content = content.replace(placeholder, finalValue);
    }
    post.content = content;
  }

  // postをわんコメに投稿
  for (const post of huga.post) {
    const { type, botKey, iconKey } = post;

    if (type === "onecomme") postOneComme(post);
    if (type === "party") postWordParty(post);
    if (type === "speech") postSpeech(post);
  }
};

// プレースホルダー値の抽選ヘルパー関数
function selectPlaceValue(values: PlaceValueType[]): PlaceValueType | null {
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

// アイテム選択関数
function selectItem(items: OmikujiType[]): OmikujiType | null {
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

/**
 * isOverlapping または omikujiName が true の場合、処理をスキップ
 * @param {Comment} comment - 受信したコメントデータ
 * @returns {Promise<boolean>} 重複しているかどうか
 */
const isSkipOmikuji = (comment: BaseComment): boolean => {
  return (
    comment.omikenToast.isOverlapping === true ||
    !!comment.omikenToast.omikujiName
  );
};

/**
 * 前回投稿の時刻を確認し、重複を判定する
 * @param {Comment} comment - 受信したコメントデータ
 * @returns {Promise<boolean>} 重複しているかどうか
 */
const checkOverlapping = async (comment: BaseComment) => {
  // TODO: COREのAPIを叩いて前回投稿の時刻を取得する実装
  // 現在は未実装のため常にfalseを返す
  return false;
};

module.exports = { handleFilterComment };

module.exports = {
  /**
   * isOverlapping または omikujiName が true の場合、処理をスキップ
   * @param {Comment} comment - 受信したコメントデータ
   * @returns {Promise<boolean>} 重複しているかどうか
   */
  isSkipOmikuji: function (comment: {
    omikenToast: { isOverlapping: boolean; omikujiName: any };
  }) {
    return (
      comment.omikenToast.isOverlapping === true ||
      comment.omikenToast.omikujiName
    );
  },
  /**
   * 前回投稿の時刻を確認し、重複を判定する
   * @param {Comment} comment - 受信したコメントデータ
   * @returns {Promise<boolean>} 重複しているかどうか
   */
  checkOverlapping: async function (comment: any) {
    // TODO: COREのAPIを叩いて前回投稿の時刻を取得する実装
    // 現在は未実装のため常にfalseを返す
    return false;
  },
  /**
   * コメントと設定されたルールを照合し、適用可能か判断する
   * @param {Comment} comment - 受信したコメントデータ
   * @param {Rule} rule - 適用するルール
   * @returns {boolean | null} ルールが適用可能かどうか
   */
  wordCheck: function (
    comment: { omikenToast: { omikujiName: any }; data: { comment: any } },
    rule: { name: any }
  ) {
    // 既に他のおみくじが実行されているか?
    if (comment.omikenToast.omikujiName) return null;
    // ワードがヒットしていたか?
    if (!matchRule(comment.data.comment, rule)) return null;
    // ヒットしていたなら、nameにおみくじ名を入れる
    const omikujiName = rule.name;

    // そのユーザーがおみくじ適用されるか(SwitchのON/OFF、メンバーのみや重複を見る)
    const isApplicable = isRuleApplicable(rule, comment);
    return { omikujiName, isApplicable };

    // --- 以下関数 -----------------------------------------

    /**
     * コメントテキストがルールに一致するかどうかを確認する
     * @param {string} commentText - コメントテキスト
     * @param {Rule} rule - 確認するルール
     * @returns {boolean} ルールに一致するかどうか
     */
    function matchRule(commentText: string, rule: { [x: string]: any }) {
      return ["matchExact", "matchStartsWith", "matchIncludes"].some(
        (matchType) => {
          const words = rule[matchType];
          return (
            words?.some((word: string) => {
              const isEmoji = /\p{Emoji}/u.test(word);
              const compareWord = isEmoji ? word : word.toLowerCase();
              const compareComment = isEmoji
                ? commentText
                : commentText.toLowerCase();

              switch (matchType) {
                case "matchExact":
                  return compareWord === compareComment;
                case "matchStartsWith":
                  return compareComment.startsWith(compareWord);
                case "matchIncludes":
                  return compareComment.includes(compareWord);
                default:
                  return false;
              }
            }) || false
          );
        }
      );
    }
    /**
     * ルールが適用可能かどうかを判断する
     * @param {Rule} rule - 適用するルール
     * @param {boolean} isOverlapping - 重複判定結果
     * @param {Comment} comment - 受信したコメントデータ
     * @returns {boolean} ルールが適用可能かどうか
     */
    function isRuleApplicable(
      rule: { switch: any; name: any; isMember: any; isModeratorAndAbove: any },
      comment: { data: { displayName: any } }
    ) {
      if (!rule.switch) {
        console.log(
          `"${rule.name}" にマッチしましたが、スイッチがOFFのため適用できませんでした。`
        );
        return false;
      }

      if (rule.isMember && checkMember(comment)) {
        postToast(
          0,
          "sorry01",
          `${comment.data.displayName}さん、「${rule.name}」は、メンバー限定だよ。ごめんなさい💦`
        );
        return false;
      }

      if (rule.isModeratorAndAbove && checkModerator(comment)) {
        postToast(
          0,
          "sorry01",
          `${comment.data.displayName}さん、「${rule.name}」は、モデレーター以上限定だよ。ごめんなさい💦`
        );
        return false;
      }

      return true;
    }

    /**
     * ユーザーがメンバーシップ保持者かどうかを確認する
     * @param {Comment} comment - 受信したコメントデータ
     * @returns {boolean} メンバーシップ保持者かどうか
     */
    function checkMember(comment: { data: {} }) {
      const { isOwner, isMember, isModerator, subscriber } = comment.data || {};
      return isOwner || isMember || isModerator || subscriber;
    }
    /**
     * ユーザーがモデレーター以上の権限を持っているかどうかを確認する
     * @param {Comment} comment - 受信したコメントデータ
     * @returns {boolean} モデレーター以上の権限を持っているかどうか
     */
    function checkModerator(comment: { data: {} }) {
      const { isOwner, isModerator } = comment.data || {};
      return isOwner || isModerator;
    }
  },

  /**
   * 共通のボットメッセージ処理関数
   * @param {Comment} comment - 受信したコメントデータ
   * @param {Rule} rule - 適用するルール
   * @returns {boolean | null} ルールが適用可能かどうか
   */
  // ? comparison は rawItems 内に入れるより、引数で渡したほうがいいかもしれない。
  processBotMessage: function (
    user = "名無し",
    rawItems: any,
    overlap = false
  ) {
    // アイテムリストのコピーと検証
    const items = JSON.parse(JSON.stringify(rawItems));
    if (!Array.isArray(items.omikuji) || items.omikuji.length === 0) {
      console.error("アイテムがないか、正しいObjectの形をしていません");
      return false;
    }

    // thresholdの条件とMatchするアイテムのフィルタリング
    const validItems = items.omikuji.filter(validateItem);
    if (validItems.length === 0) return false;

    // Weightを基に抽選を行う
    const selectedItem = selectItem(validItems);
    if (!selectedItem) {
      console.error(
        "どのアイテムも選ばれませんでした。Weightが0の可能性があります。"
      );
      return false;
    }

    // メッセージ処理
    const processedItem = processMessages(selectedItem, user, items.random);

    // メッセージの投稿
    postMessages(processedItem, overlap);
    // true(Success)を返す
    return true;

    // --- 以下関数 -----------------------------------------

    /**
     * アイテムの検証関数
     * @param {Object} item - 検証するアイテム
     * @returns {boolean} アイテムが有効かどうか
     */
    function validateItem(item: {
      threshold: { value: any; loop: any; comparison: any };
    }) {
      if (!item.threshold) return true;

      const { value, loop, comparison } = item.threshold;
      const condition = items.condition;

      if (condition === null) return true;

      const comparisons = { 0: "===", 1: ">", "-1": "<" };
      // ? loop=ture のとき、comparisonsは意味がないということでいいのか?
      return loop
        ? condition % value === 0
        : eval(`${condition} ${comparisons[comparison]} ${value}`);
    }

    /**
     * アイテム選択関数
     * @param {Array} validItems - 有効なアイテムの配列
     * @returns {Object|null} 選択されたアイテム
     */
    function selectItem(validItems: any[]) {
      const totalWeight = validItems.reduce(
        (sum: any, { weight }: any) => sum + (weight >= 0 ? weight : 1),
        0
      );
      if (totalWeight <= 0) return null;

      let rand = Math.random() * totalWeight;
      return validItems.find(
        (item: { weight: number }) =>
          (rand -= item.weight >= 0 ? item.weight : 1) < 0
      );
    }

  },

  // Wordpartyへ投稿
  // ? 将来的には、この関数でtoast投稿もできるようにする?
  postOneComme: async function (messageObject: any[]) {
    // * #TODO 仮設置。charaConfig charaImgConfig は、COREから取得する
    // charaData = require('../scripts/omikujiUtils');
    const charaConfig = {
      default: {
        name: " ",
        frameId: "",
        "--lcv-name-color": "#FAFAFA",
        "--lcv-text-color": "#FAFAFA",
        "--lcv-background-color": "#212121",
      },
    };
    const charaImgConfig = {
      default: {
        Default: "",
      },
    };
    // !要編集:画像ディレクトリ(このファイルがscriptフォルダに入ってる事が前提)
    const imgDirectory =
      document.currentScript.src.split("/script/")[0] + "/img/";

    const promises = messageObject.map(
      async (message: {
        content: any;
        botKey?: any;
        iconKey?: any;
        delaySeconds?: any;
      }) => {
        if (message.content.trim()) {
          const { botKey, iconKey, content, delaySeconds } = message;
          // エラーチェック:defaultキーの設定
          const { botKey: processedBotKey, iconKey: processedIconKey } =
            processKeys(botKey, iconKey, charaConfig);

          const characterData =
            charaConfig[processedBotKey] ||
            charaConfig[Object.keys(charaConfig)[0]];
          const characterImage =
            charaImgConfig[processedBotKey]?.[processedIconKey] ||
            charaImgConfig[processedBotKey].Default;

          // 遅延処理
          await this.delayTime(delaySeconds);

          // コメント送信
          return this.post("http://localhost:11180/api/comments", {
            service: { id: characterData.frameId || (await getFrameId()) },
            comment: {
              userId: BotUserIDname || "FirstCounter",
              id: Date.now() + Math.random().toString().slice(2, 12),
              name: characterData.name,
              comment: content,
              profileImage: imgDirectory + characterImage || "",
            },
          });
        }
      }
    );

    // 全てのメッセージ処理が完了するのを待つ
    await Promise.all(promises);

    // --- 以下関数 -----------------------------------------

    // defaultキーの設定
    function processKeys(
      botKey: string,
      iconKey: any,
      charaConfig: {
        default?: {
          name: string;
          frameId: string;
          "--lcv-name-color": string;
          "--lcv-text-color": string;
          "--lcv-background-color": string;
        };
      }
    ) {
      return {
        botKey: botKey in charaConfig ? botKey : Object.keys(charaConfig)[0],
        iconKey: iconKey || "Default",
      };
    }

    // わんコメの一番上の枠IDを取得する
    async function getFrameId() {
      try {
        const { data } = await this.get("http://localhost:11180/api/services");
        return data[0].id;
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  },

};
