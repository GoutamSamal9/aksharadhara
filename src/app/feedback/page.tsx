import { FeedbackForm } from '../../components/FeedbackForm';
import { Breadcrumbs } from '../../components/Shared';
import { books, summary } from '../../lib/catalog';
import { pageMetadata } from '../../lib/seo';
export const metadata=pageMetadata('/feedback/','ମତାମତ · Feedback','ବହି ପାଇଁ ଅନୁରୋଧ, ପାଠ୍ୟ ସଂଶୋଧନ ବା ପରାମର୍ଶ ପ୍ରସ୍ତୁତ କରନ୍ତୁ। Prepare feedback for the Aksharadhara maintainer through WhatsApp.');
export default function Feedback(){return <div className="page section"><Breadcrumbs items={[{name:'ମୁଖ୍ୟ ପୃଷ୍ଠା',path:'/'},{name:'ମତାମତ',path:'/feedback/'}]}/><div className="feedback-layout"><div className="feedback-intro"><p className="eyebrow">EVERY READER HAS A VOICE</p><h1>ଆପଣଙ୍କ କଥା<br/><em>ଆମକୁ କହନ୍ତୁ।</em></h1><p>ଏକ ନୂଆ ବହି, ଏକ ସଂଶୋଧନ, ଏକ ନୂଆ ଧାରଣା—ଆମେ ଆପଣଙ୍କ କଥା ଶୁଣିବାକୁ ଚାହୁଁ।</p><p className="muted">Prepare your feedback here, then open WhatsApp. You decide when to press Send.</p><div className="feedback-flourish" aria-hidden="true">❧</div></div><FeedbackForm books={books.map(summary)} number={process.env.NEXT_PUBLIC_FEEDBACK_WHATSAPP_NUMBER??''}/></div></div>;}
