import type { Author, Book } from '../types';

export const SITE_URL = 'https://aksharadhara.org';
const absolute = (path: string) => {
  const url = new URL(path, `${SITE_URL}/`);
  if (url.origin !== SITE_URL) throw new Error('SEO paths must belong to this site');
  url.search = ''; url.hash = '';
  if (!url.pathname.endsWith('/') && !url.pathname.split('/').pop()?.includes('.')) url.pathname += '/';
  return url.href;
};
export function pageMetadata(path: string, title: string, description: string, options: { noIndex?: boolean } = {}) {
  const url = absolute(path);
  return {
    title, description, alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Aksharadhara', locale: 'or_IN', type: 'website' as const, images: [{url: `${SITE_URL}/social-cover.png`,width:1200,height:630,alt:'ଅକ୍ଷରଧାରା · Aksharadhara'}] },
    twitter: { card: 'summary_large_image' as const, title, description, images: [`${SITE_URL}/social-cover.png`] },
    ...(options.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
const eligibleAuthor = (author: Author) => author.verified && !author.demo && author.sources.length > 0;
const evidence = (value: string[] | undefined) => Boolean(value?.length && value.every(item => item.trim()));
const eligibleBook = (book: Book) => !book.demo && book.rights.workStatus === 'cleared' && book.rights.editionStatus === 'cleared' && evidence(book.rights.workEvidence) && evidence(book.rights.editionEvidence) && Boolean(book.rights.reviewedBy && book.rights.reviewedAt && book.verification.reviewedBy && book.verification.reviewedAt) && book.verification.status === 'approved' && book.verification.proofreadAgainstSource;
export function sitemapEntries(authors: Author[], books: Book[]) {
  const paths = ['/', '/books', '/authors', '/about', '/contribute', '/feedback'];
  paths.push(...authors.filter(eligibleAuthor).map(author => `/authors/${author.slug}`));
  for (const book of books.filter(eligibleBook)) {
    paths.push(`/books/${book.slug}`);
    paths.push(`/read/${book.slug}/`);
  }
  return [...new Set(paths)].map(path => ({ url: absolute(path) }));
}
export function organizationJsonLd() {
  return { '@context': 'https://schema.org', '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'Aksharadhara', alternateName: 'ଅକ୍ଷରଧାରା', url: SITE_URL };
}
export function webSiteJsonLd() {
  return { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: 'Aksharadhara', alternateName: 'ଅକ୍ଷରଧାରା', url: SITE_URL, inLanguage: 'or', publisher: { '@id': `${SITE_URL}/#organization` } };
}
export function personJsonLd(author: Author) {
  if (!eligibleAuthor(author)) return null;
  return { '@context': 'https://schema.org', '@type': 'Person', '@id': absolute(`/authors/${author.slug}`), name: author.name, alternateName: author.nameRomanized, ...(author.description ? { description: author.description } : {}), url: absolute(`/authors/${author.slug}`), subjectOf: author.sources.map(source => ({ '@type': 'CreativeWork', name: source.title, url: source.url })) };
}
export function bookJsonLd(book: Book, author?: Author) {
  if (!eligibleBook(book)) return null;
  return { '@context': 'https://schema.org', '@type': 'Book', '@id': absolute(`/books/${book.slug}`), name: book.title, alternateName: book.titleRomanized, description: book.description, inLanguage: book.language, url: absolute(`/books/${book.slug}`), ...(author && author.id === book.authorId && eligibleAuthor(author) ? { author: { '@type': 'Person', '@id': absolute(`/authors/${author.slug}`), name: author.name } } : {}), ...(book.source.url ? { isBasedOn: book.source.url } : {}) };
}
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: absolute(item.path) })) };
}
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
