import { describe, expect, it } from 'vitest';
import { taxiCityFromCoordinates, taxiCityFromAddress, taxiUnavailableText } from '../lib/taxiCity';

describe('taxi city safety', () => {
  it('uses only selected departure administrative province, not district names or free-text matches', () => {
    expect(taxiCityFromAddress('TR','İstanbul')).toBe('İstanbul');
    expect(taxiCityFromAddress('tr','Istanbul')).toBe('İstanbul');
    for (const province of ['İzmir','Çeşme','Antalya','Ankara','Kadıköy','İstanbul Airport',undefined]) {
      expect(taxiCityFromAddress('tr',province)).toBe('');
    }
    expect(taxiCityFromAddress('de','İstanbul')).toBe('');
    expect(taxiCityFromAddress(undefined,'İstanbul')).toBe('');
  });
  it('does not apply Istanbul fares outside supported bounds', () => {
    for (const [lat, lng] of [[0, 0], [37.03, 27.43], [51.5, -0.12], [NaN, 29]]) {
      expect(taxiCityFromCoordinates(lat, lng)).toBe('');
    }
  });
  it('requires a manual jurisdiction choice without an authoritative boundary dataset', () => {
    for(const [lat,lng] of [[41.0082,28.9784],[39.9334,32.8597],[38.4237,27.1428],[36.8969,30.7133],[40.8,29.9],[37.4,32.2]]){
      expect(taxiCityFromCoordinates(lat,lng)).toBe('');
    }
  });
  it('provides a visitor-facing fallback in all supported languages', () => {
    for (const language of ['tr', 'en', 'de', 'fr', 'ar', 'ru', 'zh']) {
      expect(taxiUnavailableText(language).length).toBeGreaterThan(20);
      expect(taxiUnavailableText(language)).not.toContain('Supabase');
    }
    expect(taxiUnavailableText('unknown')).toBe(taxiUnavailableText('en'));
  });
});
