// Search anchors, not administrative boundaries or taxi tariff jurisdictions.
// New anchors checked against OSM/Photon on 2026-09-24. Districts stay distinct.
export const searchDestinations = {
  'İstanbul': { lat:41.0082, lng:28.9784 }, Ankara:{lat:39.9334,lng:32.8597},
  'İzmir':{lat:38.4237,lng:27.1428}, Antalya:{lat:36.8969,lng:30.7133},
  Cappadocia:{lat:38.6431,lng:34.8289},
  'Muğla':{lat:37.2151784,lng:28.363733}, Bodrum:{lat:37.0343987,lng:27.430651},
  'Aydın':{lat:37.8483767,lng:27.8435878}, 'Kuşadası':{lat:37.8632398,lng:27.266873},
  Didim:{lat:37.3696865,lng:27.2684841}, Denizli:{lat:37.7827875,lng:29.0966476},
  Pamukkale:{lat:37.9200382,lng:29.1217529}, Trabzon:{lat:41.0054605,lng:39.7301463},
  Konya:{lat:37.872734,lng:32.4924376}, Bursa:{lat:40.1825734,lng:29.0675039},
  'Çeşme':{lat:38.3244044,lng:26.3029604}, 'Alaçatı':{lat:38.2847573,lng:26.3745176},
};
export const searchDestinationSources = {
  'Muğla':'node/25869694', Bodrum:'relation/1827275', 'Aydın':'node/8603453649',
  'Kuşadası':'relation/1814656', Didim:'relation/1814655', Denizli:'node/6196594141',
  Pamukkale:'way/373706054', Trabzon:'node/512552945', Konya:'node/25869814',
  Bursa:'node/289534897', 'Çeşme':'relation/1268454', 'Alaçatı':'relation/10911859',
};
export const directionsText: Record<string,string> = {
  tr:'Yol tarifi', en:'Directions', de:'Wegbeschreibung', fr:'Itinéraire',
  ar:'الاتجاهات', ru:'Как добраться', zh:'路线',
};
