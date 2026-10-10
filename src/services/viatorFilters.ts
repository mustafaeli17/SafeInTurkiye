// Viator Partner API v2 /products/search: filters apply to the full catalog,
// not just the twelve items currently displayed. No availability is invented.
export function viatorFilters(params: URLSearchParams, today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })) {
  const filtering: Record<string, unknown> = {}
  for (const [query, field] of [['minPrice','lowestPrice'],['maxPrice','highestPrice']] as const) {
    const raw = params.get(query)
    if (raw !== null) {
      const n = Number(raw)
      if (!raw.trim() || !Number.isFinite(n) || n < 0 || n > 100000 || (query === 'maxPrice' && n === 0)) throw new Error('INVALID_INPUT')
      filtering[field] = n
    }
  }
  if (Number(filtering.lowestPrice ?? 0) > Number(filtering.highestPrice ?? Infinity)) throw new Error('INVALID_INPUT')
  const duration = params.get('duration') ?? 'any'
  const durations: Record<string, { from: number; to?: number }> = { short:{from:0,to:240}, day:{from:241,to:1440}, multi:{from:1441} }
  if (duration !== 'any') {
    if (!Object.hasOwn(durations,duration)) throw new Error('INVALID_INPUT')
    filtering.durationInMinutes = durations[duration]
  }
  const rating = params.get('rating') ?? 'any'
  if (!['any','3','4'].includes(rating)) throw new Error('INVALID_INPUT')
  if (rating !== 'any') filtering.rating = { from: Number(rating), to: 5 }
  const flags: string[] = []
  for (const [query, flag] of [['private','PRIVATE_TOUR'],['freeCancellation','FREE_CANCELLATION'],['skipLine','SKIP_THE_LINE']] as const) {
    if (params.has(query) && params.get(query) !== 'true') throw new Error('INVALID_INPUT')
    if (params.has(query)) flags.push(flag)
  }
  if (flags.length) filtering.flags = flags
  const date = params.get('date')
  if (date !== null) {
    const parsed = new Date(`${date}T12:00:00Z`)
    const last = new Date(`${today}T12:00:00Z`); last.setUTCFullYear(last.getUTCFullYear()+1)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== date || date < today || parsed > last) throw new Error('INVALID_INPUT')
    filtering.startDate = date; filtering.endDate = date
  }
  const sort = params.get('sort') ?? 'recommended'
  const sorts: Record<string, { sort:string; order?:string }> = {
    recommended:{sort:'DEFAULT'}, priceAsc:{sort:'PRICE',order:'ASCENDING'}, priceDesc:{sort:'PRICE',order:'DESCENDING'}, rating:{sort:'TRAVELER_RATING',order:'DESCENDING'},
  }
  if (!Object.hasOwn(sorts,sort)) throw new Error('INVALID_INPUT')
  return { filtering, sorting: sorts[sort] }
}
