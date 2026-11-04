interface CityInfo {
  name: string;
  tagline: string;
  lat: number;
  lng: number;
  temp: string;
  weatherDesc: string;
  humidity: string;
  wind: string;
  localTip: string;
  highlights: { name: string; detail: string }[];
}

export const citiesDetailedData: Record<string, CityInfo> = {
  'Ankara': {
    name: 'Ankara', tagline: 'Türkiye’s capital: museums, historic streets and parks',
    lat: 39.9334, lng: 32.8597,
    temp: '', weatherDesc: '', humidity: '', wind: '',
    localTip: 'Use Başkent Kart Ulaşım for urban transport. Check EGO for routes and departure times.',
    highlights: [
      { name: 'Anıtkabir', detail: 'Memorial grounds and museum; check visiting hours before travel.' },
      { name: 'Museum of Anatolian Civilizations', detail: 'Archaeological collections near Ankara Castle.' },
      { name: 'Ankara Castle & Hamamönü', detail: 'Historic streets and city views.' },
    ],
  },
  'İstanbul': {
    name: 'İstanbul',
    tagline: 'Bridging continents with vibrant history, ferries and culture',
    lat: 41.0082, lng: 28.9784,
    temp: '25°C',
    weatherDesc: 'Sunny & Pleasant',
    humidity: '58%',
    wind: '18 km/h NE',
    localTip: 'During 17:30 - 20:00, prefer Marmaray or Bosphorus ferries to avoid bridge gridlock.',
    highlights: [
      { name: 'Hagia Sophia & Sultanahmet', detail: 'Historic peninsula essentials; arrive early for shorter queues.' },
      { name: 'Topkapı Palace', detail: 'Allow a half day for the palace, gardens and museum collections.' },
      { name: 'Bosphorus ferries', detail: 'A practical and scenic way to cross between the European and Asian sides.' }
    ]
  },
  'Cappadocia': {
    name: 'Cappadocia (Kapadokya)',
    tagline: 'Fairy chimneys, volcanic valleys and sunrise balloon corridors',
    lat: 38.6431, lng: 34.8289,
    temp: '22°C',
    weatherDesc: 'Clear Sky & Calm',
    humidity: '34%',
    wind: '7 km/h SW',
    localTip: 'Early dawn balloon flights depend on Civil Aviation wind approval checked at 05:00.',
    highlights: [
      { name: 'Göreme Open-Air Museum', detail: 'Rock-cut churches and frescoes; go first thing in the morning.' },
      { name: 'Love & Rose Valleys', detail: 'Plan the walk before the midday sun and take water.' },
      { name: 'Uçhisar Castle', detail: 'Wide valley views from the highest point in the area.' }
    ]
  },
  'Antalya': {
    name: 'Antalya',
    tagline: 'Turquoise Mediterranean shores, waterfalls and Roman ruins',
    lat: 36.8969, lng: 30.7133,
    temp: '30°C',
    weatherDesc: 'Warm & Sunny',
    humidity: '64%',
    wind: '12 km/h S',
    localTip: 'Use AntRay tramway from the airport directly to Hadrian Gate in Kaleiçi.',
    highlights: [
      { name: 'Antalya Museum', detail: 'One of Türkiye’s strongest archaeology collections.' },
      { name: 'Kaleiçi & Hadrian’s Gate', detail: 'Walkable old town lanes, harbour views and Roman history.' },
      { name: 'Düden Waterfalls', detail: 'A short excursion with sea-cliff viewpoints.' }
    ]
  },
  'İzmir': {
    name: 'İzmir',
    tagline: 'Aegean breeze, Kordon promenade, and lively bazaar alleys',
    lat: 38.4237, lng: 27.1428,
    temp: '28°C',
    weatherDesc: 'Breezy & Sunny',
    humidity: '50%',
    wind: '22 km/h W',
    localTip: 'Enjoy the sunset ferry from Alsancak to Karşıyaka with contactless credit card tap.',
    highlights: [
      { name: 'Agora Open Air Museum', detail: 'Roman-era remains beside the historic market district.' },
      { name: 'Kemeraltı Bazaar', detail: 'A lively maze for food, crafts and local shopping.' },
      { name: 'Kordon & ferry line', detail: 'An easy waterfront walk and a useful cross-bay connection.' }
    ]
  }
};
