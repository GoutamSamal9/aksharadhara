'use client';
import { useEffect, useState } from 'react';
import { useReading } from './ReadingProvider';
import type { Book, BookSummary } from '../types';

export function OfflineManager({ book }: { book?: Book | BookSummary }) {
  const { offlineBooks, offlineReady, ready, downloadBook, removeBook } = useReading();
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [failure, setFailure] = useState('');
  const [supported, setSupported] = useState(true);
  const [storage, setStorage] = useState<StorageEstimate | null>(null);
  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'caches' in window);
    let active = true;
    navigator.storage?.estimate?.().then(value => { if (active) setStorage(value); }).catch(() => undefined);
    return () => { active = false; };
  }, [offlineBooks]);
  const act = async (slug: string, operation: () => Promise<void>, message: string) => {
    setBusy(slug); setFailure(''); setNotice('');
    try { await operation(); setNotice(message); } catch (error) { setFailure(error instanceof Error ? error.message : 'Offline storage failed. Please check your connection and available storage.'); } finally { setBusy(''); }
  };
  const downloaded = book && offlineBooks.some(item => item.slug === book.slug);
  return <section aria-label={book ? 'Offline book' : 'Downloaded books'}>
    {book ? <button className="button" disabled={!ready || !offlineReady || Boolean(busy)} onClick={() => act(book.slug, () => downloaded ? removeBook(book.slug) : downloadBook(book), downloaded ? 'Offline book removed. Your bookmarks and reading position remain.' : 'Book saved for offline reading on this device.')}>{busy ? 'Working…' : downloaded ? 'Remove offline copy' : 'Download for offline reading'}</button> : <>
      <h2>Books on this device</h2>
      {!ready ? <p role="status">Loading downloaded books…</p> : offlineBooks.length ? <ul className="offline-books">{offlineBooks.map(item => <li key={item.slug}><a href={`/read/${item.slug}/`}>{item.title}</a><button disabled={!offlineReady || Boolean(busy)} onClick={() => act(item.slug, () => removeBook(item.slug), 'Offline book removed. Your reading position remains.')}>{busy === item.slug ? 'Working…' : 'Remove offline copy'}</button><button disabled={!offlineReady || Boolean(busy)} onClick={() => act(item.slug, () => downloadBook(item.book), 'Offline copy checked and repaired if needed.')}>Repair offline copy</button></li>)}</ul> : <p>No books downloaded yet. Open a book and choose “Download for offline reading”.</p>}
      <p>Only books you select are downloaded. Reading progress and bookmarks stay on this device. Clearing browser data removes them; the browser may also evict offline storage.</p>
    </>}
    {book && downloaded && <button disabled={!offlineReady || Boolean(busy)} onClick={() => act(book.slug, () => downloadBook(book), 'Offline copy checked and repaired if needed.')}>Repair offline copy</button>}
    {!supported ? <p className="muted">This browser does not support offline downloads here. You can still read online; use a browser with service workers over HTTPS or localhost to download books.</p> : !offlineReady && <p className="muted">Offline downloads become available after the production app finishes preparing on this device.</p>}
    {storage && typeof storage.usage === 'number' && typeof storage.quota === 'number' && <p className="muted">Site storage: {(storage.usage / 1048576).toFixed(1)} MB used of {(storage.quota / 1048576).toFixed(1)} MB available to this site.</p>}
    {notice && <p role="status">{notice}</p>}{failure && <p role="alert">{failure}</p>}
  </section>;
}
export default OfflineManager;
