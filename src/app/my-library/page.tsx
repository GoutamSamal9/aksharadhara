import { ContinueReading, LocalBookmarks } from '../../components/LocalReading';
import { OfflineManager } from '../../components/OfflineManager';
import { Breadcrumbs } from '../../components/Shared';
import { books, summary } from '../../lib/catalog';
import { pageMetadata } from '../../lib/seo';
export const metadata=pageMetadata('/my-library/','ମୋ ପାଠାଗାର · My library','Your local reading places, bookmarks, and selected offline books. No account or server storage.',{noIndex:true});
export default function MyLibrary(){const catalog=books.map(summary);return <div className="section page"><Breadcrumbs items={[{name:'ମୁଖ୍ୟ ପୃଷ୍ଠା',path:'/'},{name:'ମୋ ପାଠାଗାର',path:'/my-library/'}]}/><p className="eyebrow" lang="en">YOUR WORDS. YOUR PACE.</p><h1>ମୋ ପାଠାଗାର</h1><p className="page-intro">ଆପଣଙ୍କ ସଞ୍ଚିତ ସ୍ଥାନ ଓ ଅଫଲାଇନ୍ ବହି ଏଠାରେ ରହିବ।<br/><span lang="en">Saved only on this device. No account needed.</span></p><ContinueReading books={catalog}/><div className="local-library-grid"><LocalBookmarks books={catalog}/><OfflineManager/></div><p className="privacy-note" lang="en">Browser storage may be cleared or evicted. Offline books and reading state are local to this browser; they are not backed up to a server.</p><a className="text-link" href="/books/">ବହି ଦେଖନ୍ତୁ →</a></div>;}
