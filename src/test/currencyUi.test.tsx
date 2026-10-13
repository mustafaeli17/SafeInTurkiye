import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CurrencyRates, { CurrencyResult } from '../components/CurrencyRates';

describe('currency converter accessibility and languages', () => {
  it('shows a prominent localized result with Turkish lira and a reference label', () => {
    const html = renderToStaticMarkup(<CurrencyResult amount={100} from="EUR" to="TRY" converted={5516.09} lang="tr" label="Referans" />);
    expect(html).toContain('<output');
    expect(html).toContain('5.516,09');
    expect(html).toContain('TL');
    expect(html).toContain('100 EUR ≈');
    expect(html).toContain('Referans');
    expect(html).toContain('break-all');
  });
  it.each(['en', 'tr', 'es', 'de', 'fr', 'ar', 'ru', 'zh'])('labels every input in %s', lang => {
    const html = renderToStaticMarkup(<CurrencyRates lang={lang} />);
    expect(html.match(/aria-label=/g)).toHaveLength(3);
    expect(html).toContain('step="any"');
    if (lang !== 'en') expect(html).not.toContain('aria-label="Amount"');
    for (const currency of ['AED', 'SAR', 'CNY']) expect(html).toContain(`<option>${currency}</option>`);
    expect(html).not.toContain('≈');
  });
});
