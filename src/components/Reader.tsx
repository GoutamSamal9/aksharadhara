'use client';

import { memo, useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import type { Book, Chapter, ReadingState } from '../types';
import { useReading } from './ReadingProvider';
import OfflineManager from './OfflineManager';

type Location = { chapterId: string; blockId: string; revision: number };
function locate(book: Book, fragment: string, state: ReadingState): Omit<Location, 'revision'> | null {
  let hash = fragment.replace(/^#/, '');
  try { hash = decodeURIComponent(hash); } catch { return null; }
  const first = book.chapters[0];
  if (hash === 'start') return { chapterId: first.id, blockId: first.blocks[0].id };
  const parts = hash.split('/');
  if (parts.length > 2) return null;
  const [chapterId, blockId] = parts;
  const explicitChapter = book.chapters.find(chapter => chapter.id === chapterId);
  if (explicitChapter) {
    if (parts.length === 1) return { chapterId: explicitChapter.id, blockId: explicitChapter.blocks[0].id };
    const block = explicitChapter.blocks.find(item => item.id === blockId);
    return block ? { chapterId: explicitChapter.id, blockId: block.id } : null;
  }
  // Accept old stanza-only fragments as well as the new chapter/stanza format.
  const oldChapter = book.chapters.find(chapter => chapter.blocks.some(block => block.id === hash));
  if (oldChapter) return { chapterId: oldChapter.id, blockId: hash };
  if (hash) return null;
  const saved = state.progress[book.id];
  const savedChapter = book.chapters.find(chapter => chapter.id === saved?.chapterId);
  if (savedChapter) return { chapterId: savedChapter.id, blockId: savedChapter.blocks.find(block => block.id === saved.blockId)?.id ?? savedChapter.blocks[0].id };
  return { chapterId: first.id, blockId: first.blocks[0].id };
}
function readableLocation(book: Book, chapterId: string, blockId: string) {
  const chapter = book.chapters.find(item => item.id === chapterId);
  const index = chapter?.blocks.findIndex(block => block.id === blockId) ?? -1;
  if (!chapter || index < 0) return 'ସଞ୍ଚିତ ପଢ଼ିବା ସ୍ଥାନ';
  return `${chapter.title} · ${chapter.blocks[index].type === 'verse' ? 'ପଦ୍ୟ' : 'ଅନୁଚ୍ଛେଦ'} ${index + 1}`;
}
const Poetry = memo(function Poetry({ chapter, onPosition }: { chapter: Chapter; onPosition: (blockId: string) => void }) {
  return <>{chapter.blocks.map((block, index) => <section className="stanza" id={block.id} key={block.id} aria-label={`${block.type === 'verse' ? 'ସ୍ତବକ' : 'ଅନୁଚ୍ଛେଦ'} ${index + 1}`} tabIndex={0} onFocus={() => onPosition(block.id)} onClick={() => onPosition(block.id)}><span className="stanza-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div>{block.lines.map((line, lineIndex) => <div className={block.type === 'verse' ? 'verse-line' : 'prose-line'} key={lineIndex}>{line}</div>)}{block.editorialNotes?.length ? <aside className="editorial-note" aria-label="ସମ୍ପାଦକୀୟ ଟୀକା">{block.editorialNotes.map((note, i) => <p key={i}>{note}</p>)}</aside> : null}</div></section>)}</>;
});

export default function Reader({ book }: { book: Book }) {
  const { state, update, ready } = useReading();
  const first = book.chapters[0];
  const [location, setLocation] = useState<Location>({ chapterId: first.id, blockId: first.blocks[0].id, revision: 0 });
  const [settings, setSettings] = useState(false);
  const [contents, setContents] = useState(false);
  const [notice, setNotice] = useState('');
  const [invalid, setInvalid] = useState(false);
  const invalidRef = useRef(false);
  const stateRef = useRef(state);
  const active = useRef('');
  const restoring = useRef(false);
  const restoredRevision = useRef(-1);
  useEffect(() => { stateRef.current = state; }, [state]);
  const chapter = book.chapters.find(item => item.id === location.chapterId) ?? first;
  const chapterIndex = book.chapters.findIndex(item => item.id === chapter.id);
  const preferences = state.preferences;
  const applyHash = useCallback(() => {
    const target = locate(book, window.location.hash, stateRef.current);
    if (!target) { invalidRef.current = true; setInvalid(true); setNotice(''); restoring.current = false; return; }
    invalidRef.current = false; setInvalid(false);
    restoring.current = true;
    active.current = target.blockId;
    setLocation(previous => ({ ...target, revision: previous.revision + 1 }));
    update(previous => ({ ...previous, progress: { ...previous.progress, [book.id]: { bookId: book.id, ...target, updatedAt: Date.now() } } }));
    setContents(false);
    const index = book.chapters.findIndex(chapter => chapter.id === target.chapterId);
    setNotice(`ଅଧ୍ୟାୟ ${index + 1} · ${book.chapters[index].title}`);
  }, [book, update]);
  useEffect(() => {
    if (!ready) return;
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [ready, applyHash]);
  useEffect(() => {
    if (!ready || invalid || !location.revision || restoredRevision.current === location.revision) return;
    restoredRevision.current = location.revision;
    restoring.current = true;
    const frame = requestAnimationFrame(() => {
      if (invalidRef.current) { restoring.current = false; return; }
      const target = location.blockId === chapter.blocks[0].id ? document.querySelector('.reading-page') : document.getElementById(location.blockId);
      target?.scrollIntoView?.({ behavior: 'instant', block: 'start' });
      restoring.current = false;
    });
    return () => { cancelAnimationFrame(frame); restoring.current = false; restoredRevision.current = -1; };
  }, [chapter, location, ready, invalid]);
  const markPosition = useCallback((blockId: string) => {
    if (!ready || invalidRef.current || restoring.current || active.current === blockId) return;
    active.current = blockId;
    window.history.replaceState(window.history.state, '', `#${chapter.id}/${blockId}`);
    update(previous => ({ ...previous, progress: { ...previous.progress, [book.id]: { bookId: book.id, chapterId: chapter.id, blockId, updatedAt: Date.now() } } }));
  }, [ready, chapter.id, book.id, update]);
  useEffect(() => {
    if (!ready || invalid) return;
    let frame = 0;
    const capture = () => {
      frame = 0;
      if (invalidRef.current || restoring.current) return;
      const nodes = chapter.blocks.map(block => document.getElementById(block.id)).filter((element): element is HTMLElement => Boolean(element));
      const candidate = nodes.find(element => element.getBoundingClientRect().bottom > 150) ?? nodes.at(-1);
      if (candidate) markPosition(candidate.id);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(capture); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, [ready, invalid, chapter, markPosition]);
  const navigate = useCallback((chapterId: string, blockId: string) => {
    const hash = `#${chapterId}/${blockId}`;
    if (window.location.hash !== hash) window.history.pushState(window.history.state, '', hash);
    applyHash();
  }, [applyHash]);
  const go = useCallback((index: number) => { const target = book.chapters[index]; if (target) navigate(target.id, target.blocks[0].id); }, [book.chapters, navigate]);
  const anchor = (event: MouseEvent<HTMLAnchorElement>, chapterId: string, blockId: string) => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigate(chapterId, blockId);
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setSettings(false); setContents(false); return; }
      if (!ready || invalidRef.current || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat || event.target instanceof Element && event.target.closest('input,select,textarea,button,a,[contenteditable=true],[role=textbox]')) return;
      const index = event.key === 'ArrowRight' ? chapterIndex + 1 : event.key === 'ArrowLeft' ? chapterIndex - 1 : -1;
      if (book.chapters[index]) { event.preventDefault(); go(index); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready, book.chapters, chapterIndex, go]);
  const position = state.progress[book.id];
  const blockId = position?.chapterId === chapter.id && chapter.blocks.some(block => block.id === position.blockId) ? position.blockId : chapter.blocks[0].id;
  const bookmarkKey = `${book.id}/${chapter.id}/${blockId}`;
  const saved = state.bookmarks.some(bookmark => bookmark.key === bookmarkKey);
  const bookmarks = state.bookmarks.filter(bookmark => bookmark.bookId === book.id && book.chapters.some(item => item.id === bookmark.chapterId && item.blocks.some(block => block.id === bookmark.blockId)));
  const toggleBookmark = () => {
    if (!ready || invalidRef.current) return;
    update(previous => ({ ...previous, bookmarks: previous.bookmarks.some(bookmark => bookmark.key === bookmarkKey) ? previous.bookmarks.filter(bookmark => bookmark.key !== bookmarkKey) : [...previous.bookmarks, { key: bookmarkKey, bookId: book.id, chapterId: chapter.id, blockId, updatedAt: Date.now() }] }));
    setNotice(saved ? 'ସଞ୍ଚିତ ସ୍ଥାନ ହଟାଯାଇଛି' : 'ଏହି ଡିଭାଇସରେ ପଢ଼ିବା ସ୍ଥାନ ସଞ୍ଚିତ ହୋଇଛି');
  };
  const blocks = book.chapters.flatMap(item => item.blocks);
  const progress = Math.round((blocks.findIndex(block => block.id === blockId) + 1) / blocks.length * 100);
  return <div className={`reader theme-${preferences.theme}`} data-reader-book={book.slug}>
    <div className="reader-toolbar"><a href={`/books/${book.slug}/`} aria-label="ବହିର ବିବରଣୀକୁ ଫେରନ୍ତୁ">← <span>{book.title}</span></a><div><button aria-expanded={contents} aria-controls="reader-contents" onClick={() => setContents(value => !value)}>☷ <span>ସୂଚୀ <span lang="en" className="secondary-label">Contents</span></span></button><button aria-expanded={settings} aria-controls="reader-settings" onClick={() => setSettings(value => !value)}>Aa <span>ପଢ଼ିବା ସଜାଣି <span lang="en" className="secondary-label">Settings</span></span></button><button disabled={!ready || invalid} aria-pressed={saved} onClick={toggleBookmark}>{saved ? '◆' : '◇'} <span>ସ୍ଥାନ ସଞ୍ଚୟ <span lang="en" className="secondary-label">Bookmark</span></span></button></div></div>
    {settings && <section id="reader-settings" className="reader-panel" aria-label="ପଢ଼ିବା ସଜାଣି"><h2>ପଢ଼ିବା ସଜାଣି <span lang="en">Reading settings</span></h2><div className="settings-grid"><fieldset disabled={!ready}><legend>ପୃଷ୍ଠାର ରଙ୍ଗ <span lang="en">Theme</span></legend>{(['light', 'sepia', 'dark'] as const).map(theme => <button key={theme} aria-pressed={preferences.theme === theme} onClick={() => update(previous => ({ ...previous, preferences: { ...previous.preferences, theme } }))}>{{ light: 'ଧଳା', sepia: 'କାଗଜର ରଙ୍ଗ', dark: 'ଗାଢ଼' }[theme]} <span lang="en">{theme}</span></button>)}</fieldset><label>ଅକ୍ଷର ଆକାର <span lang="en">Text size</span> · {preferences.fontSize}px<input type="range" disabled={!ready} min="18" max="36" step="1" value={preferences.fontSize} onChange={event => update(previous => ({ ...previous, preferences: { ...previous.preferences, fontSize: +event.target.value } }))}/></label><label>ଧାଡ଼ି ମଧ୍ୟରେ ବ୍ୟବଧାନ <span lang="en">Line spacing</span> · {preferences.lineHeight.toFixed(1)}<input type="range" disabled={!ready} min="1.5" max="2.5" step="0.1" value={preferences.lineHeight} onChange={event => update(previous => ({ ...previous, preferences: { ...previous.preferences, lineHeight: +event.target.value } }))}/></label><label>ପାଠ୍ୟର ଓସାର <span lang="en">Reading width</span> · {preferences.width}px<input type="range" disabled={!ready} min="480" max="900" step="20" value={preferences.width} onChange={event => update(previous => ({ ...previous, preferences: { ...previous.preferences, width: +event.target.value } }))}/></label></div><OfflineManager book={book}/></section>}
    {contents && <section id="reader-contents" className="reader-panel" aria-label="ଅଧ୍ୟାୟ ସୂଚୀ"><h2>ସୂଚୀ <span lang="en">Contents</span></h2>{book.chapters.map((item, index) => <a className="toc-row" aria-current={!invalid && item.id === chapter.id ? 'page' : undefined} href={`#${item.id}/${item.blocks[0].id}`} key={item.id} onClick={event => anchor(event, item.id, item.blocks[0].id)}>{String(index + 1).padStart(2, '0')} · {item.title}</a>)}<h3>ଏହି ଡିଭାଇସରେ ସଞ୍ଚିତ ସ୍ଥାନ <span lang="en">Bookmarks</span></h3>{bookmarks.map(bookmark => <div className="bookmark-row" key={bookmark.key}><a href={`#${bookmark.chapterId}/${bookmark.blockId}`} onClick={event => anchor(event, bookmark.chapterId, bookmark.blockId)}>{readableLocation(book, bookmark.chapterId, bookmark.blockId)}</a><button aria-label={`ସଞ୍ଚିତ ସ୍ଥାନ ହଟାନ୍ତୁ · ${readableLocation(book, bookmark.chapterId, bookmark.blockId)}`} onClick={() => update(previous => ({ ...previous, bookmarks: previous.bookmarks.filter(item => item.key !== bookmark.key) }))}>ହଟାନ୍ତୁ <span lang="en">Remove</span></button></div>)}{!bookmarks.length && <p>ଏଯାଏଁ କୌଣସି ସ୍ଥାନ ସଞ୍ଚିତ ହୋଇନାହିଁ। <span lang="en">No bookmarks yet.</span></p>}</section>}
    <div className="reader-status" role="status">{notice || (ready ? 'ଆପଣଙ୍କ ପଢ଼ିବା ସ୍ଥାନ ଏହି ଡିଭାଇସରେ ସଞ୍ଚିତ ରହେ' : 'ସଞ୍ଚିତ ପଢ଼ିବା ସ୍ଥାନ ଖୋଲୁଛି…')}</div>
    {invalid ? <section className="reading-page invalid-location" role="alert"><h1>ଏହି ପଢ଼ିବା ସ୍ଥାନ ମିଳିଲା ନାହିଁ</h1><p>ଲିଙ୍କ୍‌ରେ ଥିବା ଅଧ୍ୟାୟ କିମ୍ବା ସ୍ତବକଟି ଏହି ବହିରେ ନାହିଁ। ଆପଣଙ୍କ ସଞ୍ଚିତ ପଢ଼ିବା ସ୍ଥାନ ବଦଳାଯାଇନାହିଁ।</p><p lang="en">This reading location is invalid. Your saved place has been kept.</p><div className="actions recovery-actions"><button onClick={() => setContents(true)}>ସୂଚୀ ଦେଖନ୍ତୁ <span lang="en">Contents</span></button><button onClick={() => { window.history.pushState(window.history.state, '', window.location.pathname); applyHash(); }}>ସଞ୍ଚିତ ସ୍ଥାନରୁ ପଢ଼ନ୍ତୁ <span lang="en">Resume</span></button><button onClick={() => { window.history.pushState(window.history.state, '', '#start'); applyHash(); }}>ଆରମ୍ଭରୁ ପଢ଼ନ୍ତୁ <span lang="en">Start</span></button></div></section> : <article className="reading-page" style={{ '--reading-size': `${preferences.fontSize}px`, '--reading-line': preferences.lineHeight, maxWidth: preferences.width } as CSSProperties}><header>{book.demo && <span className="badge">ନମୁନା <span lang="en">DEMO</span></span>}<p className="eyebrow">ଅଧ୍ୟାୟ {String(chapterIndex + 1).padStart(2, '0')} / {String(book.chapters.length).padStart(2, '0')}</p><h1>{chapter.title}</h1>{book.demo && <p className="sample-note">ଏହା ଏହି ପ୍ରକଳ୍ପ ପାଇଁ ଲିଖିତ ନମୁନା ପାଠ୍ୟ; ଐତିହାସିକ କବିତା ନୁହେଁ। <span lang="en">Original demo text. Not a historical poem.</span></p>}<div className="ornament" aria-hidden="true">❧</div></header><Poetry chapter={chapter} onPosition={markPosition}/>{chapter.editorialNotes?.length ? <aside className="editorial-note" aria-label="ଅଧ୍ୟାୟର ସମ୍ପାଦକୀୟ ଟୀକା">{chapter.editorialNotes.map((note, i) => <p key={i}>{note}</p>)}</aside> : null}<div className="chapter-end"><span aria-hidden="true">✦</span><p>ଅଧ୍ୟାୟ ସମାପ୍ତ <span lang="en">End of chapter</span></p></div><nav className="chapter-nav" aria-label="ଅଧ୍ୟାୟ ବଦଳାନ୍ତୁ"><button disabled={!ready || invalid || chapterIndex === 0} onClick={() => go(chapterIndex - 1)}>← ପୂର୍ବ ଅଧ୍ୟାୟ <span lang="en">Previous chapter</span></button><button disabled={!ready || invalid || chapterIndex === book.chapters.length - 1} onClick={() => go(chapterIndex + 1)}>ପରବର୍ତ୍ତୀ ଅଧ୍ୟାୟ <span lang="en">Next chapter</span> →</button></nav></article>}
    {!invalid && <div className="progress-bar"><label htmlFor="reading-progress">ପଢ଼ିବା ସ୍ଥାନ · {progress}% <span>ଅଧ୍ୟାୟ {chapterIndex + 1} / {book.chapters.length}</span></label><progress id="reading-progress" max={100} value={progress}/></div>}
  </div>;
}
