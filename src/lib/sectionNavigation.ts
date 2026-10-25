import routes from '../data/sectionRoutes.json';
export type Section = keyof typeof routes;
export function sectionFromPath(path:string):Section|undefined {
 return (Object.keys(routes) as Section[]).find(key=>routes[key].path===path.replace(/\/$/,''));
}
export function sectionPath(section:string):string {return routes[section as Section]?.path??'/';}
export function transferIntent(query:string):boolean {
 return /transfer|traslado|transfert|трансфер|ترانسفير|نقل.*مطار|接机|送机|机场接送|havalimanı.*transfer/i.test(query);
}
