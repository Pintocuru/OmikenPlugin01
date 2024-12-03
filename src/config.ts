// src/config.ts

interface Configs {
  scriptRoot: string; // string 型
  dataRoot: string; // string 型
  isCreateService: boolean; // boolean 型
}

// 設定オブジェクト
export const configs: Configs = {
  scriptRoot: __dirname + "./", // string 型
  dataRoot: __dirname + "../../data", // string 型
  isCreateService: true, // boolean 型
};