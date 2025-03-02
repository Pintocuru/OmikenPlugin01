---
title: 2025-02-11
date: 2025-02-11
tags: [ピンとくるノート]
aliases: []
---

# おみくじ BOT プラグイン　JSON データ仕様書

## 4. データ仕様

### 4.1 データモデル

- プラグイン/エディター共用
	- `Omiken`:
		- モード (`types`)
			- `comment`: コメントでの起動
				- 以下のコメントには反応しません
					- わんコメ>設定で「除外ユーザー」に指定されている id
					- このプラグインから投稿される userId(comment.data.userId = 'FirstCounter')
			- `timer`: タイマー(定期的な起動)
			- `unused`: 無効
			- 以下、搭載予定
				- `meta`: 配信のメタ情報（配信状況、視聴者数など）
				- `waitingList`: 参加型管理の順番待ちリスト
				- `setList`: セットリスト (音楽リスト)
				- `reactions`: リアクション (配信サイトのスタンプ等)
		- rules/omikujis/places 共通:
			- `id`: 一意の識別子
			- `name`: 表示名
			- `description`: 説明文
		- ルール (`rules`):
			- **色分け** (`color`): エディターでの識別用カラー
			- **有効おみくじ** (`enableIds`): このルールで使用可能なおみくじリスト
			- **タイマー**(`timerConfig`): mode=timer のとき設定
				- minutes: 自動発動する間隔 (分)、0 で無効
				- isBaseZero: 発動する基準。ture で時計の 0 分、false で起動時を基準とする。
			- **発動条件**(`threshold`):
		- おみくじ (`omikujis`):
			- **ランク**(`rank`): 数値が最も高いものから順に発動条件をチェックする。1 つでも条件を満たす場合は、そのランク以外のすべてのランクを抽選から除外する。
			- **重み** (`weight`): 出現確率の重み付け
			- **発動条件** (`threshold`): おみくじ固有の発動条件
				- 起動タイプが timer など、comment が undefined だった際、gift など comment 由来の値が条件として指定された場合、必ず true になります
			- **ステータス**(`status`): ユーザーに対するステータスの付与
			- **コメントを無効化**(`delete`): comment ではなく false を返す
			- プレースホルダー(`placeIds`): 使用するプレースホルダーの id
			- ゲーム (`script`): 使用する外部スクリプト
				- `scriptId`: 使用する外部スクリプトの id
				- `params`: 外部スクリプトに渡す引数（Object）
			- **投稿設定** (`post`): 複数の投稿方法を指定可能
				- `postType`: post で使用する種類
					- `onecomme`: わんコメへの投稿
					- `party`: わんコメへの WordParty 投稿
					- `speech`: わんコメへのスピーチ投稿
					- `error`: システム用。わんコメの投稿
				- `post` の共通定義
					- `delaySeconds`: 遅延時間
						- 基本遅延として 1 秒引いた数値になっています（config で変更可能）
					- `content`: 投稿内容
				- onecomme の追加定義
					- `botKey`: ボット識別子
					- `iconKey`: アイコン識別子
					- `party`: 発動する WordParty(キャラ表示・効果音で使用)
		- **プレースホルダー**(`places`):
			- 値 (`values`):
				- weight: 出現割合
				- value: 内容
					- 一度だけ、他のプレースホルダーへの参照可能
		- Threshold の詳細
			- `conditionType`: Threshold で使用する種類
			- `target`: 前回のコメントと今回のコメントが同一人物なら適用
				- 連続発動を防止するための Threshold です。
					- 起動タイプが comment なら、comment.data.userId を参照
					- それ以外であれば、Omiken.preferences.BotUserIDname を参照
				- true なら同一人物だったときに適用。
				- false なら同一人物ではないときに適用。
			- `cooldown`: このプラグインのおみくじ機能が機能してから指定した時間 (秒) が経過していない場合に適用
				- 重複して発動すると支障が出る (onecomme の投稿など) 時に設定する Threshold です。
					- 0.5～10 秒、0.5 秒単位。既定値は 3。
				- 基本は omikuji に付与するものですが、規模が小さければ、rules に付与してもいいと思います。
			- `syoken`:comment.meta.free = true のコメントのうち、以下の数値を見て判定
				- `SYOKEN`:interval = 0
				- `AGAIN`:interval >= 7 * 24 * 60 * 60 * 1000 = 7 日間以上
				- `HI`: 上記以外
				- are 上記すべて
			- `access`: ユーザーの役職 (メンバー/モデレーター/配信者) で判定する
				- `MEMBER`(2):comment.data.isMember = true
				- `MODERATOR`(3):comment.data.isModerator = true
				- `ADMIN`(4):comment.data.isOwner = true
			- `count`: 数値を参照する
				- `unit`:
					- `draws`:rules に該当した回数
					- `gift` : ギフトの金額 (comment.data.price)
					- `tc`: 総数の個人コメ数 (comment.meta.tc)
					- `interval`: そのユーザーの前回のコメントからの経過時間 (ミリ秒)(comment.meta.interval)
				- `comparison`:"min" | "max" | "range" | "equal" | "loop"
				- `value1`:
				- `value2`:comparison = range の際に使用
			- `match`: 文字列を参照する
				- `target`:
					- `status`: ユーザーごとの status
					- `comment`: コメント (comment.data.comment)
					- `name`: 名前 (comment.data.name)
					- `displayName`: ニックネーム (comment.data.displayName)
				- `case`:
					- `exact`: 完全一致
					- `starts`: 前方一致
					- `include`: 部分一致
	- Presets/Charas/Scripts 共通
	- `Chara`: キャラクターJSON の型定義
		- id: キー名
		- name: 名前
		- description: 説明
		- frameId: わんコメの枠
		- color:
			- --lcv-name-color: 名前の色
			- --lcv-text-color: コメントの色
			- --lcv-background-color: 背景色
		- image: ファイル名を指定
			- Default: 必須。
			- 任意の追加キー
		- party: キャラクター表示時、WordParty を発動させるキー群
			- 単なる文字リストであり、実際に使うには、WordParty での設定が必要
