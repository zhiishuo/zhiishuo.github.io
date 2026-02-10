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

CATEGORY_KEYWORDS = {
    "研究": ["论文", "paper", "emotion", "情感", "模型", "benchmark", "sota", "检索"],
    "开发": ["代码", "debug", "bug", "python", "脚本", "app", "部署", "github", "前端"],
    "运维": ["gateway", "配置", "权限", "终端", "restart", "status", "日志", "服务"],
    "沟通": ["imessage", "消息", "聊天", "手机", "email", "邮件"],
}
LEARNING_TRIGGERS = ["如何", "怎么", "能不能", "为什么", "what", "how", "对比", "区别", "总结", "learn"]
DEEP_WORK_HINTS = ["深度", "专注", "45", "阅读", "写作", "设计", "编码", "coding", "research"]


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
                continue
            if not isinstance(item, dict):
                continue
            if item.get("type") in {"text", "input_text", "output_text"}:
                t = item.get("text")
                if t:
                    parts.append(str(t))
            elif isinstance(item.get("content"), str):
                parts.append(item["content"])
        return "\n".join(p.strip() for p in parts if p and p.strip()).strip()

    return ""


def parse_timestamp(obj: dict) -> datetime | None:
    candidates = [
        obj.get("timestamp"),
        obj.get("message", {}).get("timestamp"),
    ]
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
    t = re.sub(r"\[\[\s*reply_to_current\s*\]\]", "", text, flags=re.I)
    t = re.sub(r"\[message_id:[^\]]+\]", "", t, flags=re.I)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def classify(text: str) -> str:
    low = text.lower()
    for c, kws in CATEGORY_KEYWORDS.items():
        if any(kw.lower() in low for kw in kws):
            return c
    return "其他"


def infer_priority(text: str) -> str:
    low = text.lower()
    if any(k in low for k in ["紧急", "关键", "高优", "urgent", "important", "p0"]):
        return "high"
    if any(k in low for k in ["低优", "次要", "later", "p2"]):
        return "low"
    return "medium"


def build_weekly_summary(weekly_activities: list[dict], goals: list[dict], today_activities: list[dict]) -> dict:
    active_days = len({a["timestamp"][:10] for a in weekly_activities if a.get("timestamp")})

    cat_counter = Counter(a.get("category", "其他") for a in weekly_activities)
    top_category = cat_counter.most_common(1)[0][0] if cat_counter else "综合推进"

    deep_work_sessions = 0
    for a in weekly_activities:
        low = a.get("text", "").lower()
        if any(k in low for k in DEEP_WORK_HINTS):
            deep_work_sessions += 1

    done = sum(1 for g in goals if g.get("done"))
    completion_rate = round((done / len(goals)) * 100) if goals else 0

    return {
        "activeDays": active_days,
        "totalActivities": len(weekly_activities),
        "topCategory": top_category,
        "deepWorkSessions": deep_work_sessions,
        "completionRate": completion_rate,
        "todayCount": len(today_activities),
    }


def main() -> None:
    now = datetime.now(TZ)
    today = now.date()
    week_start = today - timedelta(days=6)

    today_activities: list[dict] = []
    weekly_activities: list[dict] = []
    user_msgs: list[str] = []

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
                role = msg.get("role", "")
                if role != "user":
                    continue

                text = clean_text(extract_text(msg.get("content")))
                if len(text) < 2:
                    continue

                act = {
                    "timestamp": dt.isoformat(),
                    "text": text[:220],
                    "category": classify(text),
                    "priority": infer_priority(text),
                    "source": p.name,
                }
                weekly_activities.append(act)
                user_msgs.append(text)

                if dt.date() == today:
                    today_activities.append(act)
        except Exception:
            continue

    # dedupe by minute+text
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

    today_clean = dedupe(today_activities)
    weekly_clean = dedupe(weekly_activities)

    learning = []
    for t in user_msgs:
        if any(k.lower() in t.lower() for k in LEARNING_TRIGGERS):
            t = re.sub(r"\s+", " ", t).strip()
            if t and t not in learning:
                learning.append(t[:180])

    category_count = Counter(a["category"] for a in today_clean)
    top_focus = category_count.most_common(1)[0][0] if category_count else "综合推进"

    goals = [
        {"text": "完成 1 次深度学习（>=45 分钟）", "done": False, "priority": "high"},
        {"text": "沉淀 3 条可复用知识点", "done": False, "priority": "medium"},
        {"text": "推进 1 个长期项目的关键一步", "done": False, "priority": "high"},
        {"text": "睡前 5 分钟复盘", "done": False, "priority": "low"},
    ]

    payload = {
        "generatedAt": now.isoformat(),
        "date": str(today),
        "summary": {
            "activityCount": len(today_clean),
            "topFocus": top_focus,
        },
        "activities": today_clean[-120:],
        "learning": learning[:12],
        "goals": goals,
        "weeklySummary": build_weekly_summary(weekly_clean, goals, today_clean),
        "meta": {
            "localOnly": True,
            "version": "v2",
            "source": str(SESSIONS),
        },
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
