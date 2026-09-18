import { describe, expect, it } from 'vitest';
import { getTransitGuide, guideStations } from '../services/transitGuide';

describe('limited official-line transit guide', () => {
  it('adds F1 only when Taksim is involved and transfers at Kabataş', () => {
    const result = getTransitGuide('taksim', 'sultanahmet');
    expect(result.status).toBe('guide');
    expect(result.legs.map(leg => leg.line)).toEqual(['F1', 'T1']);
    expect(result.legs[0].stations.at(-1)?.id).toBe('kabatas');
    expect(result.legs[1].stations[0].id).toBe('kabatas');
    expect(result.legs[1].direction).toBe('Bağcılar');
  });

  it('uses a direct tram guide for two T1 stations, not the fixed F1 + T1 route', () => {
    const result = getTransitGuide('karakoy', 'gulhane');
    expect(result.legs).toHaveLength(1);
    expect(result.legs[0].line).toBe('T1');
    expect(result.legs[0].stations.map(station => station.id)).toEqual(['karakoy', 'eminonu', 'sirkeci', 'gulhane']);
  });

  it('reverses the station sequence and direction for the return journey', () => {
    const result = getTransitGuide('sultanahmet', 'taksim');
    expect(result.legs.map(leg => leg.line)).toEqual(['T1', 'F1']);
    expect(result.legs.map(leg => leg.direction)).toEqual(['Kabataş', 'Taksim']);
    expect(result.legs[0].stations[0].id).toBe('sultanahmet');
    expect(result.legs[1].stations.at(-1)?.id).toBe('taksim');
  });

  it('does not generate a route for unknown or identical stations', () => {
    expect(getTransitGuide('airport', 'sultanahmet')).toEqual({ status: 'unsupported', legs: [] });
    expect(getTransitGuide('taksim', 'taksim')).toEqual({ status: 'same-station', legs: [] });
  });

  it('has consistent endpoints for every supported pair and no invented metrics', () => {
    for (const from of guideStations) for (const to of guideStations) {
      if (from.id === to.id) continue;
      const result = getTransitGuide(from.id, to.id);
      expect(result.legs[0].stations[0].id).toBe(from.id);
      expect(result.legs.at(-1)?.stations.at(-1)?.id).toBe(to.id);
      expect(result).not.toHaveProperty('fare');
      expect(result).not.toHaveProperty('duration');
      expect(result).not.toHaveProperty('geometry');
    }
  });
});
