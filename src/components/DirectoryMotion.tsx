import { Mountain } from 'lucide-react'
import './DirectoryMotion.css'

type DirectoryKind = 'hotels' | 'restaurants' | 'tours' | 'activities'

export default function DirectoryMotion({ kind }: { kind: DirectoryKind }) {
  return (
    <span className={`directory-motion directory-motion--${kind}`} aria-hidden="true">
      <span className="directory-motion-object">
        {kind === 'hotels' && <>
          <i className="room-key" /><i className="room-ring" /><i className="room-fob" />
        </>}
        {kind === 'restaurants' && <>
          <i className="cloche-tray" /><i className="cloche-lid" />
        </>}
        {kind === 'tours' && <i className="compass-case"><i className="compass-dial"><i className="compass-needle" /></i></i>}
        {kind === 'activities' && <i className="outing-ticket"><Mountain size={25} strokeWidth={1.6} /><i className="ticket-stub" /></i>}
      </span>
    </span>
  )
}
