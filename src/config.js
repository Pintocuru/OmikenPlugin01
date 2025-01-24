// src/config.js

const CONFIG = {
 // プラグインID:フォルダ名とこの名前は、必ず合わせてください
 PLUGIN_UID: 'OmikenPlugin02',
 // このプラグインが投稿するuserId
 BOT_USER_ID: 'FirstCounter'
};

//
// -----------------------------------------------------
// 以下設定

if (typeof window !== 'undefined') window.CONFIG = CONFIG;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
 module.exports = { CONFIG };
}
