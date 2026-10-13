# ଅକ୍ଷରଧାରା · Aksharadhara

ଅକ୍ଷରରୁ ଅନନ୍ତ ଯାତ୍ରା…

A completely free, open-source, Odia-first digital library with a poetry-aware reader. This is a clearly labeled demo pilot: all current literary text is original demo content, not historical transcription.

## Develop and verify

Use Node.js 22.17+ and npm. The application now uses Next.js 16 App Router, React 19, TypeScript, and Tailwind 3.

```sh
npm ci
npm run dev                    # http://localhost:3000
npm run check                  # content gate, types, lint, tests, static build
npx playwright install chromium
npm run test:e2e               # built static site on port 4173
npm run preview                # serve out/ locally
```

`npm run build` validates content, exports static HTML into `out/`, and generates the offline cache manifest and per-book JSON. Production needs a static host only. There are no accounts, backend, API endpoints, server actions, or middleware.

## Pilot features

- Home, searchable/filterable books, author pages, source/rights details, and chapter/stanza reader.
- Reader themes, text size, line spacing, width, bookmarks, and stable reading progress.
- IndexedDB state with a version 2 upgrade that preserves existing reader state; selected-book offline downloads and local removal.
- Install manifest, service worker shell, generated book JSON, and storage-error messages.
- Static metadata, sitemap, and canonicals for `https://aksharadhara.org`.
- Feedback drafts that open WhatsApp only when a public maintainer number is configured; the user reviews and sends them.
- Optional manually configured Cloudflare Web Analytics; no beacon on reader, personal library, or feedback pages.

Anek Odia is self-hosted with OFL licensing; bundled Noto Sans Oriya is an optional font collection. Noto Serif Oriya is not bundled. Real Android/iOS shaping and native editorial review remain required.

## Configuration and deployment

Copy `.env.example` to `.env.local` and configure only public values. `NEXT_PUBLIC_FEEDBACK_WHATSAPP_NUMBER` is an international number containing digits only. `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` is an optional public site token. These values are embedded at build time; never place credentials here. Blank values disable the corresponding integration.

See [deployment instructions](docs/DEPLOYMENT.md) for Cloudflare Pages Free, GitHub, custom domain, and HTTPS setup. No public repository or deployment was performed. This managed workspace prevents `.git` writes; repository initialization and remote setup remain external steps. No approval escalation is needed for local implementation.

## Product and rights

[AKSHARA_MASTER_PLAN.md](AKSHARA_MASTER_PLAN.md) remains unchanged as the original product plan. [Architecture](docs/ARCHITECTURE.md) documents the current technical migration and supersedes the plan's older implementation choices. The prior Vite implementation is retained under `archive/vite-prototype/`; it is excluded from active compilation, lint, and tests.

[LICENSE](LICENSE) covers code only. Literary content and font assets have separate licensing: [CONTENT_LICENSES.md](CONTENT_LICENSES.md), [content policy](CONTENT_POLICY.md), and [font attribution](public/fonts/README.md). Authentic literature requires separate work and edition evidence and manual proofreading before publication. See [verification](docs/VERIFICATION.md) for recorded results and remaining release checks.

The final primary-agent run passed 48 unit/content tests, typecheck, lint, static build, and the generated-export audit. Twelve Playwright cases are configured, but browser execution remains blocked by the managed sandbox’s localhost restriction; see docs/VERIFICATION.md.
