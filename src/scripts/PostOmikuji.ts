// src/scripts/PostOmikuji.js

import { OmikujiPostType } from "../../src/types/types";
import { delayTime } from "./AxiosAction";

// Wordpartyへ投稿
const postOneComme = async (post: OmikujiPostType) => {
  const charaConfig = {
    default: {
      name: " ",
      frameId: "",
      "--lcv-name-color": "#FAFAFA",
      "--lcv-text-color": "#FAFAFA",
      "--lcv-background-color": "#212121",
    },
  };
  const charaImgConfig = { default: { Default: "" } };
  const imgDirectory =
    document.currentScript.src.split("/script/")[0] + "/img/";

  const { botKey, iconKey, delaySeconds, content } = post;

  if (content.trim()) {
    const { botKey: processedBotKey, iconKey: processedIconKey } = processKeys(
      botKey,
      iconKey,
      charaConfig
    );

    const characterData =
      charaConfig[processedBotKey] || charaConfig[Object.keys(charaConfig)[0]];
    const characterImage =
      charaImgConfig[processedBotKey]?.[processedIconKey] ||
      charaImgConfig[processedBotKey].Default;

    await delayTime(delaySeconds);

    return post("http://localhost:11180/api/comments", {
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
};

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

// Wordpartyへ投稿
const postWordParty = async (post: OmikujiPostType) => {
  const postPromises = post.map(
    async (message: { content: any; delaySeconds?: 0 }) => {
      const { content, delaySeconds = 0 } = message;

      // 遅延処理
      await delayTime(delaySeconds);

      if (content && content.trim()) {
        try {
          await post("http://localhost:11180/api/reactions", {
            reactions: [{ key: content, value: 1 }],
          });
        } catch (error) {
          console.error("Failed to post WordParty reaction:", error);
        }
      }
    }
  );

  await Promise.all(postPromises);
};

// スピーチ(音声のみ)投稿
const postSpeech = async (post: OmikujiPostType) => {
  const postPromises = post.map(
    async (message: { content: any; delaySeconds?: 0 }) => {
      const { content, delaySeconds = 0 } = message;

      // 遅延処理
      await delayTime(delaySeconds);

      if (content && content.trim()) {
        try {
          await post("http://localhost:11180/api/speech", {
            text: content,
          });
        } catch (error) {
          console.error("Failed to post speech:", error);
        }
      }
    }
  );

  await Promise.all(postPromises);
};
