import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { practicalFaq } from '../data/practicalFaq';
import TravelFaq from '../components/TravelFaq';
import SafetyTips from '../components/SafetyTips';

for (const lang of ['tr','en','es','de','fr','ru','zh','ar']) {
  it(`renders all six practical questions and safety guidance in ${lang}`, () => {
    expect(practicalFaq[lang]).toHaveLength(6);
    const faq = renderToStaticMarkup(<TravelFaq lang={lang}/>);
    const safety = renderToStaticMarkup(<SafetyTips lang={lang}/>);
    expect((faq.match(/<details/g) ?? []).length).toBe(19);
    for (const [question] of practicalFaq[lang]) expect(faq).toContain(question);
    expect(safety).toContain(practicalFaq[lang][0][0]);
    expect(safety).toContain('112');
    expect(safety).toContain('AFAD');
    if (lang !== 'en') expect(safety).not.toContain('Keep your phone');
    if (lang === 'ar') expect(safety).toContain('dir="rtl"');
  });
}
it('keeps booking confirmation guidance instead of replacing it with directory copy', () => {
  expect(renderToStaticMarkup(<TravelFaq lang="en"/>)).toContain('Wait for the business’s confirmation.');
});
it('keeps search input escaped and supports matching the new questions', () => {
  const html = renderToStaticMarkup(<TravelFaq lang="en" initialQuery="earthquake"/>);
  expect((html.match(/<details/g) ?? []).length).toBe(1);
  expect(renderToStaticMarkup(<TravelFaq lang="en" initialQuery={'<script>alert(1)</script>'}/>)).not.toContain('<script>');
});
it('sets non-disruptive security headers without blocking geolocation or embedded maps', () => {
  const config = JSON.parse(readFileSync('vercel.json','utf8'));
  const headers = Object.fromEntries(config.headers[0].headers.map((h:{key:string;value:string})=>[h.key,h.value]));
  expect(headers['X-Content-Type-Options']).toBe('nosniff');
  expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['Permissions-Policy']).toBe('camera=(), microphone=()');
});
