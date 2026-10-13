import { notFound } from 'next/navigation';
import Reader from '../../../components/Reader';
import { books, bookBySlug, isReadable } from '../../../lib/catalog';
import { pageMetadata } from '../../../lib/seo';

export const dynamicParams = false;
export function generateStaticParams() { return books.filter(isReadable).map(book => ({ slug: book.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = bookBySlug(slug);
  if (!book || !isReadable(book)) notFound();
  return pageMetadata(`/read/${slug}/`, `${book.title} — ପଢ଼ନ୍ତୁ`, book.description, { noIndex: book.demo });
}
export default async function ReadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = bookBySlug(slug);
  if (!book || !isReadable(book)) notFound();
  return <Reader book={book}/>;
}
