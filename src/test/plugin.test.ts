// src/plugin.test.ts

import ElectronStore from 'electron-store';
import { StoreType } from '../Modules/type';
import { commentMock, MockElectronStore, storeMock } from './plugin.mockData';

const plugin = require('../plugin');

jest.mock('electron-store', () => {
 return jest.fn(() => new MockElectronStore());
});

describe('各種関数のテスト', () => {
 beforeEach(async () => {
  // 初期化を実行
  await plugin.init({ store: storeMock }, { store: ElectronStore<StoreType> });
 });

 test('filterComment:おみくじができる ', async () => {
  await plugin.filterCommentProcess(commentMock, null, null);
 });
});
