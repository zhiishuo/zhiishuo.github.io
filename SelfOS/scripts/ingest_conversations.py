#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Asia/Shanghai")
ROOT = Path(__file__).resolve().parents[1]
SESSIONS = Path.home() / ".openclaw/agents/main/sessions"
OUT = ROOT / "data/journal.json"

CATEGORY_KEYWORDS = {
    "研究": ["论文", "paper", "emotion", "情感", "模型", "benchmark", "sota"],
    "开发": ["代码", "debug", "bug", "python", "脚本", "app", "部署", "github"],
    "运维": ["gateway", "配置", "权限", "终端", "restart", "status", "日志"],
    "沟通": ["imessage", "消息", "聊天", "手机"],
}
LEARNING_TRIGGERS = ["如何", "怎么", "能不能", "为什么", "what", "how", "对比", "区别", "总结"]


def extract_text(content) -> str:
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts = []
        for p in content:
            if isinstance(p, dict) and p.get("type") == "text":
                t = p.get("text", "")
                if t:
                    parts.append(t)
        return "\n".join(parts).strip()
    return ""


def classify(text: str) -> str:
    low = text.lower()
    for c, kws in CATEGORY_KEYWORDS.items():
        if any(kw.lower() in low for kw in kws):
            return c
    return "其他"


def main() -> None:
    today = datetime.now(TZ).date()
    activities: list[dict] = []
    user_msgs: list[str] = []

    for p in sorted(SESSIONS.glob("*.jsonl")):
        try:
            for line in p.read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                if obj.get("type") != "message":
                    continue
                ts = obj.get("timestamp") or obj.get("message", {}).get("timestamp")
                if not ts:
                    continue
                try:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone(TZ)
                except Exception:
                    continue
                if dt.date() != today:
                    continue

                msg = obj.get("message", {})
                role = msg.get("role", "")
                text = extract_text(msg.get("content"))
                text = re.sub(r"\[\[\s*reply_to_current\s*\]\]", "", text, flags=re.I).strip()
                if len(text) < 2:
                    continue

                if role == "user":
                    user_msgs.append(text)
                    activities.append(
                        {
                            "timestamp": dt.isoformat(),
                            "text": text[:180],
                            "category": classify(text),
                            "source": p.name,
                        }
                    )
        except Exception:
            continue

    seen = set()
    clean = []
    for a in sorted(activities, key=lambda x: x["timestamp"]):
        key = (a["text"], a["timestamp"][:16])
        if key in seen:
            continue
        seen.add(key)
        clean.append(a)

    learning = []
    for t in user_msgs:
        if any(k.lower() in t.lower() for k in LEARNING_TRIGGERS):
            t = re.sub(r"\s+", " ", t).strip()
            if t and t not in learning:
                learning.append(t[:180])

    category_count = {}
    for a in clean:
        category_count[a["category"]] = category_count.get(a["category"], 0) + 1
    top_focus = max(category_count, key=category_count.get) if category_count else "综合推进"

    payload = {
        "generatedAt": datetime.now(TZ).isoformat(),
        "date": str(today),
        "summary": {"activityCount": len(clean), "topFocus": top_focus},
        "activities": clean[-80:],
        "learning": learning[:12],
        "goals": [
            {"text": "完成 1 次深度学习（>=45 分钟）", "done": False},
            {"text": "沉淀 3 条可复用知识点", "done": False},
            {"text": "推进 1 个长期项目的关键一步", "done": False},
            {"text": "睡前 5 分钟复盘", "done": False},
        ],
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
