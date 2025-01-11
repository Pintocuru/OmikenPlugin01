// src/config.ts

// プラグインID
// フォルダ名とこの名前は、必ず合わせてください
const PLUGIN_UID = 'OmikenPlugin01';

// わんコメに自動で枠を作成してもいいか
// falseにした場合、新しく枠が作成されなくなります。
const isCreateService = true;

// わんコメに投稿する際の基本遅延(秒)
const basicDelaySeconds = 1;

// 設定ここまで
//----------------------------------------------------------------

interface Configs {
 imgRoot: string;
 dataRoot: string;
 ScriptsRoot: string;
 isCreateService: boolean;
 BASE_URL: string;
 basicDelaySeconds: number;
 botUserId: string;
 PLUGIN_UID: string;
}

// 環境変数 NODE_ENV=development を設定していれば開発、そうでないなら本番
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const isProduction = process.env.NODE_ENV === 'development';

// 設定オブジェクト
export const configs: Configs = {
 imgRoot: isProduction // dataのディレクトリ
  ? 'data/Charas' // 開発環境用
  : `../../../plugins/${PLUGIN_UID}/Charas`, // 本番環境用
 dataRoot: isProduction // dataのディレクトリ
  ? __dirname + '../../data' // 開発環境用
  : __dirname + '/', // 本番環境用
 ScriptsRoot: isProduction // gameのディレクトリ
  ? __dirname + '../../dist/Scripts' // 開発環境用
  : __dirname + '/Scripts', // 本番環境用
 isCreateService, // わんコメに自動で枠を作成してもいいか
 BASE_URL: 'http://localhost:11180/api', // わんコメのapi
 basicDelaySeconds, // わんコメに投稿する際の基本遅延
 botUserId: 'FirstCounter', // このプラグインが投稿するuserId
 PLUGIN_UID // プラグイン固有の一意のID
};
