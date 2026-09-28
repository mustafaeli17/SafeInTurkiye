import { describe, expect, it } from 'vitest';
import { taxiCityFromCoordinates, taxiUnavailableText } from '../lib/taxiCity';

describe('taxi city safety', () => {
  it('does not apply Istanbul fares outside supported bounds', () => {
    for (const [lat, lng] of [[0, 0], [37.03, 27.43], [51.5, -0.12], [NaN, 29]]) {
      expect(taxiCityFromCoordinates(lat, lng)).toBe('');
    }
  });
  it('recognises supported city centres', () => {
    expect(taxiCityFromCoordinates(41.0082, 28.9784)).toBe('İstanbul');
    expect(taxiCityFromCoordinates(39.9334, 32.8597)).toBe('Ankara');
    expect(taxiCityFromCoordinates(38.4237, 27.1428)).toBe('İzmir');
    expect(taxiCityFromCoordinates(36.8969, 30.7133)).toBe('Antalya');
  });
  it('provides a visitor-facing fallback in all supported languages', () => {
    for (const language of ['tr', 'en', 'de', 'fr', 'ar', 'ru', 'zh']) {
      expect(taxiUnavailableText(language).length).toBeGreaterThan(20);
      expect(taxiUnavailableText(language)).not.toContain('Supabase');
    }
    expect(taxiUnavailableText('unknown')).toBe(taxiUnavailableText('en'));
  });
});
