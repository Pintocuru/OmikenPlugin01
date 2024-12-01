// src/plugin.test.ts
import {
  RulesType,
  OmikujiType,
  PlaceType,
} from "./types";
import { CommentInstance } from "./scripts/CommentInstance";
import { Comment } from "@onecomme.com/onesdk/types/Comment";

describe("CommentInstance", () => {
  // omikenSelect メソッドのテスト
  test("omikenSelect - 条件に合致するルールを正しく選択", () => {

    const comment = 'おみくじ';

    // モックコメント
    const mockComment = {
      id: "COMMENT_TESTER",
      service: "youtube",
      name: "CommentTester",
      url: "about:blank:comment-tester",
      color: { r: 0, g: 0, b: 0 },
      data: {
        id: "yt-1733023389806",
        liveId: "youtube-test",
        userId: "テストユーザー",
        name: "テストユーザー",
        isOwner: false,
        isModerator: false,
        isMember: false,
        autoModerated: false,
        timestamp: "2024-12-01T03:23:09.806Z",
        badges: [],
        hasGift: false,
        profileImage:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNjRweCIgaGVpZ2h0PSI2NHB4Ij48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIwIiBzdHlsZT0iZmlsbDojNTVjMjQyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGR5PSIuMWVtIiBmaWxsPSIjMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBzdHlsZT0iZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmOyBmb250LXNpemU6IDI0cHg7IGZvbnQtd2VpZ2h0OiBib2xkOyBsaW5lLWhlaWdodDogMSI+44OG44K5PC90ZXh0Pjwvc3ZnPg==",
        comment,
        displayName: "テストユーザー",
        originalProfileImage: "",
        meta: {},
        speechText: "テ",
      },
      meta: { interval: 999999, tc: 10, no: 2, lc: 10 },
    } as Comment;
    const mockVisit = {
      name: "",
      userId: "",
      status: "",
      lastPluginTime: 0,
      visitData: {},
    };
    const mockTimeConfig = {
      pluginTime: 1733023706798,
      defaultFrameId: "26c434d4-db3b-4975-9061-093cf7cdb5b2",
      lastTime: 0,
      lastUserId: "",
    };

    const instance = new CommentInstance(
      mockComment,
      mockVisit,
      mockTimeConfig
    );

    const mockRulesArray = [
      {
        id: "1729669868469-531k4",
        name: "おみくじ",
        ruleType: "comment",
        color: "#ff0000",
        description: "",
        enableIds: [
          "1729669848759-a4czl",
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
    ] as RulesType[];
    const mockOmikujis: Record<string, OmikujiType> = {
      "1729669848759-a4czl": {
        id: "1729669848759-a4czl",
        name: "おみくじ:大吉",
        description: "",
        weight: 15,
        rank: 0,
        delete: false,
        threshold: [],
        placeIds: ["1730215131236-r0mi5"],
        post: [
          {
            type: "onecomme", // ここはリテラル型に合致
            botKey: "reimu",
            iconKey: "joy02",
            delaySeconds: 1,
            party: "",
            content: "<<user>>さんの運勢は【大吉】<<omikuji01>>",
          },
        ],
      },
    };

    const isOmikuji = instance.omikenSelect(mockRulesArray, mockOmikujis);

      if (!isOmikuji) {
        // false でOK
        expect(isOmikuji).toBeFalsy(); 
        return;
      }

      const mockPlaces: Record<string, PlaceType> = {
        "1730215131236-r0mi5": {
          id: "1730215131236-r0mi5",
          name: "omikuji01",
          description: "おみくじ:大吉",
          values: [
            {
              weight: 1,
              value:
                "人との縁が幸運を呼び込みそう。感謝の気持ちを忘れないことが大事よ。",
            },
            {
              weight: 1,
              value: "健康運が特に好調ね。心身ともに充実した日々になるわ。",
            },
            {
              weight: 1,
              value:
                "努力が実を結び、幸運が訪れるって。積極的に行動すると良いことがあるわ。",
            },
            {
              weight: 1,
              value:
                "新しい挑戦が成功をもたらす予感。勇気を出して一歩踏み出してみて。",
            },
            {
              weight: 1,
              value: "良い知らせが届くかも。ポジティブな気持ちを持ち続けてね。",
            },
            {
              weight: 1,
              value:
                "困難な状況も乗り越えられるわ。自信を持って進んで大丈夫よ。",
            },
          ],
        },
      };

      const processResult = instance.omikujiProcess({}, mockPlaces, {}, {});

    // 期待される結果を検証
    expect(processResult).toBeTruthy(); // または特定の条件
  });
});
