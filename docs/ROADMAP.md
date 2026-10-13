# Roadmap

The local pilot has migrated to Next.js App Router static export. Discovery, structured reader, local preferences/progress/bookmarks, selected-book offline management, install metadata, and static SEO are implemented for original labeled demo content. The prior Vite prototype is retained in `archive/vite-prototype/`; the master plan remains unchanged.

Remaining release work:

- Research a lawful Tapaswini edition; independently document underlying work and exact edition/material rights, transcribe one sarga, and manually proofread every line against its source. Obtain editorial approval before publication.
- Review all Odia interface/demo language with a native editor and test shaping/line layout on real Android and iOS devices. Noto Serif Oriya is not bundled; verify the chosen licensed font stack before release.
- Complete keyboard/screen-reader, narrow-screen, offline/eviction/quota, and performance acceptance testing. Automated check results and environment limits belong in docs/VERIFICATION.md.
- Initialize Git outside this restricted workspace, create the intended public GitHub repository, and configure branch protection/CI.
- Configure a public correction/takedown contact and optionally the public analytics token. Review the analytics exclusions before enabling it.
- After explicit publication approval, connect Cloudflare Pages Free, deploy `out/`, configure `aksharadhara.org`, verify HTTPS, and test direct static routes and offline downloads on the hosted preview.

No public repository or deployment has been performed. Demo implementation is not an authentic historical library release.
