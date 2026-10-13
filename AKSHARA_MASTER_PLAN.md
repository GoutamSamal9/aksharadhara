# AKSHARA — Open-Source Odia Digital Library

**Status:** Implementation blueprint (October 2026)  
**Mission:** Preserve and make legally shareable Odia literature freely accessible through a beautiful, accessible, Kindle-like reading experience.  
**Working name:** ଅକ୍ଷର (Akshara)  
**Primary language:** Odia; English can be used for developer documentation and optional interface translation.

## 1. Product principles

1. **Free to read, open-source to build.** No paywall, advertising requirement, or account requirement in V1.
2. **Text-native first.** Reflowable Unicode Odia text, not merely an embedded PDF viewer.
3. **Faithful to the source.** Preserve original spelling, verse lines, stanza breaks, punctuation and attribution; identify editorial corrections.
4. **Rights-first publishing.** Archive availability is not redistribution permission. Verify the underlying work *and* the specific edition, transcription, images, introductions, annotations and translations.
5. **Accessible, mobile-first, low-bandwidth.** Readers on affordable phones and unreliable networks are first-class users.
6. **No unnecessary infrastructure.** Static hosting, local storage and Git-based content contributions in V1.
7. **Community stewardship.** Transparent provenance, corrections, contributions and review.

## 2. Intended readers and journeys

- A reader discovers an Odia poet, selects a work and reads with adjustable text size, spacing and colors.
- A returning reader continues from the last chapter or verse, without an account.
- A reader downloads an approved book for offline reading and manages offline storage.
- A contributor proposes a public-domain work or corrects a transcription through a GitHub pull request.
- A reviewer checks a book's rights and transcribed text against the original scan before publication.

## 3. V1 scope

### Must-have

- Odia-first homepage, book grid, author and book detail pages, categories and metadata search.
- Reader with light, sepia and dark themes; adjustable font size and line spacing; responsive layout.
- Table of contents, previous/next chapter, location-based reading progress, bookmarks and continue reading.
- Poetry-aware rendering that preserves verse/stanza line breaks and handles long lines gracefully.
- Search by Odia title/author and common Romanized aliases, where curated.
- IndexedDB persistence for preferences, progress, bookmarks and selectively downloaded books.
- Installable PWA, offline shell, explicit per-book offline download and deletion.
- Source citations, publication/edition details, rights status and verification state on book pages.
- Accessible keyboard controls, touch targets, contrast, semantic headings and screen-reader labels.
- Responsive layouts for Android, iOS and desktop; no login.
- Tests, documentation, CI and free static hosting.

### Explicitly out of scope for V1

- User accounts, cross-device sync, server/database, payments, social features, AI-generated translations, community uploads directly to production, native mobile apps, automatic publication of OCR output, full-text global search across a massive catalog.

### Later versions

- Full-text search with a generated static index; in-reader text search and highlights/notes.
- Optional source-scan side-by-side view and page-to-text alignment.
- EPUB import/export where permitted, contributor dashboard, moderated correction workflows.
- Optional user sync only if there is demonstrated need and a sustainable free solution.

## 4. Recommended stack

| Area | Choice | Notes |
|---|---|---|
| Frontend | React 19, TypeScript, Vite | Confirm compatible stable versions at setup |
| Styles | Tailwind CSS | Small, consistent design system |
| Routing | React Router | Library, book, author and reader routes |
| State | Zustand only if needed | Keep server/content state separate |
| Reading content | Validated structured JSON/HTML | Sanitize any imported markup; never execute content scripts |
| Local persistence | IndexedDB (e.g. `idb`) | Versioned schema; fallback messaging for private browsing |
| Offline | Vite PWA / Workbox | Precache shell; cache books only on request |
| Search V1 | Client-side catalog search | Normalize Unicode, curated aliases; avoid unreliable automatic transliteration |
| Reference scans | PDF.js later/optional | Do not confuse scans with reader text |
| Tests | Vitest, React Testing Library, Playwright | Mobile and Odia-specific cases |
| Hosting | Cloudflare Pages Free | GitHub-connected static deployment |
| Source control | Public GitHub repository | CI, issues, pull requests |

