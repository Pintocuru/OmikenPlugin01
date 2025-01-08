// src/Modules/TaskOmikujiProcess.js
import {
 GameType,
 OmikujiSelectType,
 PluginUpdateData,
 ScriptsReturnType,
 StoreMainType,
 StoreType,
 UserStatsType,
 VisitType
} from '@type';
import { PostMessages } from './PostOmikuji';
import { PlaceProcess } from './PlaceProcess';
import { Comment } from '@onecomme.com/onesdk/types/Comment';
import { systemMessage } from './ErrorHandler';

type OmikujiContext = {
 game: GameType;
 userStats?: UserStatsType;
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
  this.context.game = this.storeAll.Games[this.omikuji.selectRuleId] ?? {
   ruleId: this.omikuji.selectRuleId,
   draws: 0,
   totalDraws: 0,
   userStats: {},
   gameData: {}
  };

  if (this.comment) {
   const userId = this.comment.data.userId;
   this.context.visit = this.storeAll.Visits[userId];
   this.context.userStats = this.context.game.userStats[userId] ?? {
    userId,
    draws: 0,
    totalDraws: 0
   };
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
  const { userStats, game } = this.context;
  const selectRuleId = this.omikuji.selectRuleId;

  // gameの初期化を拡張
  this.context.game = {
   ...game,
   ruleId: selectRuleId,
   draws: (game?.draws ?? 0) + 1,
   totalDraws: (game?.totalDraws ?? 0) + 1,
   userStats: game?.userStats ?? {}, // userStatsの初期化を追加
   gameData: game?.gameData ?? {} // gameDataも念のため初期化
  };

  if (this.comment && userStats) {
   const userId = this.comment.data.userId;
   // userStatsの初期化処理を追加
   if (!this.context.game.userStats[userId]) {
    this.context.game.userStats[userId] = {
     userId,
     draws: 0,
     totalDraws: 0
    };
   }

   this.context.userStats = {
    ...this.context.game.userStats[userId],
    draws: (userStats?.draws ?? 0) + 1,
    totalDraws: (userStats?.totalDraws ?? 0) + 1,
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
  }
 }

 // スクリプト実行
 private async scriptsCall(): Promise<ScriptsReturnType | undefined> {
  try {
   const script = this.omikuji.script;
   const scriptData = this.storeAll.Scripts[script?.scriptId];

   // スクリプトの存在確認
   if (!scriptData || typeof scriptData.func !== 'function') {
    systemMessage('warn', `外部スクリプト ${script.scriptId} が読み込めません`, {
     scriptId: script.scriptId,
     scriptData
    });
    return undefined;
   }

   // スクリプトの実行
   return scriptData.func(this.context.game, this.comment, script.params);
  } catch (error) {
   systemMessage('error', `外部スクリプトエラー`, {
    script: this.omikuji.script,
    context: this.context,
    error
   });
   return undefined;
  }
 }

 private processPlaceData() {
  const { placeIds } = this.omikuji;
  const { userStats, game } = this.context;
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
     draws: userStats?.draws?.toString() ?? '0',
     totalDraws: userStats?.totalDraws?.toString() ?? '0',
     user: commentData.displayName || commentData.name,
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
   this.storeAll.store.set(`Visits.${this.comment.data.userId}`, this.context.visit);
  }
 }

 // Games / Visits / TimeConfig をプラグインに返す
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
