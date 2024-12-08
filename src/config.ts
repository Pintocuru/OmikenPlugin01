// src/config.ts

interface Configs {
  scriptRoot: string;
  dataRoot: string;
  isCreateService: boolean;
  basicDelaySeconds: number;
  botUserId: string;
  PLUGIN_UID:string;
}

// 環境変数 NODE_ENV=development を設定していれば開発、そうでないなら本番
process.env.NODE_ENV = process.env.NODE_ENV || "production";
const isProduction = process.env.NODE_ENV === "development";

// 設定オブジェクト
export const configs: Configs = {
  scriptRoot: __dirname + "/", // scriptのディレクトリ
  dataRoot: isProduction // dataのディレクトリ
    ? __dirname + "../../data" // 開発環境用
    : __dirname + "/", // 本番環境用
  isCreateService: true, // わんコメに自動で枠を作成してもいいか
  basicDelaySeconds: 1, // わんコメに投稿する際の基本遅延
  botUserId: "FirstCounter", // このプラグインが投稿するuserId
  PLUGIN_UID: "OmikenPlugin01", // プラグイン固有の一意のID
};
