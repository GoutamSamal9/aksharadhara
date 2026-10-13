# Primary-agent verification — Next.js migration

The primary agent reviewed the parallel changes and executed the final checks itself.

- Content validation: author sources/relationships, stable identifiers, text structure, separate work/edition rights and reviewers.
- TypeScript strict typecheck and ESLint: passed.
- Vitest: 35 tests passed across reader, persistence, navigation, catalog relationships/search, WhatsApp, SEO, and service-worker/offline behavior.
- Node content-gate tests: 13 passed.
- Next.js production build: passed; dynamic author/book/reader routes were generated as static HTML in `out/`.
- Export audit: passed for 14 app HTML routes, unique metadata/canonicals/social cards, 131 internal script/style references, nine sitemap URLs, noindex demo/private pages, 21 shell files with no book documents/text, book JSON and PWA icons.
- Playwright collection: all 12 desktop/mobile cases discovered. Execution was attempted but blocked before any browser cases ran: the sandbox denied listening on `127.0.0.1:4173` (`EPERM`). This is not a passing E2E result.

No browser rendering, real-device shaping, installability, or physical Android/iOS offline behavior is claimed as verified. File-preview browser workarounds were not attempted; prior browser policy rejected local file URLs. Service-worker tests execute the actual worker source in a mocked browser/cache environment, and are distinct from real browser E2E.

From a normal development terminal:

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
npm run preview
```

Review the exported pages at 320/360px and desktop widths, Odia shaping on Android/iOS, keyboard/mobile navigation, reload/resume, range controls, downloaded-book offline reload/removal, service-worker updates, and quota/private-browsing failure messages. CI is configured for the production-static browser suite; no remote CI run exists until GitHub is configured.

Public WhatsApp number and optional Cloudflare Analytics token are intentionally unset. Git/public repository, domain configuration, and deployment are pending; no deployment was performed. Noto Serif Oriya is not bundled because downloads were blocked; self-hosted licensed Anek Odia plus native serif fallbacks are present.
