// src/config.js

const CONFIG = {
 // プラグインID:フォルダ名とこの名前は、必ず合わせてください
 PLUGIN_UID: 'OmikenPlugin01',
 // このプラグインが投稿するuserId
 BOT_USER_ID: 'FirstCounter'
};

//
// -----------------------------------------------------
// 以下設定

if (typeof window !== 'undefined' && window !== null) window.APP_CONFIG = CONFIG;
if (typeof global !== 'undefined' && global !== null) global.APP_CONFIG = CONFIG;
module.exports = { CONFIG };
