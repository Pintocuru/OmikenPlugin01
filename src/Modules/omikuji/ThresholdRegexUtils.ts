// src/Modules/omikuji/ThresholdRegexUtils.ts

export function matchRegexPattern(
 text: string,
 pattern: string | string[],
 options: { ignoreCase?: boolean } = {}
): boolean {
 const patterns = Array.isArray(pattern) ? pattern : [pattern];
 const flags = options.ignoreCase ?? true ? 'ui' : 'u';

 return patterns.some((p) => {
  try {
   if (/\p{Emoji}/u.test(p)) {
    return text.includes(p);
   }
   const regex = new RegExp(p, flags);
   return regex.test(text);
  } catch (error) {
   console.warn(`Invalid regex pattern: ${p}. Falling back to includes match.`);
   return options.ignoreCase !== false ? text.toLowerCase().includes(p.toLowerCase()) : text.includes(p);
  }
 });
}
