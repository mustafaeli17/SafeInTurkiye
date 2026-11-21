import type {NearbyPlaceRecord} from '../services/nearbyPlaces';

export const discoveryEmptyFiltersCopy: Record<string,string> = {
 en: 'No places match your current filters.',
 tr: 'Seçtiğiniz filtrelere uyan yer bulunamadı.',
 de: 'Keine Orte entsprechen deinen aktuellen Filtern.',
 fr: 'Aucun lieu ne correspond aux filtres sélectionnés.',
 es: 'Ningún lugar coincide con los filtros seleccionados.',
 ar: 'لا توجد أماكن تطابق عوامل التصفية المحددة.',
 ru: 'Ни одно место не соответствует выбранным фильтрам.',
 zh: '没有符合当前筛选条件的地点。',
};

const resultProgress: Record<string,string> = {
 en: 'Showing {shown} of {total} results.',
 tr: '{total} sonucun {shown} tanesi gösteriliyor.',
 de: '{shown} von {total} Ergebnissen werden angezeigt.',
 fr: '{shown} résultats affichés sur {total}.',
 es: 'Se muestran {shown} de {total} resultados.',
 ar: 'يتم عرض {shown} من أصل {total} نتيجة.',
 ru: 'Показано {shown} из {total}.',
 zh: '已显示 {shown} 条，共 {total} 条。',
};
export function discoveryResultProgress(locale:string,shown:number,total:number){
 const format = new Intl.NumberFormat(locale);
 return (resultProgress[locale] ?? resultProgress.en)
  .replace('{shown}', format.format(shown))
  .replace('{total}', format.format(total));
}
export function filterDiscovery<T extends NearbyPlaceRecord>(places:T[],params:URLSearchParams):T[]{
 const min=Number(params.get('minRating')??0),open=params.get('open')==='true',sort=params.get('order');
 const filtered=places.filter(p=>(!open||p.openNow===true)&&(!Number.isFinite(min)||min<=0||p.rating!==undefined&&p.rating>=min));
 if(sort==='distance')filtered.sort((a,b)=>a.distanceMeters-b.distanceMeters);
 if(sort==='rating')filtered.sort((a,b)=>(b.rating??-1)-(a.rating??-1)||(b.reviewCount??0)-(a.reviewCount??0));
 return filtered;
}
export const discoveryFilterCopy:Record<string,string[]>={
 tr:['Yüklenen sonuçları filtrele','Sıralama','Önerilen sıra','Mesafe','Puan','Şu an açık','En az puan','Tümü','Filtreleri temizle'],en:['Filter loaded results','Sort','Recommended order','Distance','Rating','Open now','Minimum rating','All','Clear filters'],de:['Geladene Ergebnisse filtern','Sortierung','Empfohlene Reihenfolge','Entfernung','Bewertung','Jetzt geöffnet','Mindestbewertung','Alle','Filter löschen'],fr:['Filtrer les résultats chargés','Trier','Ordre recommandé','Distance','Note','Ouvert maintenant','Note minimale','Tous','Effacer les filtres'],es:['Filtrar resultados cargados','Ordenar','Orden recomendado','Distancia','Puntuación','Abierto ahora','Puntuación mínima','Todos','Borrar filtros'],ar:['تصفية النتائج المحملة','ترتيب','الترتيب المقترح','المسافة','التقييم','مفتوح الآن','أقل تقييم','الكل','مسح الفلاتر'],ru:['Фильтр загруженных результатов','Сортировка','Рекомендуемый порядок','Расстояние','Оценка','Сейчас открыто','Минимальная оценка','Все','Сбросить фильтры'],zh:['筛选已加载结果','排序','推荐顺序','距离','评分','当前营业','最低评分','全部','清除筛选'],
};
