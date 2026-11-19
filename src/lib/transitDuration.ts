/** Round once to whole minutes, then present the journey in localised units. */
export function formatTransitDuration(duration: string, locale: string): string {
 const seconds = /^\d+(\.\d+)?s$/.test(duration) ? parseFloat(duration) : NaN
 if (!Number.isFinite(seconds)) return ''
 const totalMinutes = Math.ceil(seconds / 60)
 const hours = Math.floor(totalMinutes / 60)
 const minutes = totalMinutes % 60
 const unit = (value: number, name: 'hour' | 'minute') => locale === 'tr'
  ? `${value} ${name === 'hour' ? 'saat' : 'dk'}`
  : new Intl.NumberFormat(locale, {style:'unit',unit:name,unitDisplay:'short'}).format(value)
 return [hours ? unit(hours,'hour') : '', minutes || !hours ? unit(minutes,'minute') : ''].filter(Boolean).join(' ')
}
