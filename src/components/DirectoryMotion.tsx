import { Mountain } from 'lucide-react'
import './DirectoryMotion.css'

type MotionKind = 'meal' | 'tours' | 'activities'

export default function DirectoryMotion({ kind }: { kind: MotionKind }) {
  return (
    <span className={`directory-motion directory-motion--${kind}`} aria-hidden="true">
      <span className="directory-motion-object">
        {kind === 'meal' && <>
          <i className="cloche-tray" /><i className="cloche-lid" />
        </>}
        {kind === 'tours' && <>
          <i className="tour-route" />
          <i className="tour-coach">
            <i className="coach-shell"><i className="coach-windows"/><i className="coach-cab"/></i>
            <i className="coach-wheel coach-rear"/><i className="coach-wheel coach-front"/>
          </i>
        </>}
        {kind === 'activities' && <i className="outing-ticket"><Mountain size={25} strokeWidth={1.6} /><i className="ticket-stub" /></i>}
      </span>
    </span>
  )
}