Avoid a backend, hosted DB, paid OCR, paid storage or authentication for the first release. Confirm current Cloudflare plan quotas before launch; free tiers and file limits can change. Large scans should not be bundled into the frontend.

## 5. System architecture

```text
GitHub public repository
  ├─ React/Vite source + tests + docs
  ├─ verified catalog and structured books
  └─ contribution / editorial workflow
                 │ CI build & checks
                 ▼
       Cloudflare Pages (static site)
                 │ HTTPS
                 ▼
      Browser / installable Akshara PWA
        ├─ Library / author / book discovery
        ├─ Kindle-like Odia text reader
        ├─ Catalog search
        ├─ Offline book manager
        └─ IndexedDB (progress, bookmarks,
                     preferences, offline books)

Source PDF / archive / manuscript
  → rights review → extraction / OCR if necessary
  → manual proofreading → structured chapters/verses
  → schema + quality validation → reviewed PR → publication
```

## 6. Information architecture and routes

| Route | Purpose |
|---|---|
| `/` | Discover, featured works, continue reading |
| `/books` | Search and filter catalog |
| `/books/:slug` | Book description, author, source, edition, rights, read/download |
| `/authors` | Author directory |
| `/authors/:slug` | Biography with sources, works |
| `/read/:slug/:chapterId?` | Reader and table of contents |
| `/offline` | Manage downloaded books and storage |
| `/about` | Mission, open-source project and legal notices |
| `/contribute` | How to propose books and corrections |

Use stable IDs for books, chapters and verses; slugs are for readable URLs only.

## 7. Reading UX and design

**Visual direction:** Calm, literary, premium but simple. Warm paper/sepia as the default; light and dark alternatives. Odia-serif reading typography, sans-serif navigation, comfortable margins and generous whitespace. Do not mimic proprietary Kindle branding.

- Reader toolbar hides or becomes minimal while reading, but remains accessible.
- Adjustable font size (sensible min/max), line height, margins and theme.
- Chapters or anchored verses are the canonical reading positions; avoid relying only on pixel scroll offsets.
- Poetry is rendered with explicit verse and stanza semantics. Respect authorial line breaks even on narrow screens; support careful wrap/overflow behavior.
- Navigation via clear next/previous controls and optional keyboard arrows; avoid swipe gestures that interfere with scrolling.
- Bookmarks and progress save automatically, with confirmation when needed.
- A visible table of contents and progress indicator; progress based on stable chapter/verse positions, not a fabricated source-page count.
- Support copying/selecting text when rights permit; accessible focus and reduced-motion settings.
- Test Noto Serif Oriya / Noto Sans Oriya rendering, conjuncts, matras and punctuation on real Android devices.
- Bundle fonts only with a valid redistribution license and retain required notices; alternatively use permitted hosted fonts.

## 8. Book data model (example, NOT a historical transcription)

```json
{
  "id": "book-example-001",
  "slug": "example-book",
  "title": "ନମୁନା ବହି",
  "titleRomanized": "Namuna Bahi",
  "authorId": "author-example",
  "language": "or",
  "genres": ["poetry"],
  "source": {
    "url": "https://example.org/source-record",
    "institution": "Example source",
    "editionYear": null,
    "pageReferencesAvailable": false
  },
  "rights": {
    "workStatus": "unverified",
    "editionStatus": "unverified",
    "evidence": [],
    "reviewedBy": null,
    "reviewedAt": null
  },
  "verification": {
    "status": "draft",
    "proofreadAgainstSource": false,
    "reviewedBy": null
  },
  "chapters": [
    {
      "id": "chapter-1",
      "title": "ପ୍ରଥମ ଅଧ୍ୟାୟ",
      "blocks": [
        {
          "id": "verse-1",
          "type": "verse",
          "lines": ["ଏହା ନମୁନା ପାଠ୍ୟ।", "ଏହା ମୂଳ କବିତା ନୁହେଁ।"],
          "sourcePage": null
        }
      ]
    }
  ]
}
```

