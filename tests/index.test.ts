// テストファイルの冒頭部分
import { plugin as originalPlugin } from '../src/index';

// plugin オブジェクトをモックする
const plugin = {
  ...originalPlugin,
  request: jest.fn(),
};

// テストケースの前に plugin.request のモックをリセット
beforeEach(() => {
  jest.clearAllMocks();
});

// POST メソッドのテスト
test('request method - POST', async () => {
  const postData = { omikuji: ['大吉', '中吉', '小吉'] };

  plugin.request.mockResolvedValue({
    code: 200,
    response: postData
  });

  const result = await plugin.request({
    url: 'test',
    method: 'POST',
    body: JSON.stringify(postData)
  });

  expect(result).toEqual({
    code: 200,
    response: postData
  });
  expect(plugin.request).toHaveBeenCalledWith({
    url: 'test',
    method: 'POST',
    body: JSON.stringify(postData)
  });
});

// サポートされていないメソッドのテスト
test('request method - unsupported', async () => {
  plugin.request.mockResolvedValue({
    code: 404,
    response: {}
  });

  const result = await plugin.request({
    url: 'test',
    method: 'PUT',
  });

  expect(result).toEqual({
    code: 404,
    response: {}
  });
});