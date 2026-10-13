'use client';
import { useEffect, useState } from 'react';
import { useReading } from './ReadingProvider';
import type { Book, BookSummary } from '../types';
function Label({ odia, english }: { odia: string; english: string }) { return <>{odia} <span lang="en">{english}</span></>; }
export function OfflineManager({ book }: { book?: Book | BookSummary }) {
  const { offlineBooks, offlineReady, ready, downloadBook, removeBook } = useReading();
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [failure, setFailure] = useState('');
  const [supported, setSupported] = useState(true);
  const [storage, setStorage] = useState<StorageEstimate | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'caches' in window);
    // Read this only after hydration; the static offline shell has no request-specific props.
    const requested = new URLSearchParams(window.location.search).get('from');
    setUnavailable(Boolean(requested?.startsWith('/') && !requested.startsWith('//')));
    let active = true;
    navigator.storage?.estimate?.().then(value => { if (active) setStorage(value); }).catch(() => undefined);
    return () => { active = false; };
  }, [offlineBooks]);
  const act = async (slug: string, operation: () => Promise<void>, message: string) => {
    setBusy(slug); setFailure(''); setNotice('');
    try { await operation(); setNotice(message); } catch (error) { setFailure(error instanceof Error ? error.message : 'Offline storage failed. Please check your connection and available storage.'); } finally { setBusy(''); }
  };
  const downloaded = book && offlineBooks.some(item => item.slug === book.slug);
  const removed = 'ଅଫଲାଇନ୍ ପ୍ରତିଲିପି ହଟାଯାଇଛି। ପଢ଼ିବା ସ୍ଥାନ ଓ ସଞ୍ଚିତ ସ୍ଥାନ ରହିଛି।';
  const repaired = 'ଅଫଲାଇନ୍ ପ୍ରତିଲିପି ଯାଞ୍ଚ ହୋଇଛି; ଆବଶ୍ୟକ ଥିଲେ ପୁଣି ସଞ୍ଚିତ ହୋଇଛି।';
  const removeLabel = <Label odia="ଅଫଲାଇନ୍ ପ୍ରତିଲିପି ହଟାନ୍ତୁ" english="Remove offline copy"/>;
  const repairLabel = <Label odia="ଅଫଲାଇନ୍ ପ୍ରତିଲିପି ଯାଞ୍ଚ କରନ୍ତୁ" english="Repair offline copy"/>;
  return <section aria-label={book ? 'ଅଫଲାଇନ୍ ବହି' : 'ଏହି ଡିଭାଇସରେ ସଞ୍ଚିତ ବହି'}>
    {!book && unavailable && <p role="status">ଆପଣ ଚାହିଁଥିବା ପୃଷ୍ଠା ଏହି ଡିଭାଇସରେ ସଞ୍ଚିତ ନାହିଁ। ତଳେ ଥିବା ସଞ୍ଚିତ ବହି ପଢ଼ନ୍ତୁ, କିମ୍ବା ଇଣ୍ଟରନେଟ୍ ସଂଯୋଗ ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ। <span lang="en">The requested page is not available offline. Open a downloaded book or reconnect.</span></p>}
    {book ? <button className="button" disabled={!ready || !offlineReady || Boolean(busy)} onClick={() => act(book.slug, () => downloaded ? removeBook(book.slug) : downloadBook(book), downloaded ? removed : 'ବହିଟି ଏହି ଡିଭାଇସରେ ଅଫଲାଇନ୍ ପଢ଼ିବା ପାଇଁ ସଞ୍ଚିତ ହୋଇଛି।')}>{busy ? <Label odia="କାମ ଚାଲିଛି…" english="Working…"/> : downloaded ? removeLabel : <Label odia="ଅଫଲାଇନ୍ ପଢ଼ିବା ପାଇଁ ସଞ୍ଚୟ କରନ୍ତୁ" english="Download for offline reading"/>}</button> : <>
      <h2>ଏହି ଡିଭାଇସରେ ଥିବା ବହି <span lang="en">Books on this device</span></h2>
      {!ready ? <p role="status"><Label odia="ସଞ୍ଚିତ ବହି ଖୋଲୁଛି…" english="Loading downloaded books…"/></p> : offlineBooks.length ? <ul className="offline-books">{offlineBooks.map(item => <li key={item.slug}><a href={`/read/${item.slug}/`}>{item.title}</a><button disabled={!offlineReady || Boolean(busy)} onClick={() => act(item.slug, () => removeBook(item.slug), removed)}>{busy === item.slug ? <Label odia="କାମ ଚାଲିଛି…" english="Working…"/> : removeLabel}</button><button disabled={!offlineReady || Boolean(busy)} onClick={() => act(item.slug, () => downloadBook(item.book), repaired)}>{repairLabel}</button></li>)}</ul> : <p>ଏଯାଏଁ କୌଣସି ବହି ସଞ୍ଚିତ ହୋଇନାହିଁ। ବହି ଖୋଲି ଅଫଲାଇନ୍ ପଢ଼ିବା ପାଇଁ ସଞ୍ଚୟ କରନ୍ତୁ। <span lang="en">No books downloaded yet. Open a book and choose its offline download.</span></p>}
      <p>ଆପଣ ବାଛିଥିବା ବହି ହିଁ ସଞ୍ଚିତ ହୁଏ। ପଢ଼ିବା ସ୍ଥାନ ଓ ସଞ୍ଚିତ ସ୍ଥାନ ଏହି ଡିଭାଇସରେ ରହେ। ବ୍ରାଉଜର୍‌ର ତଥ୍ୟ ହଟାଇଲେ ସେଗୁଡ଼ିକ ହଟିଯିବ; ବ୍ରାଉଜର୍ ମଧ୍ୟ ସଞ୍ଚିତ ଅଫଲାଇନ୍ ତଥ୍ୟ ହଟାଇପାରେ। <span lang="en">Only selected books are downloaded. Browser storage may be cleared or evicted.</span></p>
    </>}
    {book && downloaded && <button disabled={!offlineReady || Boolean(busy)} onClick={() => act(book.slug, () => downloadBook(book), repaired)}>{repairLabel}</button>}
    {!supported ? <p className="muted">ଏହି ବ୍ରାଉଜର୍‌ରେ ଅଫଲାଇନ୍ ସଞ୍ଚୟ ଉପଲବ୍ଧ ନାହିଁ। ଇଣ୍ଟରନେଟ୍ ସଂଯୋଗରେ ପଢ଼ିପାରିବେ। <span lang="en">Offline downloads need a supported browser and HTTPS or localhost.</span></p> : !offlineReady && <p className="muted">ଅଫଲାଇନ୍ ପଢ଼ିବା ପ୍ରସ୍ତୁତ ହେଉଛି। ଟିକେ ଅପେକ୍ଷା କରନ୍ତୁ। <span lang="en">Offline support is preparing on this device.</span></p>}
    {storage && typeof storage.usage === 'number' && typeof storage.quota === 'number' && <p className="muted">ଏହି ସାଇଟ୍‌ର ସଞ୍ଚୟ: {(storage.usage / 1048576).toFixed(1)} MB ବ୍ୟବହୃତ / {(storage.quota / 1048576).toFixed(1)} MB ସୀମା। <span lang="en">Site storage usage / quota.</span></p>}
    {notice && <p role="status">{notice}</p>}{failure && <p role="alert">ଅଫଲାଇନ୍ ସଞ୍ଚୟ ସଫଳ ହେଲା ନାହିଁ। ସଂଯୋଗ ଓ ଖାଲି ସ୍ଥାନ ଯାଞ୍ଚ କରନ୍ତୁ। <span lang="en">{failure}</span></p>}
  </section>;
}
export default OfflineManager;
