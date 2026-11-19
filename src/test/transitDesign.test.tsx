import {expect,it} from 'vitest';
import {renderToString} from 'react-dom/server';
import TransitPlanner from '../components/TransitPlanner';
import {transitDesignCopy} from '../lib/transitDesignCopy';
it.each(Object.keys(transitDesignCopy))('renders accessible transit panels in %s',lang=>{
 const html=renderToString(<TransitPlanner lang={lang} initialCity="Antalya"/>);
 expect(html.match(/role="tab"/g)).toHaveLength(4);
 expect(html.match(/role="tabpanel"/g)).toHaveLength(4);
 expect(html.match(/hidden=""/g)?.length).toBeGreaterThanOrEqual(3);
 expect(html).toContain('/photos/cities-2026/antalya-1536.webp');
 for(const label of transitDesignCopy[lang])expect(html).toContain(label.replace(/&/g,'&amp;'));
 expect(html).not.toContain('24 dk');
});
