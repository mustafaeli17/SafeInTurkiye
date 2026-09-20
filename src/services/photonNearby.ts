export function photonNearbyUrl(lat: number, lng: number, kind: string): string {
  const params = new URLSearchParams({lat: String(lat), lon: String(lng), radius: '2.5', limit: '50'});
  for (const category of kind === 'exchange' ? ['bureau_de_change'] : ['pharmacy', 'hospital', 'police', 'atm', 'taxi']) params.append('osm_tag', `amenity:${category}`);
  return `https://photon.komoot.io/reverse?${params}`;
}

export function photonToOsm(payload: unknown) {
  if (!payload || typeof payload !== 'object' || !('features' in payload) || !Array.isArray(payload.features)) throw new Error('INVALID_PHOTON_RESPONSE');
  return { provider: 'Photon', elements: payload.features.flatMap(feature => {
    const p = feature?.properties;
    const coordinates = feature?.geometry?.coordinates;
    if (!p || p.osm_key !== 'amenity' || feature?.geometry?.type !== 'Point' || !Array.isArray(coordinates)) return [];
    return [{id: p.osm_id, type: ({N:'node', W:'way', R:'relation'} as Record<string,string>)[p.osm_type], lat: coordinates[1], lon: coordinates[0], tags: {
      amenity: p.osm_value, name: p.name, 'addr:street': p.street, 'addr:housenumber': p.housenumber, 'addr:district': p.district, 'addr:city': p.city,
    }}];
  })};
}
