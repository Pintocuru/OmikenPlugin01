// src/Modules/api/serviceAPI.ts
import { Service } from '@onecomme.com/onesdk/types/Service';
import { RGBColor } from '@onecomme.com/onesdk/types/Color';
import { configs } from '@/config';
import { systemMessage } from '@core/ErrorHandler';
import axios from 'axios';

export class ServiceAPI {
 // 枠情報を取得
 async getServices(): Promise<Service[]> {
  try {
   const response = await axios.get(`${configs.BASE_URL}/services`);
   return response.data;
  } catch (error) {
   // セットアップ中に枠情報を取得することもあるので、エラーメッセージは出さない
   return [];
  }
 }

 // わんコメの枠を作成
 async createService(name: string, frameId: string, color: string): Promise<Service | null> {
  try {
   const response = await axios.post(`${configs.BASE_URL}/services`, {
    id: frameId,
    name: `おみくじBOT:${name}`,
    speech: true,
    color: this.colorCodeToRGBColor(color)
   });
   return response.data;
  } catch (error) {
   systemMessage('warn', `わんコメの枠を作成できませんでした`, error);
   return null;
  }
 }

 // カラーコードからRGBColor型のコードを生成
 private colorCodeToRGBColor(colorCode: string): RGBColor {
  const hex = colorCode.replace(/^#/, '');
  if (hex.length !== 6) throw new Error(`Invalid color code: ${colorCode}`);
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return { r, g, b };
 }
}
