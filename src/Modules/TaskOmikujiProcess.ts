// src/Modules/TaskOmikujiProcess.js
import { Comment } from '@onecomme.com/onesdk/types/Comment';
import {
 GameType,
 OmikujiSelectType,
 PluginUpdateData,
 ScriptsReturnType,
 StoreMainType,
 StoreType,
 TimeConfigType,
 visitDataType,
 VisitType
} from '@/types';
import { postErrorMessage, PostMessages } from './PostOmikuji';
import { PlaceProcess } from './PlaceProcess';

type OmikujiContext = {
 game: GameType;
 visitData?: visitDataType;
 visit?: VisitType;
};

// OmikujiProcessor クラス
export class OmikujiProcessor {
 private context: OmikujiContext = {} as OmikujiContext;
 private placeProcessor?: PlaceProcess;

 constructor(
  private readonly storeAll: StoreMainType,
  private readonly omikuji: OmikujiSelectType,
  private readonly comment?: Comment
 ) {
  this.placeProcessor = new PlaceProcess(omikuji);
  this.setupContext();
 }

 // 更新する対象を取得
 private setupContext() {
  this.context.game = this.storeAll.Games[this.omikuji.selectRuleId];
  if (this.comment) {
   this.context.visit = this.storeAll.Visits[this.comment.data.userId];
   this.context.visitData = this.context.visit?.visitData[this.omikuji.selectRuleId];
  }
 }

 async process(): Promise<Partial<StoreType>> {
  this.updateDrawsStatus(); // draws情報の更新
  await this.executeScript(); // スクリプト実行
  this.processPlaceData(); // プレースホルダー置き換え
  this.postFinalMessages(); // メッセージ生成と投稿
  this.storeChanges(); // Games / Visits の永続化
  return this.pluginsUpdate(); //  Games / Visits / TimeConfig をプラグインに返す
 }

 // draws情報の更新
 private updateDrawsStatus() {
  const { visitData, game } = this.context;
  const selectRuleId = this.omikuji.selectRuleId;

  // gameがundefinedの場合に備えたデフォルト値を設定
  this.context.game = {
   ...game,
   id: selectRuleId,
   draws: (game?.draws ?? 0) + 1,
   totalDraws: (game?.totalDraws ?? 0) + 1
  };

  if (this.comment && visitData) {
   // visitDataがundefinedの場合に備えたデフォルト値を設定
   this.context.visitData = {
    ...visitData,
    id: selectRuleId,
    draws: (visitData?.draws ?? 0) + 1,
    totalDraws: (visitData?.totalDraws ?? 0) + 1,
    // statusの付与・更新
    ...(this.omikuji.status && { status: this.omikuji.status })
   };
  }
 }

 // スクリプトからの返り値を処理
 private async executeScript() {
  if (!this.omikuji.script) return;

  const scriptResult = await this.scriptsCall();

  if (scriptResult) {
   // プレースホルダーの追加
   this.placeProcessor.updatePlace(scriptResult.placeholder);
   // メッセージ投稿処理
   if (scriptResult.postArray?.length > 0) {
    new PostMessages(scriptResult.postArray, this.storeAll.Charas);
   }
   // game / visitDataの更新
   if (scriptResult.game) this.context.game = scriptResult.game;
   if (scriptResult.visitData) this.context.visitData = scriptResult.visitData;
  }
 }

 // スクリプト実行
 private async scriptsCall(): Promise<ScriptsReturnType | undefined> {
  try {
   const script = this.omikuji.script;
   const func = this.storeAll.Scripts[script.scriptId];

   if (typeof func !== 'function') {
    throw new Error(`Function ${script.scriptId} is not registered`);
   }

   return func(this.context.visitData, this.context.game, this.comment, script.params);
  } catch (error) {
   const errorMessage = `Script execution failed: ${error.message}`;
   postErrorMessage(errorMessage);
   console.error(errorMessage, {
    script: this.omikuji.script,
    context: this.context
   });
   return undefined;
  }
 }

 private processPlaceData() {
  const { placeIds } = this.omikuji;
  const { visitData, game } = this.context;
  const commentData = this.comment?.data;
  const commentMeta = this.comment?.meta;

  // placeIds があるなら、該当する内容をplacesから取得
  if (placeIds) this.placeProcessor.placeDataHandle(this.storeAll.Omiken.places);

  // プレースホルダーの内容を作成
  const placeholder = {
   gameDraws: game.draws?.toString() ?? '0',
   gameTotalDraws: game.totalDraws?.toString() ?? '0',
   ...(commentData &&
    commentMeta && {
     draws: visitData?.draws?.toString() ?? '0',
     totalDraws: visitData?.totalDraws?.toString() ?? '0',
     user: commentData.displayName,
     tc: commentMeta.tc.toString(),
     lc: commentMeta.lc.toString(),
     round: commentMeta.no.toString()
    })
  };
  // プレースホルダー更新
  this.placeProcessor.updatePlace(placeholder);
 }

 // Games / Visits の永続化
 private storeChanges() {
  this.storeAll.store.set(`Games.${this.omikuji.selectRuleId}`, this.context.game);
  if (this.comment && this.context.visit) {
   this.context.visit.visitData[this.omikuji.selectRuleId] = this.context.visitData;
   this.storeAll.store.set(`Visits.${this.comment.data.userId}`, this.context.visit);
  }
 }

 //  Games / Visits / TimeConfig をプラグインに返す
 private pluginsUpdate(): PluginUpdateData | PromiseLike<Partial<StoreType>> {
  const result: PluginUpdateData = {
   Games: {
    ...this.storeAll.Games,
    [this.omikuji.selectRuleId]: this.context.game
   }
  };
  if (this.comment && this.context.visit) {
   // TimeConfigの更新はcommentがある場合のみ(将来、setList/reactionsでも使うかも)
   result.TimeConfig = {
    ...this.storeAll.TimeConfig,
    lastTime: Date.now(),
    lastUserId: this.comment.data.userId
   };
   result.Visits = {
    ...this.storeAll.Visits,
    [this.comment.data.userId]: { ...this.context.visit }
   };
  }
  return result;
 }

 // メッセージ生成と投稿
 private postFinalMessages() {
  const finalOmikuji = this.placeProcessor.replacementPlace();
  new PostMessages(finalOmikuji.post, this.storeAll.Charas);
 }
}
