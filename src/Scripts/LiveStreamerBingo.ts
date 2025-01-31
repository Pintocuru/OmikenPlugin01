// src/Scripts/LiveStreamerBingo.ts
import { ApiCallReturnType, GameType, OneCommePostType, ScriptParam, ScriptsType } from '@type';
import WinChan from './WinChan';

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
  id: 'pointsThreshold', // キー名
  name: '優遇するポイント数', // ルール名
  description: '一定のポイント以上なら優遇するか', // 説明文
  type: 'number', // 型
  value: 1000 // デフォルト値
 },
 {
  id: 'isFruit', // キー名
  name: 'フルーツをWordPartyで降らせるか', // ルール名
  description: '1:降らせる/0:OFF 別途専用WordPartyが必要です', // 説明文
  isEver: true,
  type: 'boolean',
  value: true // デフォルト値
 }
] as const;

const PLACEHOLDERS: ScriptParam[] = [
 {
  id: 'message',
  name: '標準メッセージ',
  description: 'デフォルトのスイカジェネレーターの返答',
  value: 'userの得点は1500!'
 },
 {
  id: 'points',
  name: 'ポイント',
  description: 'スイカジェネレーターの得点を返します',
  value: '1500'
 },
 {
  id: 'winsRank',
  name: '順位',
  description: '今回の順位を返します',
  value: '3'
 }
] as const;

// ---

// 追加パラメータ定義
interface GameParams {
 pointsThreshold: number;
}

const plugin: ScriptsType = {
 id: 'LiveStreamerBingo',
 name: 'ライバービンゴ',
 description: 'ミクチャ ライバービンゴ風のおみくじ',
 version: '0.0.0',
 author: 'Pintocuru',
 tags: ['ポイント', 'ランキング', 'スイカ'],
 url: '',
 banner: '',
 func: (game, comment, params) => {
  // パラメータ設定(型アサーションが必須)
  const { pointsThreshold } = params as unknown as GameParams;

  // ギフト判定
  const hasGift = comment.data.hasGift;
  // 受け取ったポイント
  const price = 'price' in comment.data ? comment.data.price : 0;
  // 優遇判定
  const isTreatment = price >= pointsThreshold;

  // ビンゴカードがなければ作成
  if (!game.bingoCard) {
   game.bingoCard = generateBingoCard();
  }
  // ビンゴ抽選の実行
  const result = executeBingoDraw(game, hasGift, price, pointsThreshold);

  return {
   postArray: [],

   // 各種プレースホルダー
   placeholder: {
    message: `${comment.data.name}の得点は${result.points}!`, // メッセージ
    points: result.points,
    number: result.selectedNumber
   },
   game: result.game
  };
 },
 ApiCall: (game, method, body: ApiCallBody) => {
  let message = '';
  let data: any = null;

  switch (method) {
   case 'DELETE':
    if (body.reset) {
     // ビンゴカードをリセットする処理
     game.bingoCard = null;
     message = 'Bingo card has been reset';
     // 再度ビンゴカードを作る
     const newCard = generateBingoCard();
     game.bingoCard = newCard;
     data = newCard;
    }
    break;

   case 'PUT':
    if (body.buttonState) {
     // 押したボタンを変化させる処理
     game.buttonState = body.buttonState;
     message = 'Button state has been updated';
    }
    break;

   // ビンゴカードがなければ、作成する
   default:
    if (!game.bingoCard) {
     const newCard = generateBingoCard();
     game.bingoCard = newCard;
     message = 'Bingo card has been created';
     data = newCard;
    }
    break;
  }

  return {
   status: 'success',
   game,
   message,
   data
  };
 },
 scriptParams: SCRIPTPARAMS,
 placeholders: PLACEHOLDERS
};

export default plugin;

// ---

// LiveStreamerBingo 専用の型定義
interface BingoCard {
 id: string;
 rows: Array<Array<BingoCell>>;
}

interface BingoCell {
 number: number;
 selected: boolean;
 point: number;
 message?: string;
}

interface ApiCallBody {
 reset?: boolean; // ビンゴカードをリセットする場合 true
 buttonState?: string; // ボタンの新しい状態
 createCard?: boolean; // ビンゴカードを作成する場合 true
 cardData?: BingoCard; // 作成されるビンゴカードのデータ
}
interface BingoCardResult {
 card: BingoCard;
 position: [number, number];
 points: number;
 message?: string;
}

// ポイントパターンの型定義
type PointPattern = {
 name: string;
 getPoints: (points: string[]) => string[][];
};

// ---

// ポイントパターンを生成する関数群
const pointPatterns: PointPattern[] = [
 {
  name: 'diamond',
  getPoints: (points: string[]) => {
   // points配列は昇順で渡されることを想定
   const sorted = [...points].sort((a, b) => parseInt(a) - parseInt(b));
   return [
    [sorted[0], sorted[1], sorted[2], sorted[1], sorted[0]],
    [sorted[1], sorted[2], sorted[3], sorted[2], sorted[1]],
    [sorted[2], sorted[3], sorted[4], sorted[3], sorted[2]], // 中央が最高得点
    [sorted[1], sorted[2], sorted[3], sorted[2], sorted[1]],
    [sorted[0], sorted[1], sorted[2], sorted[1], sorted[0]]
   ];
  }
 },
 {
  name: 'circle',
  getPoints: (points: string[]) => {
   const sorted = [...points].sort((a, b) => parseInt(a) - parseInt(b));
   return [
    [sorted[0], sorted[1], sorted[1], sorted[1], sorted[0]],
    [sorted[1], sorted[2], sorted[3], sorted[2], sorted[1]],
    [sorted[1], sorted[3], sorted[4], sorted[3], sorted[1]], // 中央が最高得点
    [sorted[1], sorted[2], sorted[3], sorted[2], sorted[1]],
    [sorted[0], sorted[1], sorted[1], sorted[1], sorted[0]]
   ];
  }
 },
 {
  name: 'cross',
  getPoints: (points: string[]) => {
   const sorted = [...points].sort((a, b) => parseInt(a) - parseInt(b));
   return [
    [sorted[0], sorted[1], sorted[3], sorted[1], sorted[0]],
    [sorted[1], sorted[2], sorted[3], sorted[2], sorted[1]],
    [sorted[3], sorted[3], sorted[4], sorted[3], sorted[3]], // 中央が最高得点
    [sorted[1], sorted[2], sorted[3], sorted[2], sorted[1]],
    [sorted[0], sorted[1], sorted[3], sorted[1], sorted[0]]
   ];
  }
 }
];

