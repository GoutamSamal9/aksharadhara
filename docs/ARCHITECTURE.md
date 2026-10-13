# Architecture

The active application uses Next.js 16 App Router, React 19, strict TypeScript, and Tailwind 3. It exports static HTML with `output: 'export'`, trailing slashes, and unoptimized images. `out/` is the complete hosting artifact. No request-time backend, server actions, middleware, or API routes are used. Vitest uses automatic JSX compilation; Playwright targets the built static site on port 4173.

This document supersedes the original plan's earlier technical choices without changing that plan. The Vite/React Router prototype is preserved under `archive/vite-prototype/` and excluded from active checks. Vite remains a test-tool dependency only.

## Routes and content

App Router pages cover `/`, `/books/`, `/books/[slug]/`, `/authors/`, `/authors/[slug]/`, `/read/[slug]/`, `/my-library/`, `/offline/`, `/about/`, `/contribute/`, and `/feedback/`. Book and author paths are enumerated at build time. Reader chapter/block selection uses stable IDs in shareable URLs and follows browser back/forward history; invalid locations display a recovery panel without silently overwriting saved progress; unavailable locations render an explanatory state. Native page links give every public destination its own exported HTML. A static 404 page handles unknown paths; do not add an SPA rewrite.

Structured book JSON is rendered as React text with explicit poetry lines and stanza boundaries. Imported HTML never becomes executable markup. Content validation runs before every build and checks provenance, Unicode, IDs, separate rights evidence, and review gates. The current catalog contains clearly labeled original demo text; production rights mode excludes demos. Search uses NFC-normalized text and curated aliases.

## Local state and offline reading

A client reading provider owns preferences, progress, and bookmarks. IndexedDB database `akshara-reader` version 2 preserves the original `state` store and adds the `books` store. State hydration validates stored shapes and bounds. Writes are serialized; failures are visible while in-memory reading continues.

The build creates per-book JSON and an offline manifest. A service worker caches the application shell and caches selected book routes/data on explicit download. IndexedDB records selected downloads. Removal deletes local book storage/cache while retaining reading progress and bookmarks. Quota, eviction, and unavailable worker/storage states must be surfaced; offline status is based on completed local downloads, not a promise of permanent storage. Browser storage may be cleared by the user or platform. Unavailable offline navigation uses an explicit fallback; a fallback redirect is a real HTTP 302 Response, not a fabricated successful page.

## Typography, metadata, and integrations

Noto Serif Oriya and Anek Odia are self-hosted as WOFF2 with `font-display: swap` and complete SIL OFL attribution. All glyphs and retained shaping/variation tables were verified against the original fonts after compression. Noto Sans Oriya is optionally available as an intact TTC collection, whose browser support varies. Compression verification does not replace native-device shaping QA. See `public/fonts/README.md` for actual assets.

Metadata and sitemap use `https://aksharadhara.org` canonicals. Feedback uses a configured public WhatsApp number; no message is sent by the application. Optional Cloudflare analytics uses a manually supplied public token and `spa: false` with native page navigation. Reader, personal library, and feedback routes exclude the beacon. Reading locations, bookmarks, feedback bodies, and other local personal data must never be sent as analytics events. Leaving the token blank disables it.
