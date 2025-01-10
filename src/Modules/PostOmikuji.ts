// src/Modules/PostOmikuji.js

import { CharaType, OneCommePostType, postOneCommeRequestType } from '@type';
import { configs } from '@/config';
import { Service } from '@onecomme.com/onesdk/types/Service';
import axios from 'axios';
import path from 'path';
import { RGBColor } from '@onecomme.com/onesdk/types/Color';
import { systemMessage } from './ErrorHandler';

interface PostService {
 postMessage(post: OneCommePostType, chara: CharaType): Promise<void>;
}

export class PostMessages implements PostService {
 private readonly API_BASE_URL = 'http://localhost:11180/api';
 services: Service[];

 constructor(private posts: OneCommePostType[], private Charas?: Record<string, CharaType>) {
  this.initializePosts();
 }

 private async initializePosts(): Promise<void> {
  try {
   // 枠情報の取得
   this.services = await getServices(this.API_BASE_URL);

   // 順次処理を保証
   await Promise.all(
    this.posts.map((post) =>
     post.type === 'onecomme' ? this.postMessage(post, this.Charas[post.botKey]) : this.postMessage(post)
    )
   );
  } catch (error) {
   console.error('Failed to initialize posts:', error);
  }
 }

 async postMessage(post: OneCommePostType, chara?: CharaType): Promise<void> {
  const { type, content, delaySeconds } = post;
  // 空のメッセージはスキップ
  if (!content?.trim()) return;

  // 枠情報をチェック
  if (type === 'onecomme' && chara && !this.services.some((s) => s.id === chara.frameId) && configs.isCreateService) {
   await this.createService(chara);
  }

  // `type` に応じた処理
  const actionMap: Record<string, () => Promise<void>> = {
   onecomme: () => (chara ? this.postOneComme(post, chara) : Promise.resolve()),
   party: () => this.postWordParty(delaySeconds, content),
   speech: () => this.postSpeech(delaySeconds, content),
   error: () => this.postSystem(delaySeconds, content, post.generatorParam)
  };
  const action = actionMap[type];
  if (action) await action();
 }

 // わんコメへ投稿
 private async postOneComme(post: OneCommePostType, chara: CharaType): Promise<void> {
  const { type, iconKey, party, isSilent, generatorParam, delaySeconds, content } = post;
  // 枠作成がfalseなら、一番上のIDを取得
  const DefaultFrameId = !configs.isCreateService ? this.services[0].id : null;

  // party があるなら、WordPartyの投稿
  if (party) this.postWordParty(delaySeconds, party);

  const request: postOneCommeRequestType = {
   service: {
    id: chara.frameId || DefaultFrameId
   },
   comment: {
    id: Date.now() + Math.random().toString().slice(2, 12),
    userId: configs.botUserId,
    name: chara.name,
    comment: content,
    profileImage: await this.charaImageCheck(chara, iconKey),
    badges: [],
    nickname: chara.nickname ? chara.nickname : chara.name,
    // 仕様とは異なる使い方をしているキー(仕様変更で使えなくなるかも?)
    liveId: generatorParam || '', // ジェネレーターに渡す引数
    isOwner: isSilent // BOTの読み上げを行わない
   }
  };

  // postする
  await this.delayedApiCall(`${this.API_BASE_URL}/comments`, request, delaySeconds, `Failed to post ${type} message`);
 }

 private async charaImageCheck(chara: CharaType, iconKey: string): Promise<string> {
  // 画像のファイルパスを確認
  const charaImage = chara.image[iconKey] || chara.image.Default || '';
  const profileImage = path.join(configs.imgRoot, charaImage);
  return profileImage;
 }

 // WordPartyの投稿
 private async postWordParty(delaySeconds: number, content: string): Promise<void> {
  // postする
  await this.delayedApiCall(
   `${this.API_BASE_URL}/reactions`,
   { reactions: [{ key: content, value: 1 }] },
   delaySeconds,
   'Failed to post WordParty reaction'
  );
 }

 // スピーチの投稿
 private async postSpeech(delaySeconds: number, content: string): Promise<void> {
  await this.delayedApiCall(`${this.API_BASE_URL}/speech`, { text: content }, delaySeconds, 'Failed to post speech');
 }

 // わんコメへエラーメッセージを投稿
 private async postSystem(delaySeconds: number, content: string, name: string = 'error'): Promise<void> {
  const request: postOneCommeRequestType = {
   service: {
    id: this.services[0].id
   },
   comment: {
    id: Date.now() + Math.random().toString().slice(2, 12),
    userId: configs.botUserId,
    name,
    comment: content,
    profileImage: '',
    badges: [],
    liveId: '',
    isOwner: false
   }
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
 private async delayedApiCall(url: string, data: any, delaySeconds: number, errorMessage: string): Promise<void> {
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

 // わんコメの枠を作成
 private async createService(chara: CharaType): Promise<Service | null> {
  const { name, color, frameId } = chara;

  try {
   const response = await axios.post(`${this.API_BASE_URL}/services`, {
    id: frameId,
    name: `おみくじBOT:${name}`,
    speech: true,
    color: this.colorCodeToRGBColor(color['--lcv-background-color'])
   });
   this.services.push(response.data); // 作成した枠をthis.servicesに追加
   return response.data;
  } catch (error) {
   systemMessage('warn', `わんコメの枠を作成できませんでした`, error);
   return null;
  }
 }

 // カラーコードからRGBColor型のコードを生成
 private colorCodeToRGBColor(colorCode: string): RGBColor {
  const hex = colorCode.replace(/^#/, ''); // #を取り除く
  if (hex.length !== 6) throw new Error(`Invalid color code: ${colorCode}`);
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return { r, g, b };
 }
}

// 枠情報を取得
export async function getServices(API_BASE_URL: string): Promise<Service[]> {
 try {
  const response = await axios.get(`${API_BASE_URL}/services`);
  return response.data;
 } catch (error) {
  // セットアップ中に枠情報を取得することもあるので、エラーメッセージは出さない
  return [];
 }
}
