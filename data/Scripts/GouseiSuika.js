"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const WinChan_1 = __importDefault(require("./WinChan"));
const SCRIPTPARAMS = [
    {
        id: 'mode',
        name: 'モード',
        description: '0:スイカゲーム/1:カボチャゲーム/2:クジラゲーム',
        type: 'number',
        value: 0
    },
    {
        id: 'isRank',
        name: '結果をランキングに入れるか',
        description: 'OFFなら、ランキングに影響を与えません',
        type: 'boolean',
        value: true
    },
    {
        id: 'isFruit',
        name: 'フルーツをWordPartyで降らせるか',
        description: '1:降らせる/0:OFF 別途専用WordPartyが必要です',
        isEver: true,
        type: 'boolean',
        value: true
    }
];
const PLACEHOLDERS = [
    {
        id: 'message',
        name: '標準メッセージ',
        description: 'デフォルトのスイカジェネレーターの返答',
        value: 'userの得点は1500!'
    },
    {
        id: 'points',
        name: 'ポイント',
        description: 'スイカジェネレーターの得点を返します',
        value: '1500'
    },
    {
        id: 'winsRank',
        name: '順位',
        description: '今回の順位を返します',
        value: '3'
    }
];
const plugin = {
    id: 'GouseiSuika',
    name: 'スイカジェネレーター',
    description: '米兜科技 合成大西瓜風のおみくじ',
    version: '0.0.3',
    author: 'Pintocuru',
    tags: ['ポイント', 'ランキング', 'スイカ'],
    url: '',
    banner: '',
    func: (game, comment, params) => {
        const { mode, isFruit, isRank } = params;
        let currentMode = 'suika';
        if (mode === 1)
            currentMode = 'kabo';
        if (mode === 2)
            currentMode = 'kujira';
        const user = comment.data.displayName;
        const { points, postArray } = playGacha(GAME_CONFIGS, currentMode);
        const winParams = {
            getPoint: points,
            isRank,
            rankMode: 2,
            rankDays: 20,
            historyDays: 10
        };
        const result = WinChan_1.default.func(game, comment, winParams);
        const { winsRank } = result.placeholder;
        return {
            postArray: isFruit ? postArray : [],
            placeholder: {
                message: `${user}の得点は${points}!`,
                points,
                winsRank
            },
            game: result.game
        };
    },
    scriptParams: SCRIPTPARAMS,
    placeholders: PLACEHOLDERS
};
exports.default = plugin;
const GAME_CONFIGS = {
    suika: {
        small: [
            { chance: 67, times: 15, points: 1, party: '🍓' },
            { chance: 50, times: 15, points: 3, party: '🍇' },
            { chance: 50, times: 10, points: 10, party: '🍊' },
            { chance: 50, times: 8, points: 20, party: '🦪' },
            { chance: 67, times: 5, points: 50, party: '🍎' }
        ],
        big: [
            { chance: 25, points: 300, damage: 1, party: '🍐' },
            { chance: 25, points: 400, damage: 1, party: '🍍' },
            { chance: 33, points: 500, damage: 2, party: '🍑' },
            { chance: 33, points: 700, damage: 2, party: '🍈' },
            { chance: 50, points: 1000, damage: 3, party: '🍉' },
            { chance: 100, points: 1000, damage: 0, party: '🍉' }
        ]
    },
    kabo: {
        small: [
            { chance: 67, times: 15, points: 1, party: '🍓' },
            { chance: 50, times: 15, points: 3, party: '🍇' },
            { chance: 50, times: 10, points: 10, party: '🍊' },
            { chance: 50, times: 8, points: 20, party: '🦪' },
            { chance: 67, times: 5, points: 50, party: '🍎' }
        ],
        big: [
            { chance: 25, points: 150, damage: 0, party: '🍬' },
            { chance: 33, points: 300, damage: 1, party: '🍐' },
            { chance: 33, points: 400, damage: 1, party: '🍍' },
            { chance: 33, points: 500, damage: 2, party: '🍑' },
            { chance: 33, points: 700, damage: 2, party: '🍈' },
            { chance: 50, points: 1000, damage: 3, party: '🍉' },
            { chance: 50, points: 1000, damage: 0, party: '🍉' },
            { chance: 100, points: 1200, damage: 0, party: '🎃' }
        ]
    },
    kujira: {
        small: [
            { chance: 50, times: 5, points: 11, party: '!クマノミ' },
            { chance: 50, times: 5, points: 22, party: '!クラゲ' },
            { chance: 50, times: 5, points: 33, party: '!フグ' },
            { chance: 50, times: 5, points: 44, party: '!カニ' },
            { chance: 50, times: 5, points: 55, party: '!マグロ、ご期待ください' }
        ],
        big: [
            { chance: 33, points: 300, damage: 1, party: '!ウミガメ' },
            { chance: 33, points: 350, damage: 1, party: '!マンボウ' },
            { chance: 33, points: 400, damage: 1, party: '!ジンベエザメ' },
            { chance: 33, points: 450, damage: 1, party: '!シャチ' },
            { chance: 100, points: 500, damage: 0, party: '!クジラ' }
        ]
    }
};
function playGacha(items, currentMode = 'suika') {
    let totalPoints = 0;
    const postArray = [
        { type: 'party', delaySeconds: 1, content: '🍒' },
        { type: 'party', delaySeconds: 8.5, content: '!パパッ' }
    ];
    const smallItems = items[currentMode].small;
    smallItems.forEach((item) => {
        const { pointsEarned, wins } = runItemLottery(item);
        totalPoints += pointsEarned;
        const halfWins = Math.floor(wins / 2);
        for (let i = 0; i < halfWins; i++) {
            postArray.push({ type: 'party', delaySeconds: 1, content: item.party });
        }
    });
    let life = 3;
    const bigItems = items[currentMode].big;
    while (life > 0) {
        const selectedItem = bigItems.find((item) => item.chance > Math.random() * 100);
        if (selectedItem) {
            totalPoints += selectedItem.points;
            life -= selectedItem.damage;
            postArray.push({ type: 'party', delaySeconds: 1, content: selectedItem.party });
        }
        bigItems.forEach((item) => {
            if (item.damage && 3 - item.damage > Math.random() * 6) {
                postArray.push({ type: 'party', delaySeconds: 1, content: item.party });
            }
        });
    }
    const finalPoints = Math.ceil(totalPoints * (0.7 + Math.random() * 0.6));
    return { points: finalPoints, postArray };
}
function runItemLottery(item) {
    let pointsEarned = 0;
    let wins = 0;
    for (let i = 0; i < item.times; i++) {
        if (Math.random() * 100 < item.chance) {
            pointsEarned += item.points;
            wins++;
        }
    }
    return { pointsEarned, wins };
}