- AppPlugin: プラグイン
	- Visits: プラグイン専用のユーザー情報
		- name: ユーザー名。comment.data.displayName と同じ
		- userId: ユーザーID。comment.data.userId と同じ
		- status: ステータス。omikuji 共通で参照・設定できる値
		- serviceId: 前回コメントした配信枠の id
		- visitData: omikuji ごとに Object が用意されます
			- id: Object のキー名 (omikuji の ID)
			- draws: その枠に対する、ユーザー毎のおみくじの発動回数
			- totalDraws: 過去すべてのユーザー毎のおみくじの発動回数
			- count: 任意の数値。3 つまで使用できます
			- items: 任意の配列。
	- Games: omikuji ごとに Object が用意されます
		- id: Object のキー名 (omikuji の ID)
		- draws: その枠に対する、すべてのおみくじの発動回数
		- totalDraws: 過去すべてのおみくじの発動回数
		- gameData: 外部スクリプトのみ参照可能な、任意のデータ
	- TimeConfig: プラグインで使用するコメント受付の時間に関する設定
		- defaultFrameId: わんコメの一番上の枠 ID(わんコメの投稿で使用)
		- activeTime: プラグインを起動した時刻
		- lastTime: 最後におみくじ機能が実行された時刻
		- lastUserId: 最後におみくじを行った userId
- AppEditer: エディター
	- PresetType: JSON 読み込み
		- Presets/ Scripts は、これを流用する
		- id: キー名
		- name: 名前
		- description: 説明
		- type: "Omiken" | "Chara" | "Script"
		- path: スクリプトのパス
		- banner: ページで表示される説明バナーurl
		- item: Omiken データ
		- mode: 追加方法 (overwrite/append)
			- エディターで仕様するプロパティ
- 備考: わんコメのデータモデル
	- `comment`: コメントデータ

## 1. 概要

### 1.1 システム要件

- 動作環境
	- わんコメ 最新版 (6.0.4)
		- <https://onecomme.com/>
	- PRO 版かどうかは問いません
- このプラグインの正式名
	- おみくじ BOT プラグイン OmikenPlugin
	- 「Omiken」の由来は「おみくじ＋初見」機能から。
- 商品名 (案)
	- おみくじ BOT

### 1.2 目的

おみくじ機能を持つ BOT の主な目的と解決する課題

