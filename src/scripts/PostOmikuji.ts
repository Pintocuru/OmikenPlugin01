// src/scripts/PostOmikuji.js

import { Service } from "@onecomme.com/onesdk/types/Service";
import {
  CharaType,
  OmikujiPostType,
  postOneCommeRequestType,
} from "../../src/types/index";
import { configs } from "../config";
import { RGBColor } from "@onecomme.com/onesdk/types/Color";
import axios from "axios";


interface PostService {
  postMessage(post: OmikujiPostType, chara: CharaType): Promise<void>;
}

export class PostMessages implements PostService {
  private readonly API_BASE_URL = "http://localhost:11180/api";
  services: Service[];

  constructor(
    private posts: OmikujiPostType[],
    private Charas: Record<string, CharaType>
    // TODO gameのデータを送信し、特定のジェネレーターを更新させたい
  ) {
    this.initializePosts();
  }

  private async initializePosts(): Promise<void> {
    try {
      // 枠情報の取得
      this.services = await this.getServices();

      for (const post of this.posts) {
        const chara = this.Charas[post.botKey];
        await this.postMessage(post, chara);
      }
    } catch (error) {
      console.error("Failed to initialize posts:", error);
    }
  }

  async postMessage(post: OmikujiPostType, chara: CharaType): Promise<void> {
    const { type, iconKey, content, delaySeconds } = post;

    if (!content?.trim()) return; // 空のメッセージは処理しない

    // 枠の中にframeIdがなければ、新規作成
    if (
      !this.services.some((s) => s.id === chara.frameId) &&
      configs.isCreateService
    ) {
      await this.createService(chara, type === "toast");
    }

    switch (type) {
      case "onecomme":
      case "toast":
        await this.postOneComme(post, chara);
        break;
      case "party":
        await this.postWordParty(delaySeconds, content);
        break;
      case "speech":
        await this.postSpeech(delaySeconds, content);
        break;
    }
  }

  // わんコメへ投稿
  private async postOneComme(
    post: OmikujiPostType,
    chara: CharaType
  ): Promise<void> {
    const { iconKey, content, delaySeconds, type } = post;
    const charaImage = chara.image[iconKey] || chara.image.Default || "";
    const nickname = chara.nickname;
    // 枠作成がfalseなら、一番上のIDを取得
    const DefaultFrameId = !configs.isCreateService
      ? this.services[0].id
      : null;

    const request: postOneCommeRequestType = {
      service: {
        id: chara.frameId || DefaultFrameId,
      },
      comment: {
        id: Date.now() + Math.random().toString().slice(2, 12),
        userId: "FirstCounter",
        name: chara.name,
        comment: content,
        profileImage: charaImage,
        badges: [],
        nickname: nickname ? nickname : chara.name,
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

  // post
  private async delayedApiCall(
    url: string,
    data: any,
    delaySeconds: number,
    errorMessage: string
  ): Promise<void> {
    await this.delay(delaySeconds); // 遅延

    try {
      await axios.post(url, data);
    } catch (error) {
      console.error(errorMessage, error);
    }
  }

  // 遅延function
  private async delay(seconds: number): Promise<void> {
    return new Promise((r) => setTimeout(r, Math.max(seconds * 1000, 0)));
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
  private async createService(
    chara: CharaType,
    isSilent: boolean = false
  ): Promise<Service | null> {
    const { name, serviceColor, frameId } = chara;
    const toastServiceColor: RGBColor = { b: 33, g: 33, r: 33 };

    try {
      const response = await axios.post(`${this.API_BASE_URL}/services`, {
        id: isSilent ? "OmikenToast" : frameId,
        name: isSilent ? "おみくじBOT:トースト表示" : `おみくじBOT:${name}`,
        speech: !isSilent,
        color: isSilent ? toastServiceColor : serviceColor,
      });

      this.services.push(response.data); // 作成した枠をthis.servicesに追加

      return response.data;
    } catch (error) {
      console.error("Failed to create service:", error);
      return null;
    }
  }
}
