import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import SiteInformation from '../components/SiteInformation';
import {siteOperatorName,operatorLabel,operatorContact,supportEmail} from '../lib/siteOperator';
import {informationUi,informationLanguages} from '../lib/informationUi';
import {siteInformation} from '../lib/siteInformation';
it('publishes only the approved operator identity, without inventing a mailbox or company',()=>{
 expect(siteOperatorName).toBe('Mustafa Kaan Eli');
 expect(supportEmail).toBe('elimust503@gmail.com');
 for(const lang of ['en','tr','de','fr','es','ar','ru','zh']){
  expect(operatorLabel[lang]).toBeTruthy();
  expect(siteInformation[lang].contact).toBe(operatorContact[lang]);
  expect(operatorContact[lang]).toContain('112');
  expect(operatorContact[lang]).not.toContain('support@');
 }
 for(const page of ['privacy','terms','about','contact'] as const){
  const html=renderToStaticMarkup(<SiteInformation page={page}/>);
  expect(html).toContain(siteOperatorName);expect(html).toContain('mailto:'+supportEmail);
  expect(html).not.toContain('Eli Group');
 }
});
for(const lang of Object.keys(informationLanguages)){
 it(`renders all information pages with localized navigation and support in ${lang}`,()=>{
  expect(informationUi[lang]).toHaveLength(10);
  for(const page of ['privacy','terms','about','contact'] as const){
   const html=renderToStaticMarkup(<SiteInformation page={page} initialLanguage={lang}/>);
   expect((html.match(/<h1 /g)??[]).length).toBe(1);
   expect((html.match(/aria-current="page"/g)??[]).length).toBe(1);
   expect(html).toContain(informationUi[lang][0]);
   expect(html).toContain('mailto:'+supportEmail);
   expect(html).toContain('dir="'+(lang==='ar'?'rtl':'ltr')+'"');
   expect(html).not.toContain('support@safeinturkiye.com');
   if(page==='contact')expect(html).toContain('tel:112');
  }
 });
}
