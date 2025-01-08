// scr/Scripts/GamesHondaJanken.ts

import { OneCommePostType, ScriptParam, ScriptsType } from '@type';

// エディターで設定できるパラメータ
const SCRIPTPARAMS: ScriptParam[] = [
 {
  id: 'isWin', // キー名
  name: '勝利したか', // ルール名
  description: '勝敗フラグ。', // 説明文
  type: 'boolean', //
  value: false // デフォルト値
 },
 {
  id: 'isFruit', // キー名
  name: 'フルーツをWordPartyで降らせるか', // ルール名
  description: '1:降らせる/0:OFF 別途専用WordPartyが必要です', // 説明文
  type: 'boolean',
  value: '1' // デフォルト値
 }
];

const PLACEHOLDERS: ScriptParam[] = [
 {
  id: 'winsUser',
  name: '個人勝数',
  description: 'コメントしたユーザーの、ルールの勝数(今回の配信枠内)を返します',
  value: '2'
 },
 {
  id: 'winsUserTotal',
  name: '個人勝数(すべて)',
  description: 'コメントしたユーザーの、ルールの勝数(過去全て)を返します',
  value: '5'
 },
 {
  id: 'winsEvery',
  name: '全員の勝数',
  description: 'ルールの勝数(今回の配信枠内)を返します',
  value: '18'
 },
 {
  id: 'winsEveryTotal',
  name: '全員の勝数(すべて)',
  description: 'ルールの勝数(過去全て)を返します',
  value: '55'
 },
 {
  id: 'winsUserRate',
  name: '個人勝率(今回の配信枠内)',
  description: 'コメントしたユーザーの、今回の配信枠内での勝率を返します',
  value: '16.6'
 },
 {
  id: 'winsEveryRate',
  name: '全員の勝率(今回の配信枠内)',
  description: '今回の配信枠内での全ユーザーの平均勝率を返します',
  value: '4.12'
 }
];

// ---

const plugin: ScriptsType = {
 id: 'GamesTest',
 name: '勝率判定ちゃん',
 description: 'パラメータを受け取ることで、ゲーム数や勝率を管理します。',
 version: '0.0.1',
 author: 'Pintocuru',
 url: '',
 banner: '',
 func: ( game, comment, params) => {
  // ゲームモードの設定

  // 勝率
  const userId = comment.data.userId;
  const userDraws = game.userStats[userId].draws;
  let userWins = (game.userStats[userId].wins as number) ?? 0;
  const draws = game.draws; // 今回のゲーム回数
  let wins = game.gameData?.wins as number ?? 0; // 今回の勝利数
  const totalDraws = game.totalDraws; // これまでのゲーム回数
  let totalWins = game.gameData.totalWins as number; // これまでの勝利数

  // visitData.count[0] を勝数とする

  // 勝利したか
  const isWin = params.isWin; // boolean

  if (isWin) {
   userWins++;
   wins++;
   totalWins++;
  }

  // game.gameDataの更新
  const gameData = game.gameData;
  gameData.wins = wins;
  gameData.totalWins = totalWins;

  return {
   // 各種プレースホルダー
   placeholder: {
    winsUser: userWins, // ユーザーの今回の勝利数
    winsUserTotal: userDraws > 0 ? ((userWins / userDraws) * 100).toFixed(1) : '0.0', // ユーザーの総合勝率(%)
    winsEvery: wins, // 全体の今回の勝利数
    winsEveryTotal: totalWins, // 全体の総合勝利数
    winsUserRate: userDraws > 0 ? ((userWins / userDraws) * 100).toFixed(1) : '0.0', // ユーザーの現在の勝率(%)
    winsEveryRate: draws > 0 ? ((wins / draws) * 100).toFixed(1) : '0.0' // 全体の現在の勝率(%)
   },
   game: {
    ...game,
    gameData: gameData
   },
  };
 },
 scriptParams: SCRIPTPARAMS,
 placeholders: PLACEHOLDERS
};

module.exports = plugin;

// ---

// GouseiSuika専用の型定義
type GameConfigs = {
 [key: string]: GameConfigDetails; // 各ゲーム（例: suika）がキー
};

type GameConfigDetails = {
 small: GameConfigItem[]; // small ゲーム設定の配列
 big: GameConfigItem[]; // big ゲーム設定の配列
};

type GameConfigItem = {
 chance: number; // 確率
 times?: number; // オプショナル: 繰り返し回数
 points: number; // ポイント
 damage?: number; // オプショナル: ダメージ
 party: string; // キャラクターやアイテムの名前
};

// ---

