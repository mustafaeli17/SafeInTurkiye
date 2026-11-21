import type {SearchLanguage} from '../../lib/searchLocales';

export type PlanCity = 'İstanbul' | 'Antalya';
export const isPlanCity = (city: string): city is PlanCity => city === 'İstanbul' || city === 'Antalya';

const titles: Record<SearchLanguage, string> = {
  en: 'My day plan', tr: 'Gün planım', de: 'Mein Tagesplan', fr: 'Mon programme',
  es: 'Mi plan del día', ar: 'خطة يومي', ru: 'Мой план на день', zh: '我的一日行程',
};
export const dayPlanTitle = (lang: string) => titles[lang as SearchLanguage] ?? titles.en;
