// src/Modules/components/startReadyCheck.ts
import { ServiceAPI } from '../api/serviceAPI';

// データが取得できる、または枠が作成されるまで待つ
export async function startReadyCheck() {
 const CONFIG = {
  INITIAL_INTERVAL: 1000, // 最初の1秒間隔
  EXTENDED_INTERVAL: 15000, // 15秒間隔
  THRESHOLD_TIME: 10000 // 10秒間は1秒間隔で再チェック
 };
 const startTime = Date.now();

 while (true) {
  try {
   const dataArray = await new ServiceAPI().getServices();
   // 枠が作成された時点で
   if (dataArray?.length > 0) {
    console.info('Data is ready.');
    break;
   }
  } catch (error) {
   console.log('API not ready yet:', error);
  }

  const elapsedTime = Date.now() - startTime;
  const interval = elapsedTime >= CONFIG.THRESHOLD_TIME ? CONFIG.EXTENDED_INTERVAL : CONFIG.INITIAL_INTERVAL;

  // 指定された間隔で再チェック
  await new Promise((resolve) => setTimeout(resolve, interval));
 }
}
