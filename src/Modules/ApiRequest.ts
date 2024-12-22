import { PluginRequest, PluginResponse } from '@onecomme.com/onesdk/types/Plugin';
import { ParamsType, StoreAllType } from '../types/';
import { configs } from '../config';
import { filterTypes } from './InitDataLoader';
import path from 'path';
import fs from 'fs/promises';

export class RequestHandler {
 private responseMap: StoreAllType;

 constructor(services: StoreAllType) {
  this.responseMap = services;
 }

 // リクエストの実行
 async handleRequest(req: PluginRequest): Promise<{
  response: PluginResponse;
  data?: StoreAllType;
 }> {
  const { method, params, body } = req;

  try {
   switch (method) {
    case 'GET':
     return { response: this.handleGet(params as unknown as ParamsType) };
    case 'POST':
     return this.handlePost(params, body);
    default:
     return {
      response: this.responseError(404, 'サポートされていないメソッド')
     };
   }
  } catch (error) {
   console.error('リクエスト処理中にエラーが発生:', error);
   return {
    response: this.responseError(500, 'データ処理中にエラーが発生しました')
   };
  }
 }

 // GET リクエストの処理
 private handleGet(params: ParamsType): PluginResponse {
  if (params.mode === 'data') {
   if (!params.type) return this.responseError(400, 'タイプパラメータが必要です');

   // 読み込みのデータを返す
   const response = this.responseMap[params.type];
   return response ? this.responseSuccess(JSON.stringify(response)) : this.responseError(400, '無効なタイプ');
  }

  if (params.mode === 'backup') {
   return this.responseError(501, 'バックアップの取得は未実装');
  }

  return this.responseError(400, '無効なリクエストモード');
 }

 // POST リクエストの処理
 private async handlePost(
  params: PluginRequest['params'],
  body: string
 ): Promise<{
  response: PluginResponse;
  data?: StoreAllType;
 }> {
  if (params.mode === 'writing') {
   try {
    //Omiken.index.jsonに書き込み
    const data = JSON.parse(body);
    const holder = path.join(configs.dataRoot, 'Omiken');
    const filePath = path.join(holder, 'index.json');

    await fs.mkdir(holder, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`File saved at ${filePath}`);

    // TODO バックアップは実装されていません
    const backupService = new BackupService('Omiken');
    backupService.createBackup(data);

    // プラグインのデータも更新
    Object.assign(this.responseMap, {
     Omiken: data,
     OmikenTypesArray: filterTypes(data.types, data.rules)
    });

    return {
     response: this.responseSuccess('ファイルが正常に保存されました'),
     data: this.responseMap
    };
   } catch (error) {
    console.error('エラー:', error);
    return {
     response: this.responseError(400, 'データ処理中にエラーが発生しました')
    };
   }
  }

  return { response: this.responseError(400, '無効なタイプパラメータ') };
 }

 // 成功レスポンスの共通関数
 responseSuccess(data: string, code: number = 200): PluginResponse {
  return { code, response: data };
 }

 // エラーレスポンスの共通関数
 responseError(code: number, message: string): PluginResponse {
  return { code, response: message };
 }
}

// TODO バックアップは実装されていません
class BackupService {
 constructor(private type: string) {}

 createBackup(data: any) {
  console.info(`Backup created for type: ${this.type}`, data);
 }
}
