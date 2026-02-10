#!/usr/bin/env python3
import argparse
import glob
import json
import os
import re
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

ACTIVITY_KWS = [
    "build", "fix", "write", "run", "review", "plan", "ship", "design", "implement", "debug",
    "学习", "完成", "开发", "修复", "整理", "计划", "阅读", "总结"
]
LEARNING_KWS = [
    "learn", "learned", "lesson", "note", "insight", "understand", "发现", "学到", "总结", "复盘", "笔记"
]

def extract_text(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for p in content:
            if isinstance(p, dict):
                if p.get("type") in ("text", "input_text") and p.get("text"):
                    parts.append(str(p.get("text")))
                elif p.get("type") == "output_text" and p.get("text"):
                    parts.append(str(p.get("text")))
            elif isinstance(p, str):
                parts.append(p)
        return " ".join(parts).strip()
    if isinstance(content, dict):
        return str(content.get("text", ""))
    return ""

def parse_ts(entry, msg):
    msts = msg.get("timestamp")
    if isinstance(msts, (int, float)):
        return datetime.fromtimestamp(msts / 1000, tz=timezone.utc)
    ts = entry.get("timestamp")
    if isinstance(ts, str):
        try:
            return datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None

def dedupe(items, key_fields):
    seen = set()
    out = []
    for it in items:
        key = tuple(it.get(k) for k in key_fields)
        if key in seen:
            continue
        seen.add(key)
        out.append(it)
    return out

def main():
    parser = argparse.ArgumentParser(description="Extract today's activities/learning from OpenClaw session jsonl files")
    parser.add_argument("--sessions-glob", default=os.path.expanduser("~/.openclaw/agents/main/sessions/*.jsonl"))
    parser.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "data", "extracted_today.json"))
    parser.add_argument("--state", default=os.path.join(os.path.dirname(__file__), "..", "data", "state.json"))
    parser.add_argument("--tz", default="Asia/Shanghai")
    parser.add_argument("--date", help="Override date, format YYYY-MM-DD")
    args = parser.parse_args()

    tz = ZoneInfo(args.tz)
    target_date = datetime.now(tz).date()
    if args.date:
      target_date = datetime.strptime(args.date, "%Y-%m-%d").date()

    activities, learning, timeline = [], [], []

    for path in glob.glob(args.sessions_glob):
        try:
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    if entry.get("type") != "message":
                        continue
                    msg = entry.get("message", {})
                    role = msg.get("role", "unknown")
                    text = extract_text(msg.get("content", "")).strip()
                    if not text:
                        continue
                    dt = parse_ts(entry, msg)
                    if not dt:
                        continue
                    local_dt = dt.astimezone(tz)
                    if local_dt.date() != target_date:
                        continue

                    clean = re.sub(r"\s+", " ", text)
                    short = clean[:220]
                    ts = local_dt.isoformat()
                    timeline.append({"ts": ts, "role": role, "text": short, "source": os.path.basename(path)})

                    low = clean.lower()
                    if any(k in low for k in ACTIVITY_KWS) and role == "user":
                        activities.append({
                            "ts": ts,
                            "title": short[:80],
                            "text": short,
                            "source": os.path.basename(path)
                        })
                    if any(k in low for k in LEARNING_KWS):
                        learning.append({
                            "ts": ts,
                            "title": "Learning note",
                            "note": short,
                            "source": os.path.basename(path)
                        })
        except OSError:
            continue

    activities = dedupe(sorted(activities, key=lambda x: x["ts"], reverse=True), ["ts", "text"])
    learning = dedupe(sorted(learning, key=lambda x: x["ts"], reverse=True), ["ts", "note"])
    timeline = dedupe(sorted(timeline, key=lambda x: x["ts"], reverse=True), ["ts", "text"])

    out_payload = {
        "date": str(target_date),
        "generatedAt": datetime.now(tz).isoformat(),
        "activities": activities[:100],
        "learning": learning[:100],
        "timeline": timeline[:200]
    }

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out_payload, f, ensure_ascii=False, indent=2)

    # Update state metadata + streaks heuristically.
    state = {}
    if os.path.exists(args.state):
        with open(args.state, "r", encoding="utf-8") as sf:
            try:
                state = json.load(sf)
            except json.JSONDecodeError:
                state = {}
    streaks = state.get("streaks", {})
    if activities:
        streaks["activityStreak"] = int(streaks.get("activityStreak", 0)) + 1
    if learning:
        streaks["learningStreak"] = int(streaks.get("learningStreak", 0)) + 1
    state["streaks"] = streaks
    state["lastUpdated"] = out_payload["generatedAt"]
    with open(args.state, "w", encoding="utf-8") as sf:
        json.dump(state, sf, ensure_ascii=False, indent=2)

    print(f"Ingested {len(activities)} activities, {len(learning)} learning notes, {len(timeline)} timeline events for {target_date}")
    print(f"Wrote: {os.path.abspath(args.out)}")

if __name__ == "__main__":
    main()
