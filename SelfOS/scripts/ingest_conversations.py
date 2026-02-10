#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Asia/Shanghai")
ROOT = Path(__file__).resolve().parents[1]
SESSIONS = Path.home() / ".openclaw/agents/main/sessions"
OUT = ROOT / "data/journal.json"

TRACK_RULES = {
    "research": {
        "keywords": ["论文", "paper", "research", "arxiv", "实验", "experiment", "benchmark", "写作", "review"],
        "facets": {
            "papers read": ["paper", "论文", "arxiv", "read"],
            "experiments": ["experiment", "实验", "benchmark", "ablation", "run"],
            "writing": ["write", "writing", "draft", "笔记", "总结"],
        },
    },
    "english": {
        "keywords": ["english", "英语", "vocab", "word", "listening", "speak", "speaking", "shadowing", "ielts", "toefl"],
        "facets": {
            "vocab": ["vocab", "word", "单词"],
            "listening": ["listening", "听力"],
            "speaking": ["speaking", "口语", "shadowing", "跟读"],
            "writing": ["writing", "作文", "essay", "paragraph"],
        },
    },
    "fitness": {
        "keywords": ["fitness", "workout", "gym", "run", "walk", "steps", "健身", "训练", "步数", "拉伸", "exercise"],
        "facets": {
            "workouts": ["workout", "gym", "训练", "exercise", "cardio", "run"],
            "steps/duration": ["steps", "步数", "分钟", "duration", "walk", "走"],
        },
    },
}


def extract_text(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, dict):
        text = content.get("text") or content.get("content")
        return str(text).strip() if text else ""

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                t = item.get("text") or item.get("content")
                if t:
                    parts.append(str(t))
        return "\n".join(parts).strip()

    return ""


def parse_timestamp(obj: dict) -> datetime | None:
    candidates = [obj.get("timestamp"), obj.get("message", {}).get("timestamp")]
    for ts in candidates:
        if ts is None:
            continue
        if isinstance(ts, (int, float)):
            try:
                return datetime.fromtimestamp(float(ts) / 1000, tz=ZoneInfo("UTC")).astimezone(TZ)
            except Exception:
                continue
        if isinstance(ts, str):
            try:
                return datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone(TZ)
            except Exception:
                continue
    return None


def clean_text(text: str) -> str:
    text = re.sub(r"\[\[\s*reply_to_current\s*\]\]", "", text, flags=re.I)
    text = re.sub(r"\[message_id:[^\]]+\]", "", text, flags=re.I)
    return re.sub(r"\s+", " ", text).strip()


def map_track_and_facet(text: str) -> tuple[str | None, str | None]:
    low = text.lower()
    for track, cfg in TRACK_RULES.items():
        if any(k.lower() in low for k in cfg["keywords"]):
            for facet, kws in cfg["facets"].items():
                if any(k.lower() in low for k in kws):
                    return track, facet
            return track, None
    return None, None


def infer_priority(text: str) -> str:
    low = text.lower()
    if any(k in low for k in ["紧急", "关键", "高优", "urgent", "important", "p0"]):
        return "high"
    if any(k in low for k in ["低优", "later", "p2"]):
        return "low"
    return "medium"


def dedupe(items: list[dict]) -> list[dict]:
    seen = set()
    out = []
    for a in sorted(items, key=lambda x: x["timestamp"]):
        key = (a["text"], a["timestamp"][:16])
        if key in seen:
            continue
        seen.add(key)
        out.append(a)
    return out


def progress_pct(count: int, target: int) -> int:
    if target <= 0:
        return 0
    return min(100, int(round((count / target) * 100)))


def build_weekly_tracks(weekly_activities: list[dict]) -> dict:
    track_targets = {"research": 10, "english": 12, "fitness": 10}
    output: dict[str, dict] = {}

    for track in ["research", "english", "fitness"]:
        acts = [a for a in weekly_activities if a.get("track") == track]
        facet_count = Counter(a.get("facet") for a in acts if a.get("facet"))
        output[track] = {
            "count": len(acts),
            "progress": progress_pct(len(acts), track_targets[track]),
            "facets": dict(facet_count),
        }
    return output


def main() -> None:
    now = datetime.now(TZ)
    today = now.date()
    week_start = today - timedelta(days=6)

    today_activities: list[dict] = []
    weekly_activities: list[dict] = []

    if not SESSIONS.exists():
        raise SystemExit(f"Sessions dir not found: {SESSIONS}")

    for p in sorted(SESSIONS.glob("*.jsonl")):
        try:
            for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
                if not line.strip():
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                if obj.get("type") != "message":
                    continue

                dt = parse_timestamp(obj)
                if not dt or dt.date() < week_start or dt.date() > today:
                    continue

                msg = obj.get("message", {})
                if msg.get("role") != "user":
                    continue

                text = clean_text(extract_text(msg.get("content")))
                if len(text) < 2:
                    continue

                track, facet = map_track_and_facet(text)
                act = {
                    "timestamp": dt.isoformat(),
                    "text": text[:220],
                    "category": track or "其他",
                    "track": track,
                    "facet": facet,
                    "priority": infer_priority(text),
                    "source": p.name,
                }
                weekly_activities.append(act)
                if dt.date() == today:
                    today_activities.append(act)
        except Exception:
            continue

    today_clean = dedupe(today_activities)
    weekly_clean = dedupe(weekly_activities)

    top_track = Counter(a["track"] for a in today_clean if a.get("track")).most_common(1)
    focus = top_track[0][0] if top_track else "balanced"

    payload = {
        "generatedAt": now.isoformat(),
        "date": str(today),
        "summary": {
            "activityCount": len(today_clean),
            "topFocus": focus,
        },
        "activities": today_clean[-140:],
        "weeklyTracks": build_weekly_tracks(weekly_clean),
        "meta": {
            "localOnly": True,
            "version": "v4",
            "source": str(SESSIONS),
        },
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
