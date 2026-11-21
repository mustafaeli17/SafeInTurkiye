import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import NearMeHero from '../components/NearMeHero'
import NearMeResults from '../components/NearMeResults'
import {nearMeDesignCopy} from '../lib/nearMeDesignCopy'
import {discoveryResultProgress} from '../lib/discoveryFilters'
it.each([
 ['en','Showing 6 of 20 results.'],['tr','20 sonucun 6 tanesi gösteriliyor.'],
 ['de','6 von 20 Ergebnissen werden angezeigt.'],['fr','6 résultats affichés sur 20.'],
 ['es','Se muestran 6 de 20 resultados.'],['ar','يتم عرض {6} من أصل {20} نتيجة.'],
 ['ru','Показано 6 из 20.'],['zh','已显示 6 条，共 20 条。'],
])('distinguishes the displayed result count from the total in %s',(locale,expected)=>{
 const format=new Intl.NumberFormat(locale)
 expect(discoveryResultProgress(locale,6,20)).toBe(expected.replace('{6}',format.format(6)).replace('{20}',format.format(20)))
})
it.each(['en','tr','de','fr','es','ar','ru','zh'])('renders translated near-me hero in %s',lang=>{const html=renderToStaticMarkup(<NearMeHero lang={lang}/>);expect(html).toContain(nearMeDesignCopy[lang].title);expect(html).toContain('nearby-hagia-sophia');expect(html).toContain('<h1>')})
it('does not fabricate ratings, photos or opening hours for incomplete places',()=>{
 const html=renderToStaticMarkup(<NearMeResults places={[{id:'google:test',name:'QA only',category:'cafe',coordinates:{lat:41,lng:29},distanceMeters:155,address:null,phone:null,telephoneUrl:null,website:null,openingHours:null,sourceUrl:'https://maps.google.com/'}]} lang="en" onOpen={()=>{}} categoryLabel={()=>'Cafe'} distance={n=>n+' m'} text={(_tr,en)=>en} directions="Directions" businessKey={()=>undefined} onExpired={()=>{}}/>);
 expect(html).toContain('QA only');expect(html).toContain('155 m');expect(html).not.toContain('<img');expect(html).not.toContain('Open now');expect(html).not.toContain('nearby-card-rating');expect(html).toContain('destination_place_id=test');expect(html).toContain('aria-pressed="true"');
})
