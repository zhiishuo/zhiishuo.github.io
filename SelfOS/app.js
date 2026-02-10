const GOAL_STATE_KEY = 'selfos.v3.goalState';
const QUICK_NOTES_KEY = 'selfos.v3.quickNotes';

let activeCategory = '全部';
let allActivities = [];
let currentGoals = [];

function fmtTime(iso) {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '--:--'
    : d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function normalizeData(raw) {
  const src = raw || {};
  let activities = Array.isArray(src.activities) ? src.activities : [];

  if (!activities.length && Array.isArray(src.timeline)) {
    activities = src.timeline.map((t) => ({
      timestamp: t.ts || t.timestamp,
      text: t.text || '',
      category: t.category || (t.role === 'user' ? '沟通' : '其他'),
      priority: t.priority || 'medium'
    }));
  }

  activities = activities
    .map((a) => ({
      timestamp: a.timestamp || a.ts || '',
      text: String(a.text || a.title || '').trim(),
      category: String(a.category || '其他').trim() || '其他',
      priority: String(a.priority || 'medium').toLowerCase()
    }))
    .filter((a) => a.text)
    .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));

  return {
    generatedAt: src.generatedAt || new Date().toISOString(),
    summary: src.summary || {},
    activities,
    weeklySummary: src.weeklySummary || {}
  };
}

function buildSummaryBullets(activities) {
  if (!activities.length) return ['今天暂无可分析活动。'];

  const categoryMap = new Map();
  const periodMap = new Map([['上午', 0], ['下午', 0], ['晚上', 0], ['深夜', 0]]);

  activities.forEach((a) => {
    const c = categoryMap.get(a.category) || { count: 0, first: a.timestamp, last: a.timestamp, sample: a.text };
    c.count += 1;
    c.first = c.first && c.first < a.timestamp ? c.first : a.timestamp;
    c.last = c.last && c.last > a.timestamp ? c.last : a.timestamp;
    if (!c.sample || c.sample.length < 16) c.sample = a.text;
    categoryMap.set(a.category, c);

    const h = new Date(a.timestamp).getHours();
    const p = h < 12 ? '上午' : h < 18 ? '下午' : h < 24 ? '晚上' : '深夜';
    periodMap.set(p, (periodMap.get(p) || 0) + 1);
  });

  const topCats = [...categoryMap.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 3);
  const topPeriods = [...periodMap.entries()].sort((a, b) => b[1] - a[1]).filter((p) => p[1] > 0);

  const bullets = [];
  topCats.forEach(([cat, stat]) => {
    const sample = cleanText(stat.sample).slice(0, 26);
    bullets.push(`${cat}在 ${fmtTime(stat.first)}–${fmtTime(stat.last)} 最集中，共 ${stat.count} 条，主题偏向“${sample}”。`);
  });

  if (topPeriods[0]) bullets.push(`节奏峰值在${topPeriods[0][0]}（${topPeriods[0][1]}条活动），建议把高优任务继续放在该时段。`);

  const highCount = activities.filter((a) => a.priority === 'high').length;
  bullets.push(`今日共记录 ${activities.length} 条活动，其中高优先级 ${highCount} 条。`);

  return bullets.slice(0, 6);
}

