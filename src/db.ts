import { openDB } from 'idb';
import type { Book, BookSummary, Position, ReadingState } from './types';
export const initialState: ReadingState = { preferences: { theme: 'sepia', fontSize: 24, lineHeight: 1.9, width: 720 }, progress: {}, bookmarks: [] };
const database = () => openDB('akshara-reader', 2, { upgrade(db) { if (!db.objectStoreNames.contains('state')) db.createObjectStore('state'); if (!db.objectStoreNames.contains('books')) db.createObjectStore('books', { keyPath: 'slug' }); } });
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
function position(value: unknown): value is Position {
  return object(value) && ['bookId', 'chapterId', 'blockId'].every(key => typeof value[key] === 'string' && value[key] !== '') && typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt);
}
function bounded(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
function restore(value: unknown): ReadingState {
  const state = structuredClone(initialState);
  if (!object(value)) return state;
  if (object(value.preferences)) {
    const p = value.preferences;
    state.preferences = {
      theme: p.theme === 'light' || p.theme === 'dark' || p.theme === 'sepia' ? p.theme : state.preferences.theme,
      fontSize: bounded(p.fontSize, 18, 36, state.preferences.fontSize),
      lineHeight: bounded(p.lineHeight, 1.5, 2.5, state.preferences.lineHeight),
      width: bounded(p.width, 480, 900, state.preferences.width),
    };
  }
  if (object(value.progress)) state.progress = Object.fromEntries(Object.entries(value.progress).filter(([id, p]) => position(p) && id === p.bookId)) as ReadingState['progress'];
  if (Array.isArray(value.bookmarks)) state.bookmarks = value.bookmarks.filter((b): b is ReadingState['bookmarks'][number] => position(b) && 'key' in b && b.key === `${b.bookId}/${b.chapterId}/${b.blockId}`);
  return state;
}
export async function loadState(): Promise<ReadingState> { const db = await database(); try { return restore(await db.get('state', 'reader')); } finally { db.close(); } }
export async function saveState(state: ReadingState) { const db = await database(); try { await db.put('state', state, 'reader'); } finally { db.close(); } }

export type OfflineBook = { slug: string; bookId: string; title: string; downloadedAt: number; book: Book };
export async function listOfflineBooks(): Promise<OfflineBook[]> { const db = await database(); try { return await db.getAll('books'); } finally { db.close(); } }
export async function getOfflineBook(slug: string): Promise<OfflineBook | undefined> { const db = await database(); try { return await db.get('books', slug); } finally { db.close(); } }

function workerMessage(type: string, slug: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const worker = navigator.serviceWorker?.controller;
    if (!worker) { reject(new Error('Offline support is still starting. Wait a moment and try again.')); return; }
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => { channel.port1.close(); reject(new Error('Offline storage did not respond. Please try again.')); }, 120000);
    channel.port1.onmessage = event => {
      window.clearTimeout(timer); channel.port1.close();
      if (event.data?.ok) resolve(Boolean(event.data.cached)); else reject(new Error(event.data?.error || 'Offline storage failed.'));
    };
    worker.postMessage({ type, slug }, [channel.port2]);
  });
}
const downloads = new Map<string, Promise<void>>();
export function downloadBook(book: Book | BookSummary): Promise<void> {
  const current = downloads.get(book.slug);
  if (current) return current;
  const operation = (async () => {
    if ('readable' in book && !book.readable) throw new Error('This work is awaiting rights and text review.');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(book.slug)) throw new Error('Invalid book address.');
    const existing = await getOfflineBook(book.slug);
    if (existing && await workerMessage('CHECK_BOOK', book.slug)) return;
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate().catch(() => ({} as StorageEstimate));
      if (estimate.quota && estimate.usage && estimate.usage >= estimate.quota) throw new Error('Device storage is full. Remove an offline book and try again.');
    }
    const response = await fetch(`/content/books/${book.slug}.json`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not download the book. Check your connection.');
    const payload: Book = await response.json();
    const text = (value: unknown) => typeof value === 'string' && Boolean(value.trim());
    const evidence = (value: unknown) => Array.isArray(value) && value.length > 0 && value.every(text);
    const date = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
    const reviewed = evidence(payload.rights?.evidence) && evidence(payload.rights?.workEvidence) && evidence(payload.rights?.editionEvidence) && text(payload.rights?.reviewedBy) && date(payload.rights?.reviewedAt) && text(payload.verification?.reviewedBy) && date(payload.verification?.reviewedAt);
    const cleared = payload.demo ? payload.verification?.status === 'demo' && payload.rights?.workStatus === 'demo-original' && payload.rights?.editionStatus === 'demo-original' : payload.verification?.status === 'approved' && payload.verification.proofreadAgainstSource && payload.rights?.workStatus === 'cleared' && payload.rights.editionStatus === 'cleared' && reviewed;
    if (!cleared) throw new Error('This work is awaiting rights and text review.');
    if (payload.id !== book.id || payload.slug !== book.slug || !Array.isArray(payload.chapters) || !payload.chapters.length || payload.chapters.some(chapter => !Array.isArray(chapter.blocks) || chapter.blocks.some(block => !Array.isArray(block.lines) || block.lines.some(line => typeof line !== 'string')))) throw new Error('The downloaded book is invalid.');
    await workerMessage('CACHE_BOOK', book.slug);
    try {
      const db = await database();
      try { await db.put('books', { slug: book.slug, bookId: book.id, title: book.title, downloadedAt: Date.now(), book: payload } satisfies OfflineBook); } finally { db.close(); }
    } catch (error) {
      await workerMessage('REMOVE_BOOK', book.slug).catch(() => undefined);
      throw error;
    }
  })().finally(() => downloads.delete(book.slug));
  downloads.set(book.slug, operation);
  return operation;
}
export async function removeBook(slug: string): Promise<void> {
  if (downloads.has(slug)) await downloads.get(slug);
  const existing = await getOfflineBook(slug);
  // Remove the browser cache first: if this fails, the existing offline record stays intact.
  await workerMessage('REMOVE_BOOK', slug);
  const db = await database();
  try { await db.delete('books', slug); } catch (error) { if (existing) await workerMessage('CACHE_BOOK', slug).catch(() => undefined); throw error; } finally { db.close(); }
}
