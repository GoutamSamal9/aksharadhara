import { describe, expect, it } from 'vitest';
import type { Author, Book } from '../src/types';
import demo from '../content/books/demo-garden.json';
import historical from '../content/authors/gangadhar-meher.json';
import sampleAuthor from '../content/authors/akshara-demo.json';
import { SITE_URL, pageMetadata, sitemapEntries, personJsonLd, bookJsonLd, breadcrumbJsonLd, serializeJsonLd } from '../src/lib/seo';
const book = demo as Book;
const author = historical as Author;
describe('canonical metadata and publication SEO gates', () => {
  it('uses production canonicals without tracking or fragments', () => {
    const metadata = pageMetadata('/authors/gangadhar-meher?tracking=1#bio', 'Author', 'Biography');
    expect(metadata.alternates.canonical).toBe(`${SITE_URL}/authors/gangadhar-meher/`);
    expect(metadata.openGraph.url).toBe(metadata.alternates.canonical);
    expect(pageMetadata('/my-library', 'Library', 'Local bookmarks', { noIndex: true }).robots).toEqual({ index: false, follow: false });
    expect(() => pageMetadata('https://other.example', 'External', 'External')).toThrow();
  });
  it('omits demo and unapproved records, including their reader routes', () => {
    const entries = sitemapEntries([author, sampleAuthor as Author], [book]);
    expect(entries).toContainEqual({ url: `${SITE_URL}/authors/gangadhar-meher/` });
    expect(entries).toContainEqual({ url: `${SITE_URL}/feedback/` });
    expect(entries.some(entry => entry.url.includes('demo') || entry.url.includes('/read/') || entry.url.includes('/my-library'))).toBe(false);
    const draft = structuredClone(book); draft.demo = false;
    expect(sitemapEntries([], [draft]).some(entry => entry.url.includes(`/books/${draft.slug}`))).toBe(false);
  });
  it('does not label demo content as authentic people or books', () => {
    expect(personJsonLd(sampleAuthor as Author)).toBeNull();
    expect(bookJsonLd(book)).toBeNull();
    expect(personJsonLd(author)).toMatchObject({ '@type': 'Person', name: author.name });
  });
  it('indexes reviewed books and stable chapter routes without fabricated dates', () => {
    const approved = structuredClone(book);
    approved.demo = false; approved.authorId = author.id; approved.author = author.name;
    approved.rights = { workStatus: 'cleared', editionStatus: 'cleared', evidence: ['Rights review'], workEvidence: ['Work permission'], editionEvidence: ['Edition permission'], reviewedBy: 'Reviewer', reviewedAt: '2026-10-12' };
    approved.verification = { status: 'approved', proofreadAgainstSource: true, reviewedBy: 'Proofreader', reviewedAt: '2026-10-12' };
    const entries = sitemapEntries([author], [approved]);
    expect(entries).toContainEqual({ url: `${SITE_URL}/books/${approved.slug}/` });
    expect(entries).toContainEqual({ url: `${SITE_URL}/read/${approved.slug}/` });
    expect(bookJsonLd(approved, author)).toMatchObject({ '@type': 'Book', author: { name: author.name } });
    expect(bookJsonLd(approved, author)).not.toHaveProperty('datePublished');
  });
  it('serializes JSON-LD without executable closing script tags', () => {
    const value = { description: '</script><script>alert(1)</script>' };
    const serialized = serializeJsonLd(value);
    expect(serialized).not.toContain('<');
    expect(JSON.parse(serialized)).toEqual(value);
    expect(breadcrumbJsonLd([{ name: 'Authors', path: '/authors' }]).itemListElement[0]).toMatchObject({ position: 1, item: `${SITE_URL}/authors/` });
  });
});
