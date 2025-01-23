// vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default defineConfig({
 resolve: {
  alias: {
   '@': path.resolve(__dirname, 'src'),
   '@core': path.resolve(__dirname, 'src/Modules/core'),
   '@tasks': path.resolve(__dirname, 'src/Modules/tasks'),
   '@api': path.resolve(__dirname, 'src/Modules/api'),
   '@components': path.resolve(__dirname, 'src/Modules/components'),
   '@type': path.resolve(__dirname, 'src/Modules/type.ts')
  },
  mainFields: ['module', 'main', 'browser']
 },
 build: {
  minify: true, // 圧縮するか
  target: 'node16', // Node.jsのターゲットを指定
  outDir: 'dist', // 出力ディレクトリ
  lib: {
   entry: './src/plugin.ts', // エントリーファイル
   fileName: () => 'plugin.js', // 出力ファイル名
   formats: ['cjs'] // CommonJS形式
  },
  rollupOptions: {
   plugins: [
    resolve({
     preferBuiltins: true // Node.jsの組み込みモジュールを優先
    }),
    commonjs({
     transformMixedEsModules: true // ES/CommonJSの混在を許可
    })
   ],
   external: ['crypto', 'fs', 'path'], // Node.jsの組み込みモジュールを外部化
   output: {
    entryFileNames: 'plugin.js', // 出力ファイル名
    format: 'cjs', // CommonJS形式
    globals: {
     axios: 'axios' // `axios` をグローバルに定義
    }
   }
  }
 },
 esbuild: {
  target: 'node16',
  platform: 'node', // Node.js向けに最適化
  keepNames: false, // 変数名をそのままにするか
  sourcemap: false // ソースマップ
 }
});
