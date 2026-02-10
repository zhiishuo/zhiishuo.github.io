# SelfOS V4 (Tri-goal Dashboard)

SelfOS V4 is a **local-only** personal tracker centered on 3 long-term goals:

- **Research**: papers read, experiments, writing
- **English**: vocab, listening, speaking, writing
- **Fitness**: workouts, steps/duration

## What's new in V4

1. **Top-level tri-goal cards**
   - Dedicated Research / English / Fitness cards
   - Each card shows **daily** + **weekly** progress

2. **Dedicated goal sections with editable checklists**
   - Each track has a simple checklist that can be edited inline
   - Checkbox state and custom items are saved in browser `localStorage`

3. **Conversation auto-ingestion kept and improved**
   - `scripts/ingest_conversations.py` + `scripts/ingest_sessions.py`
   - Auto maps user activities into the 3 tracks (when possible)

4. **Clean light UI with clearer hierarchy**
   - Top: tri-goal overview
   - Middle: 3 focused track sections
   - Bottom: filtered auto-ingestion timeline

5. **Responsive desktop/mobile**
   - 3-column layout on desktop
   - stacked cards on mobile

6. **Local only**
   - JSON files in `./data`
   - Browser `localStorage`
   - No external APIs

## Files

- `index.html`, `styles.css`, `app.js`: V4 frontend
- `scripts/ingest_conversations.py`: weekly/today ingestion + track/facet mapping
- `scripts/ingest_sessions.py`: fallback daily extraction + track mapping
- `data/journal.json`: primary data source
- `data/extracted_today.json`: fallback source

## Usage

### 1) Ingest local conversations

```bash
cd /Users/zzs/.openclaw/workspace/SelfOS
python3 scripts/ingest_conversations.py
```

(Optionally run fallback extractor)

```bash
python3 scripts/ingest_sessions.py
```

### 2) Run app locally

```bash
cd /Users/zzs/.openclaw/workspace/SelfOS
npm run serve
```

Open:

- `http://127.0.0.1:8080/`

## Privacy

- Everything stays on this machine.
- No cloud sync and no third-party API calls.
