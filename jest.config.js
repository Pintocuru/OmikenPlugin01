// jest.config.js
const path = require('path');

module.exports = {
 preset: 'ts-jest', // TypeScriptサポート
 testEnvironment: 'node', // Node.js環境
 testPathIgnorePatterns: ['/node_modules/', '/dist/'], // テスト対象外のパス
 rootDir: path.resolve(__dirname), // プロジェクトのルート
 moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1', // 他のパスエイリアス
  '^@type$': '<rootDir>/src/Modules/type.ts' // 型定義ファイルのエイリアス
 },
 moduleFileExtensions: ['ts', 'js', 'json'], // 解決可能なファイル拡張子
 transform: {
  '^.+\\.tsx?$': [
   'ts-jest',
   {
    tsconfig: 'tsconfig.json'
   }
  ]
 }, // TypeScriptファイルをトランスパイル
 modulePaths: [path.resolve('./src')] // モジュールパス
};
