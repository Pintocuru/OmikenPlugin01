// src/Modules/defaultState.ts

import { PluginStoreType } from '@type';

export const defaultState: PluginStoreType = {
 Omiken: {
  types: {
   comment: [
    '1737004538809-l0uyf',
    'HondaJanken',
    'HondaJanken-Rock',
    'HondaJanken-Scissors',
    'HondaJanken-Paper',
    'BomberSpin',
    'GouseiSuika',
    '1731154889231',
    '1731148078732',
    '1730455954261'
   ],
   timer: ['1737082284194-09aib'],
   meta: [],
   waitingList: [],
   setList: [],
   reactions: [],
   unused: []
  },
  rules: {
   '1737004538809-l0uyf': {
    id: '1737004538809-l0uyf',
    name: 'おみくじ',
    description: 'おみくじ。Microsoft Copilot に生成してもらいました。',
    color: '#EF5350',
    enableIds: [
     '1737004587154-e49pa',
     '1737005570029-zu75p',
     '1737005576336-xwr6c',
     '1737005723813-esl50',
     '1737005735661-vmhs4',
     '1737005737628-n529j'
    ],
    threshold: [
     {
      conditionType: 'match',
      coolDown: 3,
      syoken: 1,
      access: 2,
      gift: 0,
      count: {
       comparison: 'max',
       unit: 'draws',
       value1: 0,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'starts',
       value: ['おみくじ', 'omikuji', 'omikuzi', '御神籤', '🥠']
      }
     }
    ]
   },
   HondaJanken: {
    id: 'HondaJanken',
    name: 'じゃんけん',
    description: 'ここは練習ではありません。全身全霊で俺と向き合ってください。',
    color: '#283593',
    enableIds: [
     '1736247177100-w9ddw',
     '1736247177903-w9npy',
     '1736307219773-kver1',
     '1736307533195-0zgu9',
     '1736307602808-op1nj',
     '1736307722566-dtnvq',
     '1736307931650-wrj7f',
     '1736308696148-vzo8h',
     'HondaJankenOverlap'
    ],
    threshold: [
     {
      conditionType: 'match',
      coolDown: 3,
      syoken: 1,
      access: 2,
      gift: 0,
      count: {
       comparison: 'max',
       unit: 'draws',
       value1: 0,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'starts',
       value: ['じゃんけん', 'janken']
      }
     }
    ]
   },
   'HondaJanken-Rock': {
    id: 'HondaJanken-Rock',
    name: 'じゃんけん(グー)',
    description: 'いい勝負でしたね!でも結果が伴わないと、全く意味がありません。',
    color: '#B71C1C',
    enableIds: [
     '1736247177100-w9ddw',
     '1736247177903-w9npy',
     '1736312480939-sy2gn',
     '1736308696148-vzo8h',
     'HondaJankenOverlap'
    ],
    threshold: [
     {
      conditionType: 'match',
      coolDown: 3,
      syoken: 1,
      access: 2,
      gift: 0,
      count: {
       comparison: 'max',
       unit: 'draws',
       value1: 0,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'exact',
       value: ['グー', 'ぐー', '✊️', '👊']
      }
     }
    ]
   },
   'HondaJanken-Scissors': {
    id: 'HondaJanken-Scissors',
    name: 'じゃんけん(チョキ)',
    description: 'あなたの考えてる事ぐらい、俺にはお見通しです。',
    color: '#E8EAF6',
    enableIds: [
     '1736307219773-kver1',
     '1736307533195-0zgu9',
     '1736312527752-twp6c',
     '1736312549989-2bgie',
     'HondaJankenOverlap'
    ],
    threshold: [
     {
      conditionType: 'match',
      coolDown: 3,
      syoken: 1,
      access: 2,
      gift: 0,
      count: {
       comparison: 'max',
       unit: 'draws',
       value1: 0,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'exact',
       value: ['チョキ', 'ちょき', '✌️']
      }
     }
    ]
   },
   'HondaJanken-Paper': {
    id: 'HondaJanken-Paper',
    name: 'じゃんけん(パー)',
    description: 'それで勝てると思ってるんやったら、俺がずっと勝ちますよ!',
    color: '#303F9F',
    enableIds: [
     '1736307602808-op1nj',
     '1736307722566-dtnvq',
     '1736312569324-c90et',
     '1736312586656-grxd6',
     'HondaJankenOverlap'
    ],
    threshold: [
     {
      conditionType: 'match',
      coolDown: 3,
      syoken: 1,
      access: 2,
      gift: 0,
      count: {
       comparison: 'max',
       unit: 'draws',
       value1: 0,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'exact',
       value: ['パー', 'ぱー', '✋️', '🖐️']
      }
     }
    ]
   },
   BomberSpin: {
    id: 'BomberSpin',
    name: 'ボンバースピン',
    description: 'メダルスロットをモチーフにしたおみくじ。目指せ、出玉大爆発!',
    color: '#C62828',
    enableIds: ['BomberSpin-normal', 'BomberSpin-over'],
    threshold: [
     {
      conditionType: 'match',
      coolDown: 3,
      syoken: 1,
      access: 2,
      gift: 0,
      count: {
       comparison: 'max',
       unit: 'draws',
       value1: 0,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'starts',
       value: ['スロット', 'スピン', 'ボンバー', 'ぼんばー', 'すろっと', 'すぴん', 'slot', '🎰', 'Bomber', 'spin']
      }
     }
    ]
   },
   GouseiSuika: {
    id: 'GouseiSuika',
    name: 'スイカジェネレーター',
    description: 'スイカゲーム風のおみくじをコメント1つで。3000点超えなるか!?',
    color: '#8BC34A',
    enableIds: ['GouseiSuika-normal', 'GouseiSuika-over'],
    threshold: [
     {
      conditionType: 'match',
      coolDown: 3,
      syoken: 1,
      access: 2,
      gift: 0,
      count: {
       comparison: 'max',
       unit: 'draws',
       value1: 0,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'starts',
       value: ['すいか', 'スイカ', '合成大西瓜', 'suika', 'suica', '西瓜', '水夏']
      }
     }
    ]
   },
   '1731154889231': {
    id: '1731154889231',
    name: 'ギフト',
    description: 'ギフト(メンバー加入含む)をくださった方へのお礼',
    color: '#FFEB3B',
    enableIds: ['1731155125168-cfu88'],
    threshold: [
     {
      conditionType: 'gift',
      coolDown: 3,
      syoken: 1,
      access: 2,
      gift: 0,
      count: {
       comparison: 'max',
       unit: 'draws',
       value1: 0,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'starts',
       value: ['おみくじ']
      }
     }
    ]
   },
   '1731148078732': {
    id: '1731148078732',
    name: '初見・久しぶり',
    description: 'そのユーザーの配信枠1コメを参照し、初回や久しぶりと挨拶できます。',
    color: '#4CAF50',
    enableIds: ['1731148126492-sqbn5', '1737528424821-qb1ll', '1731149419725-o1ebm'],
    threshold: [
     {
      conditionType: 'syoken',
      coolDown: 3,
      syoken: 4,
      access: 2,
      gift: 0,
      count: {
       comparison: 'max',
       unit: 'draws',
       value1: 0,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'starts',
       value: ['おみくじ']
      }
     }
    ]
   },
   '1730455954261': {
    id: '1730455954261',
    name: 'コメント数チェック',
    description: '配信枠でのコメント数や、個人のコメント数をカウントします',
    color: '#3F51B5',
    enableIds: ['1730456057476-pw29g', '1730456354800-4sj0v'],
    threshold: []
   },
   '1737082284194-09aib': {
    id: '1737082284194-09aib',
    name: '自動投稿',
    description: '',
    color: '#66FFFF',
    enableIds: ['1737082327791-mzyyn'],
    threshold: [
     {
      conditionType: 'match',
      coolDown: 3,
      syoken: 1,
      access: 2,
      gift: 0,
      count: {
       comparison: 'max',
       unit: 'draws',
       value1: 0,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'starts',
       value: ['おみくじ']
      }
     }
    ],
    timerConfig: {
     minutes: 5,
     isBaseZero: true
    }
   }
  },
  omikujis: {
   '1737004587154-e49pa': {
    id: '1737004587154-e49pa',
    name: 'おみくじ:大吉',
    description: '大吉。',
    rank: 0,
    weight: 1,
    threshold: [],
    placeIds: ['1737005028871-ie02o'],
    post: [
     {
      type: 'party',
      botKey: 'marisa',
      iconKey: 'Default',
      delaySeconds: -1,
      party: '',
      content: '!omikuji_huru'
     },
     {
      type: 'party',
      botKey: 'marisa',
      iconKey: 'Default',
      delaySeconds: 0,
      party: '',
      content: '!omikuji_01'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1,
      party: '!レベルアップ',
      content: '<<user>>の運勢は【大吉】<<omikujiA>> '
     }
    ]
   },
   '1737005570029-zu75p': {
    id: '1737005570029-zu75p',
    name: 'おみくじ:吉',
    description: '吉。',
    rank: 0,
    weight: 1,
    threshold: [],
    placeIds: ['1737005022219-orscp'],
    post: [
     {
      type: 'party',
      botKey: 'marisa',
      iconKey: 'Default',
      delaySeconds: -1,
      party: '',
      content: '!omikuji_huru'
     },
     {
      type: 'party',
      botKey: 'marisa',
      iconKey: 'Default',
      delaySeconds: 0,
      party: '',
      content: '!omikuji_02'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1,
      party: '!シャキーン2',
      content: '<<user>>の運勢は【吉】<<omikujiB>> '
     }
    ]
   },
   '1737005576336-xwr6c': {
    id: '1737005576336-xwr6c',
    name: 'おみくじ:中吉',
    description: '中吉。',
    rank: 0,
    weight: 1,
    threshold: [],
    placeIds: ['1737004640649-tbb58'],
    post: [
     {
      type: 'party',
      botKey: 'marisa',
      iconKey: 'Default',
      delaySeconds: -1,
      party: '',
      content: '!omikuji_huru'
     },
     {
      type: 'party',
      botKey: 'marisa',
      iconKey: 'Default',
      delaySeconds: 0,
      party: '',
      content: '!omikuji_03'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1,
      party: '!シーン切り替え1',
      content: '<<user>>の運勢は【中吉】<<omikujiC>> '
     }
    ]
   },
   '1737005723813-esl50': {
    id: '1737005723813-esl50',
    name: 'おみくじ:小吉',
    description: '小吉。',
    rank: 0,
    weight: 1,
    threshold: [],
    placeIds: ['1737005024101-1brq1'],
    post: [
     {
      type: 'party',
      botKey: 'marisa',
      iconKey: 'Default',
      delaySeconds: -1,
      party: '',
      content: '!omikuji_huru'
     },
     {
      type: 'party',
      botKey: 'marisa',
      iconKey: 'Default',
      delaySeconds: 0,
      party: '',
      content: '!omikuji_04'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1,
      party: '!シーン切り替え1',
      content: '<<user>>の運勢は【小吉】<<omikujiD>> '
     }
    ]
   },
   '1737005735661-vmhs4': {
    id: '1737005735661-vmhs4',
    name: 'おみくじ:末吉',
    description: '末吉。',
    rank: 0,
    weight: 1,
    threshold: [],
    placeIds: ['1737005025863-0mghq'],
    post: [
     {
      type: 'party',
      botKey: 'marisa',
      iconKey: 'Default',
      delaySeconds: -1,
      party: '',
      content: '!omikuji_huru'
     },
     {
      type: 'party',
      botKey: 'marisa',
      iconKey: 'Default',
      delaySeconds: 0,
      party: '',
      content: '!omikuji_05'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1,
      party: '!間抜け1',
      content: '<<user>>の運勢は【末吉】<<omikujiE>> '
     }
    ]
   },
   '1737005737628-n529j': {
    id: '1737005737628-n529j',
    name: 'おみくじ:凶',
    description: '凶。',
    rank: 0,
    weight: 1,
    threshold: [],
    placeIds: ['1737005027289-yvsgp'],
    post: [
     {
      type: 'party',
      botKey: 'marisa',
      iconKey: 'Default',
      delaySeconds: -1,
      party: '',
      content: '!omikuji_huru'
     },
     {
      type: 'party',
      botKey: 'marisa',
      iconKey: 'Default',
      delaySeconds: 0,
      party: '',
      content: '!omikuji_06'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1,
      party: '!呪いの旋律',
      content: '<<user>>の運勢は【凶】<<omikujiF>> '
     }
    ]
   },
   '1736247177100-w9ddw': {
    id: '1736247177100-w9ddw',
    name: 'じゃんけん:グーA',
    description: '何事も準備がすべて。それを怠っている事がバレてますよ。',
    rank: 0,
    weight: 35,
    threshold: [],
    status: '',
    script: {
     scriptId: 'WinChan',
     params: {
      isWin: 'false',
      rankCount: '20',
      historyDays: '10',
      getPoint: '0',
      rankMode: '0',
      rankDays: '20'
     }
    },
    placeIds: ['1736236217166-wlg6i'],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1,
      generatorParam: '',
      content: 'じゃんけんぽん!'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1.4,
      content: '!janken_3'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 2.9,
      party: '',
      content: '!janken_lose'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 5,
      party: '!シーン切り替え1',
      generatorParam: 'honda',
      content: '俺の勝ち!<<JankenA1>> '
     }
    ]
   },
   '1736247177903-w9npy': {
    id: '1736247177903-w9npy',
    name: 'じゃんけん:グーB',
    description: 'ちゃんと分析してます?じっくり結果に向き合ってください。',
    rank: 0,
    weight: 3,
    threshold: [],
    status: '',
    script: {
     scriptId: 'WinChan',
     params: {
      isWin: 'false',
      rankCount: '20',
      historyDays: '10',
      getPoint: '0',
      rankMode: '0',
      rankDays: '20'
     }
    },
    placeIds: ['1736247527908-fkygm'],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 1,
      generatorParam: '',
      content: 'じゃんけんぽん!'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1.4,
      content: '!janken_3'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 2.9,
      party: '',
      content: '!janken_lose'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 5,
      party: '!シーン切り替え1',
      generatorParam: 'honda',
      content: '俺の勝ち!<<JankenA2>> '
     }
    ]
   },
   '1736307219773-kver1': {
    id: '1736307219773-kver1',
    name: 'じゃんけん:チョキA',
    description: 'たかがじゃんけん、そう思ってないですか？',
    rank: 0,
    weight: 35,
    threshold: [],
    status: '',
    script: {
     scriptId: 'WinChan',
     params: {
      isWin: 'false',
      getPoint: '0',
      rankMode: '0',
      rankDays: '20',
      historyDays: '10'
     }
    },
    placeIds: ['1736306572601-aod98'],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1,
      generatorParam: '',
      content: 'じゃんけんぽん!'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1.4,
      content: '!janken_1'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 2.9,
      party: '',
      content: '!janken_lose'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 5,
      party: '!シーン切り替え1',
      generatorParam: 'honda',
      content: '俺の勝ち!<<JankenB1>> '
     }
    ]
   },
   '1736307533195-0zgu9': {
    id: '1736307533195-0zgu9',
    name: 'じゃんけん:チョキB',
    description: 'ただの運やと思ってませんか?',
    rank: 0,
    weight: 3,
    threshold: [],
    status: '',
    script: {
     scriptId: 'WinChan',
     params: {
      isWin: 'false',
      getPoint: '0',
      rankMode: '0',
      rankDays: '20',
      historyDays: '10'
     }
    },
    placeIds: ['1736306635501-6o6ak'],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 1,
      generatorParam: '',
      content: 'じゃんけんぽん!'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1.4,
      content: '!janken_1'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 2.9,
      party: '',
      content: '!janken_lose'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 5,
      party: '!シーン切り替え1',
      generatorParam: 'honda',
      content: '俺の勝ち!<<JankenB2>> '
     }
    ]
   },
   '1736307602808-op1nj': {
    id: '1736307602808-op1nj',
    name: 'じゃんけん:パーA',
    description: 'なんで負けたか、明日まで考えといてください。',
    rank: 0,
    weight: 35,
    threshold: [],
    status: '',
    script: {
     scriptId: 'WinChan',
     params: {
      isWin: 'false',
      getPoint: '0',
      rankMode: '0',
      rankDays: '20',
      historyDays: '10'
     }
    },
    placeIds: ['1736306695904-ayv6i'],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1,
      generatorParam: '',
      content: 'じゃんけんぽん!'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1.4,
      content: '!janken_2'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 2.9,
      party: '',
      content: '!janken_lose'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 5,
      party: '!シーン切り替え1',
      generatorParam: 'honda',
      content: '俺の勝ち!<<JankenC1>> '
     }
    ]
   },
   '1736307722566-dtnvq': {
    id: '1736307722566-dtnvq',
    name: 'じゃんけん:パーB',
    description: 'この結果はじゃんけんに対する意識の差です。',
    rank: 0,
    weight: 3,
    threshold: [],
    status: '',
    script: {
     scriptId: 'WinChan',
     params: {
      isWin: 'false',
      getPoint: '0',
      rankMode: '0',
      rankDays: '20',
      historyDays: '10'
     }
    },
    placeIds: ['1736306697517-r26u6'],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 1,
      generatorParam: '',
      content: 'じゃんけんぽん!'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1.4,
      content: '!janken_2'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 2.9,
      party: '',
      content: '!janken_lose'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 5,
      party: '!シーン切り替え1',
      generatorParam: 'honda',
      content: '俺の勝ち!<<JankenC2>> '
     }
    ]
   },
   '1736307931650-wrj7f': {
    id: '1736307931650-wrj7f',
    name: 'じゃんけん:勝利EveryA',
    description: 'でも、今度は絶対、俺が勝つから!また明日やろう!',
    rank: 0,
    weight: 3,
    threshold: [],
    status: '',
    script: {
     scriptId: 'WinChan',
     params: {
      isWin: 'true',
      rankCount: '20',
      historyDays: '10',
      getPoint: '0',
      rankMode: '0',
      rankDays: '20'
     }
    },
    placeIds: ['1736307006905-1yuls', '1736307992233-4f33p'],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1,
      generatorParam: '',
      content: 'じゃんけんぽん!'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1.4,
      content: '!janken_<<JankenWinHand>> '
     },
     {
      type: 'party',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 2.9,
      party: '',
      content: '!janken_win'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 5,
      party: '!シーン切り替え1',
      generatorParam: 'honda',
      content: '俺の負け!<<JankenV>> '
     }
    ]
   },
   '1736308331896-95gld': {
    id: '1736308331896-95gld',
    name: 'じゃんけん:勝利EveryB',
    description: 'やるやん。今日は負けを認めます。ただ、勝ち逃げは許しませんよ。',
    rank: 0,
    weight: 35,
    threshold: [],
    status: '',
    script: {
     scriptId: 'WinChan',
     params: {
      isWin: 'true',
      rankCount: '20',
      historyDays: '10',
      getPoint: '0',
      rankMode: '0',
      rankDays: '20'
     }
    },
    placeIds: ['1736307006905-1yuls', '1736307992233-4f33p'],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 1,
      generatorParam: '',
      content: 'じゃんけんぽん!'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1.4,
      content: '!janken_<<JankenWinHand>> '
     },
     {
      type: 'party',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 2.9,
      party: '',
      content: '!janken_win'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 5,
      party: '!シーン切り替え1',
      generatorParam: 'honda',
      content: '俺の負け!<<JankenV>> '
     }
    ]
   },
   '1736308696148-vzo8h': {
    id: '1736308696148-vzo8h',
    name: 'じゃんけん:勝利AB',
    description: 'でも、今度は絶対、俺が勝つから!また明日やろう!',
    rank: 0,
    weight: 1,
    threshold: [],
    status: '',
    script: {
     scriptId: 'WinChan',
     params: {
      isWin: 'true',
      getPoint: '0',
      rankMode: '0',
      rankDays: '20',
      historyDays: '10'
     }
    },
    placeIds: ['1736307006905-1yuls'],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 1,
      generatorParam: '',
      content: 'じゃんけんぽん!'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1.4,
      content: '!janken_2'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 2.9,
      party: '',
      content: '!janken_win'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 5,
      party: '!シーン切り替え1',
      generatorParam: 'honda',
      content: '俺の負け!<<JankenV>> '
     }
    ]
   },
   '1736312480939-sy2gn': {
    id: '1736312480939-sy2gn',
    name: 'じゃんけん:勝利AA ',
    description: 'でも、今度は絶対、俺が勝つから!また明日やろう!',
    rank: 0,
    weight: 1,
    threshold: [],
    status: '',
    script: {
     scriptId: 'WinChan',
     params: {
      isWin: 'true',
      getPoint: '0',
      rankMode: '0',
      rankDays: '20',
      historyDays: '10'
     }
    },
    placeIds: ['1736307006905-1yuls', '1736307992233-4f33p'],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1,
      generatorParam: '',
      content: 'じゃんけんぽん!'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1.4,
      content: '!janken_2'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 2.9,
      party: '',
      content: '!janken_win'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 5,
      party: '!シーン切り替え1',
      generatorParam: 'honda',
      content: '俺の負け!<<JankenV>> '
     }
    ]
   },
   '1736312527752-twp6c': {
    id: '1736312527752-twp6c',
    name: 'じゃんけん:勝利BA ',
    description: 'でも、今度は絶対、俺が勝つから!また明日やろう!',
    rank: 0,
    weight: 3,
    threshold: [],
    status: '',
    script: {
     scriptId: 'WinChan',
     params: {
      isWin: 'true',
      getPoint: '0',
      rankMode: '0',
      rankDays: '20',
      historyDays: '10'
     }
    },
    placeIds: ['1736307006905-1yuls', '1736307992233-4f33p'],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1,
      generatorParam: '',
      content: 'じゃんけんぽん!'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1.4,
      content: '!janken_3'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 2.9,
      party: '',
      content: '!janken_win'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 5,
      party: '!シーン切り替え1',
      generatorParam: 'honda',
      content: '俺の負け!<<JankenV>> '
     }
    ]
   },
   '1736312549989-2bgie': {
    id: '1736312549989-2bgie',
    name: 'じゃんけん:勝利BB',
    description: 'でも、今度は絶対、俺が勝つから!また明日やろう!',
    rank: 0,
    weight: 3,
    threshold: [],
    status: '',
    script: {
     scriptId: 'WinChan',
     params: {
      isWin: 'true',
      rankCount: '20',
      historyDays: '10',
      getPoint: '0',
      rankMode: '0',
      rankDays: '20'
     }
    },
    placeIds: ['1736307006905-1yuls'],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 1,
      generatorParam: '',
      content: 'じゃんけんぽん!'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1.4,
      content: '!janken_3'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 2.9,
      party: '',
      content: '!janken_win'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 5,
      party: '!シーン切り替え1',
      generatorParam: 'honda',
      content: '俺の負け!<<JankenV>> '
     }
    ]
   },
   '1736312569324-c90et': {
    id: '1736312569324-c90et',
    name: 'じゃんけん:勝利CA',
    description: 'でも、今度は絶対、俺が勝つから!また明日やろう!',
    rank: 0,
    weight: 3,
    threshold: [],
    status: '',
    script: {
     scriptId: 'WinChan',
     params: {
      isWin: 'true',
      rankCount: '20',
      historyDays: '10',
      getPoint: '0',
      rankMode: '0',
      rankDays: '20'
     }
    },
    placeIds: ['1736307006905-1yuls', '1736307992233-4f33p'],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1,
      generatorParam: '',
      content: 'じゃんけんぽん!'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1.4,
      content: '!janken_1'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 2.9,
      party: '',
      content: '!janken_win'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 5,
      party: '!シーン切り替え1',
      generatorParam: 'honda',
      content: '俺の負け!<<JankenV>> '
     }
    ]
   },
   '1736312586656-grxd6': {
    id: '1736312586656-grxd6',
    name: 'じゃんけん:勝利CB',
    description: 'でも、今度は絶対、俺が勝つから!また明日やろう!',
    rank: 0,
    weight: 3,
    threshold: [],
    status: '',
    script: {
     scriptId: 'WinChan',
     params: {
      isWin: 'true',
      rankCount: '20',
      historyDays: '10',
      getPoint: '0',
      rankMode: '0',
      rankDays: '20'
     }
    },
    placeIds: ['1736307006905-1yuls'],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 1,
      generatorParam: '',
      content: 'じゃんけんぽん!'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1.4,
      content: '!janken_1'
     },
     {
      type: 'party',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 2.9,
      party: '',
      content: '!janken_win'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPurple',
      iconKey: 'Default',
      delaySeconds: 5,
      party: '!シーン切り替え1',
      generatorParam: 'honda',
      content: '俺の負け!<<JankenV>> '
     }
    ]
   },
   HondaJankenOverlap: {
    id: 'HondaJankenOverlap',
    name: 'おみくじ被り',
    description: '5秒以内に他の人がおみくじ系のコマンドをした場合、キャンセルされます',
    rank: 10,
    weight: 1,
    threshold: [
     {
      conditionType: 'coolDown',
      coolDown: 3,
      syoken: 1,
      access: 2,
      gift: 0,
      count: {
       comparison: 'max',
       unit: 'draws',
       value1: 0,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'starts',
       value: ['おみくじ']
      }
     }
    ],
    placeIds: [],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 0,
      party: '',
      isSilent: true,
      generatorParam: 'toast',
      content: 'コメントが被って、<<user>>さんのじゃんけんができなかったみたい。もう一度コメントしてね！'
     }
    ]
   },
   'BomberSpin-normal': {
    id: 'BomberSpin-normal',
    name: 'ボンバースピン',
    description: 'メダルスロットをモチーフにしたおみくじ。目指せ、出玉大爆発!',
    rank: 0,
    weight: 1,
    threshold: [],
    script: {
     scriptId: 'BomberSpin',
     params: {
      mode: '0',
      isFruit: 'true',
      isRank: 'true',
      isBomber: 'true'
     }
    },
    placeIds: [],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 2.5,
      party: '!シーン切り替え1',
      content: '<<message>>'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotYellow',
      iconKey: 'concentric',
      delaySeconds: 7,
      party: '!ニュースタイトル表示3',
      isSilent: true,
      generatorParam: 'toast',
      content: '<<user>>の<<payout>>は、<<winsRank>>位だよ。'
     }
    ]
   },
   'BomberSpin-over': {
    id: 'BomberSpin-over',
    name: 'ボンバースピン (回数超過)',
    description: '6回以上はランキングに反映されません',
    rank: 3,
    weight: 1,
    threshold: [
     {
      conditionType: 'count',
      coolDown: 3,
      syoken: 1,
      access: 2,
      gift: 0,
      count: {
       comparison: 'max',
       unit: 'draws',
       value1: 6,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'starts',
       value: ['おみくじ']
      }
     }
    ],
    script: {
     scriptId: 'BomberSpin',
     params: {
      mode: '0',
      isRank: 'false',
      isFruit: 'true',
      isBomber: 'true'
     }
    },
    placeIds: [],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 2.5,
      party: '!シーン切り替え1',
      content: '<<message>>'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotYellow',
      iconKey: 'concentric',
      delaySeconds: 7,
      party: '!ニュースタイトル表示3',
      isSilent: true,
      generatorParam: 'toast',
      content: '<<user>>は5回を超えてるから、参考記録だよ。'
     }
    ]
   },
   'GouseiSuika-normal': {
    id: 'GouseiSuika-normal',
    name: 'スイカジェネレーター',
    description: 'ランキングに入るタイプです',
    rank: 0,
    weight: 1,
    threshold: [],
    script: {
     scriptId: 'GouseiSuika',
     params: {
      mode: '0',
      isFruit: 'true',
      isRank: 'true'
     }
    },
    placeIds: [],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 3.5,
      party: '!シーン切り替え1',
      content: '<<message>>'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotYellow',
      iconKey: 'concentric',
      delaySeconds: 8,
      party: '!ニュースタイトル表示3',
      isSilent: true,
      generatorParam: 'toast',
      content: '<<user>>の<<points>>は、<<winsRank>>位だよ。'
     }
    ]
   },
   'GouseiSuika-over': {
    id: 'GouseiSuika-over',
    name: 'スイカジェネレーター (回数超過)',
    description: '6回以降は、参考記録になります。',
    rank: 3,
    weight: 1,
    threshold: [
     {
      conditionType: 'count',
      coolDown: 3,
      syoken: 1,
      access: 2,
      gift: 0,
      count: {
       comparison: 'max',
       unit: 'draws',
       value1: 6,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'starts',
       value: ['おみくじ']
      }
     }
    ],
    script: {
     scriptId: 'GouseiSuika',
     params: {
      mode: '0',
      isRank: 'false',
      isFruit: 'true'
     }
    },
    placeIds: [],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 3.5,
      party: '!シーン切り替え1',
      content: '<<message>>'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotYellow',
      iconKey: 'concentric',
      delaySeconds: 8,
      party: '!ニュースタイトル表示3',
      isSilent: true,
      generatorParam: 'toast',
      content: '<<user>>は5回を超えてるから、参考記録だよ。'
     }
    ]
   },
   '1730456057476-pw29g': {
    id: '1730456057476-pw29g',
    name: '配信枠:100回',
    description: 'その配信枠のコメント数が100ごとに反応します',
    rank: 1,
    weight: 1,
    threshold: [
     {
      conditionType: 'count',
      coolDown: 3,
      syoken: 1,
      access: 2,
      gift: 0,
      count: {
       comparison: 'loop',
       unit: 'lc',
       value1: 100,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'starts',
       value: ['おみくじ']
      }
     }
    ],
    status: '',
    placeIds: [],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 0,
      party: '!ニュースタイトル表示3',
      content: 'この配信の<<lc>>回目のコメントは、<<user>>さんだよ。'
     }
    ]
   },
   '1730456354800-4sj0v': {
    id: '1730456354800-4sj0v',
    name: '個人総合:100',
    description: '個人の総合コメント数が100ごとに反応します',
    rank: 0,
    weight: 1,
    threshold: [
     {
      conditionType: 'count',
      coolDown: 3,
      syoken: 1,
      access: 2,
      gift: 0,
      count: {
       comparison: 'loop',
       unit: 'tc',
       value1: 100,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'starts',
       value: ['おみくじ']
      }
     }
    ],
    status: '',
    placeIds: [],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 0,
      party: '!ニュースタイトル表示3',
      content: '<<user>>さんのコメントが、<<tc>>回になったよ。'
     },
     {
      type: 'party',
      botKey: 'reimu',
      iconKey: 'Default',
      delaySeconds: 0,
      content: '!ニュースタイトル表示3'
     }
    ]
   },
   '1731148126492-sqbn5': {
    id: '1731148126492-sqbn5',
    name: '初見',
    description: '初めてコメントした方にだけ出るコメント',
    rank: 2,
    weight: 3,
    threshold: [
     {
      conditionType: 'syoken',
      coolDown: 3,
      syoken: 1,
      access: 2,
      gift: 0,
      count: {
       comparison: 'max',
       unit: 'draws',
       value1: 0,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'starts',
       value: ['おみくじ']
      }
     }
    ],
    status: '',
    placeIds: [],
    post: [
     {
      type: 'party',
      botKey: 'reimu',
      iconKey: 'Default',
      delaySeconds: 0,
      content: '!初見'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 1.5,
      party: '!シーン切り替え1',
      content: '<<user>>さん、初見ありがとう!'
     }
    ]
   },
   '1731149419725-o1ebm': {
    id: '1731149419725-o1ebm',
    name: 'こんにちは',
    description: '配信枠の1コメをしたユーザーに対して出てくるコメント',
    rank: 0,
    weight: 1,
    threshold: [
     {
      conditionType: 'syoken',
      coolDown: 3,
      syoken: 3,
      access: 2,
      gift: 0,
      count: {
       comparison: 'max',
       unit: 'draws',
       value1: 0,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'starts',
       value: ['おみくじ']
      }
     }
    ],
    status: '',
    placeIds: [],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 0,
      party: '!シーン切り替え1',
      content: '<<user>>さん、こんにちは!'
     }
    ]
   },
   '1731155125168-cfu88': {
    id: '1731155125168-cfu88',
    name: 'ギフト:default01',
    description: 'ギフト(メンバー加入含む)をしてくださった方へのお礼を、ゆっくり霊夢がしてくれます',
    rank: 0,
    weight: 3,
    threshold: [],
    status: '',
    placeIds: [],
    post: [
     {
      type: 'party',
      botKey: 'reimu',
      iconKey: 'Default',
      delaySeconds: 0,
      content: '!金額表示'
     },
     {
      type: 'party',
      botKey: 'reimu',
      iconKey: 'Default',
      delaySeconds: 0.3,
      content: '!saisen_hako'
     },
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 0.5,
      party: '!レベルアップ',
      content: '<<user>>さんからギフトを頂いたよ!'
     }
    ]
   },
   '1737528424821-qb1ll': {
    id: '1737528424821-qb1ll',
    name: 'ひさしぶり',
    description: '配信が7日間空いたユーザーに対して出てくるコメント',
    rank: 1,
    weight: 1,
    threshold: [
     {
      conditionType: 'syoken',
      coolDown: 3,
      syoken: 2,
      access: 2,
      gift: 0,
      count: {
       comparison: 'max',
       unit: 'draws',
       value1: 0,
       value2: 1
      },
      match: {
       target: 'comment',
       case: 'starts',
       value: ['おみくじ']
      }
     }
    ],
    status: '',
    placeIds: [],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 0,
      party: '!シーン切り替え1',
      content: '<<user>>さん、久しぶり!'
     }
    ]
   },
   '1737082327791-mzyyn': {
    id: '1737082327791-mzyyn',
    name: '自動投稿:チャンネル登録',
    description: '',
    rank: 0,
    weight: 1,
    threshold: [],
    placeIds: ['1737529867562-t9deg'],
    post: [
     {
      type: 'onecomme',
      botKey: 'OmikenBotPink',
      iconKey: 'Default',
      delaySeconds: 0,
      party: '!シーン切り替え1',
      content: '<<autobot01>>'
     }
    ]
   }
  },
  places: {
   '1737004640649-tbb58': {
    id: '1737004640649-tbb58',
    name: 'omikujiC',
    description: '中吉。',
    placeIds: [],
    values: [
     {
      weight: 1,
      value: '安定した運勢です。現状維持を心がけましょう。'
     },
     {
      weight: 1,
      value: '人間関係に気を配り、トラブルを避けるように。'
     },
     {
      weight: 1,
      value: '体調管理を怠らず、リラックスする時間を持つこと。'
     },
     {
      weight: 1,
      value: '自分のスキルを磨くチャンスです。'
     },
     {
      weight: 1,
      value: '慎重に計画を立てて行動しましょう。'
     }
    ]
   },
   '1737005022219-orscp': {
    id: '1737005022219-orscp',
    name: 'omikujiB',
    description: '吉。',
    placeIds: [],
    values: [
     {
      weight: 1,
      value: '良い運勢です。日常の小さな幸せに感謝しましょう。'
     },
     {
      weight: 1,
      value: '問題があっても冷静に対処すれば解決できます。'
     },
     {
      weight: 1,
      value: '友人や家族との時間を大切にしてください。'
     },
     {
      weight: 1,
      value: '睡眠と栄養を十分に取ることが大切です。'
     },
     {
      weight: 1,
      value: '仕事や勉強に集中して成果を出しましょう。'
     }
    ]
   },
   '1737005024101-1brq1': {
    id: '1737005024101-1brq1',
    name: 'omikujiD',
    description: '小吉。',
    placeIds: [],
    values: [
     {
      weight: 1,
      value: '小さな幸運があります。感謝の気持ちを忘れずに。'
     },
     {
      weight: 1,
      value: '周りの人との協力が大切です。'
     },
     {
      weight: 1,
      value: '無理せず、休息を取ることが必要です。'
     },
     {
      weight: 1,
      value: '自分のペースで物事を進めましょう。'
     },
     {
      weight: 1,
      value: '健康に気をつけ、適度な運動を心がけてください。'
     }
    ]
   },
   '1737005025863-0mghq': {
    id: '1737005025863-0mghq',
    name: 'omikujiE',
    description: '末吉。',
    placeIds: [],
    values: [
     {
      weight: 1,
      value: 'これから運気が上昇します。焦らずに進んでください。'
     },
     {
      weight: 1,
      value: '小さな成功を積み重ねていくことが大切です。'
     },
     {
      weight: 1,
      value: '周りの人のサポートを受け入れましょう。'
     },
     {
      weight: 1,
      value: '体調に気を配り、無理をしないように。'
     },
     {
      weight: 1,
      value: 'ポジティブな考え方を持つことが大切です。'
     }
    ]
   },
   '1737005027289-yvsgp': {
    id: '1737005027289-yvsgp',
    name: 'omikujiF',
    description: '凶。',
    placeIds: [],
    values: [
     {
      weight: 1,
      value: '注意が必要な日です。無理をせず、慎重に行動しましょう。'
     },
     {
      weight: 1,
      value: '問題があっても冷静に対応し、解決策を見つけましょう。'
     },
     {
      weight: 1,
      value: '休息をしっかりとり、体調管理を心がけてください。'
     },
     {
      weight: 1,
      value: '周りの人と協力して困難を乗り越えましょう。'
     },
     {
      weight: 1,
      value: 'ポジティブな気持ちを持ち続けることが大切です。'
     }
    ]
   },
   '1737005028871-ie02o': {
    id: '1737005028871-ie02o',
    name: 'omikujiA',
    description: '大吉。',
    placeIds: [],
    values: [
     {
      weight: 1,
      value: '今日の運勢は最高です！目標に向かって大胆に進みましょう。'
     },
     {
      weight: 1,
      value: 'チャンスが訪れます。逃さずに掴んでください。'
     },
     {
      weight: 1,
      value: '周りの人に感謝の気持ちを忘れずに。'
     },
     {
      weight: 1,
      value: '健康運も好調です。新しい運動を始めてみては？'
     },
     {
      weight: 1,
      value: '積極的に新しいことに挑戦しましょう。'
     }
    ]
   },
   '1736236217166-wlg6i': {
    id: '1736236217166-wlg6i',
    name: 'JankenA1',
    description: '負けは次につながるチャンスです!ネバーギブアップ!',
    placeIds: [],
    values: [
     {
      weight: 1,
      value: '負けは次につながるチャンスです!ネバーギブアップ!'
     },
     {
      weight: 1,
      value: 'じゃんけんの向こう側に何があるか、考えてみてください。'
     },
     {
      weight: 1,
      value: 'いい勝負でしたね!でも結果が伴わないと、全く意味がありません。'
     },
     {
      weight: 1,
      value: '何事も準備がすべて。それを怠っている事がバレてますよ。'
     }
    ]
   },
   '1736247527908-fkygm': {
    id: '1736247527908-fkygm',
    name: 'JankenA2',
    description: 'ケイスケ ホンダの心なんて読めるわけがない、そう思ってないですか。',
    placeIds: ['1736306125063-3lqal'],
    values: [
     {
      weight: 1,
      value:
       '<<JankenHonda>> の心なんて読めるわけがない、そう思ってないですか。あきらめへん人だけに見える景色があるはずです。'
     },
     {
      weight: 1,
      value: 'ちゃんと分析してます?じっくり結果に向き合ってください。'
     },
     {
      weight: 1,
      value: 'ここは練習ではありません。全身全霊で俺と向き合ってください。'
     }
    ]
   },
   '1736306125063-3lqal': {
    id: '1736306125063-3lqal',
    name: 'JankenHonda',
    description: '僕にじゃんけんで勝ったら、1本あげますよ。',
    placeIds: [],
    values: [
     {
      weight: 1,
      value: 'ケイスケ ホンダ'
     }
    ]
   },
   '1736306572601-aod98': {
    id: '1736306572601-aod98',
    name: 'JankenB1',
    description: '運を味方につけるのは、地道な努力ですよ。',
    placeIds: [],
    values: [
     {
      weight: 1,
      value: 'たかがじゃんけん、そう思ってないですか？それやったら明日も、俺が勝ちますよ。'
     },
     {
      weight: 1,
      value: 'ウラのウラのウラまで読む訓練をしてくださいね。どこまで読もうとするかで結果が変わってきます。'
     },
     {
      weight: 1,
      value: '運を味方につけるのは、地道な努力ですよ。'
     },
     {
      weight: 1,
      value: 'あなたの考えてる事ぐらい、俺にはお見通しです。'
     }
    ]
   },
   '1736306635501-6o6ak': {
    id: '1736306635501-6o6ak',
    name: 'JankenB2',
    description: 'その程度の、気持ちで勝てるとでも思ったんですか?',
    placeIds: [],
    values: [
     {
      weight: 1,
      value: '自信を持って勝負にしっかりと向き合える、そう思えるまで、準備してください。'
     },
     {
      weight: 1,
      value: 'ただの運やと思ってませんか?運も実力のうち!聞いたことありますよね?'
     },
     {
      weight: 1,
      value: 'その程度の、気持ちで勝てるとでも思ったんですか?ちゃんと練習してきてください。'
     }
    ]
   },
   '1736306695904-ayv6i': {
    id: '1736306695904-ayv6i',
    name: 'JankenC1',
    description: 'どんな事でも絶対に勝つんや!というメンタリティーが大事ですよ。',
    placeIds: [],
    values: [
     {
      weight: 1,
      value: 'なんで負けたか、明日まで考えといてください。そしたら何かが見えてくるはずです。'
     },
     {
      weight: 1,
      value: 'どんな事でも絶対に勝つんや!というメンタリティーが大事ですよ。'
     },
     {
      weight: 1,
      value: '動揺してませんか?運が大事な時こそ集中力が物を言いますよ!'
     },
     {
      weight: 1,
      value: 'それで勝てると思ってるんやったら、俺がずっと勝ちますよ!'
     }
    ]
   },
   '1736306697517-r26u6': {
    id: '1736306697517-r26u6',
    name: 'JankenC2',
    description: '複雑に考えてないですか?答えはシンプルです。',
    placeIds: ['1736306125063-3lqal'],
    values: [
     {
      weight: 1,
      value: '複雑に考えてないですか?答えはシンプルです。<<JankenHonda>> の心を読む、それだけです。'
     },
     {
      weight: 1,
      value: '正確にはじゃんけんを味方につけた俺の勝ち!'
     },
     {
      weight: 1,
      value: '1年間何やってたんですか？この結果はじゃんけんに対する意識の差です。'
     }
    ]
   },
   '1736307006905-1yuls': {
    id: '1736307006905-1yuls',
    name: 'JankenV',
    description: 'やるやん。明日は俺にリベンジさせて。',
    placeIds: [],
    values: [
     {
      weight: 1,
      value: 'やるやん。明日は俺にリベンジさせて。'
     },
     {
      weight: 1,
      value: 'でも、今度は絶対、俺が勝つから!また明日やろう!'
     },
     {
      weight: 1,
      value: '明日、俺が勝つからまたやろう!'
     },
     {
      weight: 1,
      value: 'やるやん。今日は負けを認めます。ただ、勝ち逃げは許しませんよ。'
     }
    ]
   },
   '1736307992233-4f33p': {
    id: '1736307992233-4f33p',
    name: 'JankenWinHand',
    description: '!janken_ に続く数値。1:グー2:チョキ3:パー4:I Love You',
    placeIds: [],
    values: [
     {
      weight: 1,
      value: '1'
     },
     {
      weight: 1,
      value: '2'
     },
     {
      weight: 1,
      value: '3'
     },
     {
      weight: 1,
      value: '4'
     }
    ]
   },
   '1737529867562-t9deg': {
    id: '1737529867562-t9deg',
    name: 'autobot01',
    description: '自動投稿用プレースホルダー',
    placeIds: [],
    values: [
     {
      weight: 4,
      value: 'チャンネル登録・高評価を押すと、配信主が喜びます。よろしくね。'
     },
     {
      weight: 4,
      value: '旧twitterで配信告知してます。フォローしてね！'
     },
     {
      weight: 2,
      value: 'Discordで活動中！配信主はいつも入ってます。メンバーになって主と話そう！'
     }
    ]
   }
  }
 },
 Visits: {},
 Games: {},
 store: undefined
};
