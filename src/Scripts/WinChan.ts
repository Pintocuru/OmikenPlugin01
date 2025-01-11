// scr/Scripts/WinChan.ts
import { GameType, ScriptParam, ScriptsReturnType, ScriptsType, UserStatsType } from '@type';

// エディターで設定できるパラメータ
const SCRIPTPARAMS: ScriptParam[] = [
 {
  id: 'isWin', // キー名
  name: '勝利したか', // ルール名
  description: '勝敗フラグ。ユーザーの勝ち:ON/負け:OFF', // 説明文
  type: 'boolean', //
  value: false // デフォルト値
 },
 {
  id: 'getPoint', // キー名
  name: '獲得したポイント', // ルール名
  description: '入力した数値を、ポイントとして加算します(プレースホルダー使用不可)', // 説明文
  type: 'number', //
  value: 0 // デフォルト値
 },
 {
  id: 'rankMode', // キー名
  name: 'ランキングモード', // ルール名
  description: '0:勝数/1:レート/2:1回のポイント/3:合計ポイント', // 説明文
  isEver: true, // 永続化するか
  type: 'number', //
  value: 0 // デフォルト値
 },
 {
  id: 'rankDays', // キー名
  name: '保存するランキング数', // ルール名
  description: '1日ごとに保存するランキング数。多いほどデータ量も増えます。', // 説明文
  isEver: true, // 永続化するか
  type: 'number', //
  value: 20 // デフォルト値
 },
 {
  id: 'historyDays', // キー名
  name: '履歴を残す回数', // ルール名
  description: 'この配信回数を超えると、古いランキングから消去されます', // 説明文
  isEver: true,
  type: 'number', //
  value: 10 // デフォルト値
 }
] as const;

const PLACEHOLDERS: ScriptParam[] = [
 {
  id: 'winsCount',
  name: 'ユーザーの勝利数',
  description: 'コメントしたユーザーの、配信枠内での勝数を返します',
  value: '2'
 },
 {
  id: 'winsRank',
  name: 'ユーザーの順位',
  description: 'パラメータのランキングモードを参照し、配信枠内での順位を数値で返します',
  value: '4'
 },
 {
  id: 'winsRate',
  name: 'ユーザーの勝率(%)',
  description: 'コメントしたユーザーの、配信枠内での勝率を返します',
  value: '16.6'
 }
] as const;

// ---

// 追加game定義
interface GameDataType extends GameType {
 rankings: UserRankingType[];
 rankingHistory?: RankingHistory[];
}

// 追加パラメータ定義
interface GameParams {
 isWin: boolean;
 getPoint: number;
 rankMode: number;
 rankDays: number;
 historyDays: number;
}

// ランキングデータ定義
interface UserRankingType extends UserStatsType {
 rate?: number;
 pointHistory?: PointHistory[];
}

// ランキング履歴定義
type RankingHistory = {
 date: string;
 rankings: UserRankingType[];
};

interface PointHistory {
 timestamp: number;
 points: number;
 name: string;
 userId: string;
}

// ジェネレーター用
interface Props {
 rankings: UserRankingType[];
 currentUserId?: string;
}

// ---

const plugin: ScriptsType = {
 id: 'WinChan',
 name: '勝率判定ちゃん',
 description: 'パラメータを受け取ることで、ゲーム数や勝率を管理します。',
 version: '0.0.1',
 author: 'Pintocuru',
 url: '',
 banner: '',
 func: (game, comment, params) =>
  updateGame(game as GameDataType, comment.data.userId, params as unknown as GameParams),
 scriptParams: SCRIPTPARAMS,
 placeholders: PLACEHOLDERS
};

module.exports = plugin;

// ---

const updateGame = (game: GameDataType, userId: string, params: GameParams): ScriptsReturnType => {
 const { rankMode, isWin, getPoint, rankDays, historyDays } = params;

 // 統計の更新
 const updatedStats = updateStats(game.userStats[userId], params, getPoint);
 const updatedUserStats = { ...game.userStats, [userId]: updatedStats };

 // ランキング管理と履歴更新
 const rankingManager = new RankingManager(updatedUserStats, rankMode, rankDays);
 const rankings = rankingManager.selectRankings(userId);
 const rankingHistory = rankingManager.updateHistory(game.rankingHistory, rankings, historyDays);

 // 結果を構築
 return {
  placeholder: calculatePlaceholders(updatedStats, rankings, userId),
  game: {
   ...game,
   rankings,
   rankingHistory,
   userStats: updatedUserStats
  }
 };
};


