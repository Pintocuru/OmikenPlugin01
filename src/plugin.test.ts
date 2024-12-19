// src/plugin.test.ts

import axios from 'axios';
import ElectronStore from 'electron-store';
import { OmikujiType, PlaceType, StoreAllType, StoreType } from './types';
import { commentMock, MockElectronStore, storeMock } from './plugin.mockData';
import { configs } from './config';
import { PluginRequest } from '@onecomme.com/onesdk/types/Plugin';
import { RequestHandler } from './Modules/ApiRequest';
import { PlaceProcess } from './Modules/PlaceProcess';

const plugin = require('./plugin');

jest.mock('electron-store', () => {
 return jest.fn(() => new MockElectronStore());
});

describe.skip('plugin.init:初期化テスト', () => {
 let storeMock: MockElectronStore;

 beforeEach(() => {
  storeMock = new MockElectronStore();
 });

 test('正常に初期化される', () => {
  const initialData = { services: [{ id: 'default' }] };

  plugin.init({ store: storeMock }, initialData);

  // TimeConfigがストアにセットされたか確認
  const timeConfig = storeMock.get('TimeConfig', {});
  expect(timeConfig).toHaveProperty('pluginTime');
  expect(timeConfig).toHaveProperty('defaultFrameId', 'default');
 });
});

describe('各種関数のテスト', () => {
 beforeEach(() => {
  // 初期化を実行
  plugin.init({ store: storeMock }, { store: ElectronStore<StoreType> });
 });

 test('filterComment:おみくじができる ', () => {
  const result = plugin.filterComment(commentMock, null, null);
 });

});

describe.skip('PlaceProcess Class Tests', () => {
 const createDummyOmikuji = {
  id: 'suikaOmikuji',
  name: 'suika',
  description: '',
  rank: 0,
  weight: 1,
  threshold: [],
  script: {
   scriptId: 'GamesTest',
   parameter: ''
  },
  placeIds: [],
  post: [
   {
    type: 'onecomme',
    botKey: 'reimu',
    iconKey: 'joy02',
    delaySeconds: 1,
    content: '<<message>>'
   }
  ]
 } as OmikujiType;

 const createDummyPlaces = () =>
  ({
   place1: {
    id: 'place1',
    name: 'place1',
    description: 'placeholder',
    values: [{ value: 'テスト値1', weight: 1 }]
   },
   place2: {
    id: 'place2',
    name: 'place2',
    description: 'placeholder',
    values: [{ value: 'テスト値2', weight: 1 }]
   }
  } as Record<string, PlaceType>);

 test('同じプレースホルダーに対して複数回処理を実行', () => {
  // 1回目の処理
  const placeProcess1 = new PlaceProcess(createDummyOmikuji);
  placeProcess1.placeDataHandle(createDummyPlaces());
  const result1 = placeProcess1.replacementPlace();

  // 2回目の処理（新しいインスタンス）
  const placeProcess2 = new PlaceProcess(createDummyOmikuji);
  placeProcess2.placeDataHandle(createDummyPlaces());
  const result2 = placeProcess2.replacementPlace();

  // 結果の検証
  expect(result1).not.toEqual(result2); // ランダム性があるため

  // プレースホルダーが適切に置換されているか確認
  expect(result1.post[0].content).not.toContain('<<message>>');
  expect(result2.post[0].content).not.toContain('<<message>>');
 });

 test('プレースホルダーの蓄積テスト', () => {
  const placeProcess = new PlaceProcess(createDummyOmikuji);

  // 1回目のupdatePlace
  placeProcess.updatePlace({ test1: 'value1' });

  // 2回目のupdatePlace
  placeProcess.updatePlace({ test2: 'value2' });

  const result = placeProcess.replacementPlace();

  // placeholdersの状態を確認できるようにprivateフィールドをアクセス可能にする
  const placeholders = (placeProcess as any).placeholders;

  expect(placeholders).toHaveProperty('test1');
  expect(placeholders).toHaveProperty('test2');
 });
});
