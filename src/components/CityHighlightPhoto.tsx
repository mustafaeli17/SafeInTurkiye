import photos from '../data/cityHighlightPhotos.json';

const copy: Record<string, [string, string]> = {
  en: ['Photo credits', 'Resized / WebP; cropped to fit.'],
  tr: ['Fotoğraf bilgisi', 'Boyutlandırıldı / WebP; kadraja göre kırpılır.'],
  es: ['Créditos de la foto', 'Redimensionada / WebP; recortada para encajar.'],
  de: ['Bildnachweis', 'Verkleinert / WebP; passend zugeschnitten.'],
  fr: ['Crédit photo', 'Redimensionnée / WebP ; recadrée.'],
  ar: ['مصدر الصورة', 'تم تغيير الحجم والتحويل إلى WebP والقص لملاءمة الإطار.'],
  ru: ['Автор фотографии', 'Размер изменён / WebP; обрезка по рамке.'],
  zh: ['图片来源', '已调整尺寸并转换为 WebP；按画框裁剪。'],
};

export default function CityHighlightPhoto({city, index, name, lang}: {city:string; index:number; name:string; lang:string}) {
  const photo = photos[city as keyof typeof photos]?.[index];
  if (!photo) return null;
  const labels = copy[lang] ?? copy.en;
  return <figure className="city-guide-place-photo">
    <img src={photo.src} alt={name} width={800} height={500} loading="lazy" decoding="async" />
    <figcaption><details>
      <summary>{labels[0]}</summary>
      <span>{photo.author} · <a href={photo.sourceUrl} target="_blank" rel="noreferrer">Wikimedia Commons</a> · <a href={photo.licenseUrl || photo.sourceUrl} target="_blank" rel="noreferrer">{photo.license}</a>. {labels[1]}</span>
    </details></figcaption>
  </figure>;
}
