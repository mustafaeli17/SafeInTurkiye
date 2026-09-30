import {describe,it,expect} from 'vitest';
import {curatedDirectory} from '../lib/directory';
import {entryPhotos,illustrativeLabel} from '../lib/directoryPhotos';
import targets from '../data/catalogTargets.json';
describe('catalog expansion safeguards',()=>{
 it('keeps the requested minimums explicit, including every existing activity category',()=>{
  expect(targets.hotelsPerCity).toBe(5);
  expect(targets.restaurantsPerCity).toBe(5);
  expect(targets.activitiesPerCategory).toBe(3);
  expect(targets.activityCategories).toEqual(['Museum & Culture','Cinema','Entertainment','Summer','Winter']);
 });
 it('has five genuine-photo hotels in Antalya and İzmir',()=>{
  for(const city of ['Antalya','İzmir']){
   const entries=curatedDirectory.filter(e=>e.city===city&&e.kind==='hotels');
   expect(entries.length).toBeGreaterThanOrEqual(5);
   expect(new Set(entries.map(e=>e.website)).size).toBe(entries.length);
   for(const entry of entries)expect(entryPhotos(entry)[0].illustrative).not.toBe(true);
  }
 });
 it('has five Istanbul restaurants with actual business photos',()=>{
  const entries=curatedDirectory.filter(e=>e.city==='İstanbul'&&e.kind==='restaurants');
  expect(entries.length).toBeGreaterThanOrEqual(5);
  for(const entry of entries)expect(entryPhotos(entry)[0].illustrative).not.toBe(true);
 });
 it('allows illustrative cinema photos but rejects them for a hotel or museum',()=>{
  const cinema=curatedDirectory.find(e=>e.category==='Cinema')!;
  expect(entryPhotos(cinema)[0].illustrative).toBe(true);
  expect(entryPhotos({...cinema,kind:'hotels'})).toEqual([]);
  expect(entryPhotos({...cinema,category:'Museum & Culture'})).toEqual([]);
  for(const lang of ['tr','en','ar','zh'])expect(illustrativeLabel(lang)).toBeTruthy();
 });
 it('has three distinct cinema venues in İstanbul, Ankara and İzmir',()=>{
  for(const city of ['İstanbul','Ankara','İzmir']){
   const entries=curatedDirectory.filter(e=>e.city===city&&e.category==='Cinema');
   expect(entries.length).toBeGreaterThanOrEqual(3);
   expect(new Set(entries.map(e=>e.website)).size).toBe(entries.length);
  }
 });
 it('does not publish duplicate business websites within the same city and kind',()=>{
  const identities=curatedDirectory.map(e=>`${e.kind}/${e.city}/${e.website.replace(/\/$/,'')}`);
  // Landmarks may share a tourism authority; business venues must be distinct.
  const businesses=identities.filter(id=>id.startsWith('hotels/')||id.startsWith('restaurants/'));
  expect(new Set(businesses).size).toBe(businesses.length);
 });
});
