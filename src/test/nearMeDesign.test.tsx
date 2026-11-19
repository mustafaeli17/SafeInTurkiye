import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import NearMeHero from '../components/NearMeHero'
import NearMeResults from '../components/NearMeResults'
import {nearMeDesignCopy} from '../lib/nearMeDesignCopy'
it.each(['en','tr','de','fr','es','ar','ru','zh'])('renders translated near-me hero in %s',lang=>{const html=renderToStaticMarkup(<NearMeHero lang={lang}/>);expect(html).toContain(nearMeDesignCopy[lang].title);expect(html).toContain('nearby-hagia-sophia');expect(html).toContain('<h1>')})
it('does not fabricate ratings, photos or opening hours for incomplete places',()=>{
 const html=renderToStaticMarkup(<NearMeResults places={[{id:'google:test',name:'QA only',category:'cafe',coordinates:{lat:41,lng:29},distanceMeters:155,address:null,phone:null,telephoneUrl:null,website:null,openingHours:null,sourceUrl:'https://maps.google.com/'}]} lang="en" onOpen={()=>{}} categoryLabel={()=>'Cafe'} distance={n=>n+' m'} text={(_tr,en)=>en} directions="Directions" businessKey={()=>undefined} onExpired={()=>{}}/>);
 expect(html).toContain('QA only');expect(html).toContain('155 m');expect(html).not.toContain('<img');expect(html).not.toContain('Open now');expect(html).not.toContain('nearby-card-rating');expect(html).toContain('destination_place_id=test');expect(html).toContain('aria-pressed="true"');
})
