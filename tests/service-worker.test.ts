// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';
import demo from '../content/books/demo-garden.json';

type Handler = (event: Record<string, unknown>) => void;
function worker() {
  const origin = 'https://akshara.test';
  const handlers = new Map<string, Handler>();
  const stores = new Map<string, Map<string, Response>>();
  const calls: string[] = [];
  let offline = false, quota = false;
  const payload = structuredClone(demo);
  const key = (input: Request | string, ignoreSearch = false) => { const url = new URL(typeof input === 'string' ? input : input.url, origin); if (ignoreSearch) url.search = ''; return url.href; };
  const routes = new Map<string, string>([
    ['/', '<h1>Home</h1>'], ['/my-library/', '<h1>My library</h1>'], ['/offline/', '<h1>Offline library</h1>'],
    ['/shell.js', 'shell'], ['/fonts/odia.woff2', 'font'],
    ['/read/demo-garden/', '<div data-reader-book="demo-garden"><script src="/_next/static/reader.js"></script><link href="/_next/static/reader.css" rel="stylesheet"></div>'],
    ['/books/demo-garden/', '<div data-book-detail="demo-garden"><script src="/_next/static/reader.js"></script></div>'],
    ['/_next/static/reader.js', 'reader'], ['/_next/static/reader.css', 'body{font-family:odia;src:url(/fonts/odia.woff2)}'],
  ]);
  const network = async (input: Request | string) => {
    const path = new URL(key(input)).pathname; calls.push(path);
    if (offline) throw new Error('Disconnected');
    if (path === '/content/books/demo-garden.json') return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
    return new Response(routes.get(path) ?? 'missing', { status: routes.has(path) ? 200 : 404, headers: { 'Content-Type': path.endsWith('/') ? 'text/html' : 'text/plain' } });
  };
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const data = stores.get(name)!;
      return {
        addAll: async (urls: string[]) => { for (const url of urls) data.set(key(url), await network(url)); },
        put: async (request: Request | string, response: Response) => { if (quota && name.startsWith('akshara-book-')) throw new DOMException('quota', 'QuotaExceededError'); data.set(key(request), response.clone()); },
        match: async (request: Request | string, options?: { ignoreSearch?: boolean }) => { const target = key(request, options?.ignoreSearch); return [...data].find(([url]) => key(url, options?.ignoreSearch) === target)?.[1].clone(); },
        keys: async () => [...data.keys()].map(url => new Request(url)),
      };
    },
  };
  const self = { location: { origin }, AKSHARA_OFFLINE: { version: 'test', urls: ['/', '/my-library/', '/offline/', '/shell.js'] }, addEventListener: (type: string, handler: Handler) => handlers.set(type, handler), skipWaiting: async () => undefined, clients: { claim: async () => undefined } };
  runInNewContext(readFileSync('public/sw.js', 'utf8'), { self, importScripts: () => undefined, caches, fetch: network, URL, Request, Response, Set, Map, Promise, Date, Error, Boolean, JSON });
  const event = async (type: string, values: Record<string, unknown> = {}) => {
    let promise: Promise<unknown> = Promise.resolve();
    handlers.get(type)!({ ...values, waitUntil: (value: Promise<unknown>) => { promise = value; }, respondWith: (value: Promise<unknown>) => { promise = value; } });
    return await promise;
  };
  return {
    stores, calls, routes, payload, caches,
    install: () => event('install'), activate: () => event('activate'),
    offline: () => { offline = true; }, quota: () => { quota = true; },
    message: async (type: string, slug = 'demo-garden') => { let reply: { ok: boolean; cached?: boolean; error?: string } | undefined; await event('message', { data: { type, slug }, ports: [{ postMessage: (value: typeof reply) => { reply = value; } }] }); return reply!; },
    request: async (path: string, navigation = true, rsc = false) => {
      const request = { url: `${origin}${path}`, method: 'GET', mode: navigation ? 'navigate' : 'cors', headers: new Headers(rsc ? { RSC: '1' } : {}) };
      return await event('fetch', { request }) as Response;
    },
  };
}
it('precaches only the shell and retains explicit books across shell upgrades', async () => {
  const sw = worker(); await sw.install();
  expect(sw.calls).toEqual(['/', '/my-library/', '/offline/', '/shell.js']);
  await sw.caches.open('akshara-shell-old'); await sw.caches.open('akshara-book-existing');
  await sw.activate();
  expect([...sw.stores.keys()]).toContain('akshara-book-existing'); expect([...sw.stores.keys()]).not.toContain('akshara-shell-old');
});
it('downloads only the selected documents, payload and dependencies; detects eviction and removes them', async () => {
  const sw = worker(); await sw.install(); expect(await sw.message('CACHE_BOOK')).toMatchObject({ ok: true });
  expect(sw.calls).toContain('/content/books/demo-garden.json'); expect(sw.calls).toContain('/fonts/odia.woff2');
  expect(sw.calls.some(path => path.includes('another-book'))).toBe(false);
  expect(await sw.message('CHECK_BOOK')).toMatchObject({ ok: true, cached: true });
  sw.stores.get('akshara-book-demo-garden')!.delete('https://akshara.test/_next/static/reader.js');
  expect(await sw.message('CHECK_BOOK')).toMatchObject({ ok: true, cached: false });
  await sw.message('REMOVE_BOOK'); expect(sw.stores.has('akshara-book-demo-garden')).toBe(false);
});
it('rolls back incomplete files on quota failure with an actionable acknowledgement', async () => {
  const sw = worker(); sw.quota(); const reply = await sw.message('CACHE_BOOK');
  expect(reply).toMatchObject({ ok: false }); expect(reply.error).toMatch(/storage is full/);
  expect([...sw.stores.keys()].some(name => name.startsWith('akshara-staging-') || name.startsWith('akshara-book-'))).toBe(false);
});
it('serves selected reader documents offline and sends unavailable routes to the offline library', async () => {
  const sw = worker(); await sw.install(); await sw.message('CACHE_BOOK'); sw.offline();
  expect(await (await sw.request('/read/demo-garden/')).text()).toContain('data-reader-book');
  expect(await (await sw.request('/read/not-downloaded/')).text()).toContain('Offline library');
  expect(await (await sw.request('/_next/static/reader.js', false)).text()).toBe('reader');
  await expect(sw.request('/read/demo-garden/?_rsc=1', false, true)).rejects.toThrow('Disconnected');
});
it('rejects a generic host fallback instead of saving it as a book document', async () => {
  const sw = worker(); sw.routes.set('/read/demo-garden/', '<script src="/_next/static/reader.js"></script>');
  expect(await sw.message('CACHE_BOOK')).toMatchObject({ ok: false }); expect(sw.stores.has('akshara-book-demo-garden')).toBe(false);
});
it('rejects authentic text that lacks separate rights evidence and reviewer decisions', async () => {
  const sw = worker(); sw.payload.demo = false; sw.payload.rights.workStatus = 'cleared'; sw.payload.rights.editionStatus = 'cleared'; sw.payload.verification.status = 'approved'; sw.payload.verification.proofreadAgainstSource = true;
  expect(await sw.message('CACHE_BOOK')).toMatchObject({ ok: false, error: expect.stringMatching(/rights and text review/) });
});
