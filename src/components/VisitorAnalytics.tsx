import { Analytics } from '@vercel/analytics/react';
import { analyticsUrl, trackingOptOut } from '../lib/analytics';

export default function VisitorAnalytics() {
 if (!import.meta.env.PROD || !analyticsUrl(window.location.href) || trackingOptOut(navigator)) return null;
 return <Analytics beforeSend={event => {
  if (window.location.hash || trackingOptOut(navigator) || event.type !== 'pageview') return null;
  const url = analyticsUrl(event.url);
  return url ? {...event, url} : null;
 }} />;
}