function inferGoalsFromActivities(activities) {
  const grouped = new Map();
  activities.forEach((a) => grouped.set(a.category, (grouped.get(a.category) || 0) + 1));

  const top = [...grouped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const templates = {
    开发: { action: '完成 1 次可运行改动', stepUnit: 8, base: 1 },
    研究: { action: '沉淀 3 条可复用结论', stepUnit: 7, base: 1 },
    沟通: { action: '完成 2 次高质量沟通闭环', stepUnit: 10, base: 1 },
    运维: { action: '完成 1 次稳定性检查与修复', stepUnit: 6, base: 1 },
    其他: { action: '整理并归档 6 条关键事项', stepUnit: 12, base: 1 }
  };

  const goals = top.map(([cat, count], idx) => {
    const t = templates[cat] || templates.其他;
    const target = Math.max(t.base, Math.min(4, Math.round(count / t.stepUnit)));
    const progress = Math.min(target, Math.round(count / t.stepUnit));
    return {
      id: `${cat}-${idx}`,
      title: `${cat}：${t.action}`,
      criteria: `现实标准：围绕「${cat}」完成 ${target} 个有效推进单元（当前推断 ${progress}/${target}）。`,
      priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
      progress,
      target,
      doneAuto: progress >= target
    };
  });

  if (!goals.length) {
    goals.push({
      id: 'default-0',
      title: '综合推进：完成 1 次 25 分钟专注复盘',
      criteria: '现实标准：完成一次专注时段并写下结果。',
      priority: 'medium',
      progress: 0,
      target: 1,
      doneAuto: false
    });
  }

  return goals;
}

function renderSummary(activities) {
  const bullets = buildSummaryBullets(activities);
  document.getElementById('activitySummary').innerHTML = bullets
    .map((b) => `<li>${escapeHtml(b)}</li>`)
    .join('');
}

function renderMetrics(activities, goals) {
  const completed = goals.filter((g) => g.done).length;
  const completion = goals.length ? Math.round((completed / goals.length) * 100) : 0;
  const categories = new Set(activities.map((a) => a.category)).size;
  const highPriority = activities.filter((a) => a.priority === 'high').length;

  const cards = [
    ['活动总数', activities.length],
    ['分类数', categories],
    ['高优先活动', highPriority],
    ['目标达成', `${completed}/${goals.length}`]
  ];

  document.getElementById('metrics').innerHTML = cards
    .map(([k, v]) => `<div class="metric"><div class="label">${k}</div><div class="value">${v}</div></div>`)
    .join('');

  updateCompletion(completion, completed, goals.length);
}

function updateCompletion(percent, done, total) {
  document.getElementById('completionPercent').textContent = `${percent}%`;
  document.getElementById('completionCount').textContent = `${done} / ${total} 已完成`;
  document.getElementById('completionBar').style.width = `${percent}%`;
  document.getElementById('completionRing').style.background = `conic-gradient(var(--accent) ${percent * 3.6}deg, #e8edf3 0deg)`;
}

function renderGoals(goals) {
  const saved = JSON.parse(localStorage.getItem(GOAL_STATE_KEY) || '{}');
  currentGoals = goals.map((g) => ({ ...g, done: saved[g.id] ?? g.doneAuto }));

  const el = document.getElementById('goals');
  el.innerHTML = currentGoals
    .map((g) => `
      <li class="goal-item">
        <div class="goal-top">
          <label>
            <input type="checkbox" data-id="${g.id}" ${g.done ? 'checked' : ''} />
            <span class="goal-title">${escapeHtml(g.title)}</span>
          </label>
          <span class="priority ${g.priority}">${priorityLabel(g.priority)}</span>
        </div>
        <p class="goal-criteria">${escapeHtml(g.criteria)}</p>
        <div class="progress-track"><div class="progress-fill" style="width:${Math.round((g.progress / g.target) * 100)}%"></div></div>
        <div class="goal-progress">进度：${g.progress}/${g.target}</div>
      </li>
    `)
    .join('');

  el.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      saved[id] = e.target.checked;
      localStorage.setItem(GOAL_STATE_KEY, JSON.stringify(saved));
      const target = currentGoals.find((g) => g.id === id);
      if (target) target.done = e.target.checked;
      renderMetrics(allActivities, currentGoals);
      renderProgressDetails(allActivities, currentGoals);
    });
  });

  return currentGoals;
}

function renderProgressDetails(activities, goals) {
  const byCategory = {};
  activities.forEach((a) => { byCategory[a.category] = (byCategory[a.category] || 0) + 1; });
  const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const done = goals.filter((g) => g.done).length;
  const completion = goals.length ? Math.round((done / goals.length) * 100) : 0;

  const first = activities[0]?.timestamp;
  const last = activities[activities.length - 1]?.timestamp;

  const details = [
    ['今日活跃窗口', first && last ? `${fmtTime(first)} - ${fmtTime(last)}` : '暂无'],
    ['目标完成率', `${completion}%（${done}/${goals.length}）`],
    ['当前主线', top.map(([k, v]) => `${k}(${v})`).join(' · ') || '暂无']
  ];

  document.getElementById('progressDetails').innerHTML = details
    .map(([k, v]) => `<div class="detail-item"><div class="k">${k}</div><div class="v">${escapeHtml(v)}</div></div>`)
    .join('');
}

