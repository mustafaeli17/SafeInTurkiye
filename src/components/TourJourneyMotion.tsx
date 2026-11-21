import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import DirectoryMotion from './DirectoryMotion'

const labels: Record<string, [string, string]> = {
  en: ['Play the tour melody', 'Stop the tour melody'],
  tr: ['Tur melodisini çal', 'Tur melodisini durdur'],
  de: ['Tourmelodie abspielen', 'Tourmelodie stoppen'],
  fr: ['Écouter la mélodie du voyage', 'Arrêter la mélodie'],
  es: ['Escuchar la melodía del viaje', 'Detener la melodía'],
  ar: ['تشغيل لحن الرحلة', 'إيقاف لحن الرحلة'],
  ru: ['Включить мелодию путешествия', 'Остановить мелодию'],
  zh: ['播放旅行旋律', '停止播放旋律'],
}

export default function TourJourneyMotion({lang}: {lang: string}) {
  const player = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [journey, setJourney] = useState(0)
  const label = (labels[lang] ?? labels.en)[playing ? 1 : 0]

  useEffect(() => {
    const audio = player.current
    const pauseWhenHidden = () => { if (document.hidden) audio?.pause() }
    document.addEventListener('visibilitychange', pauseWhenHidden)
    return () => {
      document.removeEventListener('visibilitychange', pauseWhenHidden)
      audio?.pause()
    }
  }, [])

  function toggle() {
    const audio = player.current
    if (!audio) return
    if (!audio.paused) {
      audio.pause()
      return
    }
    // This short original instrumental is fetched only on an explicit press.
    if (!audio.hasAttribute('src')) audio.src = '/audio/tour-melody.mp3'
    audio.currentTime = 0
    setJourney(previous => previous + 1)
    void audio.play().catch(() => { if (audio.paused) setPlaying(false) })
  }

  return <>
    <button type="button" className="tour-melody-control" aria-label={label} title={label} onClick={toggle}>
      <DirectoryMotion key={journey} kind="tours" />
      <span className="tour-melody-badge" aria-hidden="true">
        {playing ? <Volume2 size={15} /> : <VolumeX size={15} />}
      </span>
    </button>
    <audio ref={player} preload="none" onPlaying={() => setPlaying(true)}
      onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setPlaying(false)} />
  </>
}
