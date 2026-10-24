// Service categories, not assertions about which genders a business serves.
const copy: Record<string, [string,string]> = {
 tr:['Berber','Kuaför / saç salonu'], en:['Barber','Hair salon'],
 es:['Barbería','Peluquería'], de:['Barbier','Friseursalon'],
 fr:['Barbier','Salon de coiffure'], ar:['حلاق','صالون تصفيف الشعر'],
 ru:['Барбершоп','Парикмахерская'], zh:['男士理发店','美发沙龙'],
};
export function groomingCategoryLabel(category:string,locale:string):string|undefined {
 const labels=copy[locale]??copy.en;
 return category==='barber'?labels[0]:category==='hair_salon'?labels[1]:undefined;
}
