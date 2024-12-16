// src/scripts/PostOmikuji.js

import {
  CharaType,
  OneCommePostType,
  postOneCommeRequestType,
} from "../../src/types/index";
import { configs } from "../config";
import { Service } from "@onecomme.com/onesdk/types/Service";
import axios from "axios";
import path from "path";
import fs from "fs";

interface PostService {
  postMessage(post: OneCommePostType, chara: CharaType): Promise<void>;
}

export class PostMessages implements PostService {
  private readonly API_BASE_URL = "http://localhost:11180/api";
  services: Service[];

  constructor(
    private posts: OneCommePostType[],
    private Charas?: Record<string, CharaType>
  ) {
    this.initializePosts();
  }

  private async initializePosts(): Promise<void> {
    try {
      // 枠情報の取得
      this.services = await this.getServices();

      // 順次処理を保証
      await Promise.all(
        this.posts.map(async (post) => {
          if (post.type === "onecomme") {
            const chara = this.Charas[post.botKey];
            await this.postMessage(post, chara);
          } else {
            await this.postMessage(post);
          }
        })
      );
    } catch (error) {
      console.error("Failed to initialize posts:", error);
    }
  }

  async postMessage(post: OneCommePostType, chara?: CharaType): Promise<void> {
    const { type, content, delaySeconds } = post;

    if (!content?.trim()) return; // 空のメッセージは処理しない

    // `type` が "onecomme" の場合のみ枠情報をチェック
    if (type === "onecomme" && chara) {
      if (
        !this.services.some((s) => s.id === chara.frameId) &&
        configs.isCreateService
      ) {
        await this.createService(chara);
      }
    }

    // `type` に応じた処理
    switch (type) {
      case "onecomme": // わんコメ
        if (chara) {
          await this.postOneComme(post, chara);
        }
        break;
      case "party": // WordParty
        await this.postWordParty(delaySeconds, content);
        break;
      case "speech": // スピーチ(音声のみ)
        await this.postSpeech(delaySeconds, content);
        break;
      case "error": // わんコメ(error用)
        await this.postError(delaySeconds, content);
        break;
    }
  }

  // わんコメへ投稿
  private async postOneComme(
    post: OneCommePostType,
    chara: CharaType
  ): Promise<void> {
    const { iconKey, content, delaySeconds, type, generatorParam, isSilent } =
      post;
    const charaImage = chara.image[iconKey] || chara.image.Default || "";
    const nickname = chara.nickname;
    // 枠作成がfalseなら、一番上のIDを取得
    const DefaultFrameId = !configs.isCreateService
      ? this.services[0].id
      : null;

    // 画像のファイルパスを確認
    const profileImage = path.join(
      configs.dataRoot,
      "preset/Chara/",
      charaImage
    );
    // テスト:画像が存在しない場合は、エラーを表示
    fs.access(profileImage, fs.constants.F_OK, (err) => {
      if (err) console.error("Image does not exist:", profileImage);
    });

    const request: postOneCommeRequestType = {
      service: {
        id: chara.frameId || DefaultFrameId,
      },
      comment: {
        id: Date.now() + Math.random().toString().slice(2, 12),
        userId: configs.botUserId,
        name: chara.name,
        comment: content,
        profileImage,
        badges: [],
        nickname: nickname ? nickname : chara.name,
        // 仕様とは異なる使い方をしているキー(仕様変更で使えなくなるかも?)
        liveId: generatorParam || "", // ジェネレーターに渡す引数
        isOwner: isSilent, // BOTの読み上げを行わない
      },
    };

    // postする
    await this.delayedApiCall(
      `${this.API_BASE_URL}/comments`,
      request,
      delaySeconds,
      `Failed to post ${type} message`
    );
  }

  // WordPartyの投稿
  private async postWordParty(
    delaySeconds: number,
    content: string
  ): Promise<void> {
    // postする
    await this.delayedApiCall(
      `${this.API_BASE_URL}/reactions`,
      { reactions: [{ key: content, value: 1 }] },
      delaySeconds,
      "Failed to post WordParty reaction"
    );
  }

  // スピーチの投稿
  private async postSpeech(
    delaySeconds: number,
    content: string
  ): Promise<void> {
    await this.delayedApiCall(
      `${this.API_BASE_URL}/speech`,
      { text: content },
      delaySeconds,
      "Failed to post speech"
    );
  }

  // わんコメへエラーメッセージを投稿
  private async postError(
    delaySeconds: number,
    content: string
  ): Promise<void> {
    const request: postOneCommeRequestType = {
      service: {
        id: this.services[0].id,
      },
      comment: {
        id: Date.now() + Math.random().toString().slice(2, 12),
        userId: configs.botUserId,
        name: "エラーメッセージ",
        comment: content,
        profileImage: "",
        badges: [],
        liveId: "",
        isOwner: false,
      },
    };

    // postする
    await this.delayedApiCall(
      `${this.API_BASE_URL}/comments`,
      request,
      delaySeconds,
      `エラーメッセージをわんコメへ投稿したかったが、エラー。`
    );
  }

  // post
  private async delayedApiCall(
    url: string,
    data: any,
    delaySeconds: number,
    errorMessage: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          await axios.post(url, data);
          resolve();
        } catch (error) {
          console.error(errorMessage, error);
          reject(error);
        }
      }, (delaySeconds + configs.basicDelaySeconds) * 1000);
    });
  }

  // 枠情報を取得
  private async getServices(): Promise<Service[]> {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/services`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch services:", error);
      return [];
    }
  }

  // わんコメの枠を作成
  private async createService(chara: CharaType): Promise<Service | null> {
    const { name, serviceColor, frameId } = chara;

    try {
      const response = await axios.post(`${this.API_BASE_URL}/services`, {
        id: frameId,
        name: `おみくじBOT:${name}`,
        speech: true,
        color: serviceColor,
      });
      this.services.push(response.data); // 作成した枠をthis.servicesに追加
      return response.data;
    } catch (error) {
      console.error("Failed to create service:", error);
      return null;
    }
  }
}

// エラーメッセージを投稿
export function postErrorMessage(content: string): void {
  const post: OneCommePostType[] = [
    {
      type: "error",
      delaySeconds: -1,
      content,
    },
  ];
  new PostMessages(post, {});
}