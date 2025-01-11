// src/Modules/api/PostComment.ts
import { postOneCommeRequestType } from '@type';
import { ServiceAPI } from '@api/serviceAPI';
import { configs } from '@/config';
import axios from 'axios';

// わんコメへの投稿
export class CommentService {
 async postComment(request: postOneCommeRequestType, delaySeconds: number = 0): Promise<void> {
  return delayedApiCall(`${configs.BASE_URL}/comments`, request, delaySeconds, 'Failed to post comment');
 }

 // システムメッセージ
 async postSystemMessage(content: string, name: string = 'error', delaySeconds: number = 0): Promise<void> {
  const request: postOneCommeRequestType = {
   service: {
    id: await this.getDefaultServiceId()
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

  return this.postComment(request, delaySeconds);
 }

 private async getDefaultServiceId(): Promise<string> {
  const services = await new ServiceAPI().getServices();
  return services[0]?.id;
 }
}

// WordPartyへの投稿
export class ReactionService {
 async postWordParty(content: string, delaySeconds: number = 0): Promise<void> {
  return delayedApiCall(
   `${configs.BASE_URL}/reactions`,
   { reactions: [{ key: content, value: 1 }] },
   delaySeconds,
   'Failed to post WordParty reaction'
  );
 }

 // スピーチへの投稿
 async postSpeech(content: string, delaySeconds: number = 0): Promise<void> {
  return delayedApiCall(`${configs.BASE_URL}/speech`, { text: content }, delaySeconds, 'Failed to post speech');
 }
}

function delayedApiCall(url: string, data: any, delaySeconds: number, errorMessage: string): Promise<void> {
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
