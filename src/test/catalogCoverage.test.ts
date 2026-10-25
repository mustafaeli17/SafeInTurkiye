import {describe,it,expect} from 'vitest';
import {curatedDirectory,directoryEntry} from '../lib/directory';
import retired from '../data/retiredDirectory.json';
import {isRetiredDirectoryEntry,retiredDirectoryDestination} from '../lib/retiredDirectory';
describe('pre-API catalog retirement',()=>{
 it('keeps all three old manual lists empty',()=>{expect(curatedDirectory).toEqual([]);for(const kind of ['hotels','restaurants','activities'])expect(retired.some(entry=>entry.kind===kind)).toBe(true);});
 it('routes old bookmarks to the matching discovery section without exposing the old detail',()=>{
  for(const entry of retired){const path=`/${entry.kind}/${entry.slug}`;expect(directoryEntry(path)).toBeUndefined();expect(isRetiredDirectoryEntry(entry.kind,entry.slug)).toBe(true);expect(retiredDirectoryDestination(path)).toMatch(new RegExp('^/'+entry.kind+'(?:\\\\?|$)'));expect(retiredDirectoryDestination('/tr'+path)).toBe(retiredDirectoryDestination(path));}
 });
 it('does not retire newly published businesses or unrelated paths',()=>{expect(isRetiredDirectoryEntry('hotels','new-business')).toBe(false);expect(retiredDirectoryDestination('/taxi')).toBeUndefined();});
});
