// scriptサンプル
import { ScriptParam, ScriptsType } from '@type';
import WinChan from './WinChan';

// エディターで設定できるパラメータ
const SCRIPTPARAMS: ScriptParam[] = [
 {
  id: 'isRank', // キー名
  name: '結果をランキングに入れるか', // ルール名
  description: 'OFFなら、ランキングに影響を与えません', // 説明文
  type: 'boolean', // 型
  value: true // デフォルト値
 },
 {
  id: 'isBomber', // キー名
  name: 'WordPartyで音を鳴らすか', // ルール名
  description: '1:鳴らす/0:OFF 別途専用WordPartyが必要です', // 説明文
  isEver: true,
  type: 'boolean',
  value: true // デフォルト値
 }
] as const;

const PLACEHOLDERS: ScriptParam[] = [
 {
  id: 'message',
  name: '標準メッセージ',
  description: 'デフォルトのボンバースピンの返答',
  value: 'userのセブンスピン!1/4/8000!合計$8004枚獲得!'
 },
 {
  id: 'symbol',
  name: 'シンボル',
  description: '当選した図柄を返します',
  value: 'セブン'
 },
 {
  id: 'payout',
  name: '獲得したポイント',
  description: '獲得したポイントを返します',
  value: '8004'
 },
 {
  id: 'winsRank',
  name: '順位',
  description: '今回の順位を返します',
  value: '1'
 }
] as const;

// ---

// 追加パラメータ定義
interface GameParams {
 isBomber: boolean;
 isRank: boolean;
}

// 支払いテーブルのインターフェース定義
interface PayoutEntry {
 payouts: number[];
 symbol: string;
 img: string;
}

// ゲーム結果のインターフェース定義
interface GameResult {
 symbol: string;
 img: string;
 payout: number;
 message: string;
}

// シンボルと配当テーブルの設定
const payoutTable: PayoutEntry[] = [
 { payouts: [0, 0, 1, 2, 10, 40, 200, 1000], symbol: 'チェリー', img: '!bombcherry' },
 { payouts: [0, 0, 1, 2, 15, 60, 300, 1500], symbol: 'オレンジ', img: '!bomborange' },
 { payouts: [0, 0, 1, 4, 20, 80, 400, 2000], symbol: 'プラム', img: '!bombplam' },
 { payouts: [0, 0, 2, 6, 30, 120, 600, 3000], symbol: 'スイカ', img: '!bombmelon' },
 { payouts: [0, 1, 2, 8, 40, 160, 800, 4000], symbol: 'ベル', img: '!bombbell' },
 { payouts: [0, 1, 2, 10, 50, 200, 1000, 5000], symbol: 'ハット', img: '!bombhut' },
 { payouts: [0, 1, 3, 15, 60, 240, 1200, 6000], symbol: 'BAR', img: '!bombBAR' },
 { payouts: [0, 1, 4, 30, 80, 320, 2000, 8000], symbol: 'セブン', img: '!bombseven' }
];

// 勝利コメントの設定
const winComments: [number, string][] = [
 [10000, '👑JACKPOT👑'],
 [5000, '💎EPIC WIN💎'],
 [2500, '♕FEVER♕'],
 [1000, '🎯大当り🎯'],
 [500, '✌あたり✌']
];

const plugin: ScriptsType = {
 id: 'BomberSpin',
 name: 'ボンバースピン',
 description: 'APPLI BOMBERSPIN2風のおみくじ',
 version: '0.0.1',
 author: 'Pintocuru',
 tags: ['ポイント', 'ランキング', 'スロット'],
 url: '',
 banner: '',
 func: (game, comment, params) => {
  // パラメータ設定(型アサーションが必須)
  const { isBomber, isRank } = params as unknown as GameParams;

  // ゲームの実行
  const { symbol, img, payout, message } = playGacha(comment.data.displayName);

  // WinChanでランキングの生成
  const winParams = {
   getPoint: payout, // 獲得したポイント
   isRank, // ランキングに載せるか
   rankMode: 2, // ランキングモード(2:1回のポイント)
   rankDays: 20, // 保存するランキング数
   historyDays: 10 // 履歴を残す日数
  };
  const result = WinChan.func(game, comment, winParams);

  // ユーザーの順位を取得
  const { winsRank } = result.placeholder;

  return {
   // WordPartyを発動させるか
   postArray: isBomber
    ? [
       { type: 'party', delaySeconds: 0, content: '!bombback' },
       { type: 'party', delaySeconds: 0, content: img },
       { type: 'party', delaySeconds: 1.8, content: '!bombfire' }
      ]
    : [],

   // 各種プレースホルダー
   placeholder: {
    message, // メッセージ
    symbol,
    payout, // 得点
    winsRank // 順位
   },
   game: result.game
  };
 },
 scriptParams: SCRIPTPARAMS,
 placeholders: PLACEHOLDERS
};

export default plugin;

// ---

/**
 * 配列からウェイト付きで要素を選択する関数
 * @param weights - 重みの配列
 * @returns 選択されたインデックス
 */
function arraySelect(weights: number[]): number {
 const total = weights.reduce((sum, weight) => sum + weight, 0);
 let random = Math.random() * total;

 return weights.findIndex((weight) => {
  random -= weight;
  return random <= 0;
 });
}

/**
 * WILDシンボルの再抽選を行う関数
 * @param count - 抽選回数
 * @returns WILDの出現回数
 */
const rerollWilds = (count: number): number =>
 Array(count)
  .fill(0)
  .reduce((acc) => acc + Number(Math.random() < 1 / 16), 0);

/**
 * スロットの結果を選択する関数
 * @param user - ユーザー名
 * @returns ゲーム結果
 */
function playGacha(user: string): GameResult {
 // 追加回数の抽選(2～7回)
 const baseSpins = arraySelect([12, 11, 10, 9, 8, 7, 6, 5]) + 1;
 const spins = Math.max(2, Math.min(7, baseSpins - Math.floor(Math.random() * 4)));

 // 図柄の抽選
 const symbolIndex = arraySelect([14, 13, 12, 11, 10, 9, 8, 7]);
 const { symbol, img, payouts } = payoutTable[symbolIndex];

 // 初期の空きマス数を決定(0～2)
 let emptySlots = 7 - Math.floor(Math.random() * 3);

 // 初回の払い出し計算
 let totalPayout = payouts[7 - emptySlots + rerollWilds(emptySlots)];
 if (totalPayout < 10) totalPayout++;

 let message = `${user}の${symbol}スピン!${totalPayout}/`;

 // 追加スピンの処理
 for (let j = spins; j > 0; j--) {
  // 当選確率の計算
  const threshold = (20 - symbolIndex * 2 + 20 / j) / 100;

  // 空きマスでの当選数を計算
  const hits = Array(emptySlots)
   .fill(0)
   .reduce((acc) => acc + Number(Math.random() < threshold), 0);
  emptySlots -= hits;

  // 払い出し計算
  let payout = payouts[7 - emptySlots + rerollWilds(emptySlots)];
  if (payout < 10) payout++;

  totalPayout += payout;
  message += j === 1 ? `${payout}!` : `${payout}/`;
 }

 // 勝利コメントの追加
 const winComment = winComments.find(([threshold]) => totalPayout >= threshold)?.[1] || '';
 message += winComment + `合計${totalPayout}枚獲得!`;

 return { symbol, img, payout: totalPayout, message };
}
