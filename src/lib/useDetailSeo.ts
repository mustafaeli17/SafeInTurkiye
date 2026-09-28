import { useEffect } from 'react';

export function useDetailSeo(title:string, description:string, path:string) {
  useEffect(()=>{
    const oldTitle=document.title;
    const url=`https://www.safeinturkiye.com${path}`;
    const values:[string,string,string][]=[
      ['meta[name="description"]','content',description],
      ['link[rel="canonical"]','href',url],
      ['meta[property="og:title"]','content',title],
      ['meta[name="twitter:title"]','content',title],
      ['meta[property="og:description"]','content',description],
      ['meta[name="twitter:description"]','content',description],
      ['meta[property="og:url"]','content',url],
    ];
    const snapshots=values.map(([selector,attribute,value])=>{
      const element=document.querySelector(selector),previous=element?.getAttribute(attribute);
      element?.setAttribute(attribute,value);
      return {element,attribute,previous};
    });
    document.title=title;
    return ()=>{
      document.title=oldTitle;
      for(const {element,attribute,previous} of snapshots){
        if(previous!=null)element?.setAttribute(attribute,previous);else element?.removeAttribute(attribute);
      }
    };
  },[title,description,path]);
}
