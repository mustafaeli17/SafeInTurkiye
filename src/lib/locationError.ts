export function locationErrorText(code:number,lang:string):string{
 if(lang==='es')return code===1?'No has dado permiso de ubicación. Puedes buscar por ciudad.':'No se pudo obtener tu ubicación. Busca por ciudad o inténtalo de nuevo.';
 if(code===1)return lang.startsWith('tr')?'Konum izni verilmedi. Aşağıdaki şehir merkezi aramasını kullanabilirsiniz.':'Location permission was declined. You can use the city-centre search below.';
 return lang.startsWith('tr')?'Konum alınamadı. Şehir merkezinde arayabilir veya tekrar deneyebilirsiniz.':'Your location could not be found. Search the city centre or try again.';
}
