import {afterEach,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import CurrencyRates from '../components/CurrencyRates';
const route=vi.hoisted(()=>({location:'/exchange'}));
vi.mock('../lib/browserNavigation',()=>({useBrowserLocation:()=>route.location}));
afterEach(()=>{route.location='/exchange';});

it('opens a shared exchange office detail in its visible tab',()=>{
 route.location='/exchange?city=antalya&place=cms%3Aexchange_offices%3A00000000-0000-0000-0000-000000001234';
 const html=renderToStaticMarkup(<CurrencyRates lang="tr" nearby={<div>Fixture bureau</div>}/>);
 expect(html).toContain('role="tab" aria-selected="true" aria-controls="exchange-bureaux"');
 expect(html).toContain('aria-labelledby="exchange-converter-tab" hidden=""');
});
it('keeps the converter active for ordinary URLs and invalid place links',()=>{
 route.location='/exchange?place=invalid';
 const html=renderToStaticMarkup(<CurrencyRates nearby={<div/>}/>);
 expect(html).toContain('role="tab" aria-selected="true" aria-controls="exchange-converter"');
});
it('offers navigable converter and reference sections without fabricated prices or changes',()=>{
 const html=renderToStaticMarkup(<CurrencyRates lang="en"/>);
 expect(html).toContain('role="tab" aria-selected="true" aria-controls="exchange-converter"');
 expect(html).toContain('aria-labelledby="exchange-rates-tab" hidden=""');
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

it('uses the selected city artwork and local currency flags',()=>{
 const html=renderToStaticMarkup(<CurrencyRates city="İzmir" lang="tr"/>);
 expect(html).toContain('/photos/cities-2026/izmir-1536.webp');
 expect(html).toContain('data-currency="EUR"');
 expect(html).toContain('data-currency="TRY"');
});
