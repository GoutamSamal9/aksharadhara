import { test, expect } from '@playwright/test';
test('author navigation, sourced profile and library filters',async({page,isMobile})=>{
  await page.goto('/');
  if(isMobile){await page.getByRole('button',{name:'Open navigation menu'}).click();await page.locator('dialog summary').click();await page.locator('dialog').getByRole('link',{name:/ଗଙ୍ଗାଧର/}).click();}
  else{await page.getByRole('button',{name:/ସାହିତ୍ୟିକ/}).click();await page.locator('#featured-author-menu').getByRole('link',{name:/ଗଙ୍ଗାଧର/}).click();}
  await expect(page).toHaveURL(/authors\/gangadhar-meher/);
  await expect(page.getByRole('heading',{level:1})).toContainText('ଗଙ୍ଗାଧର');
  await expect(page.getByText('0 readable books')).toBeVisible();
  await page.goto('/books/');
  await page.getByRole('searchbox').fill('garden');
  await expect(page.locator('.book-card')).toHaveCount(1);
  await page.getByLabel('ସାହିତ୍ୟିକ · Author').selectOption('gangadhar-meher');
  await expect(page.locator('.book-card')).toHaveCount(0);
});
test('reader controls, bookmarks and actual IndexedDB survive reload',async({page})=>{
  await page.goto('/books/demo-garden/');
  await page.getByRole('link',{name:/Read sample/}).click();
  await expect(page.getByRole('heading',{name:'ସକାଳ · ନମୁନା'})).toBeVisible();
  await expect(page.locator('.verse-line')).toHaveCount(8);
  await page.getByRole('button',{name:/Settings/}).click();
  await page.getByRole('button',{name:/dark/}).click();
  await page.getByLabel('Text size').press('Home');
  for(let i=0;i<12;i++)await page.getByLabel('Text size').press('ArrowRight');
  await page.getByRole('button',{name:/Settings/}).click();
  await page.getByRole('button',{name:'Next chapter'}).click();
  await expect(page.getByRole('heading',{name:'ସନ୍ଧ୍ୟା · ନମୁନା'})).toBeVisible();
  await page.locator('#evening-2').click();
  await page.getByRole('button',{name:/Bookmark/}).click();
  await expect.poll(()=>page.evaluate(async()=>{const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('akshara-reader');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});return new Promise<boolean>(resolve=>{const r=db.transaction('state').objectStore('state').get('reader');r.onsuccess=()=>{db.close();resolve(r.result.bookmarks.some((b:{blockId:string})=>b.blockId==='evening-2'));};});})).toBe(true);
  await page.reload();
  await expect(page.locator('.reader.theme-dark')).toBeVisible();
  await page.getByRole('button',{name:/Contents/}).click();
  await expect(page.getByRole('link',{name:/ପଦ୍ୟ 2/})).toBeVisible();
  await page.goto('/');
  await page.getByRole('link',{name:/Continue reading/}).first().click();
  await expect(page).toHaveURL(/#evening\/evening-2/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('keyboard controls and narrow mobile layout',async({page})=>{
  await page.setViewportSize({width:320,height:700});await page.goto('/');await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:/Skip to content/})).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto('/read/demo-garden/');await expect(page.getByRole('heading',{name:'ସକାଳ · ନମୁନା'})).toBeVisible();await page.locator('#morning-1').focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('heading',{name:'ସନ୍ଧ୍ୟା · ନମୁନା'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('storage failure is visible and reading stays usable',async({page})=>{
  await page.addInitScript(()=>{indexedDB.open=()=>{throw new Error('blocked for test');};});await page.goto('/read/demo-garden/');await expect(page.getByRole('alert')).toContainText(/storage|save/i);await expect(page.getByRole('heading',{name:'ସକାଳ · ନମୁନା'})).toBeVisible();await page.getByRole('button',{name:/Settings/}).click();await page.getByRole('button',{name:/dark/}).click();await expect(page.locator('.reader.theme-dark')).toBeVisible();
});
test('export metadata and sitemap exclude demonstration reader',async({page,request})=>{
  await page.goto('/books/demo-garden/');await expect(page.locator('meta[name=robots]')).toHaveAttribute('content',/noindex/);await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href','https://aksharadhara.org/books/demo-garden/');const sitemap=await(await request.get('/sitemap.xml')).text();expect(sitemap).toContain('https://aksharadhara.org/authors/gangadhar-meher/');expect(sitemap).not.toContain('demo-garden');
});
test('explicit offline download, read and removal',async({page,context})=>{
  await page.goto('/books/demo-garden/');const download=page.getByRole('button',{name:/Download for offline reading/});await expect(download).toBeEnabled({timeout:30000});await download.click();await expect(page.getByText('ବହିଟି ଏହି ଡିଭାଇସରେ ଅଫଲାଇନ୍ ପଢ଼ିବା ପାଇଁ ସଞ୍ଚିତ ହୋଇଛି।')).toBeVisible({timeout:30000});
  await context.setOffline(true);await page.getByRole('link',{name:/Read sample/}).click();await expect(page.getByRole('heading',{name:'ସକାଳ · ନମୁନା'})).toBeVisible();await page.getByRole('button',{name:'Next chapter'}).click();await expect(page.getByRole('heading',{name:'ସନ୍ଧ୍ୟା · ନମୁନା'})).toBeVisible();await page.reload();await expect(page.getByRole('heading',{name:'ସନ୍ଧ୍ୟା · ନମୁନା'})).toBeVisible();
  await page.goto('/my-library/');await page.getByRole('button',{name:/Remove offline copy/}).click();await expect(page.getByText('No books downloaded yet.',{exact:false})).toBeVisible();await page.goto('/read/demo-garden/');await expect(page).toHaveURL(/\/offline\/\?from=/);await expect(page.getByRole('heading',{name:'ଅଫଲାଇନ୍ ପଢ଼ିବା'})).toBeVisible();await context.setOffline(false);
});

test('catalog edits persist URL state across reload and Back/Forward',async({page})=>{
  await page.goto('/books/?q=garden');const search=page.getByRole('searchbox');await expect(search).toHaveValue('garden');await search.fill('zzzz');await expect(page).toHaveURL(/q=zzzz/);await page.reload();await expect(search).toHaveValue('zzzz');await page.getByRole('button',{name:/Clear filters/}).click();await expect(page).toHaveURL(/\/books\/$/);await page.goBack();await expect(search).toHaveValue('zzzz');await page.goForward();await expect(search).toHaveValue('');
  await page.getByLabel('ସାହିତ୍ୟିକ · Author').selectOption('akshara-demo');await page.getByLabel('ବିଭାଗ · Genre').selectOption('poetry');await page.getByLabel('କ୍ରମ · Sort').selectOption('desc');await page.reload();await expect(page.getByLabel('ସାହିତ୍ୟିକ · Author')).toHaveValue('akshara-demo');await expect(page.getByLabel('ବିଭାଗ · Genre')).toHaveValue('poetry');await expect(page.getByLabel('କ୍ରମ · Sort')).toHaveValue('desc');
});
test('invalid reading location does not replace saved progress',async({page})=>{
  await page.goto('/read/demo-garden/#evening/evening-2');await expect(page.getByRole('heading',{name:'ସନ୍ଧ୍ୟା · ନମୁନା'})).toBeVisible();
  const saved=async()=>page.evaluate(async()=>{const db=await new Promise<IDBDatabase>(resolve=>{const request=indexedDB.open('akshara-reader');request.onsuccess=()=>resolve(request.result);});return new Promise<unknown>(resolve=>{const request=db.transaction('state').objectStore('state').get('reader');request.onsuccess=()=>{db.close();resolve(request.result.progress['demo-garden']);};});});await expect.poll(saved).toMatchObject({chapterId:'evening',blockId:'evening-2'});const before=await saved();
  await page.goto('/read/demo-garden/#missing-chapter/missing-stanza');await expect(page.getByRole('heading',{name:'ଏହି ପଢ଼ିବା ସ୍ଥାନ ମିଳିଲା ନାହିଁ'})).toBeVisible();expect(await saved()).toEqual(before);await expect(page.locator('.verse-line')).toHaveCount(0);await page.getByRole('button',{name:/Resume/}).click();await expect(page.getByRole('heading',{name:'ସନ୍ଧ୍ୟା · ନମୁନା'})).toBeVisible();
});
test('fresh uncached offline navigation redirects to a stable shell without hydration errors',async({page,context})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/my-library/');await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);await context.setOffline(true);await page.goto('/read/not-downloaded/');await expect(page).toHaveURL(/\/offline\/\?from=/);await expect(page.getByRole('heading',{name:'ଅଫଲାଇନ୍ ପଢ଼ିବା'})).toBeVisible();await expect(page.locator('.site-header')).toBeVisible();await expect(page.locator('.site-footer')).toBeVisible();expect(errors.filter(e=>/hydration|#418|didn't match|did not match/i.test(e))).toEqual([]);await context.setOffline(false);
});
test('requested viewport widths keep core layouts and breadcrumbs usable',async({page})=>{
  for(const path of ['/','/books/','/feedback/','/read/demo-garden/'])for(const width of [320,375,430,768,1024,1440]){await page.setViewportSize({width,height:900});await page.goto(path);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path+' '+width).toBe(true);}
  for(const path of ['/about/','/contribute/','/offline/']){await page.goto(path);expect(await page.locator('.breadcrumbs ol').evaluate(el=>getComputedStyle(el).listStyleType)).toBe('none');}
});
