import type { MetadataRoute } from 'next';
import { authors, books } from '../lib/catalog';
import { sitemapEntries } from '../lib/seo';
export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap { return sitemapEntries(authors, books); }
