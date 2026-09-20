const labels: Record<string, string[]> = {
  en: ['Search by name, city or interest', 'All cities', 'Clear filters', 'No matches. Try another city or clear the filters.', 'results'],
  tr: ['İsim, şehir veya ilgi alanı ara', 'Tüm şehirler', 'Filtreleri temizle', 'Sonuç bulunamadı. Başka şehir deneyin veya filtreleri temizleyin.', 'sonuç'],
  de: ['Name, Stadt oder Interesse suchen', 'Alle Städte', 'Filter löschen', 'Keine Treffer. Andere Stadt wählen oder Filter löschen.', 'Ergebnisse'],
  fr: ['Rechercher un nom, une ville ou un intérêt', 'Toutes les villes', 'Effacer les filtres', 'Aucun résultat. Essayez une autre ville ou effacez les filtres.', 'résultats'],
  ar: ['ابحث بالاسم أو المدينة أو الاهتمام', 'كل المدن', 'مسح الفلاتر', 'لا توجد نتائج. جرّب مدينة أخرى أو امسح الفلاتر.', 'نتائج'],
  ru: ['Поиск по названию, городу или интересу', 'Все города', 'Сбросить фильтры', 'Ничего не найдено. Выберите другой город или сбросьте фильтры.', 'результатов'],
  zh: ['按名称、城市或兴趣搜索', '所有城市', '清除筛选', '没有匹配结果。请选择其他城市或清除筛选。', '个结果'],
};
export default function CatalogFilters({lang, query, city, cities, count, onQuery, onCity, onReset}: {
  lang: string; query: string; city: string; cities: string[]; count: number;
  onQuery: (value: string) => void; onCity: (value: string) => void; onReset: () => void;
}) {
  const t = labels[lang] ?? labels.en;
  return <section className="catalog-filters">
    <div><input type="search" aria-label={t[0]} placeholder={t[0]} value={query} onChange={event => onQuery(event.target.value)} />
      <select aria-label={t[1]} value={city} onChange={event => onCity(event.target.value)}><option value="">{t[1]}</option>{cities.map(value => <option key={value}>{value}</option>)}</select>
      <button type="button" onClick={onReset}>{t[2]}</button></div>
    <p role="status">{count ? `${count} ${t[4]}` : t[3]}</p>
  </section>;
}