**Publishing gate:** `rights.workStatus` and the edition/content rights must be cleared with evidence, and `verification.status` must be `approved` with proofreading complete. Unverified drafts are excluded from production catalog and downloads. The example above must never be published as an authentic work.

## 9. Rights and editorial policy

- Indian literary copyright generally lasts for the author's lifetime plus 60 years, calculated from the beginning of the calendar year following death; verify the applicable law and special cases before publication.
- An old public-domain *work* does not automatically clear a modern translation, annotated edition, introduction, cover, photograph or typesetting-related material.
- An Internet Archive page or downloadable PDF is not itself a grant of republication rights.
- Keep source URLs, source identifiers, publication/edition metadata, rights evidence and reviewer decisions per book.
- Prefer public-domain source texts, original transcriptions of public-domain works, or materials with explicit compatible licenses/permission.
- Where rights are unclear, link to the source instead of hosting a copy; do not imply permission.
- Do not use a blanket MIT license on book content. The app code and the literary works have separate legal status.
- Record editorial corrections separately from source text; preserve spelling variants and original stanza breaks.
- Clearly label any demo text. Never invent historical quotations or silently alter an author's text.
- Add a correction/takedown contact and a transparent review process.

**Initial candidate works (rights and exact source editions still need verification):** Gangadhar Meher's *Tapaswini* and *Pranaya Ballari*; Fakir Mohan Senapati's *Pushpamala* and *Utkal Bhramanam*; Bhima Bhoi's *Stuti Chintamani*; Gopabandhu Das's *Bandira Atmakatha*. These are discovery candidates, **not preapproved uploads**.

**Seed source to investigate:** https://archive.org/details/tapaswini-1974-n-1975/page/n19/mode/2up . Confirm metadata and rights, obtain an authorized source or make a permissible transcription, and manually proofread one chapter/sarga before publishing it.

## 10. Content ingestion and quality workflow

1. **Discover:** Collect source records and bibliographic metadata, not bulk-download every archive item.
2. **Rights review:** Establish public-domain/permission status of the work and exact material to be reused. Save evidence and reviewer notes.
3. **Acquire source:** Download only when lawful and permitted by the source's access terms; preserve the original reference and checksums.
4. **Extract:** Prefer reliable existing Unicode text. Use OCR only when necessary; mark OCR output as unverified.
5. **Proofread:** Compare every line with source scans, particularly Odia conjuncts, matras, punctuation, stanza boundaries and verse numbering.
6. **Structure:** Encode chapters, stanzas, lines and optional source-page mappings; use stable IDs.
7. **Validate:** JSON schema, no missing attribution, no duplicate IDs, rights approval, Unicode sanity, no unreviewed OCR.
8. **Review:** Two-person review for important works when possible; require a reviewed pull request.
9. **Publish:** Generate static catalog/content, run tests and deploy.
10. **Correct:** Allow public correction issues linked to book/chapter/verse; document changes.

**Pilot:** Start with one verified sarga of *Tapaswini*, not an entire unreviewed library. Build a reusable pipeline from that pilot.

## 11. Repository structure

```text
akshara/
├── AGENTS.md
├── LICENSE                       # MIT: application code only
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── CONTENT_LICENSES.md
├── .github/
│   ├── workflows/ci.yml
│   └── ISSUE_TEMPLATE/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── CONTENT_POLICY.md
│   ├── BOOK_CONTRIBUTION_GUIDE.md
│   └── DEPLOYMENT.md
├── content/
│   ├── authors/
│   ├── books/
│   └── catalog.json
├── public/
│   ├── icons/
│   ├── covers/
│   └── manifest.webmanifest
├── scripts/
│   ├── validate-content/
│   ├── import-book/
│   └── audit-rights/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── library/
│   │   ├── authors/
│   │   ├── reader/
│   │   ├── search/
│   │   ├── bookmarks/
│   │   └── offline/
│   ├── db/
│   ├── stores/
│   ├── styles/
│   └── types/
└── tests/
```

Use the simplest structure that fits the implemented code; do not create empty folders purely to match the diagram.

## 12. Implementation phases

