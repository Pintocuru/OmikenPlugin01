---
title: 2025-02-11
date: 2025-02-11
tags: [ピンとくるノート]
aliases: []
---

# おみくじ BOT プラグイン 本体 技術仕様書

## 1. システム概要

### 1.1 製品概要

- 製品名: おみくじ BOT プラグイン（OmikenPlugin）
- 対象プラットフォーム: わんコメ 7.1.0 以上
- ライセンス要件: PRO 版・無料版共に利用可能

### 1.2 目的と課題解決

1. 配信のインタラクション向上
   - リスナー参加型のコンテンツ提供
   - 視聴者体験の向上
2. 運営効率化
   - 配信中イベントの自動化
   - ミニゲーム運営の省力化
3. コミュニティ活性化
   - リスナー間の交流促進
   - コメント投稿の動機付け

### 1.3 主要機能

1. おみくじ機能
   - ランダム抽選システム
   - カスタマイズ可能な結果表示
2. Visits 機能
   - ユーザーデータの永続化
   - 視覚的フィードバック
3. カスタムゲーム開発
   - JavaScript API の提供
   - 結果の保存・分析機能

## 2. システムアーキテクチャ

### 2.1 技術スタック

1. 開発言語
   - TypeScript 5.4.5
2. フレームワーク
   - なし
3. 開発環境
	- Node.js 16.0+
	- Vite 6.0.11
	- Jest 29.7.0
4. 依存関係
	- @onecomme.com/onesdk v5.2.3
	- @rollup/plugin-commonjs ^28.0.2
	- @rollup/plugin-node-resolve ^16.0.0
	- @types/electron-store ^3.2.2
	- @types/jest ^29.5.13
	- @types/node ^20.12.7
	- electron-store ^10.0.0
	- jest ^29.7.0
	- jest-module-name-mapper ^0.1.5
	- ts-jest ^29.2.5
	- ts-loader ^9.5.1
	- tsc-alias ^1.8.10
	- typescript ^5.4.5
	- vite ^6.0.11

## 4. 機能仕様

### 4.1 init: 初期化・データ読み込み

プラグイン起動時、下記のデータを読み込みます。また、読み込みの可否に関する投稿を行います。

- データストア管理 (PluginStoreType)
  `ElectronStore` を使用してファイルを保存し、おみくじデータ等を永続化します。
    - **`Omiken`**: おみくじデータ（`OmikenType`）
    - **`Visits`**: ユーザーデータ（`Record<string, VisitType>`）
    - **`Games`**: ゲームデータ（`Record<string, GameType>`）
- 各種データ読み込み (StoreMainType)
  BOT 処理で使用するもの。
    - store:`ElectronStore` インスタンス（不具合対応のため `any`）
    - **`OmikenTypesArray`**: `Omiken` データをタイプ別に分けたおみくじデータ群（`Record<TypesType, RulesType[]>`）
    - **`Charas`**: キャラクターデータ（`Record<string, CharaType>`）
    - **`Scripts`**: アドオンデータ（`Record<string, ScriptsType>`）
    - **`TimeConfig`**: プラグイン設定データ（`TimeConfigType`）
- **API との連携**(PluginApiType)
  `PluginApiType` を使って、外部の API と連携し、設定やデータのやり取りを行います。
	- **`Presets`**: おみくじプリセットデータ（`Record<string, OmikenType>`）
    - **`Charas`**: キャラクターデータ（`Record<string, CharaType>`）
    - **`Scripts`**: アドオンデータ（`Record<string, ScriptsType>`）
- **全体設定管理** (PluginAllType)
  全体の設定と機能を管理します。
	- **`Presets`**: おみくじプリセットデータ（`Record<string, OmikenType>`）
	- **`filterCommentProcess`**: コメント処理関数（`filterCommentProcess(comment: Comment, userData: UserNameData): Promise<void>`）
	- **`timerSelector`**: タイマー投稿用データ（`TimerSelectorType`）

### 4.2 filterComment: コメント購読

コメントを購読し、以下の処理を行います：

