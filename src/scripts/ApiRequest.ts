import {
  PluginRequest,
  PluginResponse,
} from "@onecomme.com/onesdk/types/Plugin";
import { configs } from "../config";
import path from "path";
import { StoreAllType } from "../types/";
import { filterTypes } from "./InitDataLoader";
import fs from "fs/promises";

export class RequestHandler {
  private responseMap: StoreAllType;

  constructor(private services: StoreAllType) {
    this.responseMap = services;
  }

  // エラーレスポンスの共通関数
  responseError(code: number, message: string): PluginResponse {
    return { code, response: message };
  }

  // 成功レスポンスの共通関数
  responseSuccess(data: string, code: number = 200): PluginResponse {
    return { code, response: data };
  }

  // リクエストの実行
  async handleRequest(req: PluginRequest): Promise<{
    response: PluginResponse;
    data?: StoreAllType;
  }> {
    const { method, params, body } = req;

    try {
      switch (method) {
        case "GET":
          return { response: this.handleGet(params) };
        case "POST":
          return this.handlePost(params, body);
        default:
          return {
            response: this.responseError(404, "サポートされていないメソッド"),
          };
      }
    } catch (error) {
      console.error("リクエスト処理中にエラーが発生:", error);
      return {
        response: this.responseError(500, "データ処理中にエラーが発生しました"),
      };
    }
  }

  // GET リクエストの処理
  private handleGet(params: PluginRequest["params"]): PluginResponse {
    if (params.mode === "data") {
      if (!params.type) {
        return this.responseError(400, "タイプパラメータが必要です");
      }

      const response = this.responseMap[params.type];
      return response
        ? this.responseSuccess(response)
        : this.responseError(400, "無効なタイプ");
    }

    if (params.mode === "backup") {
      return this.responseError(501, "バックアップの取得は未実装");
    }

    return this.responseError(400, "無効なリクエストモード");
  }

  // POST リクエストの処理
  private async handlePost(
    params: PluginRequest["params"],
    body: string
  ): Promise<{
    response: PluginResponse;
    data?: StoreAllType;
  }> {
    if (params.mode === "writing") {
      try {
        const data = JSON.parse(body);
        const horuda = path.join(configs.dataRoot, "Omiken");
        const filePath = path.join(horuda, "index.json");

        await fs.mkdir(horuda, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(`File saved at ${filePath}`);

        // バックアップは実装されていません
        const backupService = new BackupService("Omiken");
        await backupService.createBackup(data);

        Object.assign(this.services, {
          Omiken: data,
          OmikenTypesArray: filterTypes(data.types, data.rules),
        });

        return {
          response: this.responseSuccess("ファイルが正常に保存されました"),
          data: this.services,
        };
      } catch (error) {
        console.error("エラー:", error);
        return {
          response: this.responseError(
            400,
            "データ処理中にエラーが発生しました"
          ),
        };
      }
    }

    return { response: this.responseError(400, "無効なタイプパラメータ") };
  }
}

class BackupService {
  constructor(private type: string) {}

  createBackup(data: any) {
    console.log(`Backup created for type: ${this.type}`, data);
  }
}