### Phase 0 — Repository and governance (1 day)
- Create public GitHub repo, README, MIT LICENSE for code, content rights policy, contributing guide, code of conduct and issue templates.
- Document goals, V1 scope, decisions and non-goals.
- Configure CI and branch protections where available.

**Exit:** A new contributor can understand the mission and run the project locally.

### Phase 1 — Foundation and visual system (1–2 days)
- Initialize React, TS, Vite, Tailwind, router and testing tools.
- Create responsive Odia-first app shell, typography, themes and book catalog fixtures.
- Build homepage, library search, book cards and book detail page.

**Exit:** Navigation and discovery work on mobile and desktop with clearly labeled demo metadata.

### Phase 2 — Reader MVP (3–5 days)
- Implement structured content renderer with poetry-aware stanzas and verses.
- Build chapter navigation, table of contents, font size/spacing, light/sepia/dark themes.
- Persist reading position and bookmarks in IndexedDB; restore after reload.
- Implement accessible controls and responsive reading view.

**Exit:** A reader can open a demo work, read, change settings, bookmark, close and resume.

### Phase 3 — Content workflow and first authentic text (4–7+ days)
- Implement content schema, metadata validator and rights gate.
- Research the provided *Tapaswini* edition; record rights evidence and bibliographic details.
- Produce and manually verify one sarga from a lawful source.
- Display source/edition attribution and proofreading status.

**Exit:** At least one real, verified literary section is readable without fabricated lines. This phase may take longer than estimated.

### Phase 4 — Offline PWA (2–3 days)
- Add install manifest and service worker.
- Precache shell, provide explicit book download/delete and storage usage UI.
- Test first visit, offline revisit, updates, quota failures and private-mode behavior.

**Exit:** A downloaded book opens offline and progress survives normal reloads.

### Phase 5 — Open-source launch (2–3 days)
- Audit mobile layout, Odia rendering, accessibility, performance and security.
- Run typecheck, lint, unit/integration/E2E tests and production build.
- Connect GitHub to Cloudflare Pages, publish docs and a feedback/correction route.

**Exit:** Public free URL, reproducible build, no rights-uncleared text in production.

**Rough total:** 2–4 weeks for the software MVP; source verification/transcription may substantially extend the schedule.

## 13. Testing and acceptance criteria

- Correct Unicode Odia display including conjuncts and matras on Chrome Android, Safari iOS and desktop browsers.
- Verse lines and stanza breaks match approved content; no accidental prose reflow.
- Theme, font size, bookmarks and stable reading position persist after reload.
- No account needed; works with JavaScript enabled and normal browser storage permissions.
- Catalog search finds titles/authors and curated Romanized aliases.
- Offline book opens after download with network disabled; removal frees local storage.
- Storage failure shows a useful message rather than silently losing progress.
- Reader controls are keyboard-operable and screen-reader labeled.
- No XSS from imported content; content rendered as safe structured text.
- Content validation blocks unapproved works and unverified OCR from production.
- CI runs typecheck, lint, tests, content checks and build successfully.
- Responsive layout tested at narrow phone widths; sensible loading and bundle size.

## 14. Hosting and release plan

**Recommended:** Public GitHub repo + Cloudflare Pages Free with a `*.pages.dev` subdomain, subject to availability. No custom domain is required. No backend or database server.

Typical Cloudflare Pages Vite settings:

```text
Framework preset: Vite (if offered)
Build command: npm run build
Build output directory: dist
Production branch: main
```

- Connect GitHub repository to Cloudflare Pages; enable automatic deploy on merges to `main`.
- Configure SPA routing fallback as needed for the selected deployment setup.
- Keep source text and static assets small; avoid bundling large scanned PDFs.
- Confirm current free-tier build, storage, bandwidth and asset limits from official documentation before release.
- Use free subdomain initially; a custom domain is optional and may cost money.
- No user tracking by default; if analytics is ever added, use privacy-respecting opt-in or minimal analytics.
- Ensure legal notices, rights and correction contact are visible on the deployed site.

## 15. Open-source contribution model

