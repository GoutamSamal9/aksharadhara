# Book contribution guide
1. Propose title, author, author ID, exact edition/year, source institution and URL.
2. Record separate work and reused-material rights evidence and reviewer identity/date in your review notes. Do not download or transcribe restricted material.
3. Use content/books/demo-garden.json as a structural example only. Authentic content must set demo=false, cleared work/edition rights with evidence, and approved proofreading status.
4. Create stable lowercase chapter/block IDs. Keep one explicit lines array per verse/stanza block. Preserve authorial spelling and whitespace; map source pages when available.
5. Compare every line to the source. Record corrections and reviewer decisions in a companion source review document. Prefer independent second review.
6. Run npm run validate:content and submit a reviewed PR with source/checksum and rights notes. Never auto-publish OCR or fabricate missing lines.

Tapaswini is a discovery candidate, not preapproved text. The first authentic pilot should be one verified sarga.

## Authentic metadata required by validation
Keep `rights.evidence` for the overall rationale, and provide separate nonempty `rights.workEvidence` and `rights.editionEvidence` arrays. Record `rights.reviewedBy`, `rights.reviewedAt`, `verification.reviewedBy`, and `verification.reviewedAt`; dates use real `YYYY-MM-DD` calendar dates. Authentic source records require an HTTP(S) URL, institution, and a nonempty `source.editionDescription`. `source.editionYear` may be null when unknown; describe the edition honestly rather than inventing a year.

`node scripts/validate-content.mjs --production` excludes all demo content and must pass before an authentic production catalog release. It deliberately fails for the current demo pilot. Evidence quality and reviewer authority still need human review.
