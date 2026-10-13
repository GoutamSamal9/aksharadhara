import { describe, expect, it } from 'vitest';
import { authors, books, authorBooks, summary } from '../src/lib/catalog';
import { filterAuthors, filterBooks } from '../src/lib/search';
describe('metadata catalog', () => {
  it('keeps reader chapters out of discovery payloads and preserves attribution', () => {
    for (const book of books) {
      const data = summary(book);
      expect(data).not.toHaveProperty('chapters'); expect(data.chapterCount).toBe(book.chapters.length);
      expect(authors.find(author => author.id === data.authorId)?.name).toBe(data.author);
      expect(authorBooks(data.authorId)).toContain(book);
    }
    for (const author of authors.filter(author => author.verified)) expect(authorBooks(author.id)).toHaveLength(0);
  });
  it('searches both scripts and curated aliases with intersecting author/genre filters', () => {
    const data = books.map(summary); const demo = books[0];
    expect(filterBooks(data, demo.title)).toHaveLength(1);
    expect(filterBooks(data, demo.titleRomanized.toUpperCase(), demo.authorId, 'poetry')).toHaveLength(1);
    expect(filterBooks(data, demo.aliases[0])).toHaveLength(1);
    expect(filterBooks(data, '', 'gangadhar-meher')).toHaveLength(0);
    expect(filterBooks(data, '', 'all', 'novels')).toHaveLength(0);
    expect(filterAuthors(authors, 'gangadhar')).toHaveLength(1);
    expect(filterAuthors(authors, 'ଗଙ୍ଗାଧର')).toHaveLength(1);
    expect(filterAuthors(authors, 'gangadhar', 'novels')).toHaveLength(0);
  });
});
const { readCatalogFilters, catalogFilterUrl, defaultCatalogFilters } = await import('../src/lib/search');
it('canonicalizes defaults and validates author/genre/sort URL inputs', () => {
  const filters = readCatalogFilters('?author=unknown&genre=invalid&sort=bad&q=ଓଡ଼ିଆ', authors.map(a => a.id));
  expect(filters).toEqual({ ...defaultCatalogFilters, q: 'ଓଡ଼ିଆ' });
  const url = catalogFilterUrl('https://aksharadhara.org/books/?author=all&sort=asc&genre=all#book-search', defaultCatalogFilters, 'books');
  expect(url).toBe('/books/#book-search');
});
