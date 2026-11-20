import { Analytics } from '@vercel/analytics/react';
import { productConsent, productPageUrl } from '../lib/productMetrics';
import { useBrowserLocation } from '../lib/browserNavigation';
import { analyticsUrl, trackingOptOut } from '../lib/analytics';

export default function VisitorAnalytics() {
 useBrowserLocation();
 const href=window.location.href;
 if (!import.meta.env.PROD || trackingOptOut(navigator) || !(analyticsUrl(href) || (productConsent() && productPageUrl(href)))) return null;
 return <Analytics beforeSend={event => {
  if (window.location.hash || trackingOptOut(navigator)) return null;
  const url = event.type === 'pageview' ? analyticsUrl(event.url) : productConsent() && productPageUrl(event.url);
  return url ? {...event, url} : null;
 }} />;
}
