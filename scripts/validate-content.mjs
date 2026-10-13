import { readFile, readdir } from 'node:fs/promises';
export function validateBook(b, { production = false } = {}) {
  const fail = message => { throw new Error(`${b?.id ?? 'unknown'}: ${message}`); };
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const strings = value => Array.isArray(value) && value.length > 0 && value.every(text);
  const stableId = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  const reviewDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!b || typeof b !== 'object' || Array.isArray(b)) fail('invalid book');
  for (const field of ['id','slug','title','titleRomanized','authorId','author','language','description']) if (typeof b[field] !== 'string' || !b[field].trim()) fail(`missing ${field}`);
  if (!stableId(b.id) || !stableId(b.slug) || !stableId(b.authorId) || typeof b.demo !== 'boolean') fail('invalid book identity or demo marker');
  if (b.language !== 'or' || !strings(b.genres) || !Array.isArray(b.aliases) || !b.aliases.every(text)) fail('invalid catalog metadata');
  if (!b.source || !b.rights || !b.verification || !strings(b.rights.evidence)) fail('missing provenance');
  if (b.demo) {
    if (production) fail('demo excluded from production catalog');
    if (b.verification.status !== 'demo' || b.rights.workStatus !== 'demo-original' || b.rights.editionStatus !== 'demo-original' || !b.description.includes('ନମୁନା')) fail('demo must be labeled and original');
  } else {
    if (b.rights.workStatus !== 'cleared' || b.rights.editionStatus !== 'cleared' || b.verification.status !== 'approved' || b.verification.proofreadAgainstSource !== true) fail('publication requires cleared work and edition rights and approved proofreading');
    if (!strings(b.rights.workEvidence) || !strings(b.rights.editionEvidence)) fail('publication requires separate work and edition evidence');
    if (!text(b.rights.reviewedBy) || !reviewDate(b.rights.reviewedAt) || !text(b.verification.reviewedBy) || !reviewDate(b.verification.reviewedAt)) fail('publication requires rights and proofreading reviewer identities and valid review dates');
    let sourceUrl;
    try { sourceUrl = new URL(b.source.url); } catch { fail('publication requires a valid source URL'); }
    if (!['http:', 'https:'].includes(sourceUrl.protocol) || !text(b.source.institution) || !text(b.source.editionDescription) || !(b.source.editionYear === null || (Number.isInteger(b.source.editionYear) && b.source.editionYear > 0))) fail('publication requires source institution and edition metadata');
  }
  const ids = new Set([b.id]);
  if (!Array.isArray(b.chapters) || !b.chapters.length) fail('missing chapters');
  for (const c of b.chapters) {
    if (!text(c.title) || !Array.isArray(c.blocks) || !c.blocks.length) fail('invalid chapter');
    for (const node of [c, ...c.blocks]) { if (!stableId(node.id) || ids.has(node.id)) fail('invalid or duplicate stable ID'); ids.add(node.id); }
    for (const block of c.blocks) { if (!['verse','prose'].includes(block.type) || !Array.isArray(block.lines) || !block.lines.length || block.lines.some(l => typeof l !== 'string' || !l.trim() || /[\uFFFD\u0000-\u0008\u000B-\u001F\u007F]/u.test(l))) fail('invalid text block'); }
  }
  return true;
}
export function validateAuthor(author) {
  const fail = message => { throw new Error(`${author?.id ?? 'unknown'}: ${message}`); };
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const identity = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  if (!author || !identity(author.id) || !identity(author.slug) || !text(author.name) || !text(author.nameRomanized)) fail('invalid author identity');
  if (typeof author.verified !== 'boolean' || (author.demo !== undefined && typeof author.demo !== 'boolean') || !Array.isArray(author.genres) || !author.genres.length || !author.genres.every(text)) fail('invalid author metadata');
  for (const field of ['description', 'period']) if (author[field] !== undefined && !text(author[field])) fail(`invalid author ${field}`);
  if (!Array.isArray(author.sources)) fail('missing author sources');
  for (const source of author.sources) {
    let url;
    try { url = new URL(source.url); } catch { fail('invalid author source URL'); }
    if (!text(source.title) || !['https:', 'http:'].includes(url.protocol)) fail('invalid author source');
  }
  if (author.demo) {
    if (author.verified || !author.description?.includes('ନମୁନା')) fail('demo author must be labeled and not verified as historical');
  } else if (!author.verified || !author.sources.length) fail('historical author requires verified sources');
  return true;
}
export function validateCatalog(books, authors, options = {}) {
  const authorIds = new Set(); const authorSlugs = new Set();
  for (const author of authors) {
    validateAuthor(author);
    if (authorIds.has(author.id) || authorSlugs.has(author.slug)) throw new Error('Duplicate author identity');
    authorIds.add(author.id); authorSlugs.add(author.slug);
  }
  const ids = new Set(); const slugs = new Set();
  for (const book of books) {
    validateBook(book, options);
    if (ids.has(book.id) || slugs.has(book.slug)) throw new Error('Duplicate book identity');
    if (!authorIds.has(book.authorId)) throw new Error(`${book.id}: unknown author reference`);
    const author = authors.find(item => item.id === book.authorId);
    if (Boolean(author.demo) !== book.demo || author.name !== book.author) throw new Error(`${book.id}: author attribution or demo status mismatch`);
    ids.add(book.id); slugs.add(book.slug);
  }
  return true;
}
if (process.argv[1]?.endsWith('validate-content.mjs')) {
  const production = process.argv.includes('--production');
  const all = [];
  for (const name of await readdir(new URL('../content/books/', import.meta.url))) if (name.endsWith('.json')) all.push(JSON.parse(await readFile(new URL(`../content/books/${name}`, import.meta.url), 'utf8')));
  const authors = [];
  for (const name of await readdir(new URL('../content/authors/', import.meta.url))) if (name.endsWith('.json')) authors.push(JSON.parse(await readFile(new URL(`../content/authors/${name}`, import.meta.url), 'utf8')));
  validateCatalog(all, authors, { production });
  console.log(`Validated ${all.length} demo/reviewed content record(s). Authentic production works: ${all.filter(b => !b.demo).length}.`);
}
