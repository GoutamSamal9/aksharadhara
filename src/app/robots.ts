import type { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/seo';
export const dynamic = 'force-static';
export default function robots(): MetadataRoute.Robots {
  // Crawlers must be allowed to read noindex metadata on demo/local pages.
  return { rules: { userAgent: '*', allow: '/'  }, sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL };
}
