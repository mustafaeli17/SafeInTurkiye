import { describe, expect, it } from 'vitest';
import { matchesCatalog, normalizeSearch, validBookingDate, localDate } from '../lib/catalog';
describe('catalog search', () => {
  it('matches Turkish names without accents', () => {
    expect(normalizeSearch('İSTANBUL')).toBe('istanbul');
    expect(matchesCatalog({name:'Çiya Sofrası',city:'İstanbul'},'ciya sofrasi','Istanbul')).toBe(true);
  });
  it('requires every search term and respects the city', () => {
    expect(matchesCatalog({name:'Topkapı Palace',city:'İstanbul'},'istanbul palace','')).toBe(true);
    expect(matchesCatalog({name:'Topkapı Palace',city:'İstanbul'},'palace','Ankara')).toBe(false);
    expect(matchesCatalog({name:'Topkapı Palace',city:'İstanbul'},'palace skiing','')).toBe(false);
  });
  it('does not search image URLs', () => expect(matchesCatalog({name:'Museum',img:'https://hotel.example'},'hotel','')).toBe(false));
});
describe('booking dates', () => {
  it('rejects past and invalid calendar dates', () => {
    expect(validBookingDate('2026-09-19','2026-09-20')).toBe(false);
    expect(validBookingDate('2026-02-30','2026-01-01')).toBe(false);
    expect(validBookingDate('','2026-09-20')).toBe(false);
  });
  it('accepts today and future dates', () => {
    expect(validBookingDate('2026-09-20','2026-09-20')).toBe(true);
    expect(validBookingDate('2027-01-01','2026-09-20')).toBe(true);
    expect(localDate(new Date(2026,8,20,23,59))).toBe('2026-09-20');
  });
});