- **リスナーの行動促進**
    ライブ配信中に、リスナーがコメントするきっかけを提供する。
- **配信のインタラクション向上**
    リスナーの行動が配信に影響を与える仕組みを作り、参加感を高める。
- **イベント運営の効率化**
    配信中の抽選やミニゲームなどを自動化し、運営の負担を軽減する。
- **ランダム要素の提供**
    配信内での「今日の運勢」や「ラッキーアイテム」など、予測できない要素を簡単に決定できるツールとして活用。

### 1.3 想定される使用シーンと対象ユーザー

1. **ライブ配信のエンターテイメント要素として**
    - リスナーのコメント促進：「おみくじ」の結果がコメント欄に投稿され、盛り上がりを創出。
    - 視聴者間の交流促進：結果を共有して視聴者同士で会話を楽しむ。
    - 配信者の演出支援：「ラッキーアイテム」「視聴者の今日の運勢」などを即興で決定。
    - ログインスタンプ風の機能：配信への参加回数に応じて、おみくじ結果やコメントが変化。
2. **Visit 機能による、新しい機能を持つジェネレーター**
    - リスナーのコメントに**Status**を付与し、色の変更や画面内の特定位置に表示可能。
    - 視覚的なフィードバックを提供することで、リスナーの参加意欲を向上。

## 2. プラグインアーキテクチャ

### 2.1 全体構成

