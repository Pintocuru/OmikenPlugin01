// src/main.test.ts
import { OnePlugin } from "@onecomme.com/onesdk/types/Plugin";
import { Service } from "@onecomme.com/onesdk/types/Service";
import { UserNameData } from "@onecomme.com/onesdk/types/UserData";
import ElectronStore from "electron-store";
import { CommentOmiken, OmikenType, VisitType, GameType } from "./types/index";

// モジュールをモックでインポート
jest.mock("./scripts/CommentInstance", () => ({
  CommentInstance: jest.fn().mockImplementation(() => ({
    resetVisit: jest.fn(),
    omikenSelect: jest.fn().mockReturnValue(true),
    getDATA: jest.fn().mockImplementation((key) => {
      switch (key) {
        case "ruleId":
          return "rule1";
        case "userId":
          return "user123";
        case "visit":
          return {
            /* モックのVisitデータ */
          };
        default:
          return null;
      }
    }),
  })),
}));

jest.mock("./scripts/CommentCheck", () => ({
  handleFilterComment: jest.fn(),
}));

describe("OnePlugin - filterComment", () => {
  let plugin: OnePlugin;
  let mockStore: ElectronStore;
  let mockComment: CommentOmiken;
  let mockService: Service;
  let mockUserData: UserNameData;

  beforeEach(() => {
    // モックデータの初期化
    mockStore = {
      get: jest.fn(),
      set: jest.fn(),
    } as any;

    mockComment = {
      id: "test-comment",
      service: "twitch",
      data: {
        userId: "user123",
        displayName: "TestUser",
      },
    } as CommentOmiken;

    mockService = {
      id: "service1",
      name: "Test Service",
    };

    mockUserData = {
      userId: "user123",
      userName: "TestUser",
    };

    // プラグインの初期化
    plugin = require("./main");

    // 必要な初期化メソッドをモック
    plugin.init({
      store: mockStore,
      dir: "",
      filepath: ""
    }, {});

    // モックデータの設定
    (plugin.store.get as jest.Mock).mockImplementation((key) => {
      switch (key) {
        case "Omiken":
          return {
            rules: [{ ruleType: "comment" }],
            preferences: { omikujiCooldown: 3 },
          };
        case "Visits":
          return { user123: {} };
        case "Games":
          return {};
        case "AppSettings":
          return { lastTime: 0 };
        default:
          return {};
      }
    });
  });

  describe("filterComment", () => {
    it("FirstCounterからのコメントは通過する", async () => {
      mockComment.data.userId = "FirstCounter";
      const result = await plugin.filterComment(
        mockComment,
        mockService,
        mockUserData
      );
      expect(result).toBe(mockComment);
    });

    it("おみくじ選択が失敗した場合はコメントをそのまま返す", async () => {
      // omikenSelectがfalseを返すようにモック
      const CommentInstance =
        require("./scripts/CommentInstance").CommentInstance;
      CommentInstance.mockImplementationOnce(() => ({
        resetVisit: jest.fn(),
        omikenSelect: jest.fn().mockReturnValue(false),
      }));

      const result = await plugin.filterComment(
        mockComment,
        mockService,
        mockUserData
      );
      expect(result).toBe(mockComment);
    });

    it("クールダウン中の場合はコメントをそのまま返す", async () => {
      // 最後の実行時間を現在時刻に近い値に設定
      (plugin.store.get as jest.Mock).mockImplementationOnce(
        () => Date.now() - 1000
      ); // 1秒前に実行

      const result = await plugin.filterComment(
        mockComment,
        mockService,
        mockUserData
      );
      expect(result).toBe(mockComment);
    });

    it("正常なフローでコメントを処理する", async () => {
      // handleFilterCommentのモック
      (handleFilterComment as jest.Mock).mockReturnValue({
        toast: {
          /* トーストデータ */
        },
      });

      const result = await plugin.filterComment(
        mockComment,
        mockService,
        mockUserData
      );

      expect(result.omiken).toBeDefined();
      expect(result.omiken.toast).toBeDefined();
    });
  });

  describe("ifRecent", () => {
    it("クールダウン中を正しく判定する", () => {
      // 最後の実行時間を現在時刻に近い値に設定
      (plugin.store.get as jest.Mock).mockReturnValue(Date.now() - 1000); // 1秒前に実行

      const result = plugin.ifRecent();
      expect(result).toBe(true);
    });

    it("クールダウン外を正しく判定する", () => {
      // 最後の実行時間を十分に前に設定
      (plugin.store.get as jest.Mock).mockReturnValue(Date.now() - 5000); // 5秒前に実行

      const result = plugin.ifRecent();
      expect(result).toBe(false);
    });
  });
});
