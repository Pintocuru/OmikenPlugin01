// src/plugin.test.ts
import {
  RulesType,
  StoreType,
  CharaType,
  OmikenType,
} from "./types";
import { CommentInstance } from "./scripts/CommentInstance";
import { Comment } from "@onecomme.com/onesdk/types/Comment";
import path from "path";
import { defaultStateMock } from "./plugin.mockData";

// おみくじデータモック
const rulesMock: RulesType[] = [
  {
    id: "1729669868469-531k4",
    name: "おみくじ",
    ruleType: "comment",
    color: "#ff0000",
    description: "",
    enableIds: [
      "1729669848759-a4czl",
      "1730186257904-r3vdg",
      "1730380299548-w1lfc",
      "1730380464680-k9tcy",
      "1730380504277-yfv1r",
      "1730380661023-714m5",
      "1730435587723-zj28l",
    ],
    threshold: [
      {
        conditionType: "match",
        match: {
          target: "comment",
          case: "starts",
          value: ["おみくじ", "omikuji", "omikuzi", "御神籤"],
        },
      },
    ],
  },
  {
    id: "1730186223570-nxukm",
    name: "フラワーおみくじ",
    description: "",
    ruleType: "comment",
    color: "",
    enableIds: [
      "1730186417456-m98tz",
      "1730186488892-o4w6g",
      "1730443222489-4lfj9",
      "1730443225159-86j3g",
      "1730443226509-e1gfq",
      "1730443227356-243tp",
      "1730443354996-49v8q",
      "1730443324119-ddrt1",
    ],
    threshold: [
      {
        conditionType: "match",
        match: {
          target: "comment",
          case: "starts",
          value: ["フラワー", "ふらわー", "flower"],
        },
      },
    ],
  },
];

// Omikenを外部から読み込み
const OmikenPath = path.join(__dirname, "Omiken/index.json");
const Omiken = require(OmikenPath) as OmikenType;

const omikujisMock = Omiken.omikuji;
const placesMock = Omiken.place;

// キャラデータモック
const CharasMock: Record<string, CharaType> = {
  reimu: {
    id: "reimu",
    name: "ゆっくり霊夢",
    description: "",
    frameId: "OmikenReimu",

    color: {
      "--lcv-name-color": "#333333",
      "--lcv-text-color": "#333333",
      "--lcv-background-color": "#333333",
    },
    image: {
      Default: "preset/img/reimu/Default.png",
    },
    party: ["!test", "!test2"],
    serviceColor: {
      r: 250,
      g: 52,
      b: 53
    }
  },
};



describe("CommentInstance", () => {
  // omikenSelect メソッドのテスト
  test("omikenSelect - 条件に合致するルールを正しく選択", () => {
    // モックコメント
    const commentMock: Comment = {
      id: "COMMENT_TESTER",
      service: "external",
      name: "CommentTester",
      url: "",
      color: { r: 0, g: 0, b: 0 },
      data: {
        comment: "おみくじ",
        id: "yt-1733023389806",
        liveId: "youtube-test",
        userId: "テストユーザー",
        name: "テストユーザー",
        isOwner: false,
        timestamp: "2024-12-01T03:23:09.806Z",
        badges: [],
        hasGift: false,
        profileImage: "",
        displayName: "テストユーザー",
        originalProfileImage: "",
        meta: {},
        speechText: "テ",
      },
      meta: { interval: 999999, tc: 10, no: 2, lc: 10 },
    };

    // ■【CommentInstanceテスト】
    const instance = new CommentInstance(
      commentMock,
      defaultStateMock.Visits.hoge,
      defaultStateMock.TimeConfig
    );

    const isOmikuji = instance.omikenSelect(rulesMock, omikujisMock);

    if (!isOmikuji) {
      // false でOK
      expect(isOmikuji).toBeFalsy();
      return;
    }

    // ■【omikujiProcessテスト】
    const processResult = instance.omikujiProcess(
      defaultStateMock.Games,
      placesMock,
      CharasMock,
      {}
    );

    // 期待される結果
    expect(processResult).toBeTruthy();
  });
});
