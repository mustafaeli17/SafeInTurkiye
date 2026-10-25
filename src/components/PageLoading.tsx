export default function PageLoading({lang='en'}:{lang?:string}) {
 const labels:Record<string,string>={en:'Loading',tr:'Yükleniyor',de:'Wird geladen',fr:'Chargement',es:'Cargando',ar:'جار التحميل',ru:'Загрузка',zh:'加载中'};
 return <div role="status" aria-live="polite" aria-busy="true" className="mx-auto max-w-6xl space-y-6 p-6"><p className="font-semibold text-sky-800">SafeInTürkiye · {labels[lang.toLowerCase()]??labels.en}</p><div aria-hidden="true" className="space-y-4 motion-safe:animate-pulse"><div className="h-8 w-2/3 rounded-lg bg-sky-100"/><div className="h-48 rounded-2xl bg-sky-50"/><div className="grid grid-cols-2 gap-4"><div className="h-24 rounded-xl bg-sky-100"/><div className="h-24 rounded-xl bg-sky-100"/></div></div></div>
}
