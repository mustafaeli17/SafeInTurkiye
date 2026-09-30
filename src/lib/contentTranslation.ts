import zh from '../data/directoryZh.json';
const chinese:Record<string,string>=zh;
export function translatedDescription(entry:{id:string;category?:string;description:Record<string,string>},lang:string){
 if(lang==='zh'){
  if(entry.category==='Cinema'||entry.id.startsWith('cinema')||entry.id.startsWith('paribu-'))return '请在影院官网确认最新影片、放映时间及语言。购票请通过影院运营方的网站办理。';
  if(chinese[entry.id])return chinese[entry.id];
 }
 return entry.description[lang]??entry.description.en??'';
}
export const photoEditingCopy:Record<string,string>={
 en:'Resized to WebP; display crop may vary. No retouching.',tr:'WebP olarak boyutlandırıldı; ekranda kırpılabilir. Rötuş yok.',
 zh:'图片已调整尺寸并转换为 WebP；显示时可能裁剪，未进行修饰。',ar:'تم تغيير الحجم والتحويل إلى WebP؛ قد يختلف الاقتصاص حسب الشاشة. دون تنقيح.',
 de:'Als WebP skaliert; der Bildausschnitt kann variieren. Keine Retusche.',fr:'Redimensionné en WebP ; le cadrage peut varier. Sans retouche.',ru:'Размер изменён, формат WebP; кадрирование зависит от экрана. Без ретуши.'
};
