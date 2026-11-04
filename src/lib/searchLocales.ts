export const searchLanguages=['en','tr','de','fr','es','ar','ru','zh'] as const;
export type SearchLanguage=typeof searchLanguages[number];
export function parseLocalePath(value:string):{lang:SearchLanguage;path:string}{
 const match=value.match(/^\/(tr|de|fr|es|ar|ru|zh)(?=\/|\?|#|$)/);
 if(!match)return {lang:'en',path:value};
 const remainder=value.slice(match[0].length);
 return {lang:match[1] as SearchLanguage,path:remainder.startsWith('/')?remainder:'/'+remainder};
}
export function localizePath(value:string,language:string):string{
 if(!value.startsWith('/')||value.startsWith('//')||/^\/(api|assets|fonts|photos)(\/|$)/.test(value))return value;
 const {path}=parseLocalePath(value);
 if(language==='en'||!searchLanguages.includes(language as SearchLanguage))return path;
 return '/'+language+(path==='/'?'':path.startsWith('/?')||path.startsWith('/#')?path.slice(1):path);
}
