// src/Modules/core/InitDataLoader.js
import {
 OmikenType,
 CharaType,
 PluginStoreType,
 GameType,
 VisitType,
 TimeConfigType,
 PluginAllType,
 ScriptsType
} from '@type';
import { SETTINGS } from '@/Modules/settings';
import { systemMessage } from '@core/ErrorHandler';
import ElectronStore from 'electron-store';
import fs from 'fs';
import path from 'path';

export class InitDataLoader {
 private store: any; // ElectronStore<StoreType> にするとエラーが出るためany

 constructor(store: ElectronStore<PluginStoreType>) {
  this.store = store;
 }

 // Omiken/presetデータ読み込み
 load(): Partial<PluginAllType> {
  try {
   return {
    store: this.store,
    Omiken: this.store.get('Omiken', {}) as OmikenType,
    Presets: this.loadDirectoryContents<OmikenType>('Presets', 'json'),
    Charas: this.loadDirectoryContents<CharaType>('Charas', 'json'),
    Scripts: this.loadDirectoryContents<ScriptsType>(SETTINGS.ScriptsRoot, 'js'),
    Visits: this.store.get('Visits', {}) as Record<string, VisitType>,
    Games: this.initializeGames(),
    TimeConfig: this.initializeTimeConfig()
   };
  } catch (e) {
   systemMessage('error', `プラグインデータの読み込み中にエラーが発生`, e);
   throw new Error();
  }
 }

 // Presets/Charas/Scripts読み込み
 private loadDirectoryContents<T>(dirPath: string, extension: 'json' | 'js'): Record<string, T> {
  const result: Record<string, T> = {};
  const fullPath = extension === 'js' ? dirPath : path.join(SETTINGS.dataRoot, dirPath);

  try {
   const files = fs.readdirSync(fullPath).filter((file) => file.endsWith(`.${extension}`));
   files.forEach((file) => {
    const key = file.replace(`.${extension}`, '');
    const filePath = path.join(fullPath, file);

    try {
     result[key] = extension === 'json' ? readJsonFile<T>(filePath) : require(filePath).default || require(filePath);
    } catch (e) {
     systemMessage('error', `ファイルの読み込みに失敗: ${filePath}`, e);
     throw new Error(`ファイルの読み込みに失敗: ${filePath}`);
    }
   });
  } catch (e) {
   systemMessage('error', `ディレクトリの読み取りに失敗: ${fullPath}`, e);
   throw new Error(`ディレクトリの読み取りに失敗: ${fullPath}`);
  }

  return result;
 }

 // Gamesのすべてのdrawsを初期化する
 private initializeGames(): Record<string, GameType> {
  const Games = (this.store.get('Games', {}) ?? {}) as Record<string, GameType>;
  // 初期化
  const newGames = Object.fromEntries(
   Object.entries(Games).map(([key, game]) => [
    key,
    {
     ...game,
     draws: 0,
     userStats: game.userStats
      ? Object.fromEntries(
         Object.entries(game.userStats).map(([userId, userStat]) => [
          userId,
          {
           ...userStat,
           draws: 0,
           wins: userStat?.wins != null ? 0 : undefined,
           points: userStat?.points != null ? 0 : undefined,
           status: userStat?.status != null ? '' : undefined
          }
         ])
        )
      : {}
    }
   ])
  );

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
   meta: {
    initFollowers: 0,
    maxLikes: 0,
    maxViewers: 0
   }
  };
 }
}

// JSONファイルを読む
function readJsonFile<T>(filePath: string): T | null {
 try {
  if (!fs.existsSync(filePath)) {
   systemMessage('error', `ファイルが見つかりません: ${filePath}`);
   return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const parsedData = JSON.parse(fileContent) as T;

  if (!parsedData) {
   systemMessage('error', `無効なデータ: ${filePath}`);
  }

  return parsedData;
 } catch (error) {
  systemMessage('error', `ファイル読み込みエラー: ${filePath}`, error);
  return null;
 }
}
