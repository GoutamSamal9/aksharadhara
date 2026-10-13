# Static deployment

The user has authorized pushing this project to [GoutamSamal9/aksharadhara](https://github.com/GoutamSamal9/aksharadhara). No successful push or deployment has been performed. The workspace has no `.git` directory; managed permissions rejected Git initialization and GitHub DNS access is blocked. A separate temporary checkpoint `c79c6ad` preserves the audit baseline at `/private/tmp/aksharadhara-audit-checkpoint/repository`; it is not a reconciled clone of the public repository. Complete the workflow below from an authorized terminal with GitHub access. Deployment remains unauthorized and must not follow automatically from a push.

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

Use the existing intended repository `https://github.com/GoutamSamal9/aksharadhara` and SSH origin `git@github.com:GoutamSamal9/aksharadhara.git`. Preserve its existing history. Configure branch protection and require the CI job. CI installs dependencies, runs `npm run check` (including build), then runs Chromium Playwright against the production-static server on port 4173.

In Cloudflare Workers & Pages, create a Pages project and connect that repository. Select the static Next.js preset, then override the build command to `npm run build`; set output directory to `out`, root to this project directory, and Node to 22.17+ (for example `NODE_VERSION=22.17.1`). Use Pages Free and verify current quotas before publishing large catalogs. Cloudflare documents `out` for Next.js static exports and supports repository-triggered preview builds. [Official static export deployment guide](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/)

## Public build-time configuration

Configure these public environment variables before building preview/production:

```dotenv
NEXT_PUBLIC_FEEDBACK_WHATSAPP_NUMBER=917381699797
NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=<optional-public-site-token>
```

They are included in public HTML/JavaScript. Never use private credentials, API secrets, or account tokens. Leave values blank to disable those integrations. Confirm the public number belongs to the intended correction/feedback contact. The app opens a WhatsApp draft for the user to review and send; it does not submit feedback itself.

For optional analytics, create a Cloudflare Web Analytics site and select manual installation. Put its public site token in the environment variable and rebuild. Keep automatic Pages analytics injection disabled, since it would bypass route exclusions. The application configures `spa: false` and native page links; it excludes `/read/`, `/my-library/`, and `/feedback/`. Confirm those routes load no beacon, including after navigation and reload. Do not send reading progress/bookmarks or feedback content as events. [Official Web Analytics setup](https://developers.cloudflare.com/web-analytics/get-started/)

## Custom domain and release review

The intended canonical origin is `https://aksharadhara.org`. In the Pages project's Custom domains section, add `aksharadhara.org` and complete Cloudflare's DNS/domain association flow. An apex domain must be a zone on the same Cloudflare account; follow the dashboard's generated DNS steps and wait for activation/certificate issuance. Verify the HTTPS certificate and redirect HTTP to HTTPS, then choose a single canonical host and redirect alternate `www`/pages.dev hosts as appropriate. [Official custom-domain guide](https://developers.cloudflare.com/pages/configuration/custom-domains/)

Verify direct book/author/reader links, unknown-route 404 behavior, canonicals/sitemap, typography, keyboard access, and downloaded-book offline reload/removal on the hosted preview. Keep demo labels visible. Authenticate historical catalog release separately with production rights validation and source proofreading. Native Android/iOS Odia shaping and licensed serif selection remain release checks; Noto Serif Oriya and Anek Odia WOFF2 are bundled with complete OFL licensing and data-preservation verification; this does not establish physical-device rendering.


## Authorized repository push: preserve remote history

Run from the workspace in a normal terminal. Inspect status and intended changes before committing. Do not stage `.env.local`, credentials, generated `out/`/`.next/`, or the unrelated user-supplied font ZIP. `.env.production` is intentionally tracked and must contain only the public feedback number.

```sh
cd /path/to/aksharadhara
# Only if the workspace still has no Git metadata:
if [ ! -d .git ]; then git init -b main; fi
git status --short
git remote -v
# Add this remote only if origin does not exist:
git remote add origin git@github.com:GoutamSamal9/aksharadhara.git
# If origin already exists, inspect it and reconcile the intended destination first.
git fetch origin
git branch -a
git log --oneline --all --decorate -20
```

If the remote contains commits, inspect its files/history before selecting a base. Prefer cloning it into a separate directory, creating a working branch from `origin/main`, and copying the reviewed local source changes onto that branch. Preserve remote-only files and resolve conflicts explicitly. Never force-push, reset away existing commits, or blindly merge unrelated roots. If the remote is empty, commit the reviewed local source on `main`. Run `npm run check` and supported E2E checks on the reconciled result, review the diff and staged paths, commit, and push the resulting branch normally. If using a review branch, open a PR against `main`; do not silently overwrite it.

A failed fetch is not permission to assume an empty remote. Repository publishing is already authorized; this workflow does not require a new approval request. Cloudflare deployment and domain changes are separate and remain pending explicit authorization.
