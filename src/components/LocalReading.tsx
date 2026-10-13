'use client';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { Book, BookSummary, Position } from '../types';
import { useReading } from './ReadingProvider';
function locationLabel(book: BookSummary, position: Position, downloaded?: Book) {
  const chapters = book.contents ?? downloaded?.chapters;
  const chapter = chapters?.find(item => item.id === position.chapterId);
  const blockIndex = chapter?.blocks.findIndex(block => block.id === position.blockId) ?? -1;
  if (!chapter || blockIndex < 0) return 'ସଞ୍ଚିତ ପଢ଼ିବା ସ୍ଥାନ';
  return `${chapter.title} · ${chapter.blocks[blockIndex].type === 'verse' ? 'ପଦ୍ୟ' : 'ଅନୁଚ୍ଛେଦ'} ${blockIndex + 1}`;
}
export function ThemeFrame({ children }: { children: ReactNode }) { const { state } = useReading(); return <div className={`site-frame theme-${state.preferences.theme}`}>{children}</div>; }
export function ReadAction({ book }: { book: BookSummary }) {
  const { state, ready } = useReading();
  if (!book.readable) return <p className="availability">ବହିର ସ୍ୱତ୍ୱ ଓ ପାଠ୍ୟ ଯାଞ୍ଚ ଚାଲିଛି। <span lang="en">Text is awaiting rights and proofreading review.</span></p>;
  const position = ready ? state.progress[book.id] : undefined;
  const fragment = position ? `#${encodeURIComponent(position.chapterId)}/${encodeURIComponent(position.blockId)}` : '';
  return <div className="reading-actions"><a className="button primary" href={`/read/${book.slug}/${fragment}`}>{position ? 'ପୁଣି ପଢ଼ନ୍ତୁ' : book.demo ? 'ନମୁନା ପଢ଼ନ୍ତୁ' : 'ବହି ପଢ଼ନ୍ତୁ'} <span lang="en">{position ? 'Continue reading' : book.demo ? 'Read sample' : 'Read book'}</span> <span aria-hidden="true">↗</span></a>{position && <a className="text-link" href={`/read/${book.slug}/#start`}>ଆରମ୍ଭରୁ ପଢ଼ନ୍ତୁ <span lang="en">Read from beginning</span></a>}</div>;
}
export function ContinueReading({ books }: { books: BookSummary[] }) {
  const { state, ready, offlineBooks } = useReading();
  const recent = books.filter(book => book.readable && state.progress[book.id]).sort((a, b) => state.progress[b.id].updatedAt - state.progress[a.id].updatedAt);
  if (!ready || !recent.length) return null;
  return <section className="continue-section section"><div className="section-heading"><div><p className="eyebrow">ଆପଣଙ୍କ ପରବର୍ତ୍ତୀ ପୃଷ୍ଠା <span lang="en">YOUR NEXT PAGE</span></p><h2>ପଢ଼ିବା ଜାରି ରଖନ୍ତୁ</h2></div><a href="/my-library/" className="text-link">ମୋ ପାଠାଗାର →</a></div>{recent.slice(0, 3).map(book => <div className="continue-row" key={book.id}><div><h3>{book.title}</h3><p>{book.author} · {locationLabel(book, state.progress[book.id], offlineBooks.find(item => item.bookId === book.id)?.book)}</p></div><ReadAction book={book}/></div>)}</section>;
}
export function LocalBookmarks({ books }: { books: BookSummary[] }) {
  const { state, ready, update, offlineBooks } = useReading();
  if (!ready) return <p role="status">ଆପଣଙ୍କ ପାଠାଗାର ଖୋଲୁଛି… <span lang="en">Loading your library…</span></p>;
  const bookmarks = state.bookmarks.filter(mark => books.some(book => book.id === mark.bookId && book.readable));
  return <section><h2>ସଞ୍ଚିତ ସ୍ଥାନ <span lang="en">Bookmarks</span></h2>{bookmarks.length ? bookmarks.map(mark => {
    const book = books.find(item => item.id === mark.bookId)!;
    const offline = offlineBooks.find(item => item.bookId === book.id)?.book;
    const label = locationLabel(book, mark, offline);
    return <div className="bookmark-row" key={mark.key}><a href={`/read/${book.slug}/#${encodeURIComponent(mark.chapterId)}/${encodeURIComponent(mark.blockId)}`}>{book.title}<small>{label}</small></a><button aria-label={`ସଞ୍ଚିତ ସ୍ଥାନ ହଟାନ୍ତୁ · ${book.title} · ${label}`} onClick={() => update(previous => ({ ...previous, bookmarks: previous.bookmarks.filter(item => item.key !== mark.key) }))}>ହଟାନ୍ତୁ <span lang="en">Remove</span></button></div>;
  }) : <p className="muted">ସଞ୍ଚିତ ପଢ଼ିବା ସ୍ଥାନ ଏଠାରେ ଦେଖାଯିବ। ଖାତା ଖୋଲିବା ଦରକାର ନାହିଁ। <span lang="en">Your saved places will appear here. No account needed.</span></p>}</section>;
}
export function Footer() {
  const path = usePathname();
  if (path?.startsWith('/read/')) return null;
  return <footer className="site-footer"><div><a href="/" className="footer-brand">ଅକ୍ଷରଧାରା</a><p>ଅକ୍ଷରରୁ ଅନନ୍ତ ଯାତ୍ରା…</p><small lang="en">Free to read. Open to build. Odia, for everyone.</small></div><div className="footer-links"><a href="/about/">ଆମ ବିଷୟରେ</a><a href="/contribute/">ଯୋଗଦାନ</a><a href="/feedback/">ମତାମତ</a><a href="/my-library/">ମୋ ପାଠାଗାର</a></div><p className="footer-note">ଆପ୍‌ର କୋଡ୍‌ର ଲାଇସେନ୍ସ MIT। ସାହିତ୍ୟିକ ପାଠ୍ୟର ସ୍ୱତ୍ୱ ଅଲଗା।<br/>ନମୁନା ପାଠ୍ୟ ଚିହ୍ନିତ ଅଛି; ଯାଞ୍ଚ ପରେ ମୂଳ ସାହିତ୍ୟ ଯୋଡ଼ାଯିବ। <span lang="en">Code: MIT. Literary content has separate rights.</span></p></footer>;
}
