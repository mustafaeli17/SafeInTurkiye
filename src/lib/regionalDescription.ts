import translations from '../data/regionalDescriptions.json';

export function regionalDescription(city: {slug: string; description: {tr: string; en: string}}, lang: string): string {
  const localized: Record<string, string> = translations[city.slug as keyof typeof translations] ?? {};
  return localized[lang] ?? (lang === 'tr' ? city.description.tr : city.description.en);
}
