import { afterEach, expect, it, vi } from 'vitest';
import { readLanguagePreference, saveLanguagePreference } from '../lib/languagePreference';
afterEach(() => vi.unstubAllGlobals());
it('keeps language changes usable when storage is blocked', () => {
  vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
  expect(() => saveLanguagePreference('es')).not.toThrow();
  expect(readLanguagePreference()).toBe('es');
});
it('validates stored and requested language values', () => {
  const setItem = vi.fn();
  vi.stubGlobal('localStorage', {getItem: () => 'not-a-language', setItem});
  saveLanguagePreference('tr');
  saveLanguagePreference('invalid');
  expect(readLanguagePreference()).toBe('tr');
  expect(setItem).toHaveBeenCalledTimes(1);
});
it('reads a supported persisted language', () => {
  vi.stubGlobal('localStorage', {getItem: () => 'zh'});
  expect(readLanguagePreference()).toBe('zh');
});
