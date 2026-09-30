import { requireSupabase } from '../lib/supabase'
import { safeWebsite } from '../services/nearbyPlaces'

export interface TaxiTariffRecord {
  city: string
  vehicleClass: string
  openingFare: number
  perKm: number
  minimumFare: number
  waitingFare: number
  effectiveFrom: string
  effectiveTo: string | null
  sourceUrl: string
  sourceName: string
  lastVerified: string
}

export interface TaxiTariffRow {
  vehicle_class: string
  opening_fare: number | string
  per_km: number | string
  minimum_fare: number | string
  waiting_fare: number | string
  effective_from: string
  effective_to: string | null
  cities: { name: string } | { name: string }[]
  last_verified_at: string | null
  data_sources: {name:string;url:string|null;verification_status:string} | null
}

// Conservative recheck window, not a claim about municipal tariff validity.
// A newer official effective date must still be verified by an editor.
export const TARIFF_RECHECK_DAYS = 30;
export function eligibleTariffs(rows:TaxiTariffRow[],city:string,now=Date.now()):TaxiTariffRow[]{
 const today=new Date(now).toISOString().slice(0,10);
 const seen=new Set<string>();
 return [...rows].sort((a,b)=>b.effective_from.localeCompare(a.effective_from)).filter(row=>{
  const rowCity=Array.isArray(row.cities)?row.cities[0]?.name:row.cities?.name;
  const verified=Date.parse(row.last_verified_at??'');
  const validDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
  if(!city||rowCity!==city||!['YELLOW','TURQUOISE','BLACK'].includes(row.vehicle_class)||seen.has(row.vehicle_class))return false;
  if(!validDate(row.effective_from)||row.effective_from>today||!Number.isFinite(verified)||verified>now||now-verified>TARIFF_RECHECK_DAYS*86400000)return false;
  if(row.effective_to!==null&&(!validDate(row.effective_to)||row.effective_to<today||row.effective_to<row.effective_from))return false;
  if(row.data_sources?.verification_status!=='VERIFIED'||!row.data_sources.name?.trim()||!safeWebsite(row.data_sources.url))return false;
  if(Number(row.per_km)<=0||![row.opening_fare,row.per_km,row.minimum_fare,row.waiting_fare].every(v=>v!==null&&String(v).trim()!==''&&Number.isFinite(Number(v))&&Number(v)>=0))return false;
  seen.add(row.vehicle_class);return true;
 });
}

export async function getCurrentTaxiTariffs(city: string): Promise<TaxiTariffRecord[]> {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await requireSupabase()
    .from('taxi_tariffs')
    .select('vehicle_class, opening_fare, per_km, minimum_fare, waiting_fare, effective_from, effective_to, last_verified_at, data_sources(name,url,verification_status), cities!inner(name)')
    .eq('active', true).eq('verification_status', 'VERIFIED')
    .eq('cities.name', city)
    .lte('effective_from', today)
    .or(`effective_to.is.null,effective_to.gte.${today}`)
    .order('effective_from', { ascending: false })
    .abortSignal(AbortSignal.timeout(12000))
  if (error) throw error
  return eligibleTariffs((data??[]) as unknown as TaxiTariffRow[],city).map((row) => ({
    sourceUrl:row.data_sources!.url!,sourceName:row.data_sources!.name,lastVerified:row.last_verified_at!,
    city: Array.isArray(row.cities) ? row.cities[0]?.name ?? city : row.cities.name, vehicleClass: row.vehicle_class, openingFare: Number(row.opening_fare),
    perKm: Number(row.per_km), minimumFare: Number(row.minimum_fare), waitingFare: Number(row.waiting_fare),
    effectiveFrom: row.effective_from, effectiveTo: row.effective_to,
  }))
}
