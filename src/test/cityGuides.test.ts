import { describe, expect, it } from 'vitest';
import cities from '../data/cityGuides.json';
describe('sourced city guides',()=>{
  it('includes all six requested new destinations with unique routes',()=>{
    expect(cities.map(city=>city.slug).sort()).toEqual(['aydin','bursa','denizli','konya','mugla','trabzon']);
    expect(new Set(cities.map(city=>city.slug)).size).toBe(cities.length);
  });
  it('requires official source, verification date and bilingual factual content',()=>{
    for(const city of cities){
      expect(new URL(city.source).hostname).toBe('goturkiye.com');
      expect(city.verified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(city.description.en.length).toBeGreaterThan(40);
      expect(city.description.tr.length).toBeGreaterThan(40);
      expect(city.places.length).toBeGreaterThanOrEqual(2);
      expect(city.lat).toBeGreaterThan(35);expect(city.lat).toBeLessThan(43);
      expect(city.lng).toBeGreaterThan(25);expect(city.lng).toBeLessThan(45);
      expect(city).not.toHaveProperty('trafficIndex');
      expect(city).not.toHaveProperty('temperature');
    }
  });
});
