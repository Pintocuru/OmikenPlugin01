// src/Modules/core/ErrorHandler.ts
import { CommentService } from '@api/PostComment';

type ErrorLevel = 'info' | 'warn' | 'error';
export function systemMessage(level: ErrorLevel, message: string, error?: unknown): void {
 const errorMessage = `${message}${error ? `: ${String(error)}` : ''}`;
 console[level](errorMessage);

 // メッセージをわんコメに送信
 new CommentService().postSystemMessage(message, level);
}
