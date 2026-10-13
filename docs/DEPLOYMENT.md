# Static deployment

No repository publication or deployment has been performed. Local implementation is authorized; public publication still requires explicit approval. This managed workspace restricts `.git` writes and network access, so Git initialization/remote creation cannot be completed here. Do those steps from a normal authorized terminal/account when publication is approved; do not interpret prepared files as a deployed site.

## Build and inspect

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
npm run preview
```

The build validates content, runs Next.js static export, and generates offline book JSON/cache manifests. Upload `out/`, never `.next/`, `dist/`, or the archived Vite prototype. Each route has static HTML; retain generated `404.html`, sitemap, robots, headers, manifest, service worker, and offline data. There is no Node server, API, server action, middleware, or SPA fallback in production.

## GitHub and Cloudflare Pages Free

Create the intended public GitHub repository only after approval, commit the source/lockfile/license/content evidence, and set `main` as the production branch. Configure branch protection and require the CI job. CI installs dependencies, runs `npm run check` (including build), then runs Chromium Playwright against the production-static server on port 4173.

In Cloudflare Workers & Pages, create a Pages project and connect that repository. Select the static Next.js preset, then override the build command to `npm run build`; set output directory to `out`, root to this project directory, and Node to 22.17+ (for example `NODE_VERSION=22.17.1`). Use Pages Free and verify current quotas before publishing large catalogs. Cloudflare documents `out` for Next.js static exports and supports repository-triggered preview builds. [Official static export deployment guide](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/)

## Public build-time configuration

Configure these public environment variables before building preview/production:

```dotenv
NEXT_PUBLIC_FEEDBACK_WHATSAPP_NUMBER=<international-digits-only-number>
NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=<optional-public-site-token>
```

They are included in public HTML/JavaScript. Never use private credentials, API secrets, or account tokens. Leave values blank to disable those integrations. Confirm the public number belongs to the intended correction/feedback contact. The app opens a WhatsApp draft for the user to review and send; it does not submit feedback itself.

For optional analytics, create a Cloudflare Web Analytics site and select manual installation. Put its public site token in the environment variable and rebuild. Keep automatic Pages analytics injection disabled, since it would bypass route exclusions. The application configures `spa: false` and native page links; it excludes `/read/`, `/my-library/`, and `/feedback/`. Confirm those routes load no beacon, including after navigation and reload. Do not send reading progress/bookmarks or feedback content as events. [Official Web Analytics setup](https://developers.cloudflare.com/web-analytics/get-started/)

## Custom domain and release review

The intended canonical origin is `https://aksharadhara.org`. In the Pages project's Custom domains section, add `aksharadhara.org` and complete Cloudflare's DNS/domain association flow. An apex domain must be a zone on the same Cloudflare account; follow the dashboard's generated DNS steps and wait for activation/certificate issuance. Verify the HTTPS certificate and redirect HTTP to HTTPS, then choose a single canonical host and redirect alternate `www`/pages.dev hosts as appropriate. [Official custom-domain guide](https://developers.cloudflare.com/pages/configuration/custom-domains/)

Verify direct book/author/reader links, unknown-route 404 behavior, canonicals/sitemap, typography, keyboard access, and downloaded-book offline reload/removal on the hosted preview. Keep demo labels visible. Authenticate historical catalog release separately with production rights validation and source proofreading. Native Android/iOS Odia shaping and licensed serif selection remain release checks; Noto Serif Oriya is not bundled.
