# DESIGN_NOTES.md — zhiishuo.github.io V2.1 Redesign

## 1) Scope and constraints
- Goal: serious redesign pass while preserving **all core content blocks**.
- Must preserve and clearly expose: profile representation + full contact information.
- Existing IA retained: **About / Research / Projects / Contact**.

## 2) What appeared lost vs original intent (analysis)
From current pre-redesign version (`backups/v2.0-before/`):

1. **Profile image absent in hero**
   - The page introduced stronger interactions but had no visible personal photo, making the hero less personal/trust-building.
2. **Contact information present but lightweight**
   - Email + GitHub existed, but contact area looked secondary and less explicit for collaboration intent.
3. **IA existed but hierarchy could be clearer**
   - Sections were present, yet top-of-page narrative (who/what/how to contact) was not as strongly prioritized.
4. **Interactions were good, but visual storytelling in hero was still limited**
   - Reveal animation and hover effects existed, but hero lacked a focal “identity card” component.

## 3) Internal A/B comparison

## A = Before (V2.0 backup)
Path: `backups/v2.0-before/`

### Strengths
- Clean layout and decent readability.
- Working bilingual toggle and responsive nav.
- Existing reveal/hover interactions already polished.

### Weaknesses
- No profile photo in hero.
- Contact section less comprehensive in structure.
- Hero lacked a strong right-column visual anchor.

## B = After (V2.1)
Path: root files (`index.html`, `styles.css`, `script.js`)

### Improvements
1. **Strong hero with profile photo**
   - Added hero two-column composition with profile card and photo (`https://github.com/zhishuo.png`).
2. **Complete, clearer contact section**
   - Contact grid now includes Email, GitHub, and response-time expectation.
   - Collaboration availability chip improves intent signaling.
3. **Clearer information architecture**
   - Hero immediately communicates identity, specialties, and CTA.
   - Section notes and chips improve scanning and hierarchy.
4. **Elegant minimal aesthetics + tasteful interactions**
   - Retained restrained palette and glassy dark style.
   - Enhanced visual rhythm without clutter.
5. **Responsive polish**
   - Hero collapses elegantly on smaller screens.
   - Contact grid stacks cleanly on narrow breakpoints.

### Trade-offs
- Slightly denser hero content may increase first-screen complexity.
- External profile image source relies on GitHub avatar availability.

## 4) Content preservation checklist
- [x] About section preserved (full body text retained)
- [x] Research section preserved (3 cards + original wording)
- [x] Projects section preserved (4 projects + original wording)
- [x] Contact core info preserved (email + GitHub)
- [x] Bilingual support preserved and extended for new UI labels

## 5) QA checklist (sanity)
- [x] HTML/CSS/JS load without syntax errors
- [x] Desktop layout: hero two-column + sections render
- [x] Mobile layout: nav menu toggle + stacked blocks
- [x] Language toggle updates all tagged text
- [x] Back-to-top and reveal interactions still functional
- [x] Core content blocks not removed
