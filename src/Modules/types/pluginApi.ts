// src/types/pluginApi.ts
import { PluginApiType } from './pluginType';
import { PluginResponse } from '@onecomme.com/onesdk/types/Plugin';

// APIの返り値の型定義
export type RequestResult = {
 response: PluginResponse;
 data?: Partial<PluginApiType>;
};

// パラメータの型定義
export type ParamsType =
 | PingModeParams
 | DataModeParams
 | AllDataModeParams
 | StoreModeParams
 | BackupModeParams
 | AddonModeParams;

// Ping用型定義
interface PingModeParams {
 method: 'GET';
 mode: Mode.Ping;
 type?: never;
}

// データ取得用型定義
interface DataModeParams {
 method: 'GET';
 mode: Mode.Data;
 type:
  | DataType.Omiken
  | DataType.Presets
  | DataType.Charas
  | DataType.Scripts
  | DataType.Visits
  | DataType.Games
  | DataType.EditorSettings;
}

// 一括でのデータ取得用型定義
interface AllDataModeParams {
 method: 'GET';
 mode: Mode.AllData;
 type?: never;
}

// ストア（永続化）用型定義
interface StoreModeParams {
 method: 'POST';
 mode: Mode.Store;
 type: DataType.Omiken | DataType.Visits | DataType.Games | DataType.EditorSettings;
}

// バックアップ用型定義
interface BackupModeParams {
 method: 'POST';
 mode: Mode.Backup;
 type: DataType.Omiken | DataType.Presets;
}

// アドオン用型定義
export interface AddonModeParams {
 method: 'GET' | 'POST' | 'PUT' | 'DELETE';
 mode: Mode.Addon;
 type: never;
 scriptId: string; // Scripts にある script.id を指定
 ruleId?: string; // Games にある rule.id を指定（省略可）
}

// モードを定義
export enum Mode {
 Ping = 'ping', // ping取得
 Data = 'data', // 各種データ取得
 AllData = 'allData', // すべてのデータ取得(エディター用)
 Store = 'store', // おみくじデータの永続化(エディター用)
 Backup = 'backup', // バックアップ(エディター用)
 Addon = 'addon' // アドオン用
}

// データの種類を定義
export enum DataType {
 Omiken = 'Omiken', // おみくじデータ
 Presets = 'Presets', // preset(おみくじデータ)
 Charas = 'Charas', // キャラデータ
 Scripts = 'Scripts', // スクリプト
 Visits = 'Visits', // 個人データ
 Games = 'Games', // スクリプトデータ
 EditorSettings = 'EditorSettings' // エディター用設定データ
}
