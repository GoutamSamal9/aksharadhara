import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { validateBook } from './validate-content.mjs';
await mkdir('public/content/books',{recursive:true});
for(const file of await readdir('content/books')){
  if(!file.endsWith('.json'))continue;
  const book=JSON.parse(await readFile(`content/books/${file}`,'utf8'));
  validateBook(book);
  await writeFile(`public/content/books/${book.slug}.json`,JSON.stringify(book));
}
console.log('Exported validated per-book payloads; downloaded only on reader request.');
