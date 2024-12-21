// scriptサンプル

import { Comment } from "@onecomme.com/onesdk/types/Comment";
import { OneCommePostType, ScriptParam, ScriptsReturnType, visitDataType } from "../types";
import { GameType } from "../types";

// ---

// GouseiSuika専用の型定義
type GameConfigs = {
  small: GameConfigItem[][];
  big: GameConfigItem[][];
};

type GameConfigItem = {
  chance: number;
  times?: number;
  points: number;
  damage?: number;
  party: string;
};

export function GamesTest(visitData: visitDataType, game: GameType, comment?: Comment, params:ScriptParam[] = []): ScriptsReturnType {
 // ゲームモードの設定
 let currentMode = 0;
 const param = params[0]?.value;
 if (param === 'カボチャ') currentMode = 1;
 if (param === 'クジラ') currentMode = 2;
 const isWelcome = param === 'welcome';
 const user = comment.data.displayName;

 // ゲームの設定データ
 const GAME_CONFIGS: GameConfigs = {
  small: [
   // スイカゲーム
   [
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
   // カボチャゲーム
   [
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
   // クジラゲーム
   [
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
   ]
  ],
  big: [
   // スイカゲーム
   [
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
   ],
   // カボチャゲーム
   [
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
   ],
   // クジラゲーム
   [
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
  ]
 };

 // 抽選ゲームのロジック
 function playGacha(items: GameConfigs) {
  let totalPoints = 0;
  const postArray: OneCommePostType[] = [
   { type: 'party', delaySeconds: 1, content: '🍒' },
   { type: 'party', delaySeconds: 8.5, content: '!パパッ' }
  ];

  // 小さいアイテムの抽選
  const smallItems = items.small[currentMode];
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
  const bigItems = items.big[currentMode];
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

 // ゲームの実行
 const { points, postArray } = playGacha(GAME_CONFIGS);
 // 0.7倍～1.3倍にし、最終的なスコアを返す
 const finalPoints = Math.ceil(points * (0.7 + Math.random() * 0.6));

 // メッセージの生成
 const message = isWelcome
  ? `${user}さん、こんにちは! ${user}の得点は${finalPoints}!`
  : `${user}の得点は${finalPoints}!`;

 // fruitを降らせるか(0でなければ降らせる)
 const postArrayHandle = (game.gameData?.isFruit ?? true) !== '0' ? postArray : [];

 return {
  // エディターで設定できるパラメータ
  // ここで設定したものは、game.gameDataの引数に入ります
  // (idをhogeにした場合、game.gameData.hogeにvalueが入ります)
  gameParam: [
   {
    id: 'mode', // キー名
    name: 'モード', // ルール名
    description: '0:スイカゲーム/1:カボチャゲーム/2:クジラゲーム', // 説明文
    value: '0' // デフォルト値
   },
   {
    id: 'isFruit', // キー名
    name: 'フルーツをWordPartyで降らせるか', // ルール名
    description: 'フルーツを降らせるか(1:ON/0:OFF) 別途専用WordPartyが必要です', // 説明文
    value: '1' // デフォルト値
   }
  ],
  // 複雑なWordParty用
  postArray: postArrayHandle,
  // 各種プレースホルダー
  placeholder: {
   message, // 全体のメッセージ
   points: finalPoints.toString()
  },
  game,
  visitData
 };
}
