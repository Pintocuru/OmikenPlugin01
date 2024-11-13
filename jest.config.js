// jest.config.js
module.exports = {
  preset: 'ts-jest',  // TypeScriptのサポートを追加
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'], // テスト対象外のパス
};
