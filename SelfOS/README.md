# SelfOS（个人成长 App）

SelfOS 是一个本地优先的个人成长应用：
- 自动从 OpenClaw/iMessage 对话提取你“今天做了什么”
- 自动汇总学习线索
- 提供美观仪表盘查看活动、学习、目标与复盘

## 功能

- 今日活动时间线
- 学习提炼
- 本周目标（可勾选）
- 今日复盘（浏览器本地保存）
- JSON 本地数据持久化

## 目录

- `index.html`, `styles.css`, `app.js`：前端 UI
- `scripts/ingest_conversations.py`：对话抽取脚本
- `data/journal.json`：每日提取结果

## 刷新数据

```bash
cd /Users/zzs/.openclaw/workspace/SelfOS
python3 scripts/ingest_conversations.py
```

## 启动 App

```bash
cd /Users/zzs/.openclaw/workspace
python3 -m http.server 8787
# 打开 http://127.0.0.1:8787/SelfOS/
```

## 每日自动更新（cron）

```bash
crontab -e
```

加入：

```cron
30 22 * * * /usr/bin/python3 /Users/zzs/.openclaw/workspace/SelfOS/scripts/ingest_conversations.py >> /Users/zzs/.openclaw/workspace/SelfOS/data/ingest.log 2>&1
```

## 说明

- 数据均保存在本机。
- 无需重依赖，无需构建。
