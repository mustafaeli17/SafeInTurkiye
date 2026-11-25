import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import PageNotice from '../components/PageNotice';
import {searchLanguages,localizePath} from '../lib/searchLocales';

describe('public page recovery',()=>{
  it.each(searchLanguages)('preserves %s on home links and offers a retry only on a temporary failure',lang=>{
    const missing=renderToStaticMarkup(<PageNotice lang={lang}/>);
    const temporary=renderToStaticMarkup(<PageNotice lang={lang} onRetry={()=>{}}/>);
    for(const html of [missing,temporary]){
      expect(html).toContain('dir="'+(lang==='ar'?'rtl':'ltr')+'"');
      expect(html).toContain('href="'+localizePath('/',lang)+'"');
      expect(html).toContain('<h1');
      if(lang!=='en')expect(html).not.toMatch(/Page not found|This page could not be loaded|Back to home/);
    }
    expect(missing).not.toContain('<button');
    expect(temporary).toContain('<button');
  });

  it('includes all seven non-English variants in the static noindex 404',()=>{
    const html=readFileSync('dist/404.html','utf8');
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).toContain('src="/not-found-language.js"');
    for(const lang of searchLanguages.filter(lang=>lang!=='en')){
      expect(html).toContain('id="not-found-'+lang+'"');
      expect(html).toContain('href="'+localizePath('/',lang)+'"');
    }
  });
});
