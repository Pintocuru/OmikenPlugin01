# わんコメ サンプルプラグイン 兼 テンプレート

わんコメのプラグイン開発用のサンプル & ボイラープレート  
参加型の読み上げを追加するプラグインです  
読み上げボイスや読み上げエンジンはわんコメの読み上げ設定のものをそのまま使います

## プラグインの導入

[Release](https://github.com/OneComme/OneCommeOrderSpeechPlugin/releases) ページから「order-speech-plugin.zip」をダウンロードします

zipを展開し、わんコメのプラグインフォルダに「order-speech-plugin」フォルダを設置します

わんコメを起動しプラグインを有効化します

プラグイン有効化後に[設定ページ](http://localhost:11180/plugins/com.onecomme.order-speech-extender/index.html)　`http://localhost:11180/plugins/com.onecomme.order-speech-extender/index.html`にアクセスして設定をします

## 必要環境

- Node v20
- わんコメ v5.2 以上

## 開発環境

TypeScriptで開発ができます  

※ わんコメプラグインはcommonjsで出力する必要があります
