# OmikenPlugin for わんコメ

最終更新日: 2025/01/24

## 概要

- 「おみくじ BOT プラグイン OmikenPlugin for わんコメ」は、コメントアプリ「わんコメ」で使用可能なプラグインです。
- 配信者とリスナー間のインタラクションを向上させ、楽しい配信をサポートします。
- 1000 通り以上のバリエーションのおみくじを作成できる機能を提供しています。
- 約 1 年の開発期間を経て作成されました。

## インストール方法

1. このリポジトリをクローンします

   ```bash
   git clone https://github.com/Pintocuru/OmikenPlugin01.git
   ```

2. 必要な依存関係をインストールします

```bash
 npm install
```

## ビルド手順

### テスト方法

このプラグインは、わんコメで動作するため、テストは Jest を使用してください。

### 本番ビルド

Vite を使って本番用ビルドを行います。
生成物の名称は「plugin.js」です。CommonJS で生成する必要があります。
プラグインの詳細は プラグイン<https://onecomme.com/docs/developer/plugin> をご覧ください。

## 必要な依存関係

- Node.js (バージョン 14 以上を推奨)
- npm または yarn
- TypeScript (ビルドに使用)
- Vite (ビルドツールとして使用)

## スクリプトの説明

- build:vite: Vite を使用してビルド
- test:plugin: Jest を使用してテストを実行

## 使用している依存関係

### 本番依存関係

- **@onecomme.com/onesdk**: わんコメで使用される型定義群
- **@rollup/plugin-commonjs**: CommonJS モジュールのサポート
- **@rollup/plugin-node-resolve**: Node.js モジュールの解決

### 開発依存関係

- **vite**: ビルドツール
- **electron-store**: 設定の保存に使用するため、型定義として導入しています
- **jest**: ユニットテストのフレームワーク
- **ts-jest**: TypeScript で Jest を使用するためのパッケージ
- **typescript**: TypeScript コンパイラ
- **tsc-alias**: TypeScript のエイリアスを解決

## ライセンス

このプラグインは、[Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0) の下で提供されています。ソフトウェアを使用、改変、再配布する場合は、[わんコメの利用規約](https://onecomme.com/terms)に加え、ライセンスの条件に従う必要があります。

詳細は、リポジトリ内の `LICENSE` ファイルをご確認ください。

また、本ソフトウェアには、MIT ライセンスの下で配布されているコンポーネントが含まれています。詳細については、`LICENSE-MIT` ファイルをご覧ください。

## バージョン情報

### v0.2.0 (2025/01/24)

外部スクリプトをプロジェクトから分離。

### v0.1.0 (2025/01/24)

初期バージョンのリリース
