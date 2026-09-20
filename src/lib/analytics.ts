// No search terms, query parameters, hash tokens, personal locations or custom events.
export function analyticsUrl(rawUrl: string): string | null {
 try {
  const url = new URL(rawUrl);
  if (!['www.safeinturkiye.com', 'safeinturkiye.com'].includes(url.hostname) || url.protocol !== 'https:' || url.pathname !== '/' || url.hash) return null;
  url.search = '';
  return url.href;
 } catch { return null; }
}
