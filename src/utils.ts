// src/utils.ts

export function incrementScore(currentScore: number): number {
  return currentScore + 1;
}

export function formatComment(comment: string): string {
  return comment.trim().toLowerCase();
}