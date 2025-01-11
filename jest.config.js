// jest.config.js
const path = require('path');
const { pathsToModuleNameMapper } = require('ts-jest'); // ts-jestから直接インポート
const { compilerOptions } = require('./tsconfig.json'); // tsconfig.jsonを読み込み

module.exports = {
 preset: 'ts-jest', // TypeScriptサポート
 testEnvironment: 'node', // Node.js環境
 testPathIgnorePatterns: ['/node_modules/', '/dist/'], // テスト対象外のパス
 rootDir: path.resolve(__dirname), // プロジェクトのルート
 moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }), // tsconfig.jsonのpathsを反映
 moduleFileExtensions: ['ts', 'js', 'json'], // 解決可能なファイル拡張子
 // TypeScriptファイルをトランスパイル
 transform: {
  '^.+\\.tsx?$': [
   'ts-jest',
   {
    tsconfig: 'tsconfig.json'
   }
  ]
 },
 modulePaths: [path.resolve('./src')] // モジュールパス
};
