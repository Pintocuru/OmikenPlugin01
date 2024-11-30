// src/scripts/PostOmikuji.js

import {
  OmikujiPostType,
  postOneCommeRequestType,
} from "../../src/types/index";

// わんコメへ投稿
export const postOneComme = async (
  delaySeconds: number,
  Request: postOneCommeRequestType
) => {
  // 遅延処理
  await delayTime(delaySeconds);

  // APIへの投稿
  try {
    const axios = require("axios");
    await axios.post("http://localhost:11180/api/comments", Request);
  } catch (error) {
    console.error("Failed to post OneComme message:", error);
  }
};

// Wordpartyへ投稿
export const postWordParty = async (delaySeconds: number, content: string) => {
  // 遅延処理
  await delayTime(delaySeconds);

  // APIへの投稿
  try {
    const axios = require("axios");
    await axios.post("http://localhost:11180/api/reactions", {
      reactions: [{ key: content, value: 1 }],
    });
  } catch (error) {
    console.error("Failed to post WordParty reaction:", error);
  }
};

// スピーチ(音声のみ)投稿
export const postSpeech = async (delaySeconds: number, content: string) => {
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

// 遅延function
const delayTime = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, Math.max(ms * 1000, 0)));
};
