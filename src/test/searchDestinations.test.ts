import { describe, expect, it } from 'vitest';
import { searchDestinations, searchDestinationSources } from '../lib/searchDestinations';
import { isValidCenter } from '../services/nearbyPlaces';
describe('destination search anchors', () => {
  it('supports all requested regions without replacing city centres with district centres', () => {
    for (const name of Object.keys(searchDestinationSources)) {
      expect(isValidCenter(searchDestinations[name as keyof typeof searchDestinations])).toBe(true);
    }
    expect(searchDestinations['Muğla']).not.toEqual(searchDestinations.Bodrum);
    expect(searchDestinations['Aydın']).not.toEqual(searchDestinations.Didim);
    expect(searchDestinations['İzmir']).not.toEqual(searchDestinations['Çeşme']);
  });
});
