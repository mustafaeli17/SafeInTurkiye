import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import TravelFaq,{TransportCardGuide} from '../components/TravelFaq';
import cities from '../data/citiesTr.json';
it('renders Spanish FAQ and transport guides without English fallback',()=>{
 const html=renderToStaticMarkup(<TravelFaq lang="es"/>);
 expect(html).toContain('Preguntas frecuentes');expect(html).toContain('Buscar preguntas');expect(html).toContain('¿Cómo consigo');expect(html).not.toContain('Frequently asked');expect(html).not.toContain('How do I');
 for(const city of ['İstanbul','Ankara','İzmir','Antalya'])expect(renderToStaticMarkup(<TransportCardGuide lang="es" city={city}/>)).toContain('Información oficial');
});
it('covers all five original city highlight sets in Turkish',()=>{
 expect(Object.keys(cities)).toHaveLength(5);
 for(const city of Object.values(cities)){expect(city.tagline.length).toBeGreaterThan(20);expect(city.highlights).toHaveLength(3);for(const item of city.highlights)expect(item.detail.length).toBeGreaterThan(20);}
});
