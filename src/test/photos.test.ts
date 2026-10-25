import {describe,it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import artwork from '../data/cityArtwork.json';
import hero from '../data/heroPhoto.json';
describe('active destination artwork',()=>{
 it('ships only real local paths for each active city cover and thumbnail',()=>{for(const photo of artwork)for(const src of [photo.src,photo.thumbnail]){expect(src).toMatch(/^\/photos\/cities-2026\//);expect(existsSync('public'+src)).toBe(true);const bytes=readFileSync('public'+src);expect(bytes.length).toBeGreaterThan(1000);expect(bytes.toString('ascii',8,12)).toBe('WEBP');}});
 it('retains the homepage panorama and explicitly labels generated artwork',()=>{expect(existsSync('public'+hero.src)).toBe(true);expect(hero.origin).toContain('AI-generated');for(const photo of artwork)expect(photo.kind).toContain('AI-generated');});
});
