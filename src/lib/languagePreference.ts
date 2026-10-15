const key = 'safeinturkiye-language';
const languages = new Set(['en', 'tr', 'de', 'ru', 'ar', 'zh', 'fr', 'es']);
let memoryPreference = 'en';

export function readLanguagePreference(): string {
  try {
    const stored = localStorage.getItem(key);
    if (stored && languages.has(stored)) memoryPreference = stored;
  } catch { /* Storage may be disabled; keep navigation usable. */ }
  return memoryPreference;
}

export function saveLanguagePreference(language: string): void {
  if (!languages.has(language)) return;
  memoryPreference = language;
  try { localStorage.setItem(key, language); } catch { /* In-memory preference remains available. */ }
}
