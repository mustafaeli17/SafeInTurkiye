import { describe, expect, it } from 'vitest';
import { taxiErrorText, type TaxiErrorKey } from '../lib/taxiErrors';

describe('taxi visitor messages', () => {
  const keys: TaxiErrorKey[] = ['unsupported', 'locating', 'locationFailed', 'missingPlaces', 'routeFailed', 'noRoute', 'network'];
  it.each(['tr', 'de', 'fr', 'ar', 'ru', 'zh'])('translates every state in %s without English fallback', lang => {
    for (const key of keys) {
      expect(taxiErrorText(lang, key).length).toBeGreaterThan(5);
      expect(taxiErrorText(lang, key)).not.toBe(taxiErrorText('en', key));
    }
  });
  it('retains a safe fallback for unsupported languages', () => {
    for (const key of keys) expect(taxiErrorText('unknown', key)).toBe(taxiErrorText('en', key));
  });
});
