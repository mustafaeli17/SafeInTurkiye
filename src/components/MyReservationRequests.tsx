import { useState } from 'react'
import { getOwnBookingRequests } from '../repositories/bookingRepository'
import { reservationStatusCopy, reservationStatusIndex } from '../lib/reservationStatusCopy'

type Rows = NonNullable<Awaited<ReturnType<typeof getOwnBookingRequests>>>
export default function MyReservationRequests({ lang }: { lang: string }) {
  const t = reservationStatusCopy[lang] ?? reservationStatusCopy.en
  const [rows, setRows] = useState<Rows>([])
  const [message, setMessage] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  async function load() {
    if (busy) return
    setBusy(true); setMessage(null); setRows([])
    try {
      const result = await getOwnBookingRequests()
      if (result === null) setMessage(3)
      else { setRows(result); if (!result.length) setMessage(2) }
    } catch { setMessage(4) }
    finally { setBusy(false) }
  }
  return <section dir={lang === 'ar' ? 'rtl' : 'ltr'} className="mt-4 rounded-xl border border-sky-100 p-4 space-y-3">
    <h4 className="font-bold">{t[0]}</h4>
    <button type="button" disabled={busy} onClick={() => void load()} className="min-h-11 rounded-lg border px-4">{busy ? '…' : t[1]}</button>
    <p role="status">{message === null ? '' : t[message]}</p>
    {rows.map(row => <article key={row.id} className="border-t pt-3 break-words">
      <h5 className="font-semibold">{row.listing_name}</h5>
      <p><bdi>{row.reference_code}</bdi> · {row.visit_date} {row.visit_time?.slice(0,5)} · {row.guest_count}</p>
      <p>{t[reservationStatusIndex(row.status,row.contact_stage)]}</p>
    </article>)}
  </section>
}
