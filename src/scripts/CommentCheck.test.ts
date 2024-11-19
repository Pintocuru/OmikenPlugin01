// src/scripts/CommentCheck.test.js
import { handleFilterComment, validateComment } from "./CommentCheck";
import { BaseComment, OmikenType } from "../types/types";

describe("CommentCheck", () => {
  let mockComment: BaseComment;
  let mockOmiken: OmikenType;

  beforeEach(() => {
    mockComment = {
      color: { r: 255, g: 0, b: 0 }, // RGBColor 型に合わせた値（赤色）
      id: "123",
      name: "Test Name",
      service: "twitch", // ServiceList に含まれる値を指定
      url: "http://example.com",
      data: {
        displayName: "testUser", // 表示名
        isOwner: false, // 所有者でない
        isMember: false, // メンバーかどうか
        isModerator: false, // モデレーターでない
        comment: "This is a test comment.", // コメント内容
        hasGift: false, // ギフトがあるかどうか
        id: "456", // コメントID
        liveId: "789", // ライブID
        name: "Test User", // 名前
        profileImage: "http://example.com/profile.jpg", // プロフィール画像のURL
        timestamp: new Date().toISOString(), // タイムスタンプ
        userId: "1234", // ユーザーID
      },
      meta: {
        tc: 123,
        no: 1,
        lc: 456,
      },
    };

    mockOmiken = {
      rules: {
        rule1: {
          threshold: {
            conditionType: "match",
            match: ["test"],
          },
          enabledIds: ["omikuji1"],
          color: "",
          id: "",
          name: "",
          description: "",
        },
      },
      rulesOrder: ["rule1"],
      omikuji: {
        omikuji1: {
          id: "omikuji1",
          name: "おみくじテスト",
          weight: 1,
          threshold: {
            conditionType: "none",
          },
          post: [
            {
              type: "onecomme",
              content: "<<user>>テスト投稿",
              botKey: "test",
              iconKey: "test",
              delaySeconds: 0,
            },
          ],
          description: "",
        },
      },
      place: {
        user: {
          id: "user",
          name: "",
          description: "",
          isWeight: false,
          values: [
            {
              value: "testUser",
              weight: 1,
            },
          ],
        },
      },
      preferences:{
        basicDelay: 0,
        omikujiCooldown: 0,
        commentDuration: 0,
        BotUserIDname: ""
      },
    };
  });

  describe("handleFilterComment", () => {
    test("正常系: コメント処理が成功する", async () => {
      const result = await handleFilterComment(mockComment, mockOmiken);
      expect(result).toBeTruthy();
      expect(result?.omikenToast).toBeDefined();
    });
  });

  describe("validateComment", () => {
    test("初期化されていないomikenToastを初期化する", async () => {
      const comment = { ...mockComment, omikenToast: undefined };
      const result = await validateComment(comment);
      expect(result).toBeTruthy();
      expect(comment.omikenToast).toEqual([]);
    });

  });
});