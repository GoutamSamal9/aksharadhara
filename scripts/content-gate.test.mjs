import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateBook } from './validate-content.mjs';
const demo = JSON.parse(await readFile(new URL('../content/books/demo-garden.json',import.meta.url),'utf8'));
test('labeled sample passes pilot and is rejected as production literature', () => { assert.equal(validateBook(demo),true); assert.throws(() => validateBook(demo,{production:true}),/demo excluded/); });
test('archive link and unreviewed OCR cannot clear rights gate', () => { const b = structuredClone(demo); b.demo=false; b.source.url='https://archive.org/details/example'; b.verification.status='draft'; assert.throws(() => validateBook(b),/publication requires/); });
test('duplicate IDs fail validation', () => { const b = structuredClone(demo); b.chapters[0].blocks[1].id=b.chapters[0].blocks[0].id; assert.throws(() => validateBook(b),/duplicate/); });
const reviewedBook = () => {
  const b = structuredClone(demo);
  b.demo = false;
  b.source = { url: 'https://example.org/source', institution: 'Example source record', editionYear: null, editionDescription: 'Identified original manuscript; undated' };
  b.rights = { workStatus: 'cleared', editionStatus: 'cleared', evidence: ['Companion rights review'], workEvidence: ['Documented permission from author'], editionEvidence: ['Documented permission for exact manuscript'], reviewedBy: 'Rights reviewer', reviewedAt: '2026-10-12' };
  b.verification = { status: 'approved', proofreadAgainstSource: true, reviewedBy: 'Text reviewer', reviewedAt: '2026-10-12' };
  return b;
};
test('separately evidenced, reviewed record passes production metadata gate', () => assert.equal(validateBook(reviewedBook(), { production: true }), true));
test('shared evidence alone cannot clear separate rights review', () => {
  for (const field of ['workEvidence', 'editionEvidence']) {
    const b = reviewedBook(); delete b.rights[field];
    assert.throws(() => validateBook(b), /separate work and edition evidence/);
  }
});
test('reviewer identities and real calendar dates are required for both reviews', () => {
  for (const section of ['rights', 'verification']) {
    for (const [field, value] of [['reviewedBy', ' '], ['reviewedAt', '2026-02-30'], ['reviewedAt', null]]) {
      const b = reviewedBook(); b[section][field] = value;
      assert.throws(() => validateBook(b), /reviewer identities and valid review dates/);
    }
  }
});
test('an approved flag cannot publish unproofread OCR or uncleared edition', () => {
  const b = reviewedBook(); b.verification.proofreadAgainstSource = false;
  assert.throws(() => validateBook(b), /approved proofreading/);
  b.verification.proofreadAgainstSource = true; b.rights.editionStatus = 'unverified';
  assert.throws(() => validateBook(b), /cleared work and edition rights/);
});
test('authentic publication needs a safe source URL and edition identity', () => {
  for (const [field, value] of [['url', 'javascript:alert(1)'], ['url', 'not-a-url'], ['institution', ' '], ['editionDescription', ' '], ['editionYear', -1]]) {
    const b = reviewedBook(); b.source[field] = value;
    assert.throws(() => validateBook(b), /source/);
  }
});
test('demo marker, label, and original rights statuses must agree', () => {
  for (const mutate of [b => { delete b.demo; }, b => { b.description = 'Unlabeled sample'; }, b => { b.rights.workStatus = 'cleared'; }]) {
    const b = structuredClone(demo); mutate(b);
    assert.throws(() => validateBook(b), /demo/);
  }
});
test('empty evidence, invalid identities, and corrupt Unicode fail', () => {
  for (const mutate of [b => { b.rights.evidence = [' ']; }, b => { b.id = '../book'; }, b => { b.slug = 'bad/slug'; }, b => { b.chapters[0].blocks[0].lines[0] = '\uFFFD'; }]) {
    const b = structuredClone(demo); mutate(b);
    assert.throws(() => validateBook(b));
  }
});
const { validateAuthor, validateCatalog } = await import('./validate-content.mjs');
const demoAuthor = JSON.parse(await readFile(new URL('../content/authors/akshara-demo.json', import.meta.url), 'utf8'));
const historicalAuthor = JSON.parse(await readFile(new URL('../content/authors/gangadhar-meher.json', import.meta.url), 'utf8'));
test('verified sourced author profiles and attributed demo catalog pass', () => {
  assert.equal(validateAuthor(historicalAuthor), true);
  assert.equal(validateCatalog([demo], [demoAuthor, historicalAuthor]), true);
});
test('unsourced or unsafe historical author profiles are rejected', () => {
  for (const mutate of [a => { a.sources = []; }, a => { a.verified = false; }, a => { a.sources[0].url = 'javascript:alert(1)'; }]) {
    const a = structuredClone(historicalAuthor); mutate(a);
    assert.throws(() => validateAuthor(a));
  }
});
test('catalog rejects dangling attribution and duplicate author slugs', () => {
  assert.throws(() => validateCatalog([demo], [historicalAuthor]), /unknown author reference/);
  const author = structuredClone(historicalAuthor); author.id = 'different-author';
  assert.throws(() => validateCatalog([], [historicalAuthor, author]), /Duplicate author identity/);
  const b = structuredClone(demo); b.author = 'Misattributed author';
  assert.throws(() => validateCatalog([b], [demoAuthor]), /attribution/);
});
