import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {expiredGooglePhoto,createPhotoRefreshGuard} from '../lib/photoRefresh';
import {discoveryKeys,discoveryTranslations,discoverySupplement} from '../lib/discoveryCopy';
import {authCopy} from '../lib/authCopy';
import {privacyCopy} from '../lib/privacyCopy';
import {budgetIsCurrent,taxiBudgetRange} from '../lib/taxiBudget';
import {currencyInputCopy,invalidCurrencyAmount} from '../lib/currencyInput';
import TravelFaq from '../components/TravelFaq';
import fs from 'node:fs';

it('refreshes only expired signed photo paths and coalesces simultaneous image failures',()=>{
 expect(expiredGooglePhoto('/api/place-photo?expires=1000',1001)).toBe(true);
 expect(expiredGooglePhoto('/api/place-photo?expires=2000',1001)).toBe(false);
 expect(expiredGooglePhoto('/photos/city.webp',1001)).toBe(false);
 const allow=createPhotoRefreshGuard();expect(allow(1000)).toBe(true);
 for(let i=0;i<20;i++)expect(allow(1001+i)).toBe(false);
 expect(allow(31000)).toBe(true);
});
it('supplies every formerly missing discovery message and staff field in six non-English locales',()=>{
 for(const lang of ['de','fr','ar','ru','zh','es']){
  expect(discoveryTranslations[lang]).toHaveLength(discoveryKeys.length);
  for(const key of discoveryKeys)expect(discoverySupplement(key,lang)?.trim()).toBeTruthy();
 }
 for(const lang of ['en','tr','de','fr','ar','ru','zh','es']){
  expect(authCopy[lang]).toHaveLength(9);expect(privacyCopy[lang]).toContain('Supabase');expect(currencyInputCopy[lang]).toBeTruthy();
 }
});
it('rejects stale, future or invalid budget review dates without altering current fare maths',()=>{
 const now=Date.parse('2026-10-25T12:00:00Z');
 expect(budgetIsCurrent('2026-10-06',now)).toBe(true);
 for(const date of ['2026-09-01','2026-10-26','2026-02-30','nonsense'])expect(budgetIsCurrent(date,now)).toBe(false);
 expect(taxiBudgetRange('Ankara',[10],'YELLOW',now)).toMatchObject({amount:460,upper:470});
 expect(taxiBudgetRange('Ankara',[10],'YELLOW',Date.parse('2026-11-10'))).toBeNull();
});
it('keeps paused booking flows out of public FAQ and removes dishonest seasonal shortcuts',()=>{
 expect(renderToStaticMarkup(<TravelFaq lang="en"/>)).toContain('Our reservation request service is not available yet.');
 const home=fs.readFileSync('src/components/TravelHome.tsx','utf8');
 expect(home).not.toContain("'Entertainment', 'Summer', 'Winter'].map");
});
it('identifies invalid currency input without rejecting zero',()=>{
 for(const value of ['',' ','-1','Infinity','1e999','not a number'])expect(invalidCurrencyAmount(value)).toBe(true);
 for(const value of ['0','1','1.23'])expect(invalidCurrencyAmount(value)).toBe(false);
});
it('uses a real modal dialog, labelled fields and safe localized auth errors',()=>{
 const dialog=fs.readFileSync('src/components/AccessibleDialog.tsx','utf8'),app=fs.readFileSync('src/App.tsx','utf8');
 expect(dialog).toContain('showModal()');expect(dialog).toContain('onCancel=');expect(dialog).toContain('previous?.focus()');
 expect(app).toContain('autoComplete="username"');expect(app).toContain('autoComplete="current-password"');expect(app).not.toContain(': raw)');
});
