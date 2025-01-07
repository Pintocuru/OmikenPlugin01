import { PluginRequest, PluginResponse } from '@onecomme.com/onesdk/types/Plugin';
import { DataType, Mode, ParamsType, StoreApiType } from '@type';
import { configs } from '@/config';
import { filterTypes } from './InitDataLoader';
import path from 'path';
import fs from 'fs/promises';
import { systemMessage } from './ErrorHandler';

export class RequestHandler {
 private responseMap: StoreApiType;

 constructor(services: StoreApiType) {
  this.responseMap = services;
 }

 // リクエストの実行
 async handleRequest(req: PluginRequest): Promise<{
  response: PluginResponse;
  data?: StoreApiType;
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
   systemMessage('warn', 'リクエスト処理中にエラーが発生:', error);
   return {
    response: this.responseError(500, 'データ処理中にエラーが発生しました')
   };
  }
 }

 // GET リクエストの処理
 private handleGet(params: ParamsType): PluginResponse {
  // 接続確認
  if (params.mode === Mode.Ping) {
   return this.responseSuccess(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  }

  // 一括でのデータ取得処理
  if (params.mode === Mode.AllData) {
   // すべてのデータを一括で取得する
   const allData = {
    Omiken: this.responseMap[DataType.Omiken],
    Presets: this.responseMap[DataType.Presets],
    Charas: this.responseMap[DataType.Charas],
    Scripts: this.responseMap[DataType.Scripts],
    Visits: this.responseMap[DataType.Visits],
    Games: this.responseMap[DataType.Games]
   };

   // 必要に応じてエラーチェック
   if (Object.values(allData).some((data) => data == null)) {
    return this.responseError(500, '一部データの取得に失敗しました');
   }

   return this.responseSuccess(JSON.stringify(allData));
  }

  // 個別データの取得
  if (params.mode === Mode.Data) {
   if (!params.type) return this.responseError(400, 'タイプパラメータが必要です');

   // 読み込みのデータを返す
   const response = this.responseMap[params.type];
   return response ? this.responseSuccess(JSON.stringify(response)) : this.responseError(400, '無効なタイプ');
  }

  // エディターからバックアップの取得
  if (params.mode === Mode.Backup) {
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
  data?: StoreApiType;
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
