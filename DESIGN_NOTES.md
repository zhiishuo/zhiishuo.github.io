# DESIGN_NOTES.md — Minimalist Premium Redesign (2026-02-10)

## Design intent
A substantial visual overhaul was implemented to shift from a card-heavy style to a calmer, more editorial layout with:
- airy typography and larger whitespace rhythm,
- subtle section separators instead of boxed containers,
- selective surfaces only where utility matters (contact tiles, compact chips, buttons),
- restrained neutral palette with a single refined brand accent,
- quieter but polished interactions.

## What changed
- Reworked page structure in `index.html` to reduce visual boxing while preserving all core content.
- Rebuilt styling system in `styles.css` around light premium minimalism:
  - sticky translucent header,
  - section-level top rules for hierarchy,
  - list-style research/project rows (not cards),
  - simplified hero with profile photo + slim aside divider,
  - cleaner contact area with concise emphasis.
- Kept `script.js` functionality intact (bilingual toggle, nav active state, smooth scroll/back-to-top, reveal effects, mobile menu).

## Requirements checklist
1. **Preserve functionality + bilingual toggle**: ✅ kept and verified (EN/中文 switch works).
2. **Preserve nav items + valid anchors**: ✅ all nav links map to existing sections.
3. **Keep News + Contact complete**: ✅ full entries and contact details retained.
4. **Responsive quality (mobile/desktop)**: ✅ desktop grid + mobile stacked layout maintained.
5. **Screenshot + rationale**: ✅ screenshot generated at `site-preview-v4.jpg`; this file is the rationale.

## Smoke test summary
- `node --check script.js` passes.
- Manual browser check:
  - page loads correctly,
  - language toggles EN/中文,
  - anchors navigate to real sections,
  - full-page screenshot generated.
