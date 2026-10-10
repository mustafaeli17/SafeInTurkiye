import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import HomeButton from '../components/HomeButton';
import { readFileSync } from 'node:fs';

describe('Shared home breadcrumb',()=>{
 it.each([['tr','Ana sayfaya dön'],['en','Back to home'],['es','Volver al inicio'],['zh','返回首页']])('localizes %s with one home action',(lang,label)=>{
  const html=renderToStaticMarkup(<HomeButton lang={lang} currentPage="Destination"/>);
  expect(html.match(/href="\/"/g)).toHaveLength(1);
  expect(html).toContain(label);
  expect(html).toContain('aria-current="page"');
  expect(html).toContain('Destination');
 });
 it('supports in-app navigation and RTL without a duplicate link',()=>{
  const html=renderToStaticMarkup(<HomeButton lang="ar" currentPage="مدينة" onClick={()=>{}}/>);
  expect(html.match(/<button /g)).toHaveLength(1);
  expect(html).not.toContain('href=');
  expect(html).toContain('dir="rtl"');
  expect(html).toContain('flex-wrap');
 });
 it('excludes taxi from the outer breadcrumb and names detail pages',()=>{
  const app=readFileSync('src/App.tsx','utf8');
  expect(app).toContain("activeTab!=='home' && activeTab!=='taxi'");
  expect(app).toContain("currentPage={page('taxiTitle')}");
  expect(readFileSync('src/components/DirectoryDetail.tsx','utf8')).toContain('currentPage={entry.name}');
 });
});