- BOT コメントの加工：自身（Bot）のプラグインの投稿を、プロパティに従い加工する
- おみくじ処理：下記の `filterCommentProcess` メソッドを用いておみくじ処理を行う
- パラメータの付与：`commentParamsPlus` メソッドを用いてパラメータを付与して返す

### 4.3 filterCommentProcess: おみくじ判定・BOT 投稿

おみくじ処理を以下の流れで行います：

- 有効期限チェック：コメントが 5 秒以上経過していればおみくじの対象外
- インスタンスの発行：`CommentBotProcessor` を用いてインスタンスを発行
- ユーザー情報の更新：`returnVisit` メソッドでユーザー情報を更新
- おみくじの処理：`CommentBotProcessor` の `process` メソッドでおみくじ処理を実行
- 結果の反映：結果をインスタンスに反映

### 4.4 TimerSelector: タイマー機能

自動投稿 (タイマー機能) を管理します

### 4.5 subscribe: 各種購読

下記の 4 つの情報を購読し、おみくじ処理を行います。

- meta : 配信のメタ情報
	- 配信中か
	- 配信名
	- 配信開始時間、配信枠でのギフト回数、配信枠でのギフト総額、フォロワー数、高評価数、閲覧数
- waitingList: 参加型管理
	- 参加表明時、参加辞退/キャンセル時、プレイ中の ON、完了時
- setList: セットリスト
	- 現在の曲情報変更時、リクエスト受付時、
	- 上記は予想 (間違ってたらごめん)
- reactions: リアクション
	- 押されたボタンの内容

### 4.6 request:API

RestAPI を利用した、外部からのリクエスト処理

- ping（接続確認）
	- GET のみ
- おみくじメーカー
	- PluginApiType の各データ読み込み (GET)
	- PluginStoreType の各データの永続化 (POST)
	- （新たなバンドルが必要）バックアップの読み込み
	- （新たなバンドルが必要）バックアップの書き出し
- アドオン
	- PluginApiType の各データ読み込み (GET)
	- PluginStoreType の GET/POST/PUT/DELETE

### 4.7 destroy: プラグイン終了時処理

プラグイン終了時、以下の内容を実行します

- タイマー機能の停止

## 5. データモデル

### 5.1 永続化データ

1. OmikenType
   - おみくじ設定
   - 結果パターン
2. VisitType
   - ユーザー情報
   - 訪問履歴
3. GameType
   - ゲーム設定
   - スコアデータ

### 5.2 実行時データ

1. TimeConfigType
   - コメントのタイミングの記録
2. CharaType
   - キャラクター画像のアドレス
   - テンプレートの名前・文字・背景色の設定

## 6. エラー処理

### 6.1 エラーパターン

1. システムエラー
   - API 通信エラー
   - 初期化エラー
2. ユーザーエラー
   - 入力値検証エラー
   - 権限エラー

### 6.2 エラーハンドリング

1. エラー表示
   - プラグイン: わんコメ投稿
   - エディター: トースト表示
2. ログ記録
   - デバッグログ
   - エラーログ

## 7. 開発ガイドライン

### 7.1 開発環境設定

1. 環境構築

```bash
npm install    # パッケージインストール
npm run build  # ビルド実行
npm start      # 開発サーバー起動
```

1. デバッグ環境

```bash
npm run dev    # 開発モード起動
```

## 8. テスト

### 8.1 テスト環境

- フレームワーク: Jest
- テストカバレッジ要件: 80% 以上

### 8.2 テスト項目

1. 単体テスト
   - コアロジック
   - データ処理
2. 統合テスト
   - API 連携
   - イベント処理

## 9. デプロイメント

### 9.1 リリース管理

- セマンティックバージョニング採用
- リリースノート必須

### 9.2 配布方法

- BOOTH を通じた配布

## 10. 保守・運用

### 10.1 監視項目

- エラーログ
- パフォーマンスメトリクス

### 10.2 バックアップ

- データ保存形式: JSON
- 自動バックアップ機能

## 付録

### A. 変更履歴

- 初版: 2025 年 2 月 11 日作成

### B. 関連文書

- [わんコメ 技術ドキュメント](https://onecomme.com/docs/developer)
- [OneSDK API リファレンス](https://types.onecomme.com/)
