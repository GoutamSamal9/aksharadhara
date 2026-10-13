# Final audit verification

The primary agent reviewed the parallel fixes and performed the checks below.

## Automated production checks

- `npm run check`: strict TypeScript, ESLint, 50 Vitest tests, 13 Node content-policy tests, production Next static export, and export audit passed.
- All dynamic author/book/reader routes are static; 14 app HTML documents, 133 script/style references, nine meaningful sitemap URLs, demo exclusions, and 22 selective-shell files were audited.
- Feedback's owner-approved number `917381699797` appears in the production HTML/props; the configured form is enabled. No WhatsApp link exists before user preparation. Tests preserve multiline Odia, punctuation, book names, and references; no actual message was sent.
- Reader regressions cover invalid chapter/stanza/encoding/extra fragments, unchanged saved progress, and explicit Contents/Resume/Start recovery.
- Catalog regressions cover URL hydration/share/reload, query/filter/sort persistence, actual Back/Forward transitions, history state preservation, and clear-all defaults.
- Service-worker tests execute the actual worker source with controlled mock browser/cache/network inputs. They verify uncached navigation produces a 302 to `/offline/?from=...`, then the correct cached shell; downloaded readers remain available, RSC/HTML are separated, and quotas/eviction/removal are handled.
- Parent reran both font compression/verification scripts. Anek retains 714 glyphs, Noto Serif 973; GSUB/GPOS/GDEF and all retained decompressed font tables are preserved (normalized head checksum/WOFF2 flag; Anek DSIG removed). Delivery sizes are 358,868 and 94,748 bytes.

## Chrome verification on the running development app

Chrome reconnected successfully after an earlier transport failure. On `http://localhost:3000`, the primary agent tested homepage, books, reader, feedback, authors directory, an author profile, book detail, and My Library at **320, 375, 430, 768, 1024, 1440 px**: all 48 route/width checks had no horizontal document overflow. These are desktop Chrome viewport checks, not physical-device tests.

- Directly reproduced search `garden` → `zzzz`: URL updated, reload retained the new query, clear removed filters, and Back restored `zzzz`. Author/genre/sort also survived reload.
- Invalid reader link showed the Odia recovery panel, no verse text, and a disabled bookmark control; Resume returned to the saved chapter.
- Reader toolbar touch targets at 320px measured 54–78px wide and 61px high.
- Dark theme survived reload; original sepia preference was restored afterward.
- Skip link received the first keyboard Tab; author dropdown opened with Enter and closed with Escape while restoring focus. Mobile native dialog/author disclosure opened, focus remained inside, and Escape closed it.
- Breadcrumb computed list style was `none` on About, Contribute and Offline.
- Search boundary contrast on the sepia background measured **3.52:1**.
- WhatsApp draft DOM URL used `https://wa.me/917381699797`; multiline Odia and reference fields round-tripped correctly. WhatsApp was not opened, and the draft was cleared by reload.
- No warning/error console entries were observed during these browser checks.

## Explicit limits

`npm run test:e2e` was attempted against a fresh production export but could not start its static server: sandbox `listen EPERM 127.0.0.1:4173`. Therefore production-browser offline hydration, installability and update behavior remain unverified in an actual browser. The mocked service-worker tests and development Chrome checks are not presented as passing production E2E.

Run outside the managed sandbox:

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
```

Real Android/iOS Odia shaping, conjunct/matra editorial review, and production offline checks remain release requirements. Historical texts remain unpublished until source/rights/proofreading approval. No Cloudflare deployment was performed.

## Git and publication status

The workspace has no existing Git history, and `.git` creation here is denied by its permission profile. A separate temporary Git checkpoint preserves the pre-polish source (`c79c6ad`), and the polished source is committed there after validation. Local environment files and generated artifacts are excluded; only the explicitly public `.env.production` and example are included.

GitHub SSH inspection/fetch/push is blocked by `Could not resolve hostname github.com`. Remote history could not be fetched or reconciled. No force-push or remote history replacement was attempted. Repository: https://github.com/GoutamSamal9/aksharadhara .
