import {renderToStaticMarkup} from 'react-dom/server';
import {expect, it} from 'vitest';
import CityWalkGuide from '../components/CityWalkGuide';
import {retiredPlannerLocation} from '../lib/retiredPlannerLocation';
import {publicCities} from '../lib/publicRoutes';
import {localizePath, searchLanguages} from '../lib/searchLocales';

it('opens the same city guide for bookmarked day plans in every supported language', () => {
  for (const lang of searchLanguages) {
    for (const {slug} of publicCities) {
      const guide = localizePath('/cities/' + slug, lang);
      expect(retiredPlannerLocation(guide + '?city=' + slug + '&view=plan&day=2026-11-25#day-plan'))
        .toBe(guide + '?city=' + slug);
      expect(retiredPlannerLocation(guide + '#day-plan')).toBe(guide);
    }
  }
});

it('keeps the original selection and removes only the retired directory parameter', () => {
  for (const directory of ['hotels', 'restaurants', 'activities', 'tours']) {
    const path = '/tr/' + directory + '/';
    expect(retiredPlannerLocation(path + '?planDate=undated&city=antalya&place=selected&category=cafe#results'))
      .toBe(path + '?city=antalya&place=selected&category=cafe#results');
  }
  for (const location of ['/tours?day=2026-11-25', '/cities/istanbul?view=map&day=today', '/cities/missing?view=plan', '/transport?planDate=tomorrow', '/hotels?city=istanbul']) {
    expect(retiredPlannerLocation(location)).toBeNull();
  }
});

it('keeps the editorial guides and transport links without any day-planning controls', () => {
  for (const lang of searchLanguages) {
    for (const [city, slug] of [['İstanbul', 'istanbul'], ['Antalya', 'antalya']]) {
      const html = renderToStaticMarkup(<CityWalkGuide city={city} lang={lang}/>);
      expect(html).toContain(localizePath('/transport?city=' + slug, lang));
      expect(html).toContain('https://goturkiye.com/');
      expect(html).not.toMatch(/<button|view=plan|day-plan/);
    }
  }
  expect(renderToStaticMarkup(<CityWalkGuide city="Ankara" lang="tr"/>)).toBe('');
});
