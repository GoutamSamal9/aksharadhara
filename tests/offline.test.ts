import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import demo from '../content/books/demo-garden.json';
import type { Book } from '../src/types';
import { downloadBook, getOfflineBook, listOfflineBooks, removeBook } from '../src/db';
const db = vi.hoisted(() => ({ get: vi.fn(), getAll: vi.fn(), put: vi.fn(), delete: vi.fn(), close: vi.fn() }));
vi.mock('idb', () => ({ openDB: vi.fn(async () => db) }));
const messages: string[] = [];
beforeEach(() => {
  vi.clearAllMocks(); messages.length = 0;
  db.get.mockResolvedValue(undefined); db.getAll.mockResolvedValue([]); db.put.mockResolvedValue(undefined); db.delete.mockResolvedValue(undefined);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => structuredClone(demo) })));
  vi.stubGlobal('MessageChannel', class {
    port1 = { onmessage: null as null | ((event: { data: unknown }) => void), close: vi.fn() };
    port2 = { reply: (data: unknown) => queueMicrotask(() => this.port1.onmessage?.({ data })) };
  });
  vi.stubGlobal('navigator', { serviceWorker: { controller: { postMessage: (data: { type: string }, ports: { reply: (data: unknown) => void }[]) => { messages.push(data.type); ports[0].reply({ ok: true }); } } } });
});
afterEach(() => vi.unstubAllGlobals());
it('stores only the explicitly downloaded book after cache acknowledgement', async () => {
  await downloadBook(demo as Book);
  expect(messages).toEqual(['CACHE_BOOK']);
  expect(fetch).toHaveBeenCalledWith('/content/books/demo-garden.json', { cache: 'no-store' });
  expect(db.put).toHaveBeenCalledWith('books', expect.objectContaining({ slug: 'demo-garden', bookId: demo.id, book: demo }));
});
it('rolls back cached files when IndexedDB storage fails', async () => {
  db.put.mockRejectedValue(new Error('quota'));
  await expect(downloadBook(demo as Book)).rejects.toThrow('quota');
  expect(messages).toEqual(['CACHE_BOOK', 'REMOVE_BOOK']);
});
it('rejects unreadable candidates without downloading or caching text', async () => {
  await expect(downloadBook({ ...demo, chapterCount: 2, readable: false })).rejects.toThrow('awaiting rights');
  expect(fetch).not.toHaveBeenCalled(); expect(messages).toEqual([]);
});
it('does not save a payload that lacks cleared work and edition rights', async () => {
  vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ...demo, demo: false, rights: { workStatus: 'cleared', editionStatus: 'unverified' }, verification: { status: 'approved', proofreadAgainstSource: true } }) } as Response);
  await expect(downloadBook(demo as Book)).rejects.toThrow('awaiting rights');
  expect(db.put).not.toHaveBeenCalled(); expect(messages).toEqual([]);
});
it('removes the selected cache and book record without touching reader state', async () => {
  await removeBook('demo-garden');
  expect(messages).toEqual(['REMOVE_BOOK']); expect(db.delete).toHaveBeenCalledWith('books', 'demo-garden');
  expect(db.put).not.toHaveBeenCalled();
});
it('reads selected book records from the separate books store', async () => {
  await listOfflineBooks(); await getOfflineBook('demo-garden');
  expect(db.getAll).toHaveBeenCalledWith('books'); expect(db.get).toHaveBeenCalledWith('books', 'demo-garden');
});
it('repairs an evicted browser cache even when its IndexedDB record remains', async () => {
  db.get.mockResolvedValue({ slug: demo.slug, bookId: demo.id, title: demo.title, book: demo });
  await downloadBook(demo as Book);
  expect(messages).toEqual(['CHECK_BOOK', 'CACHE_BOOK']);
  expect(db.put).toHaveBeenCalledWith('books', expect.objectContaining({ slug: demo.slug }));
});
it('keeps a complete existing offline copy without fetching it again', async () => {
  db.get.mockResolvedValue({ slug: demo.slug, bookId: demo.id, title: demo.title, book: demo });
  vi.stubGlobal('navigator', { serviceWorker: { controller: { postMessage: (data: { type: string }, ports: { reply: (data: unknown) => void }[]) => { messages.push(data.type); ports[0].reply({ ok: true, cached: true }); } } } });
  await downloadBook(demo as Book);
  expect(messages).toEqual(['CHECK_BOOK']); expect(fetch).not.toHaveBeenCalled(); expect(db.put).not.toHaveBeenCalled();
});
it('reports a known full storage quota before downloading more files', async () => {
  vi.stubGlobal('navigator', { serviceWorker: navigator.serviceWorker, storage: { estimate: async () => ({ usage: 100, quota: 100 }) } });
  await expect(downloadBook(demo as Book)).rejects.toThrow('storage is full');
  expect(fetch).not.toHaveBeenCalled(); expect(messages).toEqual([]);
});
