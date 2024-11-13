// omikujiUtils.js

module.exports = {
  /**
   * isOverlapping または omikujiName が true の場合、処理をスキップ
   * @param {Comment} comment - 受信したコメントデータ
   * @returns {Promise<boolean>} 重複しているかどうか
   */
  isSkipOmikuji: function (comment) {
    return (
      comment.omikenData.isOverlapping === true ||
      comment.omikenData.omikujiName
    );
  },
  /**
   * 前回投稿の時刻を確認し、重複を判定する
   * @param {Comment} comment - 受信したコメントデータ
   * @returns {Promise<boolean>} 重複しているかどうか
   */
  checkOverlapping: async function (comment) {
    try {
      // TODO: COREのAPIを叩いて前回投稿の時刻を取得する実装
      // 現在は未実装のため常にfalseを返す
      return false;
    } catch (error) {
      console.error('Error in checkOverlapping:', error);
      // エラー処理を行う
      throw error; // または適切なデフォルト値を返す
    }
  },
  /**
   * コメントと設定されたルールを照合し、適用可能か判断する
   * @param {Comment} comment - 受信したコメントデータ
   * @param {Rule} rule - 適用するルール
   * @returns {boolean | null} ルールが適用可能かどうか
   */
  wordCheck: function (comment, rule) {
    // 既に他のおみくじが実行されているか?
    if (comment.omikenData.omikujiName) return null;
    // ワードがヒットしていたか?
    if (!matchRule(comment.data.comment, rule)) return null;
    // ヒットしていたなら、nameにおみくじ名を入れる
    const omikujiName = rule.name;

    // そのユーザーがおみくじ適用されるか(SwitchのON/OFF、メンバーのみや重複を見る)
    const isApplicable = isRuleApplicable(rule, comment);
    return { omikujiName, isApplicable };

    // --- 以下関数 -----------------------------------------

    /**
     * コメントテキストがルールに一致するかどうかを確認する
     * @param {string} commentText - コメントテキスト
     * @param {Rule} rule - 確認するルール
     * @returns {boolean} ルールに一致するかどうか
     */
    function matchRule(commentText, rule) {
      return ["matchExact", "matchStartsWith", "matchIncludes"].some(
        (matchType) => {
          const words = rule[matchType];
          return (
            words?.some((word) => {
              const isEmoji = /\p{Emoji}/u.test(word);
              const compareWord = isEmoji ? word : word.toLowerCase();
              const compareComment = isEmoji
                ? commentText
                : commentText.toLowerCase();

              switch (matchType) {
                case "matchExact":
                  return compareWord === compareComment;
                case "matchStartsWith":
                  return compareComment.startsWith(compareWord);
                case "matchIncludes":
                  return compareComment.includes(compareWord);
                default:
                  return false;
              }
            }) || false
          );
        }
      );
    }
    /**
     * ルールが適用可能かどうかを判断する
     * @param {Rule} rule - 適用するルール
     * @param {boolean} isOverlapping - 重複判定結果
     * @param {Comment} comment - 受信したコメントデータ
     * @returns {boolean} ルールが適用可能かどうか
     */
    function isRuleApplicable(rule, comment) {
      if (!rule.switch) {
        console.log(
          `"${rule.name}" にマッチしましたが、スイッチがOFFのため適用できませんでした。`
        );
        return false;
      }

      if (rule.isMember && checkMember(comment)) {
        postToast(
          0,
          "sorry01",
          `${comment.data.displayName}さん、「${rule.name}」は、メンバー限定だよ。ごめんなさい💦`
        );
        return false;
      }

      if (rule.isModeratorAndAbove && checkModerator(comment)) {
        postToast(
          0,
          "sorry01",
          `${comment.data.displayName}さん、「${rule.name}」は、モデレーター以上限定だよ。ごめんなさい💦`
        );
        return false;
      }

      return true;
    }

    /**
     * ユーザーがメンバーシップ保持者かどうかを確認する
     * @param {Comment} comment - 受信したコメントデータ
     * @returns {boolean} メンバーシップ保持者かどうか
     */
    function checkMember(comment) {
      const { isOwner, isMember, isModerator, subscriber } = comment.data || {};
      return isOwner || isMember || isModerator || subscriber;
    }
    /**
     * ユーザーがモデレーター以上の権限を持っているかどうかを確認する
     * @param {Comment} comment - 受信したコメントデータ
     * @returns {boolean} モデレーター以上の権限を持っているかどうか
     */
    function checkModerator(comment) {
      const { isOwner, isModerator } = comment.data || {};
      return isOwner || isModerator;
    }
  },

  /**
   * 共通のボットメッセージ処理関数
   * @param {Comment} comment - 受信したコメントデータ
   * @param {Rule} rule - 適用するルール
   * @returns {boolean | null} ルールが適用可能かどうか
   */
  // ? condition は rawItems 内に入れるより、引数で渡したほうがいいかもしれない。
  processBotMessage: function (user = "名無し", rawItems, condition = null, overlap = false) {

    /**
     * アイテムの検証関数
     * @param {Object} item - 検証するアイテム
     * @returns {boolean} アイテムが有効かどうか
     */
    const validateItem = (item) => {
      if (!item.threshold) return true;

      const { value, loop, comparison } = item.threshold;

      if (condition === null) return true;

      const comparisons = { 0: "===", 1: ">", "-1": "<" };
      // ? loop=ture のとき、comparisonsは意味がないということでいいのか?
      return loop
        ? condition % value === 0
        : eval(`${condition} ${comparisons[comparison]} ${value}`);
    }

    /**
     * アイテム選択関数
     * @param {Array} validItems - 有効なアイテムの配列
     * @returns {Object|null} 選択されたアイテム
     */
    const selectItem = (validItems) => {
      const totalWeight = validItems.reduce(
        (sum, { weight }) => sum + (weight >= 0 ? weight : 1), 0
      );
      if (totalWeight <= 0) return null;

      let rand = Math.random() * totalWeight;
      return validItems.find(
        (item) => (rand -= item.weight >= 0 ? item.weight : 1) < 0
      );
    }

    // メッセージ処理
    const processMessages = (selectedItem, user, random) => {
      // 初期の置換対象を設定
      // ? 対象がuserしかなくなってしまった…
      const initialReplacements = { user };
      // randomキーの処理
      const randomReplacements = processRandomMessages(
        random,
        initialReplacements
      );
      const allReplacements = { ...randomReplacements, ...initialReplacements };

      // selectedItemのプロパティを処理
      return {
        ...selectedItem,
        message: processItemProperty(selectedItem.message, allReplacements),
        party: processItemProperty(selectedItem.party, allReplacements),
        toast: processItemProperty(selectedItem.toast, allReplacements),
        speech: processItemProperty(selectedItem.speech, allReplacements),
      };
    }

    /**
     * <<>>を置換
     * @param {string} str - 置換対象の文字列
     * @param {Object} replacements - 置換オブジェクト
     * @returns {string} 置換後の文字列
     */
    const replaceInString = (str, replacements) => {
      return str.replace(
        /<<(\w+)>>/g,
        (_, key) => replacements[key] ?? "(N/A)"
      );
    }

    /**
     * ランダムメッセージ処理関数
     * @param {Object} randomObj - ランダムメッセージオブジェクト
     * @param {Object} initialReplacements - 初期置換オブジェクト
     * @returns {Object} 処理されたランダムメッセージ
     */
    const processRandomMessages = (randomObj, initialReplacements) => {
      const processedRandoms = {};
      for (const [key, array] of Object.entries(randomObj)) {
        if (Array.isArray(array)) {
          const totalWeight = array.reduce(
            (sum, { weight }) => sum + (weight || 1), 0
          );
          let rand = Math.random() * totalWeight;
          const selectedContent = array.find(
            (item) => (rand -= item.weight || 1) < 0
          )?.content;
          processedRandoms[key] = selectedContent
            ? replaceInString(selectedContent, initialReplacements)
            : null;
        }
      }
      return processedRandoms;
    }

    /**
     * 各キーを整形する
     * @param {string|Array} property - 処理するプロパティ
     * @param {Object} replacements - 置換オブジェクト
     * @returns {string|Array} 処理後のプロパティ
     */
    const processItemProperty = (property, replacements) => {
      if (typeof property === "string") {
        return replaceInString(property, replacements);
      } else if (Array.isArray(property)) {
        return property.map((item) => {
          if (typeof item === "string") {
            return replaceInString(item, replacements);
          } else if (typeof item === "object") {
            return {
              ...item,
              content: replaceInString(item.content, replacements),
            };
          }
          return item;
        });
      }
      return property;
    }

    /**
     * メッセージ投稿関数
     * @param {Object} processedItem - 処理済みアイテム
     * @param {boolean} overlap - メッセージの重複を許可するかどうか
     */
    const postMessages = (processedItem, overlap) => {
      const { message, party, toast, speech } = processedItem;

      try {
        if (message) {
          console.warn('コンソールコメント');
          // !toastは未実装
          // !overlap ? this.postOneComme(message) : this.postToast(message);
          this.postOneComme(message)
        }
        if (party && !overlap) this.postWordParty(party);
        // !toastは未実装
        //if (toast) this.postToast(toast);
        if (speech) this.postSpeech(speech);
      } catch (error) {
        console.error('Error in postMessages:', error);
        throw error;
      }
    }


    // --------------------------------------------


    // アイテムリストのコピーと検証
    const items = JSON.parse(JSON.stringify(rawItems));
    if (!Array.isArray(items.omikuji) || items.omikuji.length === 0) {
      console.error("アイテムがないか、正しいObjectの形をしていません");
      return false;
    }

    // thresholdの条件とMatchするアイテムのフィルタリング
    const validItems = items.omikuji.filter(validateItem);
    if (validItems.length === 0) return false;

    // Weightを基に抽選を行う
    const selectedItem = selectItem(validItems);
    if (!selectedItem) {
      console.error(
        "どのアイテムも選ばれませんでした。Weightが0の可能性があります。"
      );
      return false;
    }

    // メッセージ処理
    const processedItem = processMessages(selectedItem, user, items.random);

    // メッセージの投稿
    postMessages(processedItem, overlap);
    // true(Success)を返す
    return true;

  },

  // 設定ファイルを読み込む関数
  async loadConfig(filename) {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const filePath = path.join(__dirname, 'config', filename);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      throw error;
    }
  },

  // Wordpartyへ投稿
  // ? 将来的には、この関数でtoast投稿もできるようにする?
  postOneComme: async function (messageObjects) {
    try {
      // 設定ファイルの読み込み
      //const charaConfig = await this.loadConfig('charaConfig.json');
      //const charaImgConfig = await this.loadConfig('charaImgConfig.json');
      const charaConfig = {
        default: {
          name: " ",
          frameId: "",
          "--lcv-name-color": "#FAFAFA",
          "--lcv-text-color": "#FAFAFA",
          "--lcv-background-color": "#212121"
        }
      };
      const charaImgConfig = {
        default: {
          Default: ""
        }
      };



      const promises = messageObjects.map(async message => {
        if (!message.content.trim()) return;

        const { botKey, iconKey, content, delaySeconds } = message;
        const { processedBotKey, processedIconKey } = this.processKeys(botKey, iconKey, charaConfig);

        // キャラクターデータの取得
        const characterData = charaConfig[processedBotKey] || charaConfig[Object.keys(charaConfig)[0]];
        const characterImage = charaImgConfig[processedBotKey]?.[processedIconKey] || charaImgConfig[processedBotKey]?.Default;

        // 遅延処理
        await this.delayTime(delaySeconds);

        // コメント送信
        return this.post("http://localhost:11180/api/comments", {
          service: { id: characterData.frameId || await this.getFrameId() },
          comment: {
            userId: "FirstCounter",
            id: Date.now() + Math.random().toString().slice(2, 12),
            name: characterData.name,
            comment: content,
            profileImage: characterImage,
          }
        });
      });

      // 全てのメッセージ処理が完了するのを待つ
      await Promise.all(promises);
    } catch (error) {
      console.error("Error in postOneComme:", error);
      throw error;
    }
  },

  // キーの処理を行う関数
  processKeys(botKey, iconKey, charaConfig) {
    return {
      processedBotKey: botKey in charaConfig ? botKey : Object.keys(charaConfig)[0],
      processedIconKey: iconKey || 'Default'
    };
  },

  // フレームIDを取得する関数
  async getFrameId() {
    try {
      const data = await this.get("http://localhost:11180/api/services");
      console.warn(data);
      return data[0].id;
    } catch (error) {
      console.error("Error getting frame ID:", error);
      throw error;
    }
  },

  // Wordpartyへ投稿
  postWordParty: async function (messageArray) {
    const postPromises = messageArray.map(async (message) => {
      const { content, delaySeconds = 0 } = message;

      // 遅延処理
      await this.delayTime(delaySeconds);

      if (content && content.trim()) {
        try {
          await this.post("http://localhost:11180/api/reactions", {
            reactions: [{ key: content, value: 1 }]
          });
        } catch (error) {
          console.error('Failed to post WordParty reaction:', error);
        }
      }
    });

    await Promise.all(postPromises);
  },

  // スピーチ(音声のみ)投稿
  postSpeech: async function (messageArray) {
    const postPromises = messageArray.map(async (message) => {
      const { content, delaySeconds = 0 } = message;

      // 遅延処理
      await this.delayTime(delaySeconds);

      if (content && content.trim()) {
        try {
          await this.post("http://localhost:11180/api/speech", { text: content });
        } catch (error) {
          console.error('Failed to post speech:', error);
        }
      }
    });

    await Promise.all(postPromises);
  },






  // 遅延function
  delayTime: async function (ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(ms * 1000, 0)));
  },
  // axiosを使ってGETする
  get: async (url, config = {}) => {
    const axios = require('axios');
    try {
      const response = await axios.get(url, config);
      return response.data;
    } catch (error) {
      console.error('Error in GET request:', error);
      throw error;
    }
  },
  // axiosを使ってPOSTする
  post: async (url, data, config = {}) => {
    const axios = require('axios');
    try {
      const response = await axios.post(url, data, config);
      return response.data;
    } catch (error) {
      console.error('Error in POST request:', error);
      throw error;
    }
  },
};
