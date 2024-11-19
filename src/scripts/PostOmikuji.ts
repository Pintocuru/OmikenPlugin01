// src/scripts/PostOmikuji.js

import { OmikujiPostType } from "../../src/types/types";
import { delayTime, get, post } from "./AxiosAction";

// わんコメへ投稿
export const postOneComme = async (postData: OmikujiPostType) => {
  const { content, botKey, iconKey, delaySeconds } = postData;
  
  // 空のメッセージは処理しない
  if (!content?.trim()) return;

  // TODO エディターのpresetからキャラデータを取得する関数
  const CHARA = {
    default: {
      name: " ",
      frameId: "",
      "--lcv-name-color": "#FAFAFA",
      "--lcv-text-color": "#FAFAFA",
      "--lcv-background-color": "#212121",
    },
  };
  const charaImgConfig = { default: { Default: "" } };
  const imgDirectory = document.currentScript.src.split("/script/")[0] + "/img/";

  // キャラクター設定の取得
  const characterData = CHARA[botKey] || CHARA[Object.keys(CHARA)[0]];
  const characterImage = charaImgConfig[botKey]?.[iconKey] ||
    charaImgConfig[botKey]?.Default;

  // 遅延処理
  await delayTime(delaySeconds);

  // APIへの投稿
  try {
    await post("http://localhost:11180/api/comments", {
      service: { 
        id: characterData.frameId || (await getFrameId()) 
      },
      comment: {
        userId: "FirstCounter",
        id: Date.now() + Math.random().toString().slice(2, 12),
        name: characterData.name,
        comment: content,
        profileImage: characterImage ? imgDirectory + characterImage : "",
      },
    });
  } catch (error) {
    console.error("Failed to post OneComme message:", error);
  }
};

// わんコメの一番上の枠IDを取得する
async function getFrameId() {
  try {
    const { data } = await get("http://localhost:11180/api/services");
    return data[0].id;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Wordpartyへ投稿
export const postWordParty = async (postData: OmikujiPostType) => {
  const { content, delaySeconds = 0 } = postData;

  // 空のメッセージは処理しない
  if (!content?.trim()) return;

  // 遅延処理
  await delayTime(delaySeconds);

  // APIへの投稿
  try {
    await post("http://localhost:11180/api/reactions", {
      reactions: [{ key: content, value: 1 }],
    });
  } catch (error) {
    console.error("Failed to post WordParty reaction:", error);
  }
};

// スピーチ(音声のみ)投稿
export const postSpeech = async (postData: OmikujiPostType) => {
  const { content, delaySeconds = 0 } = postData;

  // 空のメッセージは処理しない
  if (!content?.trim()) return;

  // 遅延処理
  await delayTime(delaySeconds);

  // APIへの投稿
  try {
    const axios = require("axios");
    await axios.post("http://localhost:11180/api/speech", {
      text: content,
    });
  } catch (error) {
    console.error("Failed to post speech:", error);
  }
};