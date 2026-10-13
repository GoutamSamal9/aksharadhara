import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
const origin='https://aksharadhara.org';
const paths=['/','/authors/','/authors/gangadhar-meher/','/authors/fakir-mohan-senapati/','/authors/bhima-bhoi/','/authors/akshara-demo/','/books/','/books/demo-garden/','/read/demo-garden/','/feedback/','/about/','/contribute/','/my-library/','/offline/'];
const titles=new Set();let assets=0;
for(const path of paths){
  const html=await readFile(`out${path}index.html`,'utf8');
  const doc=new JSDOM(html,{url:origin+path}).window.document;
  assert.equal(doc.documentElement.lang,'or',`${path} Odia language`);
  assert.equal(doc.querySelectorAll('main h1').length,1,`${path} one main h1`);
  const title=doc.querySelector('title')?.textContent;assert.ok(title&&title.includes('ଅକ୍ଷରଧାରା'));assert.ok(!titles.has(title),'unique title');titles.add(title);
  assert.equal(doc.querySelector('link[rel=canonical]')?.getAttribute('href'),origin+path,`${path} canonical`);
  assert.ok(doc.querySelector('meta[name=description]')?.getAttribute('content'),`${path} description`);
  assert.ok(doc.querySelector('meta[property="og:title"]'),`${path} OG`);
  assert.ok(doc.querySelector('meta[property="og:image"]'),`${path} social image`);
  assert.equal(doc.querySelector('meta[name="twitter:card"]')?.getAttribute('content'),'summary_large_image');
  const noindex=path.includes('demo')||['/my-library/','/offline/'].includes(path);
  assert.equal(Boolean(doc.querySelector('meta[name=robots]')?.getAttribute('content')?.includes('noindex')),noindex,`${path} index policy`);
  for(const node of doc.querySelectorAll('script[type="application/ld+json"]'))JSON.parse(node.textContent);
  for(const node of doc.querySelectorAll('script[src],link[rel=stylesheet]')){const url=new URL(node.getAttribute('src')??node.getAttribute('href'),origin);if(url.origin===origin){await access('out'+decodeURIComponent(url.pathname));assets++;}}
  if(path.startsWith('/read/')){assert.equal(doc.querySelectorAll('.verse-line').length,8);assert.equal(doc.querySelector('[data-reader-book]')?.getAttribute('data-reader-book'),'demo-garden');assert.equal(doc.querySelectorAll('.site-header').length,0);}
  if(['/feedback/','/my-library/','/offline/','/read/demo-garden/'].includes(path))assert.ok(!doc.querySelector('script[src*="cloudflareinsights"]'),`${path} analytics excluded`);
}
const sitemap=await readFile('out/sitemap.xml','utf8');assert.ok(!sitemap.includes('demo'));assert.ok(!sitemap.includes('/my-library/'));assert.ok(sitemap.includes('/feedback/'));assert.equal((sitemap.match(/<loc>/g)??[]).length,9);
const manifest=JSON.parse(await readFile('out/manifest.webmanifest','utf8'));assert.equal(manifest.lang,'or');for(const icon of manifest.icons)await access('out'+icon.src);
const shell=JSON.parse((await readFile('out/offline-manifest.js','utf8')).match(/= (.*);/)[1]);assert.ok(!shell.urls.some(u=>u.startsWith('/read/')||u.startsWith('/books/')||u.startsWith('/content/')));for(const u of shell.urls){const file='out'+(u.endsWith('/')?u+'index.html':decodeURIComponent(u));await access(file);if(u.endsWith('.js')||u.endsWith('.html')||u.endsWith('/'))assert.ok(!(await readFile(file,'utf8')).includes('ଏହା ଏକ ନମୁନା ପାଠ୍ୟ।'),'shell must not contain downloadable book text');}
const payload=JSON.parse(await readFile('out/content/books/demo-garden.json','utf8'));assert.equal(payload.demo,true);assert.equal(payload.id,'demo-garden');
await access('out/404.html');
console.log(`Export verified: ${paths.length} static HTML routes, unique SEO, ${assets} asset references, 9 indexed sitemap URLs, demo exclusions, ${shell.urls.length} shell files, selective payload, and PWA icons.`);
