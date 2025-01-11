// scr/Scripts/GamesHondaJanken.ts

import { DrawsBase, GameType, ScriptParam, ScriptsType, UserStatsType } from '@type';

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

interface GameDataType extends GameType {
 rankings: Ranking[];
 rankingHistory?: RankingHistory[];
}

// ランキングデータ
interface Ranking extends DrawsBase {
 userId: string;
 name: string;
 rate: number;
}

type RankingHistory = {
 date: string;
 rankings: Ranking[];
};

interface Props {
 rankings: Ranking[];
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
 func: (game, comment, params) => {
  // 型定義の拡張
  const localGame = game as GameDataType;

  // パラメータ設定(型アサーションが必須)
  const {
   isWin = false,
   getPoint = 0,
   rankMode = 0,
   rankDays = 20,
   historyDays = 10
  } = params as {
   isWin: boolean;
   getPoint: number;
   rankMode: number;
   rankDays: number;
   historyDays: number;
  };

  // 初期化
  const { userId } = comment.data;
  const today = new Date().toISOString().split('T')[0];
  const userStats = localGame.userStats;
  const userData = userStats[userId];

  // 値の更新をヘルパー関数
  const updateStats = (target: UserStatsType | GameDataType, field: string, value: number) => {
   // 必ず数値型で初期化
   if (typeof target[field] !== 'number') {
    target[field] = 0;
   }
   if (typeof target[`total${field.charAt(0).toUpperCase()}${field.slice(1)}`] !== 'number') {
    target[`total${field.charAt(0).toUpperCase()}${field.slice(1)}`] = 0;
   }

   // インクリメント処理
   target[field] += value;
   target[`total${field.charAt(0).toUpperCase()}${field.slice(1)}`] += value;
  };

  // 勝利の場合の処理
  if (isWin) {
   updateStats(userData, 'wins', 1);
   updateStats(localGame, 'wins', 1);
  }
  // ポイントが1以上ある場合は足す
  if (getPoint > 0) {
   updateStats(userData, 'points', getPoint);
   updateStats(localGame, 'points', getPoint);
  }

  // ランキングを生成する前に userStats を更新
  userStats[userId] = {
   ...userData,
   draws: userData.draws,
   totalDraws: userData.totalDraws,
   wins: userData.wins ?? 0,
   totalWins: userData.totalWins ?? 0,
   points: userData.points ?? 0,
   totalPoints: userData.totalPoints ?? 0
  };

  // 勝率計算用関数
  const calculateRate = (wins: number, draws: number): number => (draws > 0 ? (wins / draws) * 100 : 0);

  // ランキングの更新
  const rankMap = {
   0: 'wins',
   1: 'rate',
   2: 'points',
   3: 'totalPoints'
  } as const;
  const rankings: Ranking[] = Object.entries(userStats)
   .map(([id, stats]) => ({
    userId: id,
    name: stats.name,
    ...stats,
    rate: calculateRate(stats.wins || 0, stats.draws)
   }))
   .sort((a, b) => (b[rankMap[rankMode]] ?? 0) - (a[rankMap[rankMode]] ?? 0))
   .slice(0, rankDays);

  // 現在のユーザーのエントリを最上位に移動
  const currentUserIndex = rankings.findIndex((rank) => rank.userId === userId);
  if (currentUserIndex > -1) {
   const currentUser = rankings.splice(currentUserIndex, 1)[0];
   rankings.unshift(currentUser);
  }

  // ランキング履歴の更新
  const rankingHistory = localGame.rankingHistory ?? [];
  const todayRankingIndex = rankingHistory.findIndex((r) => r.date === today);

  if (todayRankingIndex === -1) {
   rankingHistory.unshift({ date: today, rankings });
   if (rankingHistory.length > historyDays) {
    rankingHistory.pop();
   }
  } else {
   rankingHistory[todayRankingIndex].rankings = rankings;
  }

  // 戻り値の計算
  const winsUser = userData.wins || 0;

  return {
   placeholder: {
    winsUser,
    winsRank: currentUserIndex + 1 || '不明',
    winsRate: calculateRate(winsUser, userData.draws)
   },
   // returnでまとめて更新する
   game: {
    ...localGame,
    rankings,
    rankingHistory,
    userStats
   }
  };
 },
 scriptParams: SCRIPTPARAMS,
 placeholders: PLACEHOLDERS
};

module.exports = plugin;
