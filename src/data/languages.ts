export interface Language {
  name: string;
  code: string;
}

export const LANGUAGES: Language[] = [
  { name: 'Arabic', code: 'ar' },
  { name: 'Chinese', code: 'zh' },
  { name: 'Czech', code: 'cs' },
  { name: 'Danish', code: 'da' },
  { name: 'Dutch', code: 'nl' },
  { name: 'English', code: 'en' },
  { name: 'Finnish', code: 'fi' },
  { name: 'French', code: 'fr' },
  { name: 'German', code: 'de' },
  { name: 'Greek', code: 'el' },
  { name: 'Hebrew', code: 'he' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Hungarian', code: 'hu' },
  { name: 'Indonesian', code: 'id' },
  { name: 'Italian', code: 'it' },
  { name: 'Japanese', code: 'ja' },
  { name: 'Korean', code: 'ko' },
  { name: 'Norwegian', code: 'no' },
  { name: 'Polish', code: 'pl' },
  { name: 'Portuguese', code: 'pt' },
  { name: 'Romanian', code: 'ro' },
  { name: 'Russian', code: 'ru' },
  { name: 'Spanish', code: 'es' },
  { name: 'Swedish', code: 'sv' },
  { name: 'Thai', code: 'th' },
  { name: 'Turkish', code: 'tr' },
  { name: 'Ukrainian', code: 'uk' },
  { name: 'Vietnamese', code: 'vi' },
];

const byNormalizedName = new Map(
  LANGUAGES.map((lang) => [lang.name.toLowerCase(), lang]),
);

export function getLanguageCode(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  return byNormalizedName.get(trimmed.toLowerCase())?.code ?? null;
}

export function normalizeLanguage(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return byNormalizedName.get(trimmed.toLowerCase())?.name ?? trimmed;
}
