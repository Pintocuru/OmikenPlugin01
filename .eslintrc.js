module.exports = {
 root: true, // プロジェクトのルート設定を指定（親ディレクトリの設定を無視）
 env: {
  node: true, // Node.js環境をサポート
  browser: true, // ブラウザ環境をサポート
  es2021: true // ECMAScript 2021（ES12）構文を使用
 },
 extends: [
  'plugin:vue/vue3-essential', // Vue 3の基本的なコードスタイル
  'eslint:recommended', // ESLintの推奨ルール
  '@vue/typescript/recommended', // VueとTypeScriptの推奨ルール
  'plugin:prettier/recommended' // Prettierの推奨ルール（コードの整形）
 ],
 parserOptions: {
  ecmaVersion: 2021, // ECMAScript 2021の構文を使用
  parser: '@typescript-eslint/parser', // TypeScriptコードを解析するパーサを指定
  sourceType: 'module' // モジュール（ES6以降のimport/export）構文を使用
 },
 plugins: [
  'vue', // Vue.jsのESLintプラグイン
  '@typescript-eslint', // TypeScript用のESLintプラグイン
  'prettier' // Prettier用のESLintプラグイン（コードフォーマット）
 ],
 rules: {
  'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // 本番環境でのみconsole使用を警告
  'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // 本番環境でのみdebugger使用を警告
  'vue/multi-word-component-names': 'off', // Vueコンポーネント名に複数単語を要求しない
  '@typescript-eslint/no-explicit-any': 'off' // any型の使用を許可（TypeScript）
 }
}
