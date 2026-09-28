import { describe, it, expect } from 'vitest';
import { parseReferenceRates, convertReferenceAmount } from '../services/travelDataService';
const rows = ['USD','GBP','CHF','TRY','AED','SAR'].map((quote, index) => ({ base:'EUR', quote, date:'2026-09-23', rate:index + 1 }));
describe('sourced reference currencies', () => {
  it('supports AED and SAR without labelling them exchange-office offers', () => {
    const rates = parseReferenceRates(rows, new Date('2026-09-24'));
    expect(rates.source).toBe('TCMB / Frankfurter');
    expect(rates.rateType).toBe('reference');
    expect(convertReferenceAmount(100, 'AED', 'SAR', rates)).toBe(120);
  });
  it('rejects incomplete, duplicated, mixed-date and invalid quotes', () => {
    for (const payload of [rows.slice(1), [...rows.slice(1), rows[1]], rows.map((row,index) => index ? row : {...row,date:'2026-09-22'}), rows.map(row => ({...row,rate:0}))]) {
      expect(() => parseReferenceRates(payload, new Date('2026-09-24'))).toThrow();
    }
  });
});
