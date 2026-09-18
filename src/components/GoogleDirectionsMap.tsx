interface GoogleDirectionsMapProps {
  origin: string
  destination: string
  mode: 'driving' | 'transit'
  title: string
  fallback?: React.ReactNode
}

export default function GoogleDirectionsMap({ origin, destination, mode, title, fallback }: GoogleDirectionsMapProps) {
  const browserKey = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY?.trim()
  const ready = Boolean(browserKey && origin.trim() && destination.trim())

  if (!ready) {
    return <>{fallback ?? <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-sky-100 bg-slate-50 p-6 text-center text-sm text-slate-600">{title}</div>}</>
  }

  const params = new URLSearchParams({
    key: browserKey,
    origin: origin.trim(),
    destination: destination.trim(),
    mode,
    language: document.documentElement.lang || 'en',
    region: 'TR',
  })

  return (
    <div className="min-h-[340px] overflow-hidden rounded-2xl border border-sky-100 bg-slate-100 shadow-sm">
      <iframe
        title={title}
        src={`https://www.google.com/maps/embed/v1/directions?${params.toString()}`}
        className="h-[340px] w-full sm:h-[430px]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  )
}
