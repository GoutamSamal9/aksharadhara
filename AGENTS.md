# Aksharadhara contributor instructions

Read AKSHARA_MASTER_PLAN.md as the original product source of truth. Keep it unchanged; docs/ARCHITECTURE.md records the current Next.js App Router migration and supersedes older technical choices. Preserve archive/vite-prototype as a historical reference excluded from active checks.

Preserve poetry lines, stanza boundaries, source spelling, and stable book/chapter/block IDs. Never invent historical quotations or publish OCR without proofreading. Work and edition rights require separate evidence; archive availability is not permission. Code is MIT; literary content and fonts have separate rights. Demo content must be original and unmistakably labeled. Use structured text, never imported executable markup.

Keep V1 static, account-free, accessible, and free to read. Use Next.js static export into out/. Do not introduce backend services, API endpoints, server actions, or middleware. Preserve existing IndexedDB reader state during schema upgrades. Offline downloads must be selected by the reader and deletable locally. Keep private reading/bookmark/feedback data out of analytics. Public environment variables are public build-time values, never credentials.

Run npm run check before handing off changes. Run production-static Playwright checks when available, and record genuine environment limitations without claiming unperformed checks passed. Do not deploy or publish without explicit user approval.
