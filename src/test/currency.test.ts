import { describe, it, expect } from 'vitest';
import { parseReferenceRates, convertReferenceAmount, referencePublicationAge } from '../services/travelDataService';
const rows = ['USD','GBP','CHF','TRY','AED','SAR','CNY'].map((quote, index) => ({ base:'EUR', quote, date:'2026-09-23', rate:index + 1 }));
describe('sourced reference currencies', () => {
  it('uses the TCMB publication day in Istanbul, including winter midnight', () => {
    expect(referencePublicationAge('2026-01-06', new Date('2026-01-05T21:30:00Z'))).toBe(0);
    expect(referencePublicationAge('2026-01-05', new Date('2026-01-05T21:30:00Z'))).toBe(1);
  });
  it('preserves old publication dates without substituting today or accepting future data', () => {
    const old = parseReferenceRates(rows, new Date('2026-10-13'));
    expect(old.date).toBe('2026-09-23');
    expect(referencePublicationAge(old.date, new Date('2026-10-13'))).toBe(20);
    expect(() => parseReferenceRates(rows, new Date('2026-09-22'))).toThrow();
  });
  it('rejects invalid amounts and converts round trips without invented spreads', () => {
    const rates = parseReferenceRates(rows, new Date('2026-09-24'));
    for (const amount of [-1, NaN, Infinity]) expect(convertReferenceAmount(amount, 'EUR', 'TRY', rates)).toBeNull();
    expect(convertReferenceAmount(0, 'EUR', 'TRY', rates)).toBe(0);
    expect(convertReferenceAmount(convertReferenceAmount(123.45, 'USD', 'TRY', rates)!, 'TRY', 'USD', rates)).toBeCloseTo(123.45);
  });
  it('supports AED and SAR without labelling them exchange-office offers', () => {
    const rates = parseReferenceRates(rows, new Date('2026-09-24'));
    expect(rates.source).toBe('TCMB / Frankfurter');
    expect(rates.rateType).toBe('reference');
    expect(convertReferenceAmount(100, 'AED', 'SAR', rates)).toBe(120);
    expect(convertReferenceAmount(100, 'EUR', 'CNY', rates)).toBe(700);
    expect(convertReferenceAmount(700, 'CNY', 'EUR', rates)).toBe(100);
  });
  it('rejects incomplete, duplicated, mixed-date and invalid quotes', () => {
    for (const payload of [rows.slice(1), [...rows.slice(1), rows[1]], rows.map((row,index) => index ? row : {...row,date:'2026-09-22'}), rows.map(row => ({...row,rate:0}))]) {
      expect(() => parseReferenceRates(payload, new Date('2026-09-24'))).toThrow();
    }
  });
});
