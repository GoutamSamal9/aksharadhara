import demo from '../../content/books/demo-garden.json';
import gangadhar from '../../content/authors/gangadhar-meher.json';
import fakir from '../../content/authors/fakir-mohan-senapati.json';
import bhima from '../../content/authors/bhima-bhoi.json';
import sample from '../../content/authors/akshara-demo.json';
import type { Author, Book, BookSummary } from '../types';
export const authors: Author[] = [gangadhar, fakir, bhima, sample] as Author[];
export const books: Book[] = [demo as Book];
export const genres = [ {id:'poetry',name:'କବିତା',english:'Poetry'}, {id:'novels',name:'ଉପନ୍ୟାସ',english:'Novels'}, {id:'short-stories',name:'କ୍ଷୁଦ୍ରଗଳ୍ପ',english:'Short stories'}, {id:'devotional',name:'ଭକ୍ତି ସାହିତ୍ୟ',english:'Devotional literature'}, {id:'essays',name:'ପ୍ରବନ୍ଧ',english:'Essays'} ];
export function isReadable(book: Book): boolean { return book.chapters.length > 0 && (book.demo ? book.verification.status === 'demo' && book.rights.workStatus === 'demo-original' && book.rights.editionStatus === 'demo-original' : book.verification.status === 'approved' && book.verification.proofreadAgainstSource && book.rights.workStatus === 'cleared' && book.rights.editionStatus === 'cleared' && Boolean(book.rights.workEvidence?.length && book.rights.editionEvidence?.length && book.rights.reviewedBy && book.rights.reviewedAt && book.verification.reviewedBy && book.verification.reviewedAt)); }
export function summary(book: Book): BookSummary { const { chapters, ...metadata } = book; return { ...metadata, chapterCount: chapters.length, readable: isReadable(book) }; }
export function bookBySlug(slug: string) { return books.find(b => b.slug === slug); }
export function authorBySlug(slug: string) { return authors.find(a => a.slug === slug); }
export function authorBooks(id: string) { return books.filter(b => b.authorId === id); }
