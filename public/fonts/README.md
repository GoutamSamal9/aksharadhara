# Font sources and licensing

Font software has separate SIL OFL 1.1 licensing from the application's MIT code license. Original fonts and complete licenses remain available alongside the delivery assets.

- `AnekOdia-Variable.ttf`: unmodified licensed original supplied locally. Embedded copyright: 2021 The Anek Project Authors (https://github.com/EkType/Anek). Embedded license: SIL OFL 1.1; complete license in `OFL.txt`.
- `AnekOdia-Variable.woff2`: complete-font WOFF2 conversion of that TTF. 856,736 → 358,868 bytes (58.11% reduction). All 714 glyphs and original variable axes remain intact.
- `NotoSerifOriya-Variable.ttf`: unmodified `NotoSerifOriya-VariableFont_wght.ttf` extracted from the user-supplied root `Noto_Serif_Oriya.zip`, which remains unchanged. Embedded copyright: 2022 The Noto Project Authors (https://github.com/notofonts/oriya). The archive's complete OFL 1.1 license is preserved verbatim in `NotoSerifOriya-OFL.txt`.
- `NotoSerifOriya-Variable.woff2`: complete-font WOFF2 conversion of that TTF. 236,068 → 94,748 bytes (59.86% reduction). All 973 glyphs and original variable axes remain intact.
- `NotoSansOriya.ttc`: unmodified collection copied from macOS `/System/Library/Fonts/NotoSansOriya.ttc`. Embedded copyright: 2015 Google Inc. Embedded license: SIL OFL 1.1, reproduced in `OFL.txt`. Official upstream: https://github.com/notofonts/oriya. TTC browser support varies; this is an optional asset.

## Compression and verification

`scripts/optimize-font.py` uses FontTools 4.63.0 with Brotli 1.2.0 for compression without glyph subsetting or WOFF2 table transforms. It compares every retained decompressed SFNT table against the original. GSUB, GPOS, GDEF, glyph outlines, variation tables, mappings, names, and license metadata are byte-identical. The `head` checksum adjustment and WOFF2 lossless-compression flag are normalized for this comparison. FontTools removes Anek's DSIG digital signature; this does not affect glyphs or shaping. Noto Serif loses no tables. Font names remain unchanged; neither input declares a Reserved Font Name in its supplied copyright notice.

`*-verification.json` records exact file hashes, sizes, glyph counts, table inventories, and removed tables. The script can be rerun in an environment with `fonttools[woff]`:

```sh
python3 scripts/optimize-font.py
python3 scripts/optimize-font.py public/fonts/NotoSerifOriya-Variable.ttf
```

This verifies font data preservation, not physical-device visual shaping. Odia conjunct, matra, punctuation, and poetry line rendering still require native editorial and real Android/iOS review.
