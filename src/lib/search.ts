import type { Author, BookSummary } from '../types';
export function normalized(value: string) { return value.normalize('NFC').toLocaleLowerCase().trim(); }
export function filterBooks(books: BookSummary[], query: string, author='all', genre='all', sort='asc') { const q=normalized(query); return books.filter(b => (author==='all'||b.authorId===author)&&(genre==='all'||b.genres.includes(genre))&&normalized([b.title,b.titleRomanized,b.author,...b.aliases].join(' ')).includes(q)).sort((a,b)=>(sort==='desc'?-1:1)*a.title.localeCompare(b.title,'or')); }
export function filterAuthors(authors: Author[], query: string, genre='all', letter='all') { const q=normalized(query); return authors.filter(a => normalized(`${a.name} ${a.nameRomanized}`).includes(q)&&(genre==='all'||a.genres.includes(genre))&&(letter==='all'||a.name.startsWith(letter))).sort((a,b)=>a.name.localeCompare(b.name,'or')); }

export const catalogGenres = ['poetry', 'novels', 'short-stories', 'devotional', 'essays'];
export type CatalogFilters = { q: string; author: string; genre: string; sort: string; letter: string };
export const defaultCatalogFilters: CatalogFilters = { q: '', author: 'all', genre: 'all', sort: 'asc', letter: 'all' };
export function readCatalogFilters(search: string, authorIds: string[], letters: string[] = []): CatalogFilters {
  const params = new URLSearchParams(search);
  const author = params.get('author') ?? 'all'; const genre = params.get('genre') ?? 'all'; const letter = params.get('letter') ?? 'all';
  return { q: params.get('q') ?? '', author: authorIds.includes(author) ? author : 'all', genre: catalogGenres.includes(genre) ? genre : 'all', sort: params.get('sort') === 'desc' ? 'desc' : 'asc', letter: letters.includes(letter) ? letter : 'all' };
}
export function catalogFilterUrl(current: string, filters: CatalogFilters, kind: 'books' | 'authors') {
  const url = new URL(current);
  for (const key of ['q', 'author', 'genre', 'sort', 'letter'] as const) url.searchParams.delete(key);
  if (filters.q) url.searchParams.set('q', filters.q);
  if (filters.genre !== 'all') url.searchParams.set('genre', filters.genre);
  if (kind === 'books') {
    if (filters.author !== 'all') url.searchParams.set('author', filters.author);
    if (filters.sort !== 'asc') url.searchParams.set('sort', filters.sort);
  } else if (filters.letter !== 'all') url.searchParams.set('letter', filters.letter);
  return `${url.pathname}${url.search}${url.hash}`;
}
