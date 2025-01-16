// src/Modules/api/PostOneComme.ts
import { SendCommentType, SendTestCommentType } from '@type';
import { ServiceAPI } from '@api/serviceAPI';
import { configs } from '@/config';
import axios from 'axios';

// わんコメへの投稿
export async function sendComment(request: SendCommentType, delaySeconds: number = 0): Promise<void> {
 return delayAxiosPost(`${configs.BASE_URL}/comments`, request, delaySeconds, 'Failed to post comment');
}

// テストコメントを使ったシステムメッセージ
export async function postSystemMessage(
 content: string,
 name: string = 'error',
 delaySeconds: number = 0
): Promise<void> {
 const request: SendTestCommentType = {
  platform: 'youtube',
  hasGift: false,
  unit: '',
  price: 1000,
  giftType: 'none',
  newComment: false,
  repeater: false,
  subscribe: false,
  speech: true,
  username: name,
  comment: content
 };

 return delayAxiosPost(`${configs.BASE_URL}/comments/test`, request, delaySeconds, 'Failed to post test comment');
}

// WordPartyへの投稿
export async function postWordParty(content: string, delaySeconds: number = 0): Promise<void> {
 return delayAxiosPost(
  `${configs.BASE_URL}/reactions`,
  { reactions: [{ key: content, value: 1 }] },
  delaySeconds,
  'Failed to post WordParty reaction'
 );
}

// スピーチへの投稿
export async function postSpeech(content: string, delaySeconds: number = 0): Promise<void> {
 return delayAxiosPost(`${configs.BASE_URL}/speech`, { text: content }, delaySeconds, 'Failed to post speech');
}

// 遅延付きaxios.post
function delayAxiosPost(url: string, data: any, delaySeconds: number, errorMessage: string): Promise<void> {
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