function renderTimelineFilters(activities) {
  const categories = ['全部', ...new Set(activities.map((a) => a.category))];
  const holder = document.getElementById('timelineFilters');
  holder.innerHTML = categories
    .map((c) => `<button class="chip ${c === activeCategory ? 'active' : ''}" data-cat="${c}">${c}</button>`)
    .join('');

  holder.querySelectorAll('.chip').forEach((el) => {
    el.addEventListener('click', () => {
      activeCategory = el.dataset.cat;
      renderTimeline(allActivities);
      renderTimelineFilters(allActivities);
    });
  });
}

function renderTimeline(activities) {
  const filtered = activeCategory === '全部'
    ? activities
    : activities.filter((a) => a.category === activeCategory);

  document.getElementById('timelineMeta').textContent = `${filtered.length} 条`;

  const el = document.getElementById('timeline');
  if (!filtered.length) {
    el.innerHTML = '<li>暂无匹配活动，试试切换筛选。</li>';
    return;
  }

  el.innerHTML = filtered.slice(-40).reverse().map((a) => `
    <li>
      <div class="row-top"><span class="time">${fmtTime(a.timestamp)}</span><span class="tag">${escapeHtml(a.category)}</span></div>
      <div class="line-text">${escapeHtml(cleanText(a.text).slice(0, 140))}</div>
    </li>
  `).join('');
}

function renderQuickNotes() {
  const notes = JSON.parse(localStorage.getItem(QUICK_NOTES_KEY) || '[]');
  const list = document.getElementById('quickNotes');
  list.innerHTML = notes.length
    ? notes.map((n) => `<li>${escapeHtml(n.text)} <span class="time">${fmtTime(n.ts)}</span></li>`).join('')
    : '<li>还没有记录，先写一条吧。</li>';
}

function setupQuickNoteForm() {
  const form = document.getElementById('quickNoteForm');
  const input = document.getElementById('quickNoteInput');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const notes = JSON.parse(localStorage.getItem(QUICK_NOTES_KEY) || '[]');
    notes.unshift({ text, ts: new Date().toISOString() });
    localStorage.setItem(QUICK_NOTES_KEY, JSON.stringify(notes.slice(0, 30)));

    input.value = '';
    renderQuickNotes();
  });
}

function setTodayFocus(activities) {
  const categories = {};
  activities.forEach((a) => { categories[a.category] = (categories[a.category] || 0) + 1; });
  const topFocus = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || '综合推进';
  document.getElementById('todayFocus').textContent = `今日主线：${topFocus}（基于本地日志自动推断）`;
}

function cleanText(text = '') {
  return String(text)
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function priorityLabel(p) {
  if (p === 'high') return '高优先';
  if (p === 'low') return '低优先';
  return '中优先';
}

function escapeHtml(input = '') {
  return String(input)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function loadData() {
  const candidates = ['./data/journal.json', './data/extracted_today.json'];
  let lastErr;

  for (const p of candidates) {
    try {
      const res = await fetch(`${p}?_=${Date.now()}`);
      if (!res.ok) continue;
      return normalizeData(await res.json());
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error('未找到可用数据文件');
}

async function main() {
  const data = await loadData();
  allActivities = data.activities;

  setTodayFocus(allActivities);
  renderSummary(allActivities);

  const inferredGoals = inferGoalsFromActivities(allActivities);
  const goals = renderGoals(inferredGoals);

  renderMetrics(allActivities, goals);
  renderProgressDetails(allActivities, goals);

  renderTimelineFilters(allActivities);
  renderTimeline(allActivities);

  renderQuickNotes();
  setupQuickNoteForm();

  document.getElementById('genInfo').textContent = `更新于：${new Date(data.generatedAt).toLocaleString('zh-CN')} · local-only`;
}

document.getElementById('refreshBtn').addEventListener('click', () => location.reload());
main().catch((err) => {
  document.getElementById('activitySummary').innerHTML = `<li>加载失败：${escapeHtml(err.message)}</li>`;
});
