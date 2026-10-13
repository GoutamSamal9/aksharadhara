import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const root = 'out';
const urls = new Set(['/', '/my-library/', '/offline/']);
const fingerprints = [];
for (const path of ['', 'my-library/', 'offline/']) {
  const html = await readFile(join(root, path, 'index.html'), 'utf8');
  fingerprints.push(html);
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const asset = new URL(match[1].replace(/&amp;/g, '&'), 'https://akshara.local');
    if (asset.origin === 'https://akshara.local' && /^\/(?:_next\/static\/|fonts\/|icons\/)/.test(asset.pathname)) urls.add(asset.pathname);
  }
}
// CSS font and image references are explicit dependencies of the shell.
for (const asset of urls) {
  if (!asset.endsWith('.css')) continue;
  const css = await readFile(join(root, asset), 'utf8');
  for (const match of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) {
    const dependency = new URL(match[1], `https://akshara.local${asset}`);
    if (dependency.origin === 'https://akshara.local' && !dependency.pathname.startsWith('/content/')) urls.add(dependency.pathname);
  }
}
async function addPublic(directory) {
  try { for (const item of await readdir(join(root, directory), { withFileTypes: true })) if (item.isFile()) urls.add(`/${directory}/${item.name}`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
await addPublic('icons');
// Fonts actually referenced by shell CSS are already included above; don't precache unused alternatives.
urls.add('/fonts/OFL.txt');
try { await readFile(join(root, 'manifest.webmanifest')); urls.add('/manifest.webmanifest'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const asset of urls) {
  if (asset.endsWith('/')) continue;
  fingerprints.push(await readFile(join(root, asset)));
}
const hash = createHash('sha256');
for (const value of fingerprints) hash.update(value);
const version = hash.digest('hex').slice(0, 16);
await writeFile(join(root, 'offline-manifest.js'), `self.AKSHARA_OFFLINE = ${JSON.stringify({ version, urls: [...urls].sort() })};\n`);
console.log(`Offline shell ${version}: ${urls.size} files; book pages and text require explicit download.`);
