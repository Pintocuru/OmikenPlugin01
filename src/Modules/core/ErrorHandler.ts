// src/Modules/core/ErrorHandler.ts
import { CommentService } from '@api/PostComment';

type ErrorLevel = 'info' | 'warn' | 'error';
export function systemMessage(level: ErrorLevel, message: string, error?: unknown): void {
 const errorMessage = `${message}${error ? `: ${String(error)}` : ''}`;
 const logMethods: Record<ErrorLevel, (msg: string) => void> = {
  info: console.info,
  warn: console.warn,
  error: console.error
 };

 logMethods[level](errorMessage);

 // エラーメッセージの送信先を決定
 const messageType = level === 'warn' || level === 'error' ? 'error' : 'info';

 // コメントサービスでエラーメッセージを送信
 new CommentService().postSystemMessage(message, messageType);

 if (level === 'error') throw new Error(errorMessage);
}
