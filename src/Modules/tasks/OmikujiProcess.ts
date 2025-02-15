// src/Modules/tasks/OmikujiProcess.ts
import {
 GameType,
 PluginUpdateData,
 PluginMainType,
 PluginStoreType,
 UserStatsType,
 VisitType,
 OmikujiType,
 OmikenRulesType,
 SelectOmikujiOptions
} from '@type';
import { systemMessage } from '@core/ErrorHandler';
import { PlaceProcess } from '@tasks/PlaceProcess';
import { PostMessage } from '@api/PostMessage';

export class OmikujiProcessor {
 private context!: {
  game: GameType & { userStats: Record<string, UserStatsType> };
  visit?: VisitType;
 };

 constructor(
  private readonly rule: OmikenRulesType,
  private readonly omikuji: OmikujiType,
  private readonly store: PluginMainType,
  private readonly options: SelectOmikujiOptions,
  private placeProcessor: PlaceProcess = new PlaceProcess(omikuji)
 ) {
  this.initializeContext();
 }

 async process(): Promise<Partial<PluginStoreType>> {
  this.updateGameStats();
  await this.executeScript();
  this.updatePlaceData();
  await this.postFinalMessages();
  this.persistChanges();
  return this.createPluginUpdate();
 }

 private initializeContext() {
  const { Games, Visits } = this.store;
  const { id } = this.rule;
  const { type, comment } = this.options;

  this.context = {
   game: Games[id] ?? { ruleId: id, draws: 0, totalDraws: 0, settings: [], currentUserIds: [], userStats: {} },
   visit: type === 'comment' ? Visits[comment.data.userId] : undefined
  };

  if (type === 'comment' && !this.getUserStats()) {
   this.updateUserStats({ userId: comment.data.userId, name: comment.data.name, draws: 0, totalDraws: 0 });
  }
 }

 private getUserStats(): UserStatsType | undefined {
  return this.options.type === 'comment' ? this.context.game.userStats[this.options.comment.data.userId] : undefined;
 }

 private updateGameStats() {
  if (this.options.type !== 'comment') return;

  const { userId } = this.options.comment.data;
  const { game } = this.context;

  this.context.game = {
   ...game,
   draws: (game.draws ?? 0) + 1,
   totalDraws: (game.totalDraws ?? 0) + 1,
   currentUserIds: [userId, ...(game.currentUserIds ?? [])].slice(0, 10)
  };

  this.updateUserStats({
   draws: (this.getUserStats()?.draws ?? 0) + 1,
   totalDraws: (this.getUserStats()?.totalDraws ?? 0) + 1
  });
 }

 private async executeScript() {
  const { script } = this.rule;
  if (!script) return;

  try {
   const { scriptId, settings } = script;
   const scriptData = this.store.Scripts[scriptId];

   if (!scriptData?.OmikujiFunc) {
    systemMessage('warn', '外部スクリプトが読み込めません', scriptData);
    return;
   }

   const result = this.omikuji.scriptParams
    ? scriptData.OmikujiFunc(this.options, this.context.game, settings, this.omikuji.scriptParams)
    : undefined;

   if (result) {
    this.placeProcessor.updatePlace(result.placeholder);
    if (result.postArray?.length) await new PostMessage(result.postArray, this.store.Charas).post();
    if (result.game) this.context.game = result.game;
   }
  } catch (error) {
   systemMessage('error', '外部スクリプトエラー', error);
   throw new Error();
  }
 }

 private updatePlaceData() {
  if (this.omikuji.placeIds) this.placeProcessor.placeDataHandle(this.store.Omiken.places);

  const currentUserStats = this.getUserStats();
  const commentData = this.options.comment?.data;
  const commentMeta = this.options.comment?.meta;

  const placeholder = {
   gameDraws: this.context.game.draws ?? 0,
   gameTotalDraws: this.context.game.totalDraws ?? 0,
   ...(commentData &&
    commentMeta && {
     draws: currentUserStats?.draws ?? 0,
     totalDraws: currentUserStats?.totalDraws ?? 0,
     user: commentData.displayName || commentData.name,
     tc: commentMeta.tc,
     lc: commentMeta.lc,
     round: commentMeta.no
    })
  };

  this.placeProcessor.updatePlace(placeholder);
 }

 private async postFinalMessages() {
  const finalOmikuji = this.placeProcessor.replacementPlace();
  await new PostMessage(finalOmikuji.post, this.store.Charas).post();

  if (this.context.visit) {
   if (finalOmikuji.addStatus !== undefined) this.context.visit.status = finalOmikuji.addStatus ?? '';
   if (finalOmikuji.addPoints !== undefined) this.updateVisitPoints(finalOmikuji.addPoints);
  }
 }

 private updateVisitPoints(addPoints: string | null) {
  if (!this.context.visit) return;

  let point = this.context.visit.point;
  const match = addPoints?.match(/^([+=-]?)(\d+)$/);

  if (match) {
   const [_, operation, value] = match;
   const numValue = parseInt(value, 10);

   switch (operation) {
    case '-':
     point -= numValue;
     break;
    case '=':
     point = numValue;
     break;
    default:
     point += numValue;
   }
  } else if (addPoints !== null) {
   const numValue = parseInt(addPoints, 10);
   if (!isNaN(numValue)) point += numValue;
  } else {
   point = 0;
  }

  this.context.visit.point = point;
 }

 private persistChanges() {
  this.store.store.set(`Games.${this.rule.id}`, this.context.game);
  if (this.options.type === 'comment' && this.context.visit) {
   this.store.store.set(`Visits.${this.options.comment.data.userId}`, this.context.visit);
  }
 }

 private createPluginUpdate(): PluginUpdateData {
  const result: PluginUpdateData = {
   Games: { ...this.store.Games, [this.rule.id]: this.context.game }
  };

  if (this.options.type === 'comment' && this.context.visit) {
   result.TimeConfig = { ...this.store.TimeConfig, lastTime: Date.now() };
   result.Visits = { ...this.store.Visits, [this.options.comment.data.userId]: { ...this.context.visit } };
  }

  return result;
 }

 private updateUserStats(updates: Partial<UserStatsType>) {
  if (this.options.type !== 'comment') return;

  const { userId } = this.options.comment.data;
  const current = this.getUserStats() as UserStatsType;

  this.context.game.userStats[userId] = { ...current, ...updates, userId };
 }
}