- **Code contributions:** MIT-licensed app code; normal GitHub PRs with CI and review.
- **Book proposals:** Require title, author, edition, source, rights rationale and evidence.
- **Transcriptions:** Require chapter/verse IDs, source references and proofreading checklist.
- **Corrections:** Issues should identify book ID, chapter/verse, expected text and scan evidence.
- **Maintainers:** Review both code quality and content provenance; never auto-merge unverified text.
- **License separation:** `LICENSE` covers code; `CONTENT_LICENSES.md` and per-book metadata explain literary material.

## 16. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Copyright ambiguity | Per-edition rights review; link rather than mirror if uncertain |
| Bad OCR | Manual proofreading, comparison with scans, approval gate |
| Incorrect attribution | Bibliographic source records and editorial review |
| Odia font shaping issues | Real-device tests and properly licensed fonts |
| Offline storage eviction | Explain local-only data and offer recovery/export later |
| Catalog growth | Lazy-load per-book content, split indexes, add static search index later |
| Hosting limits | Avoid large PDFs; monitor official free-tier quotas |
| Contributor quality | Schema validation, review checklists and CI |

## 17. Decisions to keep stable

- Open-source and free to read.
- Public GitHub + Cloudflare Pages Free.
- React + TypeScript + Vite; no backend or login in V1.
- Text-native Kindle-like reader, not PDF-only.
- Local IndexedDB bookmarks, progress and offline books.
- Separate rights and license tracking for each literary work and edition.
- *Tapaswini* as the first authentic content pilot, pending source and rights verification.

## 18. Codex CLI master prompt

Copy the following prompt into Codex CLI from the new project directory:

```text
You are the lead engineer and product architect for AKSHARA, an open-source, free Odia digital literature library.

Read AKSHARA_MASTER_PLAN.md in full and treat it as the product source of truth. Build a mobile-first, accessible, premium Kindle-like Odia reading experience using React, TypeScript, Vite and Tailwind. Use IndexedDB for local reading state and selective offline books, a PWA for installation/offline, GitHub for open-source development, and Cloudflare Pages Free for static hosting. No backend, accounts or paid services in V1.

Important constraints:
- Preserve original Odia poetry line breaks, stanza boundaries and spelling.
- Never invent historical verses or publish unverified OCR.
- Never treat Internet Archive availability as redistribution permission.
- Enforce per-work and per-edition rights checks before content enters the production catalog.
- Keep app code under MIT, with separate literary-content rights metadata.
- Do not introduce unnecessary infrastructure or dependencies.
- All demo content must be unmistakably labeled as demo.

Execution plan:
1. Inspect existing files; do not overwrite working code without reason.
2. Set up or update README, AGENTS.md, docs/PRD.md, docs/ARCHITECTURE.md, docs/CONTENT_POLICY.md, docs/ROADMAP.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, LICENSE and CONTENT_LICENSES.md.
3. Implement Phase 0 and Phase 1 from the master plan.
4. Implement Phase 2: functional poetry-aware reader with theme, font/spacing controls, TOC, bookmarks and persistent progress using clearly labeled sample content.
5. Add tests for navigation, Odia line/stanza preservation, persistence, responsiveness and accessibility.
6. Run typecheck, lint, tests and build. Fix failures.
7. Document the Cloudflare Pages build command (npm run build), output directory (dist) and deployment steps, but do not deploy without explicit approval.
8. Report what is complete, what remains, and the exact commands to run locally.

Proceed with implementation of Phases 0–2 now. Make reasonable documented assumptions; ask only when blocked by an essential decision.
```

## 19. Next immediate actions

1. Create a new local folder and save this document as `AKSHARA_MASTER_PLAN.md`.
2. Open that folder in Codex CLI and paste the master prompt above.
3. Review the working reader and mobile typography before expanding content.
4. Research and verify the provided *Tapaswini* source; publish one verified sarga only after rights and proofreading checks.
5. Launch to Cloudflare Pages once tests and editorial checks pass.

---

*This is a product and engineering plan, not legal advice. Confirm applicable copyright rules and current hosting terms at publication time.*
