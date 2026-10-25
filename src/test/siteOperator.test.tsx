import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import SiteInformation from '../components/SiteInformation';
import {siteOperatorName,operatorLabel,operatorContact} from '../lib/siteOperator';
import {siteInformation} from '../lib/siteInformation';
it('publishes only the approved operator identity, without inventing a mailbox or company',()=>{
 expect(siteOperatorName).toBe('Mustafa Kaan Eli');
 for(const lang of ['en','tr','de','fr','es','ar','ru','zh']){
  expect(operatorLabel[lang]).toBeTruthy();
  expect(siteInformation[lang].contact).toBe(operatorContact[lang]);
  expect(operatorContact[lang]).toContain('112');
  expect(operatorContact[lang]).not.toContain('support@');
 }
 for(const page of ['privacy','terms','about','contact'] as const){
  const html=renderToStaticMarkup(<SiteInformation page={page}/>);
  expect(html).toContain(siteOperatorName);expect(html).not.toContain('mailto:');
  expect(html).not.toContain('Eli Group');
 }
});
