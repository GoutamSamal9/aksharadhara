import { OfflineManager } from '../../components/OfflineManager';
import { Breadcrumbs } from '../../components/Shared';
import { pageMetadata } from '../../lib/seo';
export const metadata=pageMetadata('/offline/','ଅଫଲାଇନ୍ ପଢ଼ିବା · Offline reading','Open or manage books selected for offline reading on this device.',{noIndex:true});
export default function Offline(){return <div className="section page prose"><Breadcrumbs items={[{name:'ମୁଖ୍ୟ ପୃଷ୍ଠା',path:'/'},{name:'ଅଫଲାଇନ୍',path:'/offline/'}]}/><p className="eyebrow">A PAGE, EVEN WITHOUT A CONNECTION</p><h1>ଅଫଲାଇନ୍ ପଢ଼ିବା</h1><p>You can open books downloaded on this device. Other pages and books require a connection. Select a book’s offline download while online first.</p><OfflineManager/><a className="text-link" href="/my-library/">ମୋ ପାଠାଗାର →</a></div>;}
