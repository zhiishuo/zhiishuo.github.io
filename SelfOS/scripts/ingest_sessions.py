#!/usr/bin/env python3
import argparse
import glob
import json
import os
import re
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

TRACK_RULES = {
    "research": ["paper", "论文", "research", "arxiv", "experiment", "实验", "benchmark", "写作"],
    "english": ["english", "英语", "vocab", "单词", "listening", "speaking", "shadowing", "ielts", "toefl"],
    "fitness": ["fitness", "workout", "gym", "run", "walk", "steps", "步数", "训练", "健身", "拉伸"],
}


def extract_text(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for p in content:
            if isinstance(p, dict):
                t = p.get("text") or p.get("content")
                if t:
                    parts.append(str(t))
            elif isinstance(p, str):
                parts.append(p)
        return " ".join(parts).strip()
    if isinstance(content, dict):
        return str(content.get("text") or content.get("content") or "")
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


def map_track(text):
    low = text.lower()
    for track, kws in TRACK_RULES.items():
        if any(k.lower() in low for k in kws):
            return track
    return None


def main():
    parser = argparse.ArgumentParser(description="Extract today's activities from OpenClaw session jsonl files")
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

    activities, timeline = [], []

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
                    track = map_track(clean)

                    timeline.append({"ts": ts, "role": role, "text": short, "track": track, "source": os.path.basename(path)})

                    if role == "user":
                        activities.append({
                            "ts": ts,
                            "title": short[:80],
                            "text": short,
                            "track": track,
                            "category": track or "其他",
                            "source": os.path.basename(path)
                        })
        except OSError:
            continue

    activities = dedupe(sorted(activities, key=lambda x: x["ts"], reverse=True), ["ts", "text"])
    timeline = dedupe(sorted(timeline, key=lambda x: x["ts"], reverse=True), ["ts", "text"])

    out_payload = {
        "date": str(target_date),
        "generatedAt": datetime.now(tz).isoformat(),
        "activities": activities[:140],
        "timeline": timeline[:240],
    }

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out_payload, f, ensure_ascii=False, indent=2)

    state = {}
    if os.path.exists(args.state):
        with open(args.state, "r", encoding="utf-8") as sf:
            try:
                state = json.load(sf)
            except json.JSONDecodeError:
                state = {}

    state["lastUpdated"] = out_payload["generatedAt"]
    with open(args.state, "w", encoding="utf-8") as sf:
        json.dump(state, sf, ensure_ascii=False, indent=2)

    print(f"Ingested {len(activities)} activities, {len(timeline)} timeline events for {target_date}")
    print(f"Wrote: {os.path.abspath(args.out)}")


if __name__ == "__main__":
    main()