1. **コメント受信機能**
    - わんコメのプラグイン仕様に準拠したコメント受信システム
    - リアルタイムでのコメント取得と解析機能
    - API の詳細は [わんコメ公式ドキュメント](https://onecomme.com/docs/developer/plugin) を参照
2. **プラグインの構造と機能**
    - **おみくじロジックモジュール**
        - 受信したコメントから様々なルールを参照・抽選を行うことで、おみくじ結果を生成したり、visit 機能にデータを入れます
    - **応答生成モジュール**
        おみくじ結果をわんコメの API を利用して送信し、ジェネレーターを通じて配信上で結果を表示させる。
    - **visit 機能**
        - ユーザー毎のデータを保持することで、新しいタイプのジェネレーターを実現
        - 配信枠を跨いで、おみくじの回数やゲームの得点等のデータを保持。

### 2.2 主要機能

**1. 初期化システム（init）**

- データストア管理
    - ElectronStore によるファイル管理（Omiken/Visits/Games）
    - Presets(おみくじプリセットデータ)/Charas(キャラクターデータ)/Scripts(外部スクリプトデータ) の読み込み
- 配信管理
    - 枠 ID 単位での新規配信識別
- 数分ごとに自動でコメントを発信するタイマー機能

**2. コメント処理システム（filterComment）**

- おみくじ機能
    - 重み付き確率システム
    - 条件分岐機能（コメント回数、間隔、役職等）
    - プレースホルダーによる動的表示
    - 外部スクリプト連携
- 表示・演出機能
    - キャラクターアイコン制御
    - 音声設定（棒読み声）
    - WordParty 連携
    - ジェネレーター制御

**3. API 管理システム（request）**
- データアクセス制御
    - 読み書き可能：Omiken/Visits/Games
    - 読み取り専用：Presets/Charas/Scripts
- 機能提供
    - エディターへの API 提供。
        - おみくじデータ編集
        - プリセットデータの引用。
        - 訪問データ、script データの閲覧、編集
    - ジェネレーターへの API 提供。
        - script データの実行。
        - 訪問データ、script データの編集。
        - キャラクター画像の提供。

## 2.3 データフロー

1. **データの流れの概要**
	1. プラグインの特定の関数 (filterComment) にてコメントを受信。
	2. 受信したコメントからユーザー情報を抽出（ユーザー名や ID）。
	3. コメント内容を解析し、あらかじめ設定された条件に基づいておみくじ結果を判定。
	4. 判定結果を「おみくじ結果」として生成し、以下の動作を行う
		- わんコメにコメント、WordParty、speech として送信
		- プラグインにユーザー毎の情報や、おみくじ結果の情報を保存
2. **各コンポーネント間の通信方式**
    - **前提条件**
        - **わんコメが稼働していること**。Node.js がサーバーとして動作。
    - プラグイン内通信
        - モジュール間は関数呼び出しで通信。
    - わんコメとの通信
        - REST API リクエストを使用し、非同期通信を実現。
    - エディターとの通信
        - わんコメの Nodejs 機能を利用し、ブラウザアプリケーションを実現。OneSDK を使用。
3. **エラーハンドリングの基本方針**
    - **API エラー**
        - API からエラーコードが返却された場合：
            - - コンソールログにエラー内容を出力。
        - 必要に応じてエラー通知をコメントとして送信。
    - **コメント解析エラー**
        - コメントが不正または解析不能な場合：
            - わんコメの投稿 API を利用し、エラーメッセージを投稿
            - わんコメのログにも記録
    - **おみくじロジックエラー**
        - 判定時にエラーが発生した場合：
            - エラーの詳細をコンソールログに出力。

## 2.3 技術スタック

1. **開発言語**
    - TypeScript (version 5.4.5)
    - モダンな型付け言語を採用し、静的型チェックによるコード品質の向上を実現
2. **フレームワーク**
    - フロントエンド: Vue 3
    - エディターUI: Vuetify 3 (最新版)
    - モダンでレスポンシブな UI コンポーネントを提供
3. **ビルド & テスト環境**
    - ビルドツール: Webpack (v5.91.0)
        - 静的な環境が必須のため、Vite ではビルド不可。
    - テストフレームワーク: Jest (v29.7.0)
    - トランスパイラ: ts-loader
    - コード圧縮: Terser Webpack Plugin
4. **依存関係**
    - わんコメ（v7.0.1）
        - エディタはわんコメの RestAPI を利用して通信を行います
    - OneSDK: @onecomme.com/onesdk (v5.2.1)
        - <https://onecomme.com/docs/developer/onesdk-js>
    - 型定義: @types/jest, @types/node

## 3. プラグイン実装仕様

### 3.1 API リファレンス

#### 提供される関数・メソッド一覧

- 前提条件として、**わんコメが稼働していること**。Node.js がサーバーとして動作。
- REST API リクエストを使用し、非同期通信を実現しています。
- わんコメ搭載のプラグイン機能 (<https://onecomme.com/docs/developer/plugin>) に記載されている内容は除きます

| 関数/メソッド名          | 説明                   | 入力パラメータ                    | 戻り値                       |
| ----------------- | -------------------- | -------------------------- | ------------------------- |
| `filterComment`   | コメントを受信し、おみくじ処理を実行する | `comment`: わんコメのコメント Object | `comment`: 処理後のコメント Object |
| `CommentInstance` | コメントを受け取り解析します。      |                            |                           |

#### パラメータの詳細

- **`CommentInstance(config)`**
    `config`: プラグインの設定オブジェクト。
- **`processComment(commentData)`**
    - `commentData`: わんコメから受信したコメントオブジェクト。
        - フォーマット例:

```javascript
{
  "userId": "12345",
  "userName": "視聴者A",
  "message": "おみくじ！",
  "timestamp": "2024-11-26T12:34:56Z"
}
```

- **`sendResponse(responseData)`**
    - `responseData`: 送信する応答メッセージのデータ。
        - フォーマット例

```javascript
{
  "message": "視聴者Aの運勢: 大吉！",
  "highlightColor": "#FF0000"
}
```

#### エラーコードと対応方法

|エラーコード|説明|対応方法|
|---|---|---|
|`ERR_INIT`|プラグインの初期化に失敗しました。|設定項目を確認してください。|
|`ERR_PARSE`|コメント解析中にエラーが発生しました。|フォーマットが正しいか確認してください。|
|`ERR_SEND`|応答の送信に失敗しました。|ネットワーク接続や API の利用状況を確認。|

---

#### サポートされるイベント一覧

|イベント名|説明|発火条件|
|---|---|---|
|`onCommentReceived`|コメントが受信された際に発火します。|わんコメがコメントを検出したとき|
|`onFortuneGenerated`|おみくじ結果が生成された際に発火します。|`processComment` が成功したとき|
|`onError`|エラーが発生した際に発火します。|プラグイン内で例外がスローされたとき|

#### イベントデータの構造

- **`onCommentReceived`**
    - データ例:

```javascript
{   "userId": "12345",   "userName": "視聴者A",   "message": "おみくじ！" }
```

- **`onFortuneGenerated`**
    - データ例:

```javascript
{
  "userId": "12345",
  "result": "大吉",
  "highlightColor": "#FF0000"
}

```

- **`onError`**
    - データ例:

```javascript
{
  "errorCode": "ERR_PARSE",
  "message": "Invalid comment format"
}

```

---

### 3.3 設定項目

#### 必須設定項目

|項目名|データ型|説明|デフォルト値|
|---|---|---|---|
|`pluginName`|`string`|プラグインの名前|`null`|
|`enableLog`|`boolean`|ログ出力を有効にするか|`false`|

#### オプション設定項目

|項目名|データ型|説明|デフォルト値|
|---|---|---|---|
|`responseDelay`|`number`|応答の遅延時間（ミリ秒）|`1000`|
|`highlightColor`|`string`|応答メッセージの強調表示の色|`"#FF0000"`|

#### デフォルト値

すべての設定項目は初期化時に指定しなかった場合、以下のデフォルト値が使用されます：

```javascript
{
  "pluginName": null,
  "enableLog": false,
  "responseDelay": 1000,
  "highlightColor": "#FF0000"
}

```

## 4. データ仕様

### 4.1 データモデル

- プラグイン/エディター共用
	- `Omiken`:
		- モード (`types`)
			- `comment`: コメントでの起動
				- 以下のコメントには反応しません
					- わんコメ>設定で「除外ユーザー」に指定されている id
					- このプラグインから投稿される userId(comment.data.userId = 'FirstCounter')
			- `timer`: タイマー(定期的な起動)
			- `unused`: 無効
			- 以下、搭載予定
				- `meta`: 配信のメタ情報（配信状況、視聴者数など）
				- `waitingList`: 参加型管理の順番待ちリスト
				- `setList`: セットリスト (音楽リスト)
				- `reactions`: リアクション (配信サイトのスタンプ等)
		- rules/omikujis/places 共通:
			- `id`: 一意の識別子
			- `name`: 表示名
			- `description`: 説明文
		- ルール (`rules`):
			- **色分け** (`color`): エディターでの識別用カラー
			- **有効おみくじ** (`enableIds`): このルールで使用可能なおみくじリスト
			- **タイマー**(`timerConfig`): mode=timer のとき設定
				- minutes: 自動発動する間隔 (分)、0 で無効
				- isBaseZero: 発動する基準。ture で時計の 0 分、false で起動時を基準とする。
			- **発動条件**(`threshold`):
		- おみくじ (`omikujis`):
			- **ランク**(`rank`): 数値が最も高いものから順に発動条件をチェックする。1 つでも条件を満たす場合は、そのランク以外のすべてのランクを抽選から除外する。
			- **重み** (`weight`): 出現確率の重み付け
			- **発動条件** (`threshold`): おみくじ固有の発動条件
				- 起動タイプが timer など、comment が undefined だった際、gift など comment 由来の値が条件として指定された場合、必ず true になります
			- **ステータス**(`status`): ユーザーに対するステータスの付与
			- **コメントを無効化**(`delete`): comment ではなく false を返す
			- プレースホルダー(`placeIds`): 使用するプレースホルダーの id
			- ゲーム (`script`): 使用する外部スクリプト
				- `scriptId`: 使用する外部スクリプトの id
				- `params`: 外部スクリプトに渡す引数（Object）
			- **投稿設定** (`post`): 複数の投稿方法を指定可能
				- `postType`: post で使用する種類
					- `onecomme`: わんコメへの投稿
					- `party`: わんコメへの WordParty 投稿
					- `speech`: わんコメへのスピーチ投稿
					- `error`: システム用。わんコメの投稿
				- `post` の共通定義
					- `delaySeconds`: 遅延時間
						- 基本遅延として 1 秒引いた数値になっています（config で変更可能）
					- `content`: 投稿内容
				- onecomme の追加定義
					- `botKey`: ボット識別子
					- `iconKey`: アイコン識別子
					- `party`: 発動する WordParty(キャラ表示・効果音で使用)
		- **プレースホルダー**(`places`):
			- 値 (`values`):
				- weight: 出現割合
				- value: 内容
					- 一度だけ、他のプレースホルダーへの参照可能
		- Threshold の詳細
			- `conditionType`: Threshold で使用する種類
			- `target`: 前回のコメントと今回のコメントが同一人物なら適用
				- 連続発動を防止するための Threshold です。
					- 起動タイプが comment なら、comment.data.userId を参照
					- それ以外であれば、Omiken.preferences.BotUserIDname を参照
				- true なら同一人物だったときに適用。
				- false なら同一人物ではないときに適用。
			- `cooldown`: このプラグインのおみくじ機能が機能してから指定した時間 (秒) が経過していない場合に適用
				- 重複して発動すると支障が出る (onecomme の投稿など) 時に設定する Threshold です。
					- 0.5～10 秒、0.5 秒単位。既定値は 3。
				- 基本は omikuji に付与するものですが、規模が小さければ、rules に付与してもいいと思います。
			- `syoken`:comment.meta.free = true のコメントのうち、以下の数値を見て判定
				- `SYOKEN`:interval = 0
				- `AGAIN`:interval >= 7 * 24 * 60 * 60 * 1000 = 7 日間以上
				- `HI`: 上記以外
				- are 上記すべて
			- `access`: ユーザーの役職 (メンバー/モデレーター/配信者) で判定する
				- `MEMBER`(2):comment.data.isMember = true
				- `MODERATOR`(3):comment.data.isModerator = true
				- `ADMIN`(4):comment.data.isOwner = true
			- `count`: 数値を参照する
				- `unit`:
					- `draws`:rules に該当した回数
					- `gift` : ギフトの金額 (comment.data.price)
					- `tc`: 総数の個人コメ数 (comment.meta.tc)
					- `interval`: そのユーザーの前回のコメントからの経過時間 (ミリ秒)(comment.meta.interval)
				- `comparison`:"min" | "max" | "range" | "equal" | "loop"
				- `value1`:
				- `value2`:comparison = range の際に使用
			- `match`: 文字列を参照する
				- `target`:
					- `status`: ユーザーごとの status
					- `comment`: コメント (comment.data.comment)
					- `name`: 名前 (comment.data.name)
					- `displayName`: ニックネーム (comment.data.displayName)
				- `case`:
					- `exact`: 完全一致
					- `starts`: 前方一致
					- `include`: 部分一致
	- Presets/Charas/Scripts 共通
	- `Chara`: キャラクターJSON の型定義
		- id: キー名
		- name: 名前
		- description: 説明
		- frameId: わんコメの枠
		- color:
			- --lcv-name-color: 名前の色
			- --lcv-text-color: コメントの色
			- --lcv-background-color: 背景色
		- image: ファイル名を指定
			- Default: 必須。
			- 任意の追加キー
		- party: キャラクター表示時、WordParty を発動させるキー群
			- 単なる文字リストであり、実際に使うには、WordParty での設定が必要
- AppPlugin: プラグイン
	- Visits: プラグイン専用のユーザー情報
		- name: ユーザー名。comment.data.displayName と同じ
		- userId: ユーザーID。comment.data.userId と同じ
		- status: ステータス。omikuji 共通で参照・設定できる値
		- serviceId: 前回コメントした配信枠の id
		- visitData: omikuji ごとに Object が用意されます
			- id: Object のキー名 (omikuji の ID)
			- draws: その枠に対する、ユーザー毎のおみくじの発動回数
			- totalDraws: 過去すべてのユーザー毎のおみくじの発動回数
			- count: 任意の数値。3 つまで使用できます
			- items: 任意の配列。
	- Games: omikuji ごとに Object が用意されます
		- id: Object のキー名 (omikuji の ID)
		- draws: その枠に対する、すべてのおみくじの発動回数
		- totalDraws: 過去すべてのおみくじの発動回数
		- gameData: 外部スクリプトのみ参照可能な、任意のデータ
	- TimeConfig: プラグインで使用するコメント受付の時間に関する設定
		- defaultFrameId: わんコメの一番上の枠 ID(わんコメの投稿で使用)
		- activeTime: プラグインを起動した時刻
		- lastTime: 最後におみくじ機能が実行された時刻
		- lastUserId: 最後におみくじを行った userId
- AppEditer: エディター
	- PresetType: JSON 読み込み
		- Presets/ Scripts は、これを流用する
		- id: キー名
		- name: 名前
		- description: 説明
		- type: "Omiken" | "Chara" | "Script"
		- path: スクリプトのパス
		- banner: ページで表示される説明バナーurl
		- item: Omiken データ
		- mode: 追加方法 (overwrite/append)
			- エディターで仕様するプロパティ
- 備考: わんコメのデータモデル
	- `comment`: コメントデータ

### 4.2 データ永続化

- 保存形式
	- 1. プラグインの ElectronStore を利用。
	- 2. エディタ側にて、API を使い json 形式で保存
	- 保存対象は 以下の通り
	- Omiken Games Visits
- **保存場所**: プラグインのルートフォルダ。
	- 保存ファイル名例: `state.json`
	- **理由**: プラグインによる、ElectronStore の仕様
- バックアップ方法
	- エディターで omiken を保存する際にのみ、実施
	- fs.file なんとかを使用し、バックアップを実施
	- エディター側で保存を行う際、同時にバックアップを作成
		- 最大 10 件まで。それ以降は古いものから削除
		- エディター側でバックアップを参照し、そのデータを開くことも可能

### 4.3 データ制約

#### サイズ制限

- **データ量制限**: おみくじ結果を最大 50 件程度に制限することを推奨します。
	- 1 つのコメントにつき、複数の判定が必要なため、多いほど倍々で負荷が増えます
- **ファイルサイズ制限**: 明示的な制限はありませんが、10MB を超えると処理パフォーマンスが低下する可能性があります。
- rules は最大 30 まで
- omikuji は 50、place は 200 まで（の予定）

### 4.4 わんコメの Send Comment 仕様の工夫

#### 概要

- わんコメのコメント形式には制約があるため、それぞれのプロパティの意味を拡張し、機能の追加を試みる
- 仕様変更の影響を受けにくいよう、可能な限り、仕様に反するプロパティの使用は控える

#### 各プロパティの仕様

- service
	- id : わんコメの枠を指定
- comment
	- id : プラグインやジェネレーターでパラメーターのように使用する文字列
		- id : 一意の ID
		- liveId : ジェネレーターに渡す引数 (generatorParam)
		- isOwner : BOT の読み上げを行わない (isSilent)
	- userId : わんコメがユーザーを識別するための ID
	- name : 投稿時の表示名
	- comment : コメント
	- profileImage : アイコン
	- badges : メンバーやモデレーター等の表示用バッジ
	- colors : コメントの文字や背景を指定。
	- nickname : 未使用
		- おみくじ BOT は「名前を読まない仕様」のため、使用することはない。
		- 本来は読み上げ時に、この名前で読み上げるためのもの

## 5. エディタ仕様

### 5.1 UI 構成

- 画面レイアウト
	- types
		- comment / timer / unused でカテゴライズする
			- 配列で並べる。適用する順番は上から。
			- 適用された場合、その時点で終了し、以降の rules は判定されない。
		- vuedraggable を使い、rules をドラッグアンドドロップできるようにする
		- クリックで、その rules のダイアログを表示する
	- rules
		- どのようなコメントであれば適用されるかの条件を記入する（threshold の設定）
		- 条件に合致した際、抽選するおみくじを 1 つあるいは複数選択する（enable）
	- omikuji
		- おみくじの内容や、付与するステータスを記述。
		- 元になったコメントを非表示にもできる
	- place
		- プレースホルダーの編集。omikuji で使用する。
		- 一度だけ、プレースホルダー内でプレースホルダーを使用できる。
	- preset
		- 予め作成されたセットを収録
			- Omiken データ
			- 外部スクリプト (Game)
			- BOT の画像セット (Chara)
	- 設定
		- BOT の発言する基本的な遅延などの設定
- 操作フロー
	1. 起動の条件を決める (rules)
		- コメントに対する適用や、定期的な発動など、様々な発動条件が選べます
	2. おみくじの内容 (omikuji) を用意する
		- 特定の条件で発動させたり、優先的に発動させるなど、様々な条件設定ができます
	3. rules に複数のおみくじを入れる
		- 抽選は重み付けができます
	4. おみくじの内容に合うプレースホルダー(place) を設定する
		- プレースホルダーには重み付けを設定できます
		- 一度だけ、プレースホルダーにプレースホルダーを使うことができます

### 5.2 編集機能

## 7. エラー処理

### 7.1 エラーパターン

1. **想定されるエラーの種類**
    - わんコメ投稿に対する無限ループ
    - ユーザー入力ミス
        - 必須項目が入力されていない
        - 不正な形式のデータ（例：文字列に数値が含まれている）
    - システムエラー
        - 外部 API エラー
            - わんコメが応答しない
            - わんコメが起動していない
        - スクリプト実行中の例外
    - ファイルエラー
        - ファイルが存在しない
        - JSON ファイルの読み込み失敗（パスが存在しない、読み取り権限がない）
        - 不正な JSON 構造
    - 操作エラー
        - 未対応の操作要求（例：不明なコマンド）
        - 重複したリクエストの送信
    - コメントが一度に大量に来たとき
        - プラグインのバージョンとシステムのバージョンが一致しない
2. **エラーメッセージ一覧**
    - プラグイン
        - エラーはわんコメの投稿で表示
        - アプリのログにもエラー表示
    - エディター
        - SweetAlert2 のトースト表示でエラーを表示。

### 7.2 トラブルシューティングガイド

- 一般的なエラー例と解決策を記載。
    - BOT が発動しない
        - 不要な Threshold を設定していないか確認してください
    - アイコンが表示されない
        - 画像フォルダを移動させていないか確認してください
        - 必要があれば、再インストールしてください
    - JSON 構造エラー：
        - 報告をください
        - 提供されたサンプル JSON を参考に、構造を修正してください。

## 8. パフォーマンス要件

### 8.1 性能要件

1. **レスポンス時間**
    - コメント処理の応答時間は **1 秒以内** を目指す（ユーザー体感で遅延を感じさせないため）。
    - 外部 API を使用する場合も、遅延が 5 秒を超える場合はエラーを返却する。
2. **スループット**
    - 1 分間に処理可能なコメントは **500 件** を目安とする。
    - BOT の負荷が高い場合は、一時的にスローダウンする制御を実装。
    - 過度な反応をさせない。

### 8.2 スケーラビリティ

1. **同時接続数**
    - 想定される接続人数は **5～200 人** 。
    - BOT からのわんコメ投稿は 3 秒のクールダウンを設けることで、重複による過剰な反応を抑制し、大量の同時コメントでもスムーズな対応を可能に。
2. **被り対策**
    - コメントの重複を防ぐため、**2 秒間の投稿間隔制御** を設定可能。
    - 同一ユーザーからのスパム対策として、特定の投稿頻度を超えた場合は一定時間のミュート処理を適用。

## 9. 開発ガイドライン

### 9.1 開発環境

1. **推奨開発環境**
	- **Node.js** バージョン 16.0 以上
	- パッケージ管理ツール：**npm** または **yarn**
	- テストフレームワーク：**Jest**
2. **ビルド手順**
    - 必要なパッケージをインストール：
		- `npm install`
	- アプリケーションをビルド：
		- `npm run build`
	- 実行可能な状態で検証：
		- `npm start`
3. デバッグ方法
	- ローカルサーバーを起動：
		- `npm run dev`
	- 開発中にエラーが発生した場合は、`logs/debug.log` を確認。
	- 配信サイトとの接続確認：
	    - 模擬データを使用したテストスクリプトを実行。
	    - コメント送信シミュレーションを行い、リアルタイム応答を確認。

### 9.2 コーディング規約

- **命名規則**
    - 可能な限り、親の名前を子が継承する
        - 親が App なら、子は AppXxxxx 等と親と子の関係をわかりやすく命名する
    - 変数名：キャメルケース（例：`commentList`、`userResponse`）
    - 定数名：スネークケース大文字（例：`MAX_USERS`）
    - 関数名：キャメルケース（例：`handleComment`）
- **コードスタイル**
    - インデント：スペース 2 つ (VSCord の Lint に任せる)
    - 1 行の長さ：80 文字以内 (Prettier に任せる)
    - 不要なコメントやデバッグコードは削除。必要な場合は簡潔に記載：

```javascript
// コメント重複防止のためのタイマーリセット
clearTimeout(duplicateCheckTimer);
```
