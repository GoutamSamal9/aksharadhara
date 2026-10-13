import { notFound } from 'next/navigation';
import { authors, authorBySlug, authorBooks, summary } from '../../../lib/catalog';
import { pageMetadata, personJsonLd } from '../../../lib/seo';
import { Breadcrumbs, JsonLd, BookCard, DemoBadge, Analytics } from '../../../components/Shared';
export const dynamicParams = false;
export function generateStaticParams() { return authors.map(author => ({ slug: author.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const author = authorBySlug((await params).slug); if (!author) notFound();
  return pageMetadata(`/authors/${author.slug}/`, `${author.name} · ${author.nameRomanized}`, author.description ?? `Explore ${author.nameRomanized} in Aksharadhara.`, { noIndex: Boolean(author.demo || !author.verified) });
}
export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const author = authorBySlug((await params).slug); if (!author) notFound();
  const available = authorBooks(author.id).map(summary).filter(book => book.readable);
  return <section className="section page author-detail"><Breadcrumbs items={[{ name: 'ମୁଖ୍ୟ ପୃଷ୍ଠା', path: '/' }, { name: 'ସାହିତ୍ୟିକ', path: '/authors/' }, { name: author.name, path: `/authors/${author.slug}/` }]}/><header className="author-profile"><span className="author-monogram" aria-hidden="true">{author.name.slice(0,1)}<span>❧</span></span><div>{author.demo && <DemoBadge/>}<p className="eyebrow" lang="en">{author.demo ? 'ORIGINAL DEMO IDENTITY' : 'ODIA LITERARY PROFILE'}</p><h1>{author.name}</h1><p lang="en">{author.nameRomanized}</p>{author.period && <p className="muted" lang="en">{author.period}</p>}</div></header><section className="prose"><h2>ପରିଚୟ · <span lang="en">Biography</span></h2><p>{author.description}</p>{author.demo ? <p lang="en">This profile identifies the original interface sample. It does not represent a historical writer.</p> : <><h3>ପରିଚୟର ସୂତ୍ର · <span lang="en">Profile sources</span></h3><ul>{author.sources.map(source => <li key={source.url}><a lang="en" href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a></li>)}</ul></>}</section><section><div className="section-heading"><h2>ଉପଲବ୍ଧ ବହି · <span lang="en">Available books</span></h2><span lang="en">{available.length} readable {available.length === 1 ? 'book' : 'books'}</span></div>{available.length ? <div className="book-grid">{available.map(book => <BookCard key={book.id} book={book}/>)}</div> : <div className="empty-state"><p lang="en">No readable works by this author are available yet. Publication requires review of both work and edition rights and line-by-line proofreading.</p><a className="text-link" href="/feedback/" lang="en">Request a work →</a></div>}</section><JsonLd data={personJsonLd(author)}/>{author.verified && !author.demo && <Analytics/>}</section>;
}
