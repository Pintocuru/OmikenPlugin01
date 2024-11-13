import * as pluginModule from '../src/100omi';
import { OnePlugin } from '../src/types';

const plugin: OnePlugin = pluginModule as any;

describe('おみくじプラグイン', () => {
  let testPlugin: OnePlugin;

  beforeEach(() => {
    testPlugin = { ...plugin };
    testPlugin.init({ 
      dir: '/test/dir', 
      store: {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'rules') return testPlugin.defaultState.rules;
          if (key === 'omikuji') return testPlugin.defaultState.omikuji;
          return null;
        })
      } 
    }, {});
  });

  test('プラグインの基本情報が正しいこと', () => {
    expect(testPlugin.name).toBe('おみくじプラグイン');
    expect(testPlugin.uid).toBe('OmiKen100-omi');
    expect(testPlugin.version).toBe('0.0.5');
    expect(testPlugin.author).toBe('Pintocuru');
    expect(testPlugin.permissions).toContain('filter.comment');
  });

  test('matchRule関数が正しく動作すること', () => {
    const rule = {
      name: "テストルール",
      switch: true,
      isMember: false,
      NoLimits: false,
      matchExact: ["🥠"],
      matchStartsWith: ["おみくじ", "御神籤"],
      matchIncludes: ["【おみくじ】"],
    };

    expect(testPlugin.matchRule("🥠", rule)).toBe(true);
    expect(testPlugin.matchRule("おみくじをひく", rule)).toBe(true);
    expect(testPlugin.matchRule("今日の【おみくじ】", rule)).toBe(true);
    expect(testPlugin.matchRule("こんにちは", rule)).toBe(false);
  });

  test('drawOmikuji関数が正しく動作すること', () => {
    const omikuji: any[] = [
      {
        weight: 18,
        botKey: 0,
        message: [["<<user>>さんの運勢は【大吉】<<random>>", 1]],
        random: ["良い一日になりそうです", "幸運が訪れるでしょう"],
      },
    ];

    const result = testPlugin.drawOmikuji(omikuji);
    expect(result).toMatch(/さんの運勢は【大吉】/);
    expect(result).toMatch(/(良い一日になりそうです|幸運が訪れるでしょう)/);
  });

  test('filterComment関数が正しく動作すること', async () => {
    const comment: any = {
      data: { displayName: 'テストユーザー' },
      text: 'おみくじ',
    };
    const service = {};
    const userData = {};

    const result: any = await testPlugin.filterComment(comment, service, userData);
    expect(result).toBeDefined();
    if (result !== false) {
      expect(result.omikenData).toBeDefined();
      expect(result.omikenData.isOverlapping).toBeDefined();
      expect(result.omikenData.message).toBeDefined();
    }
  });

  test('request関数のGETリクエストが正しく動作すること', async () => {
    const getRequest = {
      method: 'GET',
      url: '/api/plugins/OmiKen100-omi',
      params: {},
    };

    const getResponse = await testPlugin.request(getRequest);
    expect(getResponse.code).toBe(200);
    expect(getResponse.response).toBeDefined();
  });

  test('request関数のPOSTリクエストが正しく動作すること', async () => {
    const postRequest = {
      method: 'POST',
      url: '/api/plugins/OmiKen100-omi',
      params: {},
      body: JSON.stringify({ omikuji: [{ weight: 10, botKey: 1 }] }),
    };

    const postResponse = await testPlugin.request(postRequest);
    expect(postResponse.code).toBe(200);
    expect(postResponse.response).toEqual({ omikuji: [{ weight: 10, botKey: 1 }] });
  });
});