// ビンゴカードを作る
function generateBingoCard(pattern: string = 'diamond'): BingoCard {
 const points = ['200', '300', '500', '1000', '2000'];
 const selectedPattern = pointPatterns.find((p) => p.name === pattern) || pointPatterns[0];
 const pointMatrix = selectedPattern.getPoints(points);

 const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
 const shuffledNumbers = numbers.sort(() => Math.random() - 0.5);

 const rows: Array<Array<BingoCell>> = [];
 for (let i = 0; i < 5; i++) {
  const row: Array<BingoCell> = [];
  for (let j = 0; j < 5; j++) {
   row.push({
    number: shuffledNumbers[i * 5 + j],
    selected: false,
    point: parseInt(pointMatrix[i][j]),
    message: ''
   });
  }
  rows.push(row);
 }

 return {
  id: generateUniqueId(),
  rows
 };
}

function generateUniqueId(): string {
 return '_' + Math.random().toString(36).substr(2, 9);
}

// ビンゴ抽選
function updateBingoCard(card: BingoCard, number: number): BingoCardResult {
 let position: [number, number] = [-1, -1];
 let points = 0;
 let message: string | undefined = undefined;

 card.rows.forEach((row, rowIndex) => {
  row.forEach((cell, cellIndex) => {
   if (cell.number === number) {
    cell.selected = true;
    position = [rowIndex, cellIndex];
    points += cell.point;
    if (cell.message) {
     message = cell.message;
    }
   }
  });
 });

 return { card, position, points, message };
}

function calculatePoints(card: BingoCard): number {
 let points = 0;

 card.rows.forEach((row) => {
  row.forEach((cell) => {
   if (cell.selected) {
    points += cell.point;
   }
  });
 });

 return points;
}

// types.ts
export interface GameResult {
 selectedNumber: number;
 bingoResult: BingoCardResult;
 points: number;
 isTreatment: boolean;
}

// bingoLogic.ts
export function executeBingoDraw(game: GameType, hasGift: boolean, price: number, pointsThreshold: number): GameResult {
 // 優遇措置の判定
 const isTreatment = price >= pointsThreshold;

 // 抽選番号の決定（1-25の範囲）
 let selectedNumber: number;
 if (isTreatment) {
  // 優遇措置がある場合、未選択のセルの中から最高ポイントのものを選ぶ
  selectedNumber = findHighestPointUnselectedNumber(game.bingoCard);
 } else {
  // 通常の抽選
  selectedNumber = getRandomUnselectedNumber(game.bingoCard);
 }

 // ビンゴカードの更新
 const bingoResult = updateBingoCard(game.bingoCard, selectedNumber);

 return {
  selectedNumber,
  bingoResult,
  points: bingoResult.points,
  isTreatment
 };
}

function findHighestPointUnselectedNumber(card: BingoCard): number {
 let maxPoints = -1;
 let selectedNumber = -1;

 card.rows.forEach((row, rowIndex) => {
  row.forEach((cell, cellIndex) => {
   if (!cell.selected && cell.point > maxPoints) {
    maxPoints = cell.point;
    selectedNumber = cell.number;
   }
  });
 });

 return selectedNumber !== -1 ? selectedNumber : getRandomUnselectedNumber(card);
}

function getRandomUnselectedNumber(card: BingoCard): number {
 const unselectedNumbers: number[] = [];

 card.rows.forEach((row) => {
  row.forEach((cell) => {
   if (!cell.selected) {
    unselectedNumbers.push(cell.number);
   }
  });
 });

 if (unselectedNumbers.length === 0) {
  throw new Error('All numbers have been selected');
 }

 const randomIndex = Math.floor(Math.random() * unselectedNumbers.length);
 return unselectedNumbers[randomIndex];
}

// apiHandler.ts
export function handleBingoApiCall(
 game: GameType,
 method: 'GET' | 'POST' | 'PUT' | 'DELETE',
 body?: ApiCallBody
): ApiCallReturnType {
 let message = '';
 let data: any = null;

 switch (method) {
  case 'DELETE':
   if (body?.reset) {
    game.bingoCard = generateBingoCard();
    message = 'Bingo card has been reset';
    data = game.bingoCard;
   }
   break;

  case 'PUT':
   if (body?.buttonState) {
    game.buttonState = body.buttonState;
    message = 'Button state has been updated';
   }
   break;

  default:
   if (!game.bingoCard) {
    game.bingoCard = generateBingoCard();
    message = 'Bingo card has been created';
    data = game.bingoCard;
   }
   break;
 }

 return {
  status: 'success',
  game,
  message,
  data
 };
}
