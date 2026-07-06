import { getLanguageCode } from '../data/languages';

const DEFAULT_TARGET = 'English';
const translationCache = new Map<string, string>();

function cacheKey(sourceCode: string, targetCode: string, text: string): string {
  return `${sourceCode}|${targetCode}|${text}`;
}

export async function translateTerm(
  text: string,
  sourceName: string,
  targetName = DEFAULT_TARGET,
  signal?: AbortSignal,
): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed || !navigator.onLine) return null;

  const sourceCode = getLanguageCode(sourceName);
  const targetCode = getLanguageCode(targetName);
  if (!sourceCode || !targetCode || sourceCode === targetCode) return null;

  const key = cacheKey(sourceCode, targetCode, trimmed);
  const cached = translationCache.get(key);
  if (cached) return cached;

  try {
    const url =
      `https://translate.googleapis.com/translate_a/single` +
      `?client=gtx&sl=${encodeURIComponent(sourceCode)}` +
      `&tl=${encodeURIComponent(targetCode)}` +
      `&dt=t&q=${encodeURIComponent(trimmed)}`;

    const response = await fetch(url, { signal });
    if (!response.ok) return null;

    const data: unknown = await response.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;

    const translation = (data[0] as [string][]).map((segment) => segment[0]).join('').trim();
    if (!translation) return null;

    translationCache.set(key, translation);
    return translation;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return null;
    return null;
  }
}
