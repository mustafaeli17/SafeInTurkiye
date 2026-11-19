export type AddressSearchState = '' | 'loading' | 'empty' | 'error'
const copy:Record<string,[string,string,string]>={
 tr:['Adresler aranıyor…','Yer bulunamadı. Şehir ve tam yer adını ekleyerek tekrar ara.','Adres araması şu an kullanılamıyor. Biraz sonra tekrar dene.'],
 en:['Searching addresses…','No place found. Try adding the city and full place name.','Address search is unavailable. Please try again shortly.'],
 de:['Adressen werden gesucht…','Kein Ort gefunden. Suche mit Stadt und vollständigem Ortsnamen.','Die Adresssuche ist nicht verfügbar. Bitte versuche es gleich erneut.'],
 fr:['Recherche d’adresses…','Aucun lieu trouvé. Ajoutez la ville et le nom complet du lieu.','La recherche d’adresses est indisponible. Réessayez dans un instant.'],
 es:['Buscando direcciones…','No se encontró el lugar. Añade la ciudad y el nombre completo.','La búsqueda de direcciones no está disponible. Inténtalo de nuevo en unos momentos.'],
 ru:['Поиск адресов…','Место не найдено. Добавьте город и полное название места.','Поиск адресов недоступен. Попробуйте немного позже.'],
 ar:['جارٍ البحث عن العناوين…','لم يتم العثور على المكان. أضف المدينة والاسم الكامل للمكان.','البحث عن العناوين غير متاح الآن. حاول مجددًا بعد قليل.'],
 zh:['正在搜索地址…','未找到地点。请添加城市和完整地点名称后重试。','地址搜索暂时不可用，请稍后重试。'],
}
export function addressSearchText(lang:string,state:AddressSearchState){
 return state?(copy[lang.toLowerCase()]??copy.en)[state==='loading'?0:state==='empty'?1:2]:''
}
