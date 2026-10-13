import { authors, books, summary } from '../../lib/catalog';
import { pageMetadata } from '../../lib/seo';
import { Breadcrumbs, Analytics } from '../../components/Shared';
import { BookBrowser } from '../../components/CatalogBrowser';
export const metadata = pageMetadata('/books/', 'ଓଡ଼ିଆ ବହି · Odia books', 'Browse Odia book metadata by title, author and genre. Original demonstration text is clearly labeled.');
export default function BooksPage() {
  return <section className="section page"><Breadcrumbs items={[{ name: 'ମୁଖ୍ୟ ପୃଷ୍ଠା', path: '/' }, { name: 'ବହି', path: '/books/' }]}/><p className="eyebrow" lang="en">FIND YOUR NEXT PAGE</p><h1>ବହି ପାଠାଗାର</h1><p className="page-intro">ବହି, ଲେଖକ ଓ ସାହିତ୍ୟ ବିଭାଗ ଖୋଜନ୍ତୁ।</p><p className="muted" lang="en">This library currently contains one original demo. Historical works will appear after rights and proofreading review.</p><BookBrowser books={books.map(summary)} authors={authors}/><Analytics/></section>;
}
