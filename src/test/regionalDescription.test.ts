import { expect, it } from 'vitest';
import cities from '../data/cityGuides.json';
import { regionalDescription } from '../lib/regionalDescription';

it.each(['de', 'fr', 'ar', 'ru'])('regional descriptions use persisted %s translations', lang => {
  for (const city of cities) {
    expect(regionalDescription(city, lang)).not.toBe(city.description.en);
    expect(regionalDescription(city, lang).length).toBeGreaterThan(50);
  }
});
it('preserves original Turkish and English content and the fallback', () => {
  for (const city of cities) {
    expect(regionalDescription(city, 'tr')).toBe(city.description.tr);
    expect(regionalDescription(city, 'en')).toBe(city.description.en);
    expect(regionalDescription(city, 'unknown')).toBe(city.description.en);
  }
});
