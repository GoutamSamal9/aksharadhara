import { authors, books, summary } from '../../lib/catalog';
import { pageMetadata } from '../../lib/seo';
import { Breadcrumbs, Analytics } from '../../components/Shared';
import { AuthorBrowser } from '../../components/CatalogBrowser';
export const metadata = pageMetadata('/authors/', 'ଓଡ଼ିଆ ସାହିତ୍ୟିକ · Odia authors', 'Discover sourced profiles of Odia writers and the books currently available in Aksharadhara.');
export default function AuthorsPage() {
  return <section className="section page"><Breadcrumbs items={[{ name: 'ମୁଖ୍ୟ ପୃଷ୍ଠା', path: '/' }, { name: 'ସାହିତ୍ୟିକ', path: '/authors/' }]}/><p className="eyebrow" lang="en">THE VOICES OF ODIA LITERATURE</p><h1>ସାହିତ୍ୟିକ</h1><p className="page-intro">ଓଡ଼ିଆ ସାହିତ୍ୟର ସ୍ରଷ୍ଟାଙ୍କ ପରିଚୟ।</p><p className="muted" lang="en">Historical profiles cite their sources. Readable book counts reflect this library; no historical text is available yet.</p><AuthorBrowser authors={authors} books={books.map(summary)}/><Analytics/></section>;
}
