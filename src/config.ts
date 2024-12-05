// src/config.ts

interface Configs {
  scriptRoot: string;
  dataRoot: string;
  isCreateService: boolean;
}

// 環境変数 NODE_ENV=development を設定していれば開発、そうでないなら本番
process.env.NODE_ENV = process.env.NODE_ENV || "production";
const isProduction = process.env.NODE_ENV === "development";

// 設定オブジェクト
export const configs: Configs = {
  scriptRoot: __dirname + "/", // string 型
  dataRoot: isProduction
    ? __dirname + "../../data" // 開発環境用
    : __dirname + "/", // 本番環境用
  isCreateService: true, // boolean 型
};
