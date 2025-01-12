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
  id: 'isRank', // キー名
  name: '結果をランキングに入れるか', // ルール名
  description: 'OFFなら、ランキングに影響を与えません', // 説明文
  type: 'boolean', // 型
  value: true // デフォルト値
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
 isRank: boolean;
 rankMode: number;
 rankDays: number;
 historyDays: number;
}

// ランキングデータ定義
interface UserRankingType extends Partial<UserStatsType> {
 userId: string;
 name?: string;
 rate?: number;
}

// ランキング履歴定義
type RankingHistory = {
 date: string;
 age: number;
 rankings: UserRankingType[];
};

// ジェネレーター用
interface Props {
 rankings: UserRankingType[];
 currentUserId?: string;
}

// ---

const plugin: ScriptsType = {
 id: 'WinChan',
 name: '勝率判定ちゃん',
 description: 'パラメータを受け取ることで、ゲーム数や勝率を生成します。',
 version: '0.0.2',
 author: 'Pintocuru',
 url: '',
 banner: '',
 func: (game, comment, params) =>
  updateGame(game as GameDataType, comment.data.userId, params as unknown as GameParams),
 scriptParams: SCRIPTPARAMS,
 placeholders: PLACEHOLDERS
};

export default plugin;

// ---

const updateGame = (game: GameDataType, userId: string, params: GameParams): ScriptsReturnType => {
 const { getPoint, historyDays } = params;

 // 統計の更新
 const updatedStats = updateStats(game.userStats[userId], params, getPoint);
 const updatedUserStats = { ...game.userStats, [userId]: updatedStats };

 // ランキング管理と履歴更新
 const rankingManager = new RankingManager(game, updatedUserStats, params, userId);
 const rankings = rankingManager.selectRankings();
 const rankingHistory = rankingManager.updateHistory(rankings, historyDays);

 // 結果を構築
 return {
  placeholder: calculatePlaceholders(updatedStats, rankings, userId, params),
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
 countLimit: number;
 constructor(
  private readonly game: GameDataType,
  private readonly userStats: Record<string, UserStatsType>,
  private readonly params: GameParams,
  private readonly userId: string
 ) {}

 // ランキングの生成
 selectRankings(): UserRankingType[] {
  // isRankがfalseなら、ランキングは更新されない
  if (!this.params.isRank) return this.game.rankings;

  if (this.params.rankMode === 2)
   // 1ゲームの得点によるランキング
   return this.pointRankings();

  // 総得点によるランキング
  return this.totalRankings();
 }

 // 履歴の更新
 updateHistory(rankings: UserRankingType[], historyDays: number): RankingHistory[] {
  const { rankingHistory = [] } = this.game;
  const today = new Date().toISOString().split('T')[0];

  // draws <= 1 の場合、新しい履歴を作成し、rankingsをリセット
  if (this.game.draws <= 1) {
   this.game.age = Number.isFinite(this.game.age) ? this.game.age + 1 : 1;
   // rankingsをリセット
   const emptyRankings: UserRankingType[] = [];
   rankingHistory.unshift({
    date: today,
    age: this.game.age,
    rankings: emptyRankings
   });
   return rankingHistory.slice(0, Math.max(0, Math.floor(historyDays)));
  }

  if (rankingHistory[0]) rankingHistory[0].rankings = rankings;
  return rankingHistory;
 }

 // ポイントベースのランキング生成
 private pointRankings(): UserRankingType[] {
  // draws=1なら、ランキングを新しくする
  const rankingsOld = this.game.draws <= 1 ? [] : [...(this.game.rankings || [])];

  // 既存のrankingsから新しいエントリを追加
  const newEntry = {
   userId: this.userId || '',
   name: this.userStats[this.userId || '']?.name || 'Unknown',
   points: this.userStats[this.userId || '']?.points || 0
  };

  const rankings = [...rankingsOld, newEntry].sort((a, b) => b.points - a.points).slice(0, this.params.rankDays);

  return this.prioritizeCurrentUser(rankings, this.userId);
 }

 // 総得点によるランキング
 private totalRankings(): UserRankingType[] {
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
    rate: stats.draws > 0 ? ((stats.wins || 0) / stats.draws) * 100 : 0
   }))
   .sort((a, b) => (b[rankMap[this.params.rankMode]] ?? 0) - (a[rankMap[this.params.rankMode]] ?? 0))
   .slice(0, this.params.rankDays);

  return this.prioritizeCurrentUser(rankings, this.userId);
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
 userId: string,
 params: GameParams // パラメータを追加
): ScriptsReturnType['placeholder'] {
 const winsUser = userStats.wins || 0;
 let winsRank: number | string;

 if (params.rankMode === 2) {
  // 1回毎のランキングの場合
  const points = userStats.points || 0;
  const betterScores = rankings.filter((rank) => rank.points > points).length;
  winsRank = betterScores + 1;
 } else {
  // 通常のランキングの場合
  const currentUserIndex = rankings.findIndex((rank) => rank.userId === userId);
  winsRank = currentUserIndex + 1 || '不明';
 }

 const winsRate = userStats.draws > 0 ? (winsUser / userStats.draws) * 100 : 0;

 return {
  winsUser,
  winsRank,
  winsRate
 };
}
