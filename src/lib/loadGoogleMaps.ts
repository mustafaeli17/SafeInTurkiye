let mapsPromise: Promise<any> | undefined
export function loadMaps() {
  if (mapsPromise) return mapsPromise
  const key = import.meta.env.VITE_GOOGLE_TRANSIT_MAP_KEY?.trim()
  if (!key) return Promise.reject(new Error('Map not configured'))
  mapsPromise = new Promise((resolve, reject) => {
    const scope = window as any
    if (scope.google?.maps?.Map) { resolve(scope.google.maps); return }
    const script = document.createElement('script')
    scope.gm_authFailure = () => window.dispatchEvent(new Event('transit-map-auth-error'))
    const timer = setTimeout(() => { script.remove(); mapsPromise=undefined; reject(new Error('Map timeout')) },15000)
    scope.safeTransitMapReady = () => { clearTimeout(timer); resolve(scope.google.maps); delete scope.safeTransitMapReady }
    script.onerror = () => { clearTimeout(timer); script.remove(); mapsPromise=undefined; reject(new Error('Map unavailable')) }
    script.src = `https://maps.googleapis.com/maps/api/js?${new URLSearchParams({key,loading:'async',callback:'safeTransitMapReady',v:'weekly',language:document.documentElement.lang||'en',region:'TR'})}`
    script.async=true; document.head.appendChild(script)
  })
  return mapsPromise
}
