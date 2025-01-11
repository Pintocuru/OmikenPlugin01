// src/Modules/api/PostMessage.ts
import { CharaType, OneCommePostType, postOneCommeRequestType } from '@type';
import { CommentService, ReactionService } from '@api/PostComment';
import { ServiceAPI } from '@api/serviceAPI';
import { configs } from '@/config';
import { Service } from '@onecomme.com/onesdk/types/Service';
import path from 'path';

export class PostMessage {
 private readonly commentService: CommentService;
 private readonly serviceAPI: ServiceAPI;
 private readonly reactionService: ReactionService;
 private services: Service[] = [];

 constructor(private posts: OneCommePostType[], private charas?: Record<string, CharaType>) {
  this.commentService = new CommentService();
  this.serviceAPI = new ServiceAPI();
  this.reactionService = new ReactionService();
 }

 async post(): Promise<void> {
  try {
   // 枠情報の取得
   this.services = await this.serviceAPI.getServices();

   // 順次処理を保証
   await Promise.all(
    this.posts.map(async (post) => {
     const chara = post.type === 'onecomme' ? this.charas[post.botKey] : undefined;
     await this.postFork(post, chara);
    })
   );
  } catch (error) {
   console.error('Failed to post messages:', error);
   throw error;
  }
 }

 private async postFork(post: OneCommePostType, chara?: CharaType): Promise<void> {
  const { type, content, delaySeconds = 0 } = post;

  // 空のメッセージはスキップ
  if (!content?.trim()) return;

  // キャラクターの枠作成チェック
  if (type === 'onecomme' && chara && configs.isCreateService) {
   const existingService = this.services.some((s) => s.id === chara.frameId);
   if (!existingService) {
    const newService = await this.serviceAPI.createService(
     chara.name,
     chara.frameId,
     chara.color['--lcv-background-color']
    );
    if (newService) {
     this.services.push(newService);
    }
   }
  }

  // メッセージタイプに応じた投稿処理
  const postActions: Record<string, () => Promise<void>> = {
   onecomme: async () => {
    if (!chara) return;
    const DefaultFrameId = !configs.isCreateService ? this.services[0]?.id : null;
    const request = this.createCommentRequest(post, chara, DefaultFrameId);

    if (post.party) this.reactionService.postWordParty(post.party, delaySeconds);
    this.commentService.postComment(request, delaySeconds);
   },
   party: async () => this.reactionService.postWordParty(content, delaySeconds),
   speech: async () => this.reactionService.postSpeech(content, delaySeconds),
   error: async () => this.commentService.postSystemMessage(content, post.generatorParam, delaySeconds)
  };

  const action = postActions[type];
  if (action) await action();
 }

 private createCommentRequest(
  post: OneCommePostType,
  chara: CharaType,
  defaultFrameId: string | null
 ): postOneCommeRequestType {
  return {
   service: {
    id: chara.frameId || defaultFrameId
   },
   comment: {
    id: Date.now() + Math.random().toString().slice(2, 12),
    userId: configs.botUserId,
    name: chara.name,
    comment: post.content,
    profileImage: this.getCharaImagePath(chara, post.iconKey),
    badges: [],
    nickname: chara.nickname || chara.name,
    liveId: post.generatorParam || '',
    isOwner: post.isSilent
   }
  };
 }

 private getCharaImagePath(chara: CharaType, iconKey: string): string {
  const charaImage = chara.image[iconKey] || chara.image.Default || '';
  return path.join(configs.imgRoot, charaImage);
 }
}
