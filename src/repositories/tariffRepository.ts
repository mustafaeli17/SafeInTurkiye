import { requireSupabase } from '../lib/supabase'

export interface TaxiTariffRecord {
  city: string
  vehicleClass: string
  openingFare: number
  perKm: number
  minimumFare: number
  waitingFare: number
  effectiveFrom: string
  effectiveTo: string | null
}

interface TaxiTariffRow {
  vehicle_class: string
  opening_fare: number | string
  per_km: number | string
  minimum_fare: number | string
  waiting_fare: number | string
  effective_from: string
  effective_to: string | null
  cities: { name: string } | { name: string }[]
}

export async function getCurrentTaxiTariffs(city: string): Promise<TaxiTariffRecord[]> {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await requireSupabase()
    .from('taxi_tariffs')
    .select('vehicle_class, opening_fare, per_km, minimum_fare, waiting_fare, effective_from, effective_to, cities!inner(name)')
    .eq('cities.name', city)
    .lte('effective_from', today)
    .or(`effective_to.is.null,effective_to.gte.${today}`)
  if (error) throw error
  return ((data ?? []) as TaxiTariffRow[]).map((row) => ({
    city: Array.isArray(row.cities) ? row.cities[0]?.name ?? city : row.cities.name, vehicleClass: row.vehicle_class, openingFare: Number(row.opening_fare),
    perKm: Number(row.per_km), minimumFare: Number(row.minimum_fare), waitingFare: Number(row.waiting_fare),
    effectiveFrom: row.effective_from, effectiveTo: row.effective_to,
  }))
}
