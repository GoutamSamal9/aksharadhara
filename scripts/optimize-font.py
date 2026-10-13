"""Compress a complete font and verify every decompressed SFNT table.

Requires fonttools[woff] (FontTools + Brotli). No subsetting or table transforms.
Run: python3 scripts/optimize-font.py
"""
from pathlib import Path
import hashlib
import json
import sys
from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import compress

root = Path(__file__).resolve().parents[1]
source = root / (sys.argv[1] if len(sys.argv) > 1 else 'public/fonts/AnekOdia-Variable.ttf')
target = source.with_suffix('.woff2')
compress(source, target, transform_tables=set())
original = TTFont(source, lazy=True, recalcTimestamp=False)
compressed = TTFont(target, lazy=True, recalcTimestamp=False)
removed = set(original.reader.keys()) - set(compressed.reader.keys())
assert removed <= {'DSIG'}, 'Unexpected table removal'
assert not (set(compressed.reader.keys()) - set(original.reader.keys())), 'Unexpected added table'
for tag in compressed.reader.keys():
    before, after = original.reader[tag], compressed.reader[tag]
    if tag == 'head':
        # Container conversion recalculates checksum adjustment and sets a lossless flag.
        before, after = bytearray(before), bytearray(after)
        before[8:12] = after[8:12] = b'\0' * 4
        # WOFF2 marks lossless compression using flags bit 11.
        before[16] &= ~8
        after[16] &= ~8
    assert before == after, f'{tag} table changed'
assert original.getGlyphOrder() == compressed.getGlyphOrder(), 'Glyph order changed'
assert original.getBestCmap() == compressed.getBestCmap(), 'Character mappings changed'
for name_id in (0, 1, 13, 14):
    before = [(n.platformID, n.platEncID, n.langID, n.toUnicode()) for n in original['name'].names if n.nameID == name_id]
    after = [(n.platformID, n.platEncID, n.langID, n.toUnicode()) for n in compressed['name'].names if n.nameID == name_id]
    assert before == after, f'Name/license metadata {name_id} changed'
report = {
    'sourceBytes': source.stat().st_size,
    'woff2Bytes': target.stat().st_size,
    'reductionPercent': round(100 * (1 - target.stat().st_size / source.stat().st_size), 2),
    'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'woff2Sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
    'glyphCount': len(original.getGlyphOrder()),
    'tables': sorted(compressed.reader.keys()),
    'removedTables': sorted(removed),
    'verification': 'All retained decompressed SFNT tables byte-identical except head checksumAdjustment and WOFF2 lossless flag; glyph order, cmap and name/license metadata unchanged. No glyph subsets or WOFF2 table transforms. Only DSIG digital signature removal is permitted; it does not affect rendering.',
}
(root / f'public/fonts/{source.stem}-verification.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
