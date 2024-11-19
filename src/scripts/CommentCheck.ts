// src/scripts/CommentCheck.js
import {
  BaseComment,
  OmikenType,
  OmikujiPostType,
  OmikujiType,
  PlaceValueType,
  RulesType,
} from "../types/index";
import { postOneComme, postSpeech, postWordParty } from "./PostOmikuji";
import { thresholdCheck } from "./ThresholdCheck";

// おみくじ:メイン処理
export const handleFilterComment =  (
  comment: BaseComment,
  Omiken: OmikenType,
  visitData: undefined, // 個人データ
  Ganes: undefined, // おみくじデータ
): OmikujiPostType[] | null => {

  // ルールとおみくじの処理
  const selectedOmikuji = omikenSelect(comment, Omiken);
  if (!selectedOmikuji) return null;

  // メッセージの処理と投稿
  const toast = postProcess(selectedOmikuji, comment, Omiken);
  if (!toast) return null;
  return toast;
};


// ---

// ルールとおみくじの処理
const omikenSelect = (
  comment: BaseComment,
  Omiken: OmikenType
): OmikujiType | null => {
  // rulesOrderに基づいて配列にする
  const rules = omikenRulesSort(Omiken.rules, Omiken.rulesOrder);

  // 各ルールに対して処理を実行
  for (const rule of rules) {
    const validOmikuji = omikenProcessRule(comment, rule, Omiken);
    if (validOmikuji) return validOmikuji;
  }

  return null;
};

// ルールの並び替え処理
const omikenRulesSort = (
  rules: Record<string, RulesType>,
  rulesOrder: string[]
): RulesType[] => {
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
};

// 単一ルールの処理
const omikenProcessRule = (
  comment: BaseComment,
  rule: RulesType,
  Omiken: OmikenType
): OmikujiType | null => {
  if (!thresholdCheck(comment, rule.threshold)) return null;

  const validOmikuji = omikenValidOmikuji(comment, rule, Omiken);
  if (validOmikuji.length === 0) return null;

  return omikenSelectItem(validOmikuji);
};

// 有効なおみくじの取得
const omikenValidOmikuji = (
  comment: BaseComment,
  rule: RulesType,
  Omiken: OmikenType
): OmikujiType[] => {
  return rule.enabledIds
    .map((id) => Omiken.omikuji[id])
    .filter((omikuji) => thresholdCheck(comment, omikuji.threshold));
};

// アイテム抽選
function omikenSelectItem(items: OmikujiType[]): OmikujiType | null {
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
const postProcess = (
  selectedOmikuji: OmikujiType,
  comment: BaseComment,
  Omiken: OmikenType
): OmikujiPostType[] | null => {
  const toastArray: OmikujiPostType[] = [];
  for (const post of selectedOmikuji.post) {
    const processedContent = postPlaceholder(post.content, comment, Omiken);
    const finalPost = { ...post, content: processedContent };
    const toast = postMessage(finalPost);
    // toast投稿があるなら蓄える
    if (toast) toastArray.push(toast);
  }
  return toastArray.length !== 0 ? toastArray : null;
};

// メッセージ内容の処理
const postPlaceholder = (
  content: string,
  comment: BaseComment,
  Omiken: OmikenType
): string => {
  // コメントの値(user/lcなど)を置き換え
  let processedContent = postPlaceholderComment(content, comment);
  return replacePlaceholders(processedContent, Omiken);
};

// プレースホルダー:コメントの値を置換
const postPlaceholderComment = (
  content: string,
  comment: BaseComment
): string => {
  const specialPlaceholders = {
    "<<user>>": comment.data.displayName,
    "<<tc>>": comment.meta.tc.toString(),
    "<<no>>": comment.meta.no.toString(),
    "<<lc>>": comment.meta.lc.toString(),
  };

  return Object.entries(specialPlaceholders).reduce(
    (acc, [placeholder, value]) =>
      acc.replace(new RegExp(placeholder, "g"), value),
    content
  );
};

// 通常プレースホルダーの置換
const replacePlaceholders = (content: string, Omiken: OmikenType): string => {
  const placeholders = content.match(/<<([^>>]+)>>/g);
  if (!placeholders) return content;

  return placeholders.reduce((acc, placeholder) => {
    const placeName = placeholder.slice(2, -2);
    const placeData = Omiken.place[placeName];
    if (!placeData) return acc;

    const selectedValue = selectPlaceValue(placeData.values);
    if (!selectedValue) return acc;

    const finalValue = processNestedPlaceholder(selectedValue.value, Omiken);
    return acc.replace(placeholder, finalValue);
  }, content);
};

// ネストされたプレースホルダーの処理
const processNestedPlaceholder = (
  value: string,
  Omiken: OmikenType
): string => {
  const nestedPlaceholder = value.match(/<<([^>>]+)>>/);
  if (!nestedPlaceholder) return value;

  const nestedPlaceName = nestedPlaceholder[1];
  const nestedPlaceData = Omiken.place[nestedPlaceName];
  if (!nestedPlaceData) return value;

  const nestedValue = selectPlaceValue(nestedPlaceData.values);
  return nestedValue ? value.replace(/<<[^>>]+>>/, nestedValue.value) : value;
};

// メッセージの投稿 toast ならそのまま返し、それ以外はわんコメへ投稿
const postMessage = (post: OmikujiPostType) => {
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

module.exports = { handleFilterComment };
