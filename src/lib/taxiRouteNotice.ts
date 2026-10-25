export const taxiRouteNotice:Record<string,string>={
 tr:'Bu karttaki mesafe, süre ve ücret aynı hesaplama rotasına aittir (OSRM). Google haritası bağımsız rota seçer; farklı mesafe veya süre gösterebilir. Haritadaki mesafe bu ücrete uygulanmaz. Süre canlı trafik tahmini değildir.',
 en:'Distance, duration and fare in this card refer to the same calculation route (OSRM). Google Maps selects its route independently and may show a different distance or time. Its distance is not used for this fare. Duration is not a live traffic estimate.',
 de:'Entfernung, Dauer und Preis beziehen sich auf die Berechnungsroute (OSRM). Google Maps wählt unabhängig eine Route und kann andere Werte anzeigen. Die Kartenentfernung wird nicht für diesen Preis verwendet. Keine Live-Verkehrsprognose.',
 fr:'La distance, la durée et le tarif concernent le trajet calculé (OSRM). Google Maps choisit son trajet indépendamment et peut afficher d’autres valeurs. Sa distance ne sert pas à ce tarif. La durée ne tient pas compte du trafic en direct.',
 es:'La distancia, duración y tarifa corresponden a la ruta calculada (OSRM). Google Maps elige su ruta de forma independiente y puede mostrar otros valores. Su distancia no se usa para esta tarifa. La duración no refleja el tráfico en directo.',
 ar:'المسافة والمدة والأجرة تخص مسار الحساب (OSRM). تختار خرائط Google مسارها بشكل مستقل وقد تعرض مسافة أو مدة مختلفة. لا تُستخدم مسافة الخريطة لحساب هذه الأجرة. المدة ليست تقديرًا لحركة المرور المباشرة.',
 ru:'Расстояние, время и цена относятся к расчётному маршруту (OSRM). Google Maps выбирает маршрут независимо и может показывать другие значения. Расстояние на карте не используется для этой цены. Время не учитывает текущие пробки.',
 zh:'距离、时间和费用对应计算路线（OSRM）。Google 地图独立选择路线，可能显示不同距离或时间。地图距离不用于此费用计算，时间也不是实时路况预测。'
};
// The packaged Preview map draws the calculation geometry itself, not a
// separately selected Google route. Keep the disclosure accurate in both modes.
export const taxiCalculationMapNotice:Record<string,string>={
 tr:'Harita, mesafe, süre ve tahmini ücret aynı hesaplama rotasına aittir (OSRM). Süre canlı trafik tahmini değildir.',
 en:'Map, distance, duration and estimated fare use the same calculation route (OSRM). Duration is not a live traffic estimate.',
 de:'Karte, Entfernung, Dauer und geschätzter Preis verwenden dieselbe Berechnungsroute (OSRM). Keine Live-Verkehrsprognose.',
 fr:'La carte, la distance, la durée et le tarif estimé utilisent le même trajet calculé (OSRM). La durée ne reflète pas le trafic en direct.',
 es:'El mapa, la distancia, la duración y la tarifa estimada usan la misma ruta calculada (OSRM). La duración no refleja el tráfico en directo.',
 ar:'تستخدم الخريطة والمسافة والمدة والأجرة التقديرية مسار الحساب نفسه (OSRM). المدة ليست تقديرًا لحركة المرور المباشرة.',
 ru:'Карта, расстояние, время и примерная цена используют один расчётный маршрут (OSRM). Время не учитывает текущие пробки.',
 zh:'地图、距离、时间和预估费用使用同一条计算路线（OSRM）。时间并非实时路况预测。',
};
