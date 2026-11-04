import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {SearchGuide} from '../components/SearchGuide';
import {searchLanguages} from '../lib/searchLocales';
import {localizePath} from '../lib/searchLocales';
import {readFileSync} from 'node:fs';
import {searchIntentGuides} from '../data/searchIntentGuides';
import routes from '../data/sectionRoutes.json';

it('answers exchange discovery questions in the initial and interactive guide in every language',()=>{
 const questions={en:'How can I find a good currency exchange in Turkey?',tr:'Türkiye’de uygun bir döviz bürosunu nasıl bulabilirim?',de:'Wie finde ich eine gute Wechselstube in der Türkei?',fr:'Comment trouver un bon bureau de change en Turquie ?',es:'¿Cómo encontrar una buena casa de cambio en Turquía?',ar:'كيف أجد مكتب صرافة مناسبًا في تركيا؟',ru:'Как найти подходящий обменный пункт в Турции?',zh:'在土耳其如何找到合适的兑换点？'};
 for(const lang of searchLanguages){
  for(const standalone of [true,false]){
   const html=renderToStaticMarkup(<SearchGuide path="/exchange" lang={lang} standalone={standalone}/>);
   expect(html).toContain(questions[lang]);
   expect(html).not.toContain('FAQPage');
  }
 }
});
it('ships the same localized answers in built HTML as in the interactive guide',()=>{
 for(const lang of searchLanguages)for(const [tool,answer] of Object.entries(searchIntentGuides[lang])){
  const route=routes[tool as keyof typeof routes].path;
  const html=readFileSync('dist'+localizePath(route,lang)+'/index.html','utf8');
  const escape=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
  expect(html).toContain(escape(answer[0]));
  expect(html).toContain(escape(answer[1]));
  if(lang!=='en')expect(html).not.toContain(searchIntentGuides.en[tool as keyof typeof searchIntentGuides.en][0]);
 }
});
it('keeps practical questions scoped to the appropriate tool without changing canonical routes',()=>{
 const taxi=renderToStaticMarkup(<SearchGuide path="/taxi" lang="en" standalone/>);
 expect(taxi).toContain('How much is a taxi from Istanbul Airport to the city centre?');
 expect(taxi).not.toContain('How can I find a good currency exchange in Turkey?');
 const hotel=renderToStaticMarkup(<SearchGuide path="/hotels" lang="en" standalone/>);
 expect(hotel).toContain('Can I compare hotel room prices and book here?');
 expect(hotel).toContain('does not provide room prices');
});