// ゲームの設定データ
const GAME_CONFIGS: GameConfigs = {
 // スイカゲーム
 suika: {
  small: [
   // 🍓いちご：1点(2/3:15回)
   { chance: 67, times: 15, points: 1, party: '🍓' },
   // 🍇ぶどう：3点(1/2:15回)
   { chance: 50, times: 15, points: 3, party: '🍇' },
   // 🍊デコポン：10点(1/2:10回)
   { chance: 50, times: 10, points: 10, party: '🍊' },
   // 🦪かき：20点(1/3:8回)
   { chance: 50, times: 8, points: 20, party: '🦪' },
   // 🍎りんご：50点(2/3:5回)
   { chance: 67, times: 5, points: 50, party: '🍎' }
  ],
  big: [
   // 🍐なし
   { chance: 25, points: 300, damage: 1, party: '🍐' },
   // 🍍パイナップル
   { chance: 25, points: 400, damage: 1, party: '🍍' },
   // 🍑もも
   { chance: 33, points: 500, damage: 2, party: '🍑' },
   // 🍈メロン
   { chance: 33, points: 700, damage: 2, party: '🍈' },
   // 🍉スイカ
   { chance: 50, points: 1000, damage: 3, party: '🍉' },
   // 🍉🍉ダブル
   { chance: 100, points: 1000, damage: 0, party: '🍉' }
  ]
 },
 // カボチャゲーム
 kabo: {
  small: [
   // 🍓いちご：1点(2/3:15回)
   { chance: 67, times: 15, points: 1, party: '🍓' },
   // 🍇ぶどう：3点(1/2:15回)
   { chance: 50, times: 15, points: 3, party: '🍇' },
   // 🍊デコポン：10点(1/2:10回)
   { chance: 50, times: 10, points: 10, party: '🍊' },
   // 🦪かき：20点(1/3:8回)
   { chance: 50, times: 8, points: 20, party: '🦪' },
   // 🍎りんご：50点(2/3:5回)
   { chance: 67, times: 5, points: 50, party: '🍎' }
  ],
  big: [
   // 🍬キャンディー
   { chance: 25, points: 150, damage: 0, party: '🍬' },
   // 🍐なし
   { chance: 33, points: 300, damage: 1, party: '🍐' },
   // 🍍パイナップル
   { chance: 33, points: 400, damage: 1, party: '🍍' },
   // 🍑もも
   { chance: 33, points: 500, damage: 2, party: '🍑' },
   // 🍈メロン
   { chance: 33, points: 700, damage: 2, party: '🍈' },
   // 🍉スイカ
   { chance: 50, points: 1000, damage: 3, party: '🍉' },
   // 🍉🍉ダブル
   { chance: 50, points: 1000, damage: 0, party: '🍉' },
   // 🎃カボチャ
   { chance: 100, points: 1200, damage: 0, party: '🎃' }
  ]
 },
 // クジラゲーム
 kujira: {
  small: [
   // クマノミ：11点(1/2:5回)
   { chance: 50, times: 5, points: 11, party: '!クマノミ' },
   // クラゲ：22点(1/2:5回)
   { chance: 50, times: 5, points: 22, party: '!クラゲ' },
   // フグ：33点(1/2:5回)
   { chance: 50, times: 5, points: 33, party: '!フグ' },
   // カニ：44点(1/2:5回)
   { chance: 50, times: 5, points: 44, party: '!カニ' },
   // マグロ：55点(1/2:5回)
   { chance: 50, times: 5, points: 55, party: '!マグロ、ご期待ください' }
  ],
  big: [
   // ウミガメ
   { chance: 33, points: 300, damage: 1, party: '!ウミガメ' },
   // マンボウ
   { chance: 33, points: 350, damage: 1, party: '!マンボウ' },
   // ジンベエザメ
   { chance: 33, points: 400, damage: 1, party: '!ジンベエザメ' },
   // シャチ
   { chance: 33, points: 450, damage: 1, party: '!シャチ' },
   // クジラ
   { chance: 100, points: 500, damage: 0, party: '!クジラ' }
  ]
 }
};

// ---

// 抽選ゲームのロジック
function playGacha(items: GameConfigs, currentMode = 'suika') {
 let totalPoints = 0;
 const postArray: OneCommePostType[] = [
  { type: 'party', delaySeconds: 1, content: '🍒' },
  { type: 'party', delaySeconds: 8.5, content: '!パパッ' }
 ];

 // 小さいアイテムの抽選
 const smallItems = items[currentMode].small;
 smallItems.forEach((item) => {
  const { pointsEarned, wins } = runItemLottery(item);
  totalPoints += pointsEarned;

  // 当選数の半分を絵文字として追加
  const halfWins = Math.floor(wins / 2);
  for (let i = 0; i < halfWins; i++) {
   postArray.push({ type: 'party', delaySeconds: 1, content: item.party });
  }
 });

 // 大きいアイテムの抽選
 let life = 3;
 const bigItems = items[currentMode].big;
 while (life > 0) {
  const selectedItem = bigItems.find((item) => item.chance > Math.random() * 100);

  if (selectedItem) {
   totalPoints += selectedItem.points;
   life -= selectedItem.damage;
   postArray.push({ type: 'party', delaySeconds: 1, content: selectedItem.party });
  }

  // 追加のランダムなアイテム落下
  bigItems.forEach((item) => {
   if (item.damage && 3 - item.damage > Math.random() * 6) {
    postArray.push({ type: 'party', delaySeconds: 1, content: item.party });
   }
  });
 }

 return { points: totalPoints, postArray };
}

// 単一アイテムの抽選
function runItemLottery(item: GameConfigItem) {
 let pointsEarned = 0;
 let wins = 0;

 for (let i = 0; i < item.times; i++) {
  if (Math.random() * 100 < item.chance) {
   pointsEarned += item.points;
   wins++;
  }
 }

 return { pointsEarned, wins };
}
