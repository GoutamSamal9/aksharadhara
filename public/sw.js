/* Only the shell is precached. Book documents and text are cached by explicit request. */
importScripts('/offline-manifest.js');
const SHELL = `akshara-shell-${self.AKSHARA_OFFLINE.version}`;
const BOOK_PREFIX = 'akshara-book-';
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(SHELL);
  await cache.addAll(self.AKSHARA_OFFLINE.urls);
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith('akshara-shell-') && key !== SHELL || key.startsWith('akshara-staging-')).map(key => caches.delete(key)));
  await self.clients.claim();
})()));
function sameOriginAsset(raw, base) {
  const url = new URL(raw.replace(/&amp;/g, '&'), base);
  return url.origin === self.location.origin && /^\/(?:_next\/static\/|fonts\/|icons\/|covers\/)/.test(url.pathname) ? url.pathname : null;
}
async function fetchOK(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('A required offline file could not be downloaded. Please retry when connected.');
  return response;
}
async function cacheBook(slug) {
  const name = `${BOOK_PREFIX}${slug}`;
  const stagingName = `akshara-staging-${slug}-${Date.now()}`;
  const staging = await caches.open(stagingName);
  let committed = false;
  try {
    const documents = [`/read/${slug}/`, `/books/${slug}/`];
    const assets = new Set();
    for (const path of documents) {
      const response = await fetchOK(path);
      if (!response.headers.get('content-type')?.includes('text/html')) throw new Error('The reader document was not available.');
      const html = await response.clone().text();
      // A missing static route must not silently cache the host's generic fallback page.
      const marker = path.startsWith('/read/') ? 'data-reader-book' : 'data-book-detail';
      if (!html.includes('_next/static/') || !html.includes(`${marker}="${slug}"`)) throw new Error('The selected book document was not available.');
      await staging.put(path, response);
      for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
        const asset = sameOriginAsset(match[1], `${self.location.origin}${path}`);
        if (asset) assets.add(asset);
      }
    }
    const payloadPath = `/content/books/${slug}.json`;
    const payloadResponse = await fetchOK(payloadPath);
    const payload = await payloadResponse.clone().json();
    const text = value => typeof value === 'string' && Boolean(value.trim());
    const evidence = value => Array.isArray(value) && value.length > 0 && value.every(text);
    const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
    const reviewed = evidence(payload.rights?.evidence) && evidence(payload.rights?.workEvidence) && evidence(payload.rights?.editionEvidence) && text(payload.rights?.reviewedBy) && date(payload.rights?.reviewedAt) && text(payload.verification?.reviewedBy) && date(payload.verification?.reviewedAt);
    const cleared = payload.demo ? payload.verification?.status === 'demo' && payload.rights?.workStatus === 'demo-original' && payload.rights?.editionStatus === 'demo-original' : payload.verification?.status === 'approved' && payload.verification.proofreadAgainstSource && payload.rights?.workStatus === 'cleared' && payload.rights.editionStatus === 'cleared' && reviewed;
    if (!cleared) throw new Error('This work is awaiting rights and text review.');
    if (payload.slug !== slug || !Array.isArray(payload.chapters) || !payload.chapters.length) throw new Error('The book payload was invalid.');
    await staging.put(payloadPath, payloadResponse);
    for (const asset of assets) {
      const response = await fetchOK(asset);
      if (asset.endsWith('.css')) {
        const css = await response.clone().text();
        for (const match of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) {
          const dependency = sameOriginAsset(match[1], `${self.location.origin}${asset}`);
          if (dependency) assets.add(dependency);
        }
      }
      await staging.put(asset, response);
    }
    const entries = (await staging.keys()).map(request => request.url);
    await staging.put(`/.akshara-offline/${slug}`, new Response(JSON.stringify(entries), { headers: { 'Content-Type': 'application/json' } }));
    // Copy only after every file has downloaded. Any quota failure removes partial work.
    const destination = await caches.open(name);
    for (const request of await staging.keys()) await destination.put(request, await staging.match(request));
    committed = true;
  } finally {
    await caches.delete(stagingName);
    if (!committed) await caches.delete(name);
  }
}
const operations = new Map();
self.addEventListener('message', event => {
  const { type, slug } = event.data || {};
  if (!['CACHE_BOOK', 'REMOVE_BOOK', 'CHECK_BOOK'].includes(type)) return;
  const port = event.ports[0];
  if (!port) return;
  if (!slugPattern.test(slug || '')) { port.postMessage({ ok: false, error: 'Invalid book address.' }); return; }
  const task = (operations.get(slug) || Promise.resolve()).catch(() => undefined).then(async () => {
    if (type === 'CHECK_BOOK') {
      const cache = await caches.open(`${BOOK_PREFIX}${slug}`);
      const index = await cache.match(`/.akshara-offline/${slug}`);
      if (!index) return false;
      try { const entries = await index.json(); return Array.isArray(entries) && entries.length >= 3 && (await Promise.all(entries.map(url => cache.match(url)))).every(Boolean); } catch { return false; }
    }
    if (type === 'CACHE_BOOK') await cacheBook(slug);
    else await caches.delete(`${BOOK_PREFIX}${slug}`);
  });
  operations.set(slug, task);
  event.waitUntil(task.then(cached => port.postMessage({ ok: true, cached: Boolean(cached) })).catch(error => port.postMessage({ ok: false, error: error.name === 'QuotaExceededError' ? 'Device storage is full. Remove an offline book and try again.' : error.message || 'Could not save this book offline.' })).finally(() => { if (operations.get(slug) === task) operations.delete(slug); }));
});
async function offlineMatch(request) {
  const shell = await caches.open(SHELL);
  const shellResponse = await shell.match(request, { ignoreSearch: true });
  if (shellResponse) return shellResponse;
  for (const key of await caches.keys()) {
    if (!key.startsWith(BOOK_PREFIX)) continue;
    const response = await (await caches.open(key)).match(request, { ignoreSearch: true });
    if (response) return response;
  }
}
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    if (request.mode === 'navigate') {
      try { return await fetch(request); } catch {
        const cached = await offlineMatch(request);
        if (cached) return cached;
        const fallback = await (await caches.open(SHELL)).match('/offline/');
        if (fallback && url.pathname !== '/offline/') return Response.redirect(new URL(`/offline/?from=${encodeURIComponent(url.pathname)}`, self.location.origin).href, 302);
        return new Response('ଏହି ପୃଷ୍ଠା ପଢ଼ିବା ପାଇଁ ଇଣ୍ଟରନେଟ୍ ସଂଯୋଗ ଆବଶ୍ୟକ।', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    }
    // Next RSC requests must never receive a cached HTML document.
    if (request.headers.has('RSC') || url.searchParams.has('_rsc')) return fetch(request);
    const cached = await offlineMatch(request);
    return cached || fetch(request);
  })());
});
