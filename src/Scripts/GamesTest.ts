// scriptサンプル
import { OneCommePostType, ScriptParam, ScriptsType } from '@type';

// エディターで設定できるパラメータ
const SCRIPTPARAMS: ScriptParam[] = [
 {
  id: 'mode', // キー名
  name: 'モード', // ルール名
  description: '0:スイカゲーム/1:カボチャゲーム/2:クジラゲーム', // 説明文
  type: 'number',
  value: 0 // デフォルト値
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
  id: 'message',
  name: '標準メッセージ',
  description: 'デフォルトのスイカゲームの返答',
  value: 'userの得点は1500!'
 },
 {
  id: 'points',
  name: 'ポイント',
  description: '総合得点',
  value: '1500'
 }
];

// ---

const plugin: ScriptsType = {
 id: 'GamesTest',
 name: 'スイカゲーム(test)',
 description: 'おみくじプラグイン用のテスト',
 version: '0.0.1',
 author: 'Pintocuru',
 url: '',
 banner: '',
 func: ( game, comment, params) => {
  // ゲームモードの設定
  let currentMode = 'suika';
  const mode = params?.mode ?? 0;
  if (mode === 1) currentMode = 'kabo'; // カボチャゲーム
  if (mode === 2) currentMode = 'kujira'; // クジラゲーム
  const isWelcome = mode === 'welcome';
  const user = comment.data.displayName;

  // ゲームの実行
  const { points, postArray } = playGacha(GAME_CONFIGS, currentMode);
  // 0.7倍～1.3倍にし、最終的なスコアを返す
  const finalPoints = Math.ceil(points * (0.7 + Math.random() * 0.6));

  // メッセージの生成
  const message = isWelcome
   ? `${user}さん、こんにちは! ${user}の得点は${finalPoints}!`
   : `${user}の得点は${finalPoints}!`;

  // fruitを降らせるか(0でなければ降らせる)
  const postArrayHandle = (game.gameData?.isFruit ?? true) !== '0' ? postArray : [];

  return {
   postArray: postArrayHandle, // 複雑なWordParty用

   // 各種プレースホルダー
   placeholder: {
    message, // 全体のメッセージ
    points: finalPoints.toString() // 得点
   },
   game,
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
