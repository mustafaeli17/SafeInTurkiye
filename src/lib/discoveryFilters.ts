import type {NearbyPlaceRecord} from '../services/nearbyPlaces';
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
