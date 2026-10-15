import { createHash, randomBytes } from 'node:crypto';

/** Instance-local defence only. A shared edge limit/provider quota is still required
 * for protection across instances. No raw IP addresses are retained. */
export function createRequestBudget(maxRequests: number, windowMs = 60_000, capacity = 2000) {
  const salt = randomBytes(16).toString('hex');
  const entries = new Map<string, { count: number; until: number }>();
  return (headers: Record<string, string | string[] | undefined> = {}, now = Date.now()) => {
    for (const [id, row] of entries) if (row.until <= now) entries.delete(id);
    const forwarded = headers['x-forwarded-for'];
    // The hosting proxy must overwrite this header; not an authentication mechanism.
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim() || 'unknown';
    const id = createHash('sha256').update(salt).update(ip.slice(0,256)).digest('hex');
    const row = entries.get(id);
    if (row && row.count >= maxRequests) return Math.max(1, Math.ceil((row.until - now) / 1000));
    if (!row && entries.size >= capacity) return Math.ceil(windowMs / 1000);
    entries.set(id, { count: (row?.count ?? 0) + 1, until: row?.until ?? now + windowMs });
    return 0;
  };
}
