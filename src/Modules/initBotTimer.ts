import { OmikenType, RulesType } from "@/types";



export class BotTimer {
 Omiken: OmikenType;
 timesArray: RulesType[];
 constructor(Omiken:OmikenType,timesArray:RulesType[]) {
  this.Omiken = Omiken;
  this.timesArray = timesArray;
 }

 // intervalが1分以上なら関数起動をセット
if (BotTimerInterval > 0) {
  setInterval(() => {
    common_BotMessage("名無し", BotTimer);
  }, BotTimerInterval * 60 * 1000);
}