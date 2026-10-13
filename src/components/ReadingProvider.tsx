'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { initialState, loadState, saveState, listOfflineBooks, downloadBook as storeBook, removeBook as deleteBook, type OfflineBook } from '../db';
import type { Book, BookSummary, ReadingState } from '../types';

type ReadingStore = {
  state: ReadingState;
  update: (fn: (state: ReadingState) => ReadingState) => void;
  ready: boolean;
  error: string;
  offlineReady: boolean;
  offlineBooks: OfflineBook[];
  downloadBook: (book: Book | BookSummary) => Promise<void>;
  removeBook: (slug: string) => Promise<void>;
};
const ReadingContext = createContext<ReadingStore | null>(null);
export function useReading() { const context = useContext(ReadingContext); if (!context) throw new Error('useReading requires ReadingProvider'); return context; }

export function ReadingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => structuredClone(initialState));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [offlineReady, setOfflineReady] = useState(false);
  const [offlineBooks, setOfflineBooks] = useState<OfflineBook[]>([]);
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    Promise.allSettled([loadState(), listOfflineBooks()]).then(([saved, books]) => {
      if (!active) return;
      if (saved.status === 'fulfilled') setState(saved.value);
      else setError('Local storage is unavailable. Reading changes last only for this visit.');
      if (books.status === 'fulfilled') setOfflineBooks(books.value);
      else setError('Offline book storage is unavailable on this device.');
      setReady(true);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    queue.current = queue.current.then(() => saveState(state)).catch(() => setError('Could not save your reading changes. Device storage may be full or unavailable.'));
  }, [state, ready]);
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let active = true;
    const controlled = () => { if (active) setOfflineReady(Boolean(navigator.serviceWorker.controller)); };
    navigator.serviceWorker.addEventListener('controllerchange', controlled);
    // The exported service worker exists in production, never in Next development.
    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(() => navigator.serviceWorker.ready).then(controlled).catch(() => { if (active) setError('Offline support could not start. Reading remains available online.'); });
    }
    return () => { active = false; navigator.serviceWorker.removeEventListener('controllerchange', controlled); };
  }, []);
  const update = useCallback((fn: (state: ReadingState) => ReadingState) => setState(fn), []);
  const downloadBook = useCallback(async (book: Book | BookSummary) => { await storeBook(book); setOfflineBooks(await listOfflineBooks()); }, []);
  const removeBook = useCallback(async (slug: string) => { await deleteBook(slug); setOfflineBooks(await listOfflineBooks()); }, []);
  return <ReadingContext.Provider value={{ state, update, ready, error, offlineReady, offlineBooks, downloadBook, removeBook }}>{error && <div className="storage-error" role="alert"><span lang="or">ସ୍ଥାନୀୟ ସଞ୍ଚୟରେ ସମସ୍ୟା ହୋଇଛି। ପଢ଼ିପାରିବେ; କିଛି ପରିବର୍ତ୍ତନ ସଞ୍ଚୟ ହୋଇନପାରେ।</span> <span lang="en">{error}</span></div>}{children}</ReadingContext.Provider>;
}
export default ReadingProvider;
