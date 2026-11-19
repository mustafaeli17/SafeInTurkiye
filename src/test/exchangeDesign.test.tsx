import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import CurrencyRates from '../components/CurrencyRates';
it('offers navigable converter and reference sections without fabricated prices or changes',()=>{
 const html=renderToStaticMarkup(<CurrencyRates lang="en"/>);
 expect(html).toContain('href="#exchange-converter"');
 expect(html).toContain('id="exchange-rates"');
 expect(html).toContain('Swap currencies');
 expect(html).not.toContain('+0.28%');
 expect(html).not.toContain('4,300.00');
});
it.each(['tr','es','de','fr','ar','ru','zh'])('localizes the exchange redesign in %s',lang=>{
 const html=renderToStaticMarkup(<CurrencyRates lang={lang}/>);
 expect(html).toContain('id="exchange-converter"');
 expect(html).not.toContain('Good to know');
 expect(html).not.toContain('You have');
});
