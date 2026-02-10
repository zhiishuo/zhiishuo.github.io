# SelfOS

SelfOS is a local-first personal productivity app with a modern web UI and JSON-backed data.

## Features

- Dashboard with daily metrics
- Daily learning log
- Activity timeline
- Goals and streak tracking
- Local JSON persistence (`./data/*.json`)
- Session transcript ingestion from OpenClaw/iMessage JSONL logs

## Project Structure

- `index.html`, `styles.css`, `app.js` — frontend app
- `data/state.json` — persistent goals/streak/meta
- `data/extracted_today.json` — generated daily extract
- `scripts/ingest_sessions.py` — transcript ingestion + extraction
- `server.js` — optional simple Node static server

## Run

### Option A: Python static server

```bash
cd SelfOS
python3 -m http.server 8080
# open http://localhost:8080
```

### Option B: Node server

```bash
cd SelfOS
npm run serve
# open http://localhost:8080
```

## Refresh extracted data

```bash
cd SelfOS
npm run refresh
# or: python3 scripts/ingest_sessions.py
```

This script reads from:

`~/.openclaw/agents/main/sessions/*.jsonl`

and writes:

- `data/extracted_today.json`
- updates `data/state.json` (`lastUpdated` + streak counters)

Optional flags:

```bash
python3 scripts/ingest_sessions.py --date 2026-02-10 --tz Asia/Shanghai
```

## Automate daily refresh

Add a cron entry (example: every day at 21:00):

```bash
0 21 * * * cd /Users/zzs/.openclaw/workspace/SelfOS && /usr/bin/python3 scripts/ingest_sessions.py >> /tmp/selfos-refresh.log 2>&1
```

(Or trigger this command from OpenClaw heartbeat/task automation.)

## Notes

- All data stays local.
- No heavy frontend frameworks or build step required.
