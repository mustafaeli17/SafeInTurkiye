import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './CategoryRail.css'

const navigation: Record<string, readonly [string, string]> = {
  tr: ['Önceki kategorileri göster', 'Sonraki kategorileri göster'],
  en: ['Show previous categories', 'Show more categories'],
  de: ['Vorherige Kategorien anzeigen', 'Weitere Kategorien anzeigen'],
  es: ['Ver categorías anteriores', 'Ver más categorías'],
  fr: ['Afficher les catégories précédentes', 'Afficher plus de catégories'],
  ar: ['عرض الفئات السابقة', 'عرض المزيد من الفئات'],
  ru: ['Показать предыдущие категории', 'Показать ещё категории'],
  zh: ['显示上一组类别', '显示更多类别'],
}

function revealCategory(track: HTMLElement, item: HTMLElement) {
  const bounds = track.getBoundingClientRect()
  const category = item.getBoundingClientRect()
  // Keep focused buttons clear of the edge controls without moving the page vertically.
  if (category.left < bounds.left + 48 || category.right > bounds.right - 48) {
    track.scrollBy({left: (category.left + category.right - bounds.left - bounds.right) / 2, behavior: 'instant'})
  }
}

interface Props { className: string; label: string; lang: string; children: ReactNode }

export default function CategoryRail({className, label, lang, children}: Props) {
  const track = useRef<HTMLDivElement>(null)
  const previous = useRef<HTMLButtonElement>(null)
  const next = useRef<HTMLButtonElement>(null)
  const [edges, setEdges] = useState({previous: false, next: false})
  const id = useId()
  const rtl = lang === 'ar'
  const labels = navigation[lang] ?? navigation.en

  useEffect(() => {
    const row = track.current
    if (!row) return
    const measure = () => {
      const position = Math.abs(row.scrollLeft)
      const maximum = row.scrollWidth - row.clientWidth
      const canGoBack = maximum > 1 && position > 1
      const canGoForward = maximum - position > 1
      // A hidden scroll button must not leave keyboard focus on the document body.
      if (!canGoBack && document.activeElement === previous.current) row.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({preventScroll: true})
      if (!canGoForward && document.activeElement === next.current) {
        const items = row.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
        items[items.length - 1]?.focus({preventScroll: true})
      }
      setEdges(current => current.previous === canGoBack && current.next === canGoForward
        ? current : {previous: canGoBack, next: canGoForward})
    }
    const selected = row.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (selected) revealCategory(row, selected)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    for (const child of row.children) observer.observe(child)
    row.addEventListener('scroll', measure, {passive: true})
    return () => { observer.disconnect(); row.removeEventListener('scroll', measure) }
  }, [lang])

  function scroll(forward: boolean) {
    const row = track.current
    if (!row) return
    row.scrollBy({
      left: (forward !== rtl ? 1 : -1) * Math.max(64, row.clientWidth - 96),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }

  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
    const current = items.indexOf(event.target as HTMLButtonElement)
    if (current < 0) return
    let target = current
    switch (event.key) {
      case 'Home': target = 0; break
      case 'End': target = items.length - 1; break
      case 'ArrowRight': target += rtl ? -1 : 1; break
      case 'ArrowLeft': target += rtl ? 1 : -1; break
      default: return
    }
    event.preventDefault()
    items[Math.max(0, Math.min(target, items.length - 1))].focus({preventScroll: true})
  }

  return <div className={`category-rail ${className}-rail`} dir={rtl ? 'rtl' : 'ltr'} role="group" aria-label={label}>
    <button ref={previous} type="button" className="category-rail-nav category-rail-prev" hidden={!edges.previous}
      aria-label={labels[0]} title={labels[0]} aria-controls={id} onClick={() => scroll(false)}>
      <ChevronLeft size={18} aria-hidden="true"/>
    </button>
    <div id={id} ref={track} className={`category-rail-track ${className}`} onKeyDown={navigate}
      onFocus={event => { if (event.target.matches('button:focus-visible')) revealCategory(event.currentTarget, event.target) }}>
      {children}
    </div>
    <button ref={next} type="button" className="category-rail-nav category-rail-next" hidden={!edges.next}
      aria-label={labels[1]} title={labels[1]} aria-controls={id} onClick={() => scroll(true)}>
      <ChevronRight size={18} aria-hidden="true"/>
    </button>
  </div>
}
