export type DirectoryKind = 'hotels' | 'restaurants' | 'activities'
export const activityTypes = ['activity', 'museum', 'historical', 'cinema', 'entertainment', 'park'] as const
interface DirectoryCopy {
  hotels: [string, string, string]
  restaurants: [string, string, string]
  activities: [string, string, string]
  cuisine: string
  cuisines: [string, string, string, string, string, string, string]
}
export const directoryCopy: Record<string, DirectoryCopy> = {
  en: {
    hotels: ['Find your stay in Türkiye', 'Explore hotels by destination and see how to get there.', 'Search hotels by name'],
    restaurants: ['Discover Türkiye’s restaurants', 'From Turkish classics to seafood by the coast, find a table in your destination.', 'Search restaurants by name'],
    activities: ['Explore Türkiye’s sights', 'Discover museums, historic sites and parks around your destination.', 'Search places by name'],
    cuisine: 'Explore by cuisine', cuisines: ['All', 'Turkish', 'Seafood', 'Steakhouse', 'Breakfast', 'Italian', 'Vegan'],
  },
  tr: {
    hotels: ['Türkiye’de otelini bul', 'Gideceğin şehirdeki otelleri incele ve yol tarifi al.', 'Otel adıyla ara'],
    restaurants: ['Türkiye’nin restoranlarını keşfet', 'Geleneksel Türk mutfağından deniz ürünlerine, gideceğin yerde damak zevkine uygun bir restoran bul.', 'Restoran adıyla ara'],
    activities: ['Türkiye’de gezilecek yerler', 'Gideceğin şehirdeki müzeleri, tarihi yerleri ve parkları keşfet.', 'Yer adıyla ara'],
    cuisine: 'Mutfağa göre keşfet', cuisines: ['Tümü', 'Türk mutfağı', 'Deniz ürünleri', 'Et restoranı', 'Kahvaltı', 'İtalyan', 'Vegan'],
  },
  de: {
    hotels: ['Hotels in der Türkei entdecken', 'Finde Hotels an deinem Reiseziel und plane die Anfahrt.', 'Hotelname suchen'],
    restaurants: ['Restaurants in der Türkei entdecken', 'Finde türkische Klassiker und Fischrestaurants an deinem Reiseziel.', 'Restaurantname suchen'],
    activities: ['Die Türkei entdecken', 'Erkunde Museen, historische Stätten und Parks an deinem Reiseziel.', 'Ortsnamen suchen'],
    cuisine: 'Nach Küche entdecken', cuisines: ['Alle', 'Türkisch', 'Fisch', 'Steakhaus', 'Frühstück', 'Italienisch', 'Vegan'],
  },
  fr: {
    hotels: ['Trouvez votre hôtel en Turquie', 'Découvrez les hôtels de votre destination et trouvez votre itinéraire.', 'Rechercher un hôtel par nom'],
    restaurants: ['Les restaurants de Turquie', 'De la cuisine turque aux fruits de mer, découvrez les bonnes tables de votre destination.', 'Rechercher un restaurant par nom'],
    activities: ['Explorez les sites de Turquie', 'Découvrez les musées, les sites historiques et les parcs de votre destination.', 'Rechercher un lieu par nom'],
    cuisine: 'Explorer par cuisine', cuisines: ['Tous', 'Turque', 'Fruits de mer', 'Grillades', 'Petit déjeuner', 'Italienne', 'Végane'],
  },
  es: {
    hotels: ['Encuentra tu hotel en Turquía', 'Explora los hoteles de tu destino y consulta cómo llegar.', 'Buscar un hotel por nombre'],
    restaurants: ['Descubre los restaurantes de Turquía', 'De los clásicos turcos al marisco, encuentra un restaurante en tu destino.', 'Buscar un restaurante por nombre'],
    activities: ['Qué visitar en Turquía', 'Descubre museos, lugares históricos y parques en tu destino.', 'Buscar un lugar por nombre'],
    cuisine: 'Explorar por cocina', cuisines: ['Todos', 'Turca', 'Mariscos', 'Parrilla', 'Desayuno', 'Italiana', 'Vegana'],
  },
  ar: {
    hotels: ['اعثر على فندقك في تركيا', 'استكشف فنادق وجهتك وتعرّف على طرق الوصول إليها.', 'ابحث باسم الفندق'],
    restaurants: ['اكتشف مطاعم تركيا', 'من المطبخ التركي إلى المأكولات البحرية، اعثر على مطعم يناسب ذوقك في وجهتك.', 'ابحث باسم المطعم'],
    activities: ['استكشف معالم تركيا', 'اكتشف المتاحف والمواقع التاريخية والحدائق في وجهتك.', 'ابحث باسم المكان'],
    cuisine: 'استكشف حسب المطبخ', cuisines: ['الكل', 'تركي', 'مأكولات بحرية', 'ستيك', 'فطور', 'إيطالي', 'نباتي صرف'],
  },
  ru: {
    hotels: ['Найдите отель в Турции', 'Посмотрите отели в выбранном городе и проложите маршрут.', 'Поиск отелей по названию'],
    restaurants: ['Откройте для себя рестораны Турции', 'Найдите в выбранном городе рестораны турецкой кухни и блюда из морепродуктов.', 'Поиск ресторана по названию'],
    activities: ['Что посмотреть в Турции', 'Исследуйте музеи, исторические места и парки в выбранном городе.', 'Поиск места по названию'],
    cuisine: 'Выбрать кухню', cuisines: ['Все', 'Турецкая', 'Морепродукты', 'Стейк-хаус', 'Завтраки', 'Итальянская', 'Веганская'],
  },
  zh: {
    hotels: ['寻找土耳其的下榻之处', '探索目的地的酒店，并查看前往酒店的路线。', '按名称搜索酒店'],
    restaurants: ['探索土耳其的餐厅', '从经典土耳其菜到海鲜，在目的地找到合口味的餐厅。', '按名称搜索餐厅'],
    activities: ['探索土耳其的景点', '发现目的地的博物馆、历史遗址和公园。', '按名称搜索地点'],
    cuisine: '按菜系探索', cuisines: ['全部', '土耳其菜', '海鲜', '牛排馆', '早餐', '意大利菜', '纯素'],
  },
}
