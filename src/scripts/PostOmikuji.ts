// src/scripts/PostOmikuji.js

import {
  CharaType,
  OmikujiPostType,
  postOneCommeRequestType,
  PresetCharaType,
} from "../../src/types/index";

export class PostMessages {
  posts: OmikujiPostType[];
  Charas: Record<string, PresetCharaType>;
  defaultFrameId: string;

  constructor(
    posts: OmikujiPostType[],
    Charas: Record<string, PresetCharaType>,
    defaultFrameId: string
  ) {
    this.posts = posts;
    this.Charas = Charas;
    this.defaultFrameId = defaultFrameId;

    // メッセージ投稿(わんコメ/他の何らかのサービス)
    this.posts.map((post) => this.postMessage(post, Charas[post.botKey].item));
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
            id: chara.frameId || this.defaultFrameId,
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
