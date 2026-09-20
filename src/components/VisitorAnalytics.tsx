import { Analytics } from '@vercel/analytics/react';
import { analyticsUrl } from '../lib/analytics';

export default function VisitorAnalytics() {
 if (!import.meta.env.PROD || !analyticsUrl(window.location.href) || navigator.doNotTrack === '1') return null;
 return <Analytics beforeSend={event => {
  if (window.location.hash || navigator.doNotTrack === '1' || event.type !== 'pageview') return null;
  const url = analyticsUrl(event.url);
  return url ? {...event, url} : null;
 }} />;
}
