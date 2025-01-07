// src/Modules/ErrorHandler.ts
import { PostMessages } from './PostOmikuji';

type ErrorLevel = 'info' | 'warn' | 'error';
export function systemMessage(level: ErrorLevel, message: string, error?: unknown): never | void {
 const errorMessage = `${message}${error ? `: ${String(error)}` : ''}`;

 switch (level) {
  case 'info':
   console.info(errorMessage);
   systemMessagePost(message, 'info');
   break;

   // プラグインが止まらないなら注意喚起で
  case 'warn':
   console.warn(errorMessage);
   systemMessagePost(message, 'error');
   break;

  // 致命的ならプラグインをクラッシュ
  case 'error':
   console.error(errorMessage);
   systemMessagePost(message, 'error');
   throw new Error(errorMessage);
 }
}

// エラーメッセージを投稿
 function systemMessagePost(content: string, name?: string): void {
 new PostMessages(
  [
   {
    generatorParam: name, // 名前で使用
    type: 'error', // errorではなく、systemにしたかった…
    delaySeconds: -1,
    content
   }
  ],
  {}
 );
}
