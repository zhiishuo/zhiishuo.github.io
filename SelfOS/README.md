# SelfOS V3（本地个人成长系统）

SelfOS V3 是一个 **local-only** 的个人成长仪表盘，重点解决 V2 用户反馈：
- 信息层级更清晰：顶部总览，中部目标与进展，底部时间线
- 时间线不再占主屏，改为可折叠的精简卡片
- UI 更干净、留白更合理、移动端更易读

## V3 主要更新

1. **新增「真实活动总结」**
   - 基于 `data/journal.json` 本地活动数据
   - 自动生成 3-6 条中文要点（分类 + 时段 + 活动密度）
   - 不调用任何外部 API

2. **重构信息结构**
   - **顶部**：真实活动总结 + 关键指标 + 完成率环形图/进度条
   - **中部**：自动目标面板 + 进展详情 + 快速记录
   - **底部**：可折叠时间线（支持分类筛选，默认不抢占注意力）

3. **升级目标模型（自动生成）**
   - 从当日活动分类自动推断目标
   - 带优先级（高/中/低）和现实完成标准
   - 展示目标数量、完成率、每项目标进度（x/y）

4. **视觉与可用性优化**
   - 更高文字对比、卡片弱阴影、简化边框
   - 更稳定的响应式布局，手机端控件尺寸与排版优化

## 目录

- `index.html`, `styles.css`, `app.js`：V3 前端
- `scripts/ingest_conversations.py`：主 ingestion（生成 `journal.json`）
- `scripts/ingest_sessions.py`：兼容脚本
- `data/journal.json`：前端优先读取
- `data/extracted_today.json`：回退读取（兼容旧流程）

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

## 数据与隐私

- **local-only**：仅使用本地 JSON + 浏览器 localStorage
- 不调用外部服务、不上传日志
- 目标勾选和快速记录仅保存在当前浏览器
