export function normalizeSearch(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').trim();
}

export function matchesCatalog(item: Record<string, unknown>, query: string, city: string) {
  if (city && normalizeSearch(String(item.city)) !== normalizeSearch(city)) return false;
  const content = normalizeSearch(Object.entries(item).filter(([key]) => !['id', 'img'].includes(key)).map(([, value]) => String(value)).join(' '));
  return normalizeSearch(query).split(/\s+/).filter(Boolean).every(word => content.includes(word));
}

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function validBookingDate(value: string, today = localDate()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < today) return false;
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && localDate(parsed) === value;
}
