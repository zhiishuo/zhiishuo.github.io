# SelfOS V2（本地个人成长系统）

SelfOS V2 是一个 **local-only** 的极简成长仪表盘：
- Apple-like 简洁 UI，移动端优先适配
- 今日聚焦 / 核心指标 / 快速记录 / 时间线筛选 / 目标优先级 / 本周摘要
- 数据仅保存在本机（JSON + 浏览器 localStorage）

## 目录

- `index.html`, `styles.css`, `app.js`：V2 前端
- `scripts/ingest_conversations.py`：主 ingestion（增强鲁棒性，兼容现有会话数据）
- `scripts/ingest_sessions.py`：保留兼容脚本
- `data/journal.json`：前端优先读取
- `data/extracted_today.json`：前端回退读取（兼容旧流程）

## 快速开始

```bash
cd /Users/zzs/.openclaw/workspace/SelfOS
python3 scripts/ingest_conversations.py
```

```bash
cd /Users/zzs/.openclaw/workspace
python3 -m http.server 8787
```

打开：

`http://127.0.0.1:8787/SelfOS/`

## V2 数据说明

- **local-only**：不上传、不调用外部数据库
- 目标勾选状态、快速记录保存在浏览器 localStorage
- ingestion 会生成 `weeklySummary` 字段供周视图使用

## 兼容性

- 可继续使用原有 `journal.json` 数据结构
- 前端支持 `journal.json` 与 `extracted_today.json` 双数据源回退
- 可直接通过 `python3 -m http.server` 在 `/SelfOS/` 访问
