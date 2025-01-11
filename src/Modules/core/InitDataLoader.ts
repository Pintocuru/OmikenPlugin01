// src/Modules/core/InitDataLoader.js
import {
 OmikenType,
 RulesType,
 CharaType,
 StoreType,
 GameType,
 TypesType,
 VisitType,
 TimeConfigType,
 OmikujiSelectType,
 StoreAllType,
 ScriptsType
} from '@type';
import { configs } from '@/config';
import { systemMessage } from '@core/ErrorHandler';
import { getServices } from '@tasks/PostOmikuji';
import { OmikujiSelector, OmikujiSelectorTimer } from '@tasks/OmikujiSelector';
import { OmikujiProcessor } from '@tasks/OmikujiProcess';
import ElectronStore from 'electron-store';
import fs from 'fs';
import path from 'path';

export class InitDataLoader {
 private store: any; // ElectronStore<StoreType> にするとエラーが出るためanyにしています。
 private jsonReader: JsonFileReader;

 constructor(store: ElectronStore<StoreType>) {
  this.store = store;
  this.jsonReader = new JsonFileReader();
 }

 // Omiken/presetデータ読み込み
 loadPluginData(): Omit<StoreAllType, 'filterCommentProcess'> {
  try {
   // TODO 後でdefault値を入れたいかも
   const Omiken = this.store.get('Omiken', {}) as OmikenType;

   return {
    store: this.store,
    Omiken,
    OmikenTypesArray: filterTypes(Omiken.types, Omiken.rules),
    Presets: this.loadDirectoryContents<OmikenType>('Presets', 'json'),
    Charas: this.loadDirectoryContents<CharaType>('Charas', 'json'),
    Scripts: this.loadDirectoryContents<ScriptsType>(configs.ScriptsRoot, 'js'),
    Visits: this.store.get('Visits', {}) as Record<string, VisitType>,
    Games: this.initializeGames(),
    TimeConfig: this.initializeTimeConfig(),
    timerSelector: OmikujiSelector.create('timer') as OmikujiSelectorTimer
   };
  } catch (error) {
   systemMessage('error', `プラグインデータの読み込み中にエラーが発生`, error);
  }
 }

 // Scriptsにある関数を読み込み
 private loadDirectoryContents<T>(dirPath: string, extension: 'json' | 'js'): Record<string, T> {
  const result: Record<string, T> = {};
  const fullPath = extension === 'js' ? dirPath : path.join(configs.dataRoot, dirPath);

  try {
   fs
    .readdirSync(fullPath)
    .filter((file) => file.endsWith(`.${extension}`))
    .forEach((file) => {
     const key = file.replace(`.${extension}`, '');
     const filePath = path.join(fullPath, file);

     try {
      result[key] =
       extension === 'json' ? this.jsonReader.read<T>(filePath) : require(filePath).default || require(filePath);
     } catch (err) {
      systemMessage('error', `ファイルの読み込みに失敗: ${filePath}`, err);
     }
    });
  } catch (err) {
   systemMessage('error', `ディレクトリの読み取りに失敗: ${fullPath}`, err);
  }
  return result;
 }

 // Gamesのすべてのdrawsを初期化する
 private initializeGames(): Record<string, GameType> {
  const Games = this.store.get('Games', {}) as Record<string, GameType>;
  // 初期化
  const resetStats = { draws: 0, wins: 0, points: 0, status: '' };

  const newGames = Object.fromEntries(
   Object.entries(Games).map(([key, game]) => [
    key,
    {
     ...game,
     ...resetStats,
     userStats: Object.fromEntries(
      Object.entries(game.userStats).map(([userId, userStat]) => [userId, { ...userStat, ...resetStats }])
     )
    }
   ])
  );

  // storeに格納
  this.store.set('Games', newGames);
  return newGames;
 }

 // TimeConfigを初期化する
 private initializeTimeConfig(): TimeConfigType {
  return { pluginTime: Date.now(), lc: 0, lastTime: 0, lastUserId: '' };
 }
}

interface FileReader<T> {
 read(filePath: string): T | null;
}

// JSONファイルを読む
class JsonFileReader implements FileReader<unknown> {
 constructor() {}

 read<T>(filePath: string): T | null {
  try {
   if (!fs.existsSync(filePath)) {
    systemMessage('error', `ファイルが見つかりません: ${filePath}`);
   }

   const fileContent = fs.readFileSync(filePath, 'utf-8');
   const parsedData = JSON.parse(fileContent) as T;

   if (!parsedData) {
    systemMessage('error', `無効なデータ: ${filePath}`);
   }

   return parsedData;
  } catch (error) {
   systemMessage('error', `ファイル読み込みエラー: ${filePath}`, error);
  }
 }
}

// rulesを配列にする
export function filterTypes(types: Record<TypesType, string[]>, rules: Record<string, RulesType>) {
 return Object.keys(types).reduce((result, typeKey) => {
  result[typeKey] = types[typeKey].map((id: string) => rules[id]).filter((rule) => rule !== undefined);
  return result;
 }, {} as Record<TypesType, RulesType[]>);
}

// timerのセットアップ
export async function timerSetup(StoreAll: StoreAllType) {
 // timerが空の場合、処理を終了
 if (StoreAll.OmikenTypesArray?.timer.length === 0) return;

 // timerのセットアップ
 StoreAll.timerSelector.setupTimers(
  StoreAll.OmikenTypesArray.timer,
  StoreAll.Omiken.omikujis,
  async (result: OmikujiSelectType) => {
   await new OmikujiProcessor(StoreAll, result).process();
  }
 );
}

// データが取得できるまで待つ関数
export async function startReadyCheck() {
 const CONFIG = {
  INITIAL_INTERVAL: 1000, // 最初の1秒間隔
  EXTENDED_INTERVAL: 15000, // 15秒間隔
  THRESHOLD_TIME: 10000, // 10秒間は1秒間隔で再チェック
  API_ENDPOINT: 'http://localhost:11180/api'
 };
 const startTime = Date.now();

 while (true) {
  try {
   const dataArray = await getServices(CONFIG.API_ENDPOINT);
   if (dataArray?.length > 0) {
    console.info('Data is ready.');
    break;
   }
  } catch (error) {
   console.log('API not ready yet:', error);
  }

  const elapsedTime = Date.now() - startTime;
  const interval = elapsedTime >= CONFIG.THRESHOLD_TIME ? CONFIG.EXTENDED_INTERVAL : CONFIG.INITIAL_INTERVAL;

  // 指定された間隔で再チェック
  await new Promise((resolve) => setTimeout(resolve, interval));
 }
}
