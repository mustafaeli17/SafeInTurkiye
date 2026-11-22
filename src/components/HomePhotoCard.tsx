import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import './homePhotoCards.css'

type HomePhotoCardProps = {
  href: string
  label: string
  children: ReactNode
  onOpen: () => void
  city?: string
  balloon?: boolean
}

export default function HomePhotoCard({ href, label, children, onOpen, city, balloon }: HomePhotoCardProps) {
  return (
    <a className={balloon ? 'home-photo-card home-balloon-card' : 'home-photo-card'} data-city={city}
      href={href} aria-label={label} onClick={event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
        event.preventDefault()
        onOpen()
      }}>
      <div className="home-photo-window">{children}</div>
      {balloon && <i className="home-balloon" aria-hidden="true" />}
      <div className="home-photo-caption">
        <span>{label}</span><ArrowRight aria-hidden="true" size={19} strokeWidth={1.8} />
      </div>
    </a>
  )
}
