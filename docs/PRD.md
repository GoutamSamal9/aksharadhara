# Product requirements

The original source of truth is [AKSHARA_MASTER_PLAN.md](../AKSHARA_MASTER_PLAN.md). Akshara provides free, Odia-first, text-native reading for affordable phones and unreliable networks. The original plan stays unchanged; current Next.js static implementation details are in [ARCHITECTURE.md](ARCHITECTURE.md).

The pilot must offer labeled demo discovery, searchable/filterable books and authors, rights/provenance details, and a poetry-aware reader preserving exact lines, stanza boundaries, and stable IDs. Settings, progress, bookmarks, and selected offline downloads stay on the reader's device. Upgrades preserve existing reader state. Downloads are explicit and locally removable, with honest storage/error status.

Every exported public route must load directly from static hosting. Unknown paths must return the static unavailable page. The app remains account-free and has no backend, server actions, API endpoints, or middleware. Canonicals/sitemap use `https://aksharadhara.org`. Feedback is a user-reviewed WhatsApp draft with an optional configured public number. Optional manual-token analytics excludes reader, personal library, and feedback; it must not send private local data.

Acceptance includes discovery navigation/search, chapter and stanza selection, reader settings, bookmark/reload/resume, intact poetry lines, local storage migration, explicit download/offline reload/removal, storage failures, direct-route loading, keyboard access, and usable 320px layouts. Verify with `npm run check` and production-static Playwright tests where supported, then real-device Odia typography/editorial review. Anek Odia is licensed and self-hosted; Noto Serif Oriya is not bundled.

No authentic historical text can ship until work and edition rights are separately evidenced and manual source comparison is approved. No deployment or public publication occurs without explicit user approval.
