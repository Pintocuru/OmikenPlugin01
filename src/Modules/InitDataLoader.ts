// src/Modules/InitDataLoader.js
import {
 OmikenType,
 RulesType,
 CharaType,
 StoreType,
 GameType,
 TypesType,
 ScriptsParamType,
 VisitType,
 TimeConfigType,
 OmikujiSelectType,
 StoreAllType
} from '@type';;
import { configs } from '@/config';
import { getServices, postErrorMessage } from './PostOmikuji';
import { OmikujiSelectorFactory, TimerBasedSelector } from './TaskOmikujiSelect';
import { OmikujiProcessor } from './TaskOmikujiProcess';
import ElectronStore from 'electron-store';
import fs from 'fs';
import path from 'path';

export class InitDataLoader {
 private store: any; // ElectronStore<StoreType> にするとエラーが出るためanyにしています。
 private errorHandler: ErrorHandler;
 private jsonReader: JsonFileReader;
 private timerSelector: TimerBasedSelector;

 constructor(store: ElectronStore<StoreType>) {
  this.store = store;
  this.errorHandler = new ErrorHandler();
  this.jsonReader = new JsonFileReader(this.errorHandler);
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
    Scripts: this.loadDirectoryContents<ScriptsParamType>(configs.ScriptsRoot, 'js'),
    Visits: this.store.get('Visits', {}) as Record<string, VisitType>,
    Games: this.initializeGames(),
    TimeConfig: this.initializeTimeConfig(),
    timerSelector: OmikujiSelectorFactory.create('timer') as TimerBasedSelector
   };
  } catch (error) {
   this.errorHandler.handle('プラグインデータの読み込み中にエラーが発生', error);
  }
 }

 // Scriptsにある関数を読み込み
 private loadDirectoryContents<T>(dirPath: string, extension: 'json' | 'js'): Record<string, T> {
  const result: Record<string, T> = {};
  const fullPath = extension === 'js' ? dirPath : path.join(configs.dataRoot, dirPath);

  try {
   const files = fs.readdirSync(fullPath);

   for (const file of files) {
    // 指定された拡張子のみ対象
    if (!file.endsWith(`.${extension}`)) continue;
    const key = file.replace(new RegExp(`\\.${extension}$`), '');
    const filePath = path.join(fullPath, file);

    try {
     if (extension === 'json') {
      const data = this.jsonReader.read<T>(filePath);
      if (data) result[key] = data;
     } else if (extension === 'js') {
      const module = require(filePath);
      if (module?.[key]) result[key] = module[key];
     }
    } catch (err) {
     this.errorHandler.handle(`ファイルの読み込みに失敗: ${filePath}`, err);
    }
   }
  } catch (err) {
   this.errorHandler.handle(`ディレクトリの読み取りに失敗: ${fullPath}`, err);
  }

  return result;
 }

 // Gamesのすべてのdrawsを初期化する
 private initializeGames(): Record<string, GameType> {
  const Games = this.store.get('Games', {}) as Record<string, GameType>;
  // 初期化
  const newGames = Object.fromEntries(Object.entries(Games).map(([key, game]) => [key, { ...game, draws: 0 }]));
  // storeに格納
  this.store.set('Games', newGames);
  return newGames;
 }

 // TimeConfigを初期化する
 private initializeTimeConfig(): TimeConfigType {
  return {
   pluginTime: Date.now(),
   lc: 0,
   lastTime: 0,
   lastUserId: ''
  };
 }
}

interface FileReader<T> {
 read(filePath: string): T | null;
}

// JSONファイルを読む
class JsonFileReader implements FileReader<unknown> {
 constructor(private errorHandler: ErrorHandler) {}

 read<T>(filePath: string): T | null {
  try {
   if (!fs.existsSync(filePath)) {
    this.errorHandler.handle(`ファイルが見つかりません: ${filePath}`);
   }

   const fileContent = fs.readFileSync(filePath, 'utf-8');
   const parsedData = JSON.parse(fileContent) as T;

   if (!parsedData) {
    this.errorHandler.handle(`無効なデータ: ${filePath}`);
   }

   return parsedData;
  } catch (error) {
   this.errorHandler.handle(`ファイル読み込みエラー: ${filePath}`, error);
  }
 }
}

// エラー用メゾット(コンソールログとわんコメへの投稿)
class ErrorHandler {
 handle(message: string, error?: unknown): never {
  const errorMessage = `${message}${error ? `: ${String(error)}` : ''}`;
  console.error(errorMessage);
  postErrorMessage(message);
  throw new Error(errorMessage);
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
   const processor = new OmikujiProcessor(StoreAll, result);
   await processor.process();
  }
 );
}

// データが取得できるまで待つ関数
export async function startReadyCheck() {
  const checkInterval = 1000; // 最初の1秒間隔
  const extendedInterval = 15000; // 15秒間隔
  const startTime = Date.now();

  while (true) {
    try {
      // APIエンドポイントをチェック
      const dataArray = await getServices('http://localhost:11180/api');

      if (dataArray && dataArray.length > 0) {
        // データが取得できたらループを抜ける
        console.log('Data is ready.');
        break;
      }
    } catch (error) {
      console.log('API not ready yet:', error);
    }

    // 10秒間は1秒間隔で再チェック
    const elapsedTime = Date.now() - startTime;
    const interval = elapsedTime >= 10000 ? extendedInterval : checkInterval;

    // 指定された間隔で再チェック
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}