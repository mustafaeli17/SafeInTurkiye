/**
 * A deliberately limited station guide, not a live journey planner.
 * Station order and interchange: Metro Istanbul's official F1 and T1 pages.
 * Checked 2026-09-17. No operating times, fares or disruption data is inferred.
 */
export const transitSources = {
  F1: 'https://www.metro.istanbul/en/Hatlarimiz/HatDetay?hat=F1',
  T1: 'https://www.metro.istanbul/en/Hatlarimiz/HatDetay?hat=T1',
} as const;

export const guideStations = [
  { id: 'taksim', name: 'Taksim', lat: 41.0369, lng: 28.9850 },
  { id: 'kabatas', name: 'Kabataş', lat: 41.0341, lng: 28.9920 },
  { id: 'findikli', name: 'Fındıklı–Mimar Sinan Ü.', lat: 41.0310, lng: 28.9880 },
  { id: 'tophane', name: 'Tophane', lat: 41.0261, lng: 28.9805 },
  { id: 'karakoy', name: 'Karaköy', lat: 41.0220, lng: 28.9756 },
  { id: 'eminonu', name: 'Eminönü', lat: 41.0175, lng: 28.9746 },
  { id: 'sirkeci', name: 'Sirkeci', lat: 41.0138, lng: 28.9777 },
  { id: 'gulhane', name: 'Gülhane', lat: 41.0116, lng: 28.9779 },
  { id: 'sultanahmet', name: 'Sultanahmet', lat: 41.0084, lng: 28.9754 },
  { id: 'cemberlitas', name: 'Çemberlitaş', lat: 41.0084, lng: 28.9712 },
  { id: 'beyazit', name: 'Beyazıt–Kapalıçarşı', lat: 41.0086, lng: 28.9668 },
] as const;

export type GuideStation = (typeof guideStations)[number];
export type GuideLeg = {
  line: 'F1' | 'T1';
  direction: string;
  stations: GuideStation[];
  sourceUrl: string;
};

export type GuideResult =
  | { status: 'same-station' | 'unsupported'; legs: [] }
  | { status: 'guide'; legs: GuideLeg[] };

export function getTransitGuide(originId: string, destinationId: string): GuideResult {
  const from = guideStations.findIndex(station => station.id === originId);
  const to = guideStations.findIndex(station => station.id === destinationId);
  if (from < 0 || to < 0) return { status: 'unsupported', legs: [] };
  if (from === to) return { status: 'same-station', legs: [] };

  const direction = from < to ? 1 : -1;
  const legs: GuideLeg[] = [];
  for (let index = from; index !== to; index += direction) {
    const next = index + direction;
    const line = Math.min(index, next) === 0 ? 'F1' : 'T1';
    const last = legs.at(-1);
    if (last?.line === line) {
      last.stations.push(guideStations[next]);
    } else {
      legs.push({
        line,
        direction: line === 'F1' ? (direction === 1 ? 'Kabataş' : 'Taksim') : (direction === 1 ? 'Bağcılar' : 'Kabataş'),
        stations: [guideStations[index], guideStations[next]],
        sourceUrl: transitSources[line],
      });
    }
  }
  return { status: 'guide', legs };
}