// ---

// ユーザーの更新
function updateStats(userStats: UserStatsType, params: GameParams, points: number): UserStatsType {
 const stats = { ...userStats };
 const { rankMode, isWin } = params;

 const updateField = (target: UserStatsType, field: keyof Pick<UserStatsType, 'wins' | 'points'>, value: number) => {
  const totalField = `total${field.charAt(0).toUpperCase()}${field.slice(1)}`;

  // ランキングモード2の場合は値を直接置き換え、それ以外は加算
  target[field] = rankMode === 2 ? value : (target[field] || 0) + value;
  target[totalField] = (target[totalField] || 0) + value;
 };

 // 必要に応じてフィールドを更新
 if (isWin) updateField(stats, 'wins', 1);
 if (points > 0) updateField(stats, 'points', points);

 return stats;
}


// ---

// ランキング生成関数
class RankingManager {
 private userStats: Record<string, UserRankingType>;
 private rankMode: number;
 private rankDays: number;

 constructor(userStats: Record<string, UserRankingType>, rankMode: number, rankDays: number) {
  this.userStats = userStats;
  this.rankMode = rankMode;
  this.rankDays = rankDays;
 }

 // ランキングの生成
 selectRankings(currentUserId?: string): UserRankingType[] {
  // 1ゲームの得点によるランキング
  if (this.rankMode === 2) return this.pointRankings(currentUserId);

  // 総得点によるランキング
  return this.totalRankings(currentUserId);
 }

 // 履歴の更新
 updateHistory(history: RankingHistory[] = [], rankings: UserRankingType[], historyDays: number): RankingHistory[] {
  const today = new Date().toISOString().split('T')[0];
  const todayRankingIndex = history.findIndex((r) => r.date === today);

  if (todayRankingIndex === -1) {
   history.unshift({ date: today, rankings });
   return history.slice(0, historyDays);
  }

  history[todayRankingIndex].rankings = rankings;
  return history;
 }

 // ポイントベースのランキング生成
 private pointRankings(currentUserId?: string): UserRankingType[] {
  const allHistory = Object.entries(this.userStats)
   .flatMap(([_, stats]) =>
    (stats.pointHistory ?? []).map((history) => ({
     userId: history.userId,
     name: history.name,
     points: history.points,
     timestamp: history.timestamp,
     draws: 0,
     totalDraws: 0,
    }))
   )
   .sort((a, b) => {
    if (b.points === a.points) return b.timestamp - a.timestamp;
    return b.points - a.points;
   })
   .slice(0, this.rankDays);

  return this.prioritizeCurrentUser(allHistory, currentUserId);
 }

 // 総得点によるランキング
 private totalRankings(currentUserId?: string): UserRankingType[] {
  const rankMap = {
   0: 'wins',
   1: 'rate',
   3: 'totalPoints'
  } as const;

  const rankings = Object.entries(this.userStats)
   .map(([id, stats]) => ({
    userId: id,
    name: stats.name,
    ...stats,
    rate: stats.draws > 0 ? (stats.wins || 0 / stats.draws) * 100 : 0
   }))
   .sort((a, b) => (b[rankMap[this.rankMode]] ?? 0) - (a[rankMap[this.rankMode]] ?? 0))
   .slice(0, this.rankDays);

  return this.prioritizeCurrentUser(rankings, currentUserId);
 }

 // 現在のユーザーを一番上にする
 private prioritizeCurrentUser<T extends { userId: string }>(rankings: T[], currentUserId?: string): T[] {
  if (!currentUserId) return rankings;

  const currentUserIndex = rankings.findIndex((rank) => rank.userId === currentUserId);

  if (currentUserIndex > -1) {
   const [currentUser] = rankings.splice(currentUserIndex, 1);
   rankings.unshift(currentUser);
  }

  return rankings;
 }
}

// プレースホルダー計算関数
function calculatePlaceholders(
 userStats: UserStatsType,
 rankings: UserRankingType[],
 userId: string
): ScriptsReturnType['placeholder'] {
 const winsUser = userStats.wins || 0;
 const currentUserIndex = rankings.findIndex((rank) => rank.userId === userId);
 const winsRate = userStats.draws > 0 ? (winsUser / userStats.draws) * 100 : 0;

 return {
  winsUser,
  winsRank: currentUserIndex + 1 || '不明',
  winsRate
 };
}
