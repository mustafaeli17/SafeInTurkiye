import {Pause, Play} from 'lucide-react'
import {useEffect, useRef, type ReactNode} from 'react'
import hero from '../data/heroPhoto.json'

const motionLabels: Record<string, string> = {
  tr: 'Ana sayfa animasyonlarını duraklat', en: 'Pause homepage animations',
  es: 'Pausar las animaciones de inicio', de: 'Animationen der Startseite pausieren',
  fr: 'Mettre en pause les animations de l’accueil', ar: 'إيقاف حركة الصفحة الرئيسية مؤقتًا',
  ru: 'Приостановить анимацию главной страницы', zh: '暂停首页动画',
}

export default function HomeHarbour({lang, paused, onToggle, children}: {
  lang: string; paused: boolean; onToggle: () => void; children: ReactNode
}) {
  const harbour = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!harbour.current || paused) return
    const element = harbour.current
    const media = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    let frame = 0
    function reset() {
      cancelAnimationFrame(frame)
      element.style.removeProperty('--harbour-x')
      element.style.removeProperty('--harbour-y')
    }
    function move(event: PointerEvent) {
      if (event.pointerType !== 'mouse') return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const box = element.getBoundingClientRect()
        const x = (event.clientX - box.left) / box.width - .5
        const y = (event.clientY - box.top) / box.height - .5
        element.style.setProperty('--harbour-x', `${x * 5}px`)
        element.style.setProperty('--harbour-y', `${y * 3}px`)
      })
    }
    function sync() {
      element.removeEventListener('pointermove', move)
      if (media.matches) element.addEventListener('pointermove', move, {passive: true})
      else reset()
    }
    sync()
    media.addEventListener('change', sync)
    element.addEventListener('pointerleave', reset)
    return () => {
      media.removeEventListener('change', sync)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerleave', reset)
      reset()
    }
  }, [paused])

  const photo = {
    src: hero.src, srcSet: hero.srcSet, sizes: '(max-width: 1200px) 100vw, 1180px',
    width: hero.width, height: hero.height, alt: '',
  }
  return <section ref={harbour} className="home-harbour travel-hero">
    <div className="home-harbour__viewport" aria-hidden="true">
      <div className="home-harbour__stage">
        <img className="home-harbour__panorama" {...photo} fetchPriority="high"/>
        <img className="home-harbour__water" {...photo} decoding="async"/>
        <div className="home-harbour__vessel"><img className="home-harbour__ferry" src={hero.layers.ferry} width={622} height={440} alt="" decoding="async"/></div>
      </div>
    </div>
    <div className="home-harbour__copy">{children}</div>
    <button type="button" className="home-harbour__motion" aria-label={motionLabels[lang] ?? motionLabels.en}
      aria-pressed={paused} onClick={onToggle}>
      {paused ? <Play size={15} fill="currentColor" aria-hidden="true"/> : <Pause size={15} fill="currentColor" aria-hidden="true"/>}
    </button>
  </section>
}
