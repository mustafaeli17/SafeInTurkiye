import { expect, it } from 'vitest';
import { createRequestBudget } from '../server/requestBudget';

it('allows the budget then returns the remaining retry delay', () => {
  const budget = createRequestBudget(2);
  const headers = { 'x-forwarded-for': '192.0.2.1' };
  expect(budget(headers, 0)).toBe(0);
  expect(budget(headers, 1000)).toBe(0);
  expect(budget(headers, 1500)).toBe(59);
  expect(budget(headers, 60000)).toBe(0);
});
it('keeps clients separate and does not bypass limits with forwarded suffixes', () => {
  const budget = createRequestBudget(1);
  expect(budget({'x-forwarded-for':'192.0.2.1, proxy'},0)).toBe(0);
  expect(budget({'x-forwarded-for':['192.0.2.1, changed']},1)).toBe(60);
  expect(budget({'x-forwarded-for':'192.0.2.2'},1)).toBe(0);
});
it('bounds memory, preserves existing client allowance at capacity and expires entries', () => {
  const budget = createRequestBudget(2,60000,1);
  expect(budget({'x-forwarded-for':'192.0.2.1'},0)).toBe(0);
  expect(budget({'x-forwarded-for':'192.0.2.2'},1)).toBe(60);
  expect(budget({'x-forwarded-for':'192.0.2.1'},1)).toBe(0);
  expect(budget({'x-forwarded-for':'192.0.2.2'},60000)).toBe(0);
});
it('groups missing identity rather than creating unlimited anonymous allowances', () => {
  const budget = createRequestBudget(1);
  expect(budget({},0)).toBe(0);
  expect(budget({},1)).toBe(60);
});
