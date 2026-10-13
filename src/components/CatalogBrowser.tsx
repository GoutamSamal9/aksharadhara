'use client';
import { useEffect, useRef, useState } from 'react';
import type { Author, BookSummary } from '../types';
import { catalogFilterUrl, defaultCatalogFilters, filterAuthors, filterBooks, readCatalogFilters, type CatalogFilters } from '../lib/search';
import { AuthorCard, BookCard } from './Shared';
const genreOptions = [['poetry', 'କବିତା', 'Poetry'], ['novels', 'ଉପନ୍ୟାସ', 'Novels'], ['short-stories', 'କ୍ଷୁଦ୍ରଗଳ୍ପ', 'Short stories'], ['devotional', 'ଭକ୍ତି ସାହିତ୍ୟ', 'Devotional'], ['essays', 'ପ୍ରବନ୍ଧ', 'Essays']];
function useCatalogUrl(kind: 'books' | 'authors', authors: Author[]) {
  const [filters, setFilters] = useState<CatalogFilters>(defaultCatalogFilters);
  const current = useRef(filters); const typing = useRef(false);
  useEffect(() => {
    const read = () => {
      const next = readCatalogFilters(window.location.search, authors.map(a => a.id), authors.map(a => a.name.slice(0, 1)));
      current.current = next; setFilters(next); typing.current = false;
    };
    read(); window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [authors]);
  const change = (patch: Partial<CatalogFilters>, queryEdit = false) => {
    const next = { ...current.current, ...patch };
    const url = catalogFilterUrl(window.location.href, next, kind);
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== url) {
      const method = queryEdit && typing.current ? 'replaceState' : 'pushState';
      window.history[method](window.history.state, '', url);
    }
    typing.current = queryEdit; current.current = next; setFilters(next);
  };
  return { filters, change, endTyping: () => { typing.current = false; }, clear: () => change(defaultCatalogFilters) };
}
export function BookBrowser({ books, authors }: { books: BookSummary[]; authors: Author[] }) {
  const { filters, change, endTyping, clear } = useCatalogUrl('books', authors);
  const results = filterBooks(books, filters.q, filters.author, filters.genre, filters.sort);
  return <><div className="catalog-filters"><label className="search-field" id="book-search"><span>ବହି ଖୋଜନ୍ତୁ · <span lang="en">Search books</span></span><input type="search" value={filters.q} onChange={e => change({ q: e.target.value }, true)} onBlur={endTyping} placeholder="ଶୀର୍ଷକ, ଲେଖକ ବା Romanized name"/></label><label>ସାହିତ୍ୟିକ · <span lang="en">Author</span><select value={filters.author} onChange={e => change({ author: e.target.value })}><option value="all" lang="en">All authors</option>{authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label>ବିଭାଗ · <span lang="en">Genre</span><select value={filters.genre} onChange={e => change({ genre: e.target.value })}><option value="all" lang="en">All genres</option>{genreOptions.map(([id, odia, english]) => <option key={id} value={id}>{odia} · {english}</option>)}</select></label><label>କ୍ରମ · <span lang="en">Sort</span><select value={filters.sort} onChange={e => change({ sort: e.target.value })}><option value="asc" lang="en">Alphabetical A–Z</option><option value="desc" lang="en">Alphabetical Z–A</option></select></label></div><button className="text-link" onClick={clear}>ସଫା କରନ୍ତୁ · <span lang="en">Clear filters</span></button><p className="results-count" role="status" lang="en">{results.length} {results.length === 1 ? 'book' : 'books'} · {results.filter(b => b.demo).length} clearly labeled {results.filter(b => b.demo).length === 1 ? 'demo' : 'demos'}</p><div className="book-grid">{results.map(b => <BookCard key={b.id} book={b}/>)}</div>{!results.length && <div className="empty-state"><span aria-hidden="true">❧</span><h2>ଏହି ବିଭାଗରେ ବହି ନାହିଁ।</h2><p lang="en">No matching books yet. Try another search or <a href="/feedback/">request a work</a>.</p></div>}</>;
}
export function AuthorBrowser({ authors, books }: { authors: Author[]; books: BookSummary[] }) {
  const { filters, change, endTyping, clear } = useCatalogUrl('authors', authors);
  const letters = Array.from(new Set(authors.map(a => a.name.slice(0, 1)))).sort((a, b) => a.localeCompare(b, 'or'));
  const results = filterAuthors(authors, filters.q, filters.genre, filters.letter);
  return <><div className="catalog-filters author-filters"><label className="search-field" id="author-search"><span>ସାହିତ୍ୟିକ ଖୋଜନ୍ତୁ · <span lang="en">Search authors</span></span><input type="search" value={filters.q} onChange={e => change({ q: e.target.value }, true)} onBlur={endTyping} placeholder="ନାମ ବା English transliteration"/></label><label>ସାହିତ୍ୟ ବିଭାଗ · <span lang="en">Genre</span><select value={filters.genre} onChange={e => change({ genre: e.target.value })}><option value="all" lang="en">All genres</option>{genreOptions.map(([id, odia, english]) => <option key={id} value={id}>{odia} · {english}</option>)}</select></label></div><nav className="alphabet-nav" aria-label="Browse authors alphabetically"><button aria-pressed={filters.letter === 'all'} onClick={() => change({ letter: 'all' })}>ସମସ୍ତେ · <span lang="en">All</span></button>{letters.map(letter => <button key={letter} aria-pressed={filters.letter === letter} onClick={() => change({ letter })}>{letter}</button>)}</nav><button className="text-link" onClick={clear}>ସଫା କରନ୍ତୁ · <span lang="en">Clear filters</span></button><p className="results-count" role="status" lang="en">{results.length} authors · Alphabetical directory</p><div className="author-grid">{results.map(author => <AuthorCard key={author.id} author={author} count={books.filter(book => book.authorId === author.id && book.readable).length}/>)}</div>{!results.length && <p className="empty-state" lang="en">No matching authors. Try another name or genre.</p>}</>;
}
