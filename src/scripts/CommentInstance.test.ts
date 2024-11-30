// src/scripts/CommentInstance.test.ts
import { CommentInstance } from "./CommentInstance";
import { Comment } from "@onecomme.com/onesdk/types/Comment";
import {
  CommentOmiken,
  OmikenType,
  VisitType,
  GameType,
  PlaceType,
  PresetCharaType,
  PresetScriptType,
} from "../types/index";

// Mock external dependencies
jest.mock("./PostOmikuji", () => ({
  postOneComme: jest.fn(),
  postWordParty: jest.fn(),
  postSpeech: jest.fn(),
}));

describe("CommentInstance", () => {
  let mockComment: Comment;
  let mockVisit: VisitType;
  let mockAppSettings: any;
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
         isModerator: false, // モデレーターでない
         comment: "This is a test comment.", // コメント内容
         hasGift: false, // ギフトがあるかどうか
         id: "456", // コメントID
         liveId: "789", // ライブID
         name: "Test User", // 名前
         profileImage: "http://example.com/profile.jpg", // プロフィール画像のURL
         timestamp: new Date().toISOString(), // タイムスタンプ
         userId: "1234", // ユーザーID
         badges: [], // 必須プロパティ: 空の配列や適切なデータを設定
         origin: "chat", // 追加されたプロパティ
         screenName: "testUserScreen", // 追加されたプロパティ
       },
       meta: {
         tc: 123,
         no: 1,
         lc: 456,
       },
     };
    mockVisit = {
      name: "TestUser",
      userId: "user123",
      status: "syoken",
      lastPluginTime: "",
      visitData: {},
    };

    mockAppSettings = {};

    mockOmiken = {
      rules: {
        rule1: {
          id: "rule1",
          name: "Test Rule",
          description: "Test Description",
          color: "#333333",
          ruleType: "comment",
          threshold: [
            {
              conditionType: "match",
              match: {
                target: "comment",
                case: "starts",
                value: ["test"],
              },
            },
          ],
          enableIds: ["omikuji1"],
        },
      },
      rulesOrder: ["rule1"],
      omikuji: {
        omikuji1: {
          id: "omikuji1",
          name: "Test Omikuji",
          description: "",
          rank: 0,
          delete: false,
          weight: 1,
          threshold: [],
          post: [
            {
              type: "onecomme",
              content: "<<user>>テスト投稿",
              botKey: "test",
              iconKey: "test",
              delaySeconds: 0,
              party: "",
            },
          ],
          placeIds: [],
          status: "test-status",
        },
      },
      place: {
        user: {
          id: "user",
          name: "",
          description: "",
          values: [
            {
              value: "TestUser",
              weight: 1,
            },
          ],
        },
      },
    };
  });

  describe("constructor", () => {
    it("should initialize CommentInstance correctly", () => {
      const commentInstance = new CommentInstance(
        mockComment,
        mockVisit,
        mockAppSettings
      );

      // You might want to add specific assertions based on the constructor logic
      expect(commentInstance).toBeTruthy();
    });
  });

  describe("omikenSelect", () => {
    it("should select an omikuji based on rules", () => {
      const commentInstance = new CommentInstance(
        mockComment,
        mockVisit,
        mockAppSettings
      );

      const result = commentInstance.omikenSelect(mockOmiken);

      expect(result).toBeTruthy();
    });
  });

  describe("postProcess", () => {
    it("should process and post omikuji", async () => {
      const commentInstance = new CommentInstance(
        mockComment,
        mockVisit,
        mockAppSettings
      );

      // First, select an omikuji
      commentInstance.omikenSelect(mockOmiken);

      const mockGame: GameType = {
        id: "rule1",
        draws: 0,
        totalDraws: 0,
        gameData: {},
      };

      const mockPlace: PlaceType = {
        id: "user",
        name: "",
        description: "",
        values: [
          {
            value: "TestUser",
            weight: 1,
          },
        ],
      };

      const mockCharas: Record<string, PresetCharaType> = {};
      const mockScripts: Record<string, PresetScriptType> = {};

      const result = await commentInstance.postProcess(
        mockGame,
        mockPlace,
        mockCharas,
        mockScripts
      );

      expect(result).toHaveProperty("toastArray");
      expect(result).toHaveProperty("isComment");
    });
  });

  describe("getDATA", () => {
    it("should return correct data based on input", () => {
      const commentInstance = new CommentInstance(
        mockComment,
        mockVisit,
        mockAppSettings
      );

      expect(commentInstance.getDATA("userId")).toBe("user123");
    });
  });
});
