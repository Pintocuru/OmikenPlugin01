// src/Modules/api/ApiRequest.ts
import {
 AddonModeParams,
 DataType,
 Mode,
 OmikenType,
 ParamsType,
 PluginApiType,
 PluginStoreType,
 RequestResult
} from '@type';
import { filterTypes } from '@core/InitDataLoader';
import { systemMessage } from '@core/ErrorHandler';
import { PluginRequest, PluginResponse } from '@onecomme.com/onesdk/types/Plugin';

export class RequestHandler {
 constructor(private readonly responseMap: PluginApiType) {}

 // リクエストの実行
 async request(req: PluginRequest): Promise<RequestResult> {
  try {
   const { params, body } = req;
   const typedParams = params as unknown as ParamsType;

   switch (typedParams.mode) {
    // Ping
    case Mode.Ping:
     return { response: this.handlePing() };
    // 各データ取得
    case Mode.Data:
     return { response: this.handleSingleData(typedParams) };
    // すべてのデータ取得(エディター用)
    case Mode.AllData:
     return { response: this.handleAllData() };
    // おみくじデータの永続化(エディター用)
    case Mode.Store:
     return this.updateOmikenData(typedParams, body.data);
    // バックアップ(未実装)
    case Mode.Backup:
     return { response: this.createResponse(501, 'バックアップの取得は未実装') };
    // アドオン
    case Mode.Addon:
     return this.handleAddonRequest(typedParams, body.data);
    default:
     return { response: this.createResponse(400, '無効なモード') };
   }
  } catch (e) {
   systemMessage('warn', 'リクエスト処理中にエラーが発生:', e);
   return { response: this.createResponse(500, 'データ処理中にエラーが発生しました') };
  }
 }

 // 接続確認
 private handlePing(): PluginResponse {
  return this.createResponse(
   200,
   JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString()
   })
  );
 }

 // 個別データの取得
 private handleSingleData(params: ParamsType): PluginResponse {
  if (params.mode !== Mode.Data) return this.createResponse(400, 'モードが異なるため取得できません');
  if (!params.type) return this.createResponse(400, 'タイプパラメータが必要です');

  const data = this.responseMap[params.type];
  return data ? this.createResponse(200, JSON.stringify(data)) : this.createResponse(400, '無効なタイプ');
 }

 // 一括でのデータ取得処理
 private handleAllData(): PluginResponse {
  const allData = Object.fromEntries(Object.values(DataType).map((type) => [type, this.responseMap[type]]));

  return Object.values(allData).some((data) => data == null)
   ? this.createResponse(500, '一部データの取得に失敗しました')
   : this.createResponse(200, JSON.stringify(allData));
 }

 // おみくじデータの更新
 private async updateOmikenData(params: ParamsType, newOmiken: OmikenType): Promise<RequestResult> {
  if (params.type !== DataType.Omiken) {
   return { response: this.createResponse(400, '永続化できる現在のタイプはOmikenのみです') };
  }
  try {
   this.responseMap.store.set('Omiken', newOmiken);
   Object.assign(this.responseMap, {
    Omiken: newOmiken,
    OmikenTypesArray: filterTypes(newOmiken.types, newOmiken.rules)
   });
   return {
    response: this.createResponse(200, 'ファイルが正常に保存されました'),
    data: this.responseMap
   };
  } catch (error) {
   console.error('エラー:', error);
   return { response: this.createResponse(400, 'データ処理中にエラーが発生しました') };
  }
 }

 // アドオンにAPIを渡す
 private async handleAddonRequest(params: AddonModeParams, body: any): Promise<RequestResult> {
  const game = params.ruleId ? this.responseMap.Games[params.ruleId] : null;
  const script = this.responseMap.Scripts[params.scriptId];

  if (!script || !script.ApiCall) {
   return { response: this.createResponse(404, '指定された scriptId が見つかりません') };
  }

  try {
   const result = await script.ApiCall(game, params.method, body);

   // POST, PUT, DELETE メソッドの場合のみ responseMap を更新
   if (['POST', 'PUT', 'DELETE'].includes(params.method) && result.status === 'success') {
    // データの永続化（PluginStore への保存）
    if (result.data && this.responseMap.store) {
     // データが PluginStoreType に適合するか確認
     const storeData = result.data as Partial<PluginStoreType>;
     Object.entries(storeData).forEach(([key, value]) => {
      if (key in this.responseMap.store) {
       this.responseMap.store.set(key, value);
      }
     });
    }
   }

   return {
    response: this.createResponse(200, 'ファイルが正常に処理されました'),
    data: result.data
   };
  } catch (e) {
   return { response: this.createResponse(500, 'アドオン API 実行中にエラーが発生しました') };
  }
 }

 // 共通レスポンスの生成
 private createResponse(code: number, response: string): PluginResponse {
  return { code, response };
 }
}
