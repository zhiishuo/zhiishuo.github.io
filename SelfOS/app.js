const REFLECTION_KEY = 'selfos.v2.reflection';
const GOAL_STATE_KEY = 'selfos.v2.goalState';
const QUICK_NOTES_KEY = 'selfos.v2.quickNotes';

let activeCategory = '全部';
let allActivities = [];

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
      category: t.category || (t.role === 'user' ? '沟通' : '其他')
    }));
  }

  activities = activities
    .map((a) => ({
      timestamp: a.timestamp || a.ts || '',
      text: String(a.text || a.title || '').trim(),
      category: String(a.category || '其他').trim() || '其他'
    }))
    .filter((a) => a.text)
    .sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));

  const learning = Array.isArray(src.learning)
    ? src.learning.map((l) => (typeof l === 'string' ? l : l.note || l.title || '')).filter(Boolean)
    : [];

  const goals = Array.isArray(src.goals) ? src.goals : [];
  const weekly = src.weeklySummary || {};

  return {
    generatedAt: src.generatedAt || new Date().toISOString(),
    summary: src.summary || {},
    activities,
    learning,
    goals,
    weeklySummary: {
      activeDays: weekly.activeDays ?? 0,
      totalActivities: weekly.totalActivities ?? activities.length,
      topCategory: weekly.topCategory || src.summary?.topFocus || '综合推进',
      deepWorkSessions: weekly.deepWorkSessions ?? 0,
      completionRate: weekly.completionRate ?? 0
    }
  };
}

function renderMetrics(data) {
  const done = data.goals.filter((g) => g.done).length;
  const completion = data.goals.length ? Math.round((done / data.goals.length) * 100) : 0;
  const cards = [
    ['活动', data.activities.length],
    ['学习提炼', data.learning.length],
    ['目标完成', `${done}/${data.goals.length || 0}`],
    ['完成率', `${completion}%`]
  ];
  document.getElementById('metrics').innerHTML = cards
    .map(([k, v]) => `<div class="metric"><div class="label">${k}</div><div class="value">${v}</div></div>`)
    .join('');
}

function renderTimelineFilters(data) {
  const categories = ['全部', ...new Set(data.activities.map((a) => a.category))];
  const holder = document.getElementById('timelineFilters');
  holder.innerHTML = categories
    .map((c) => `<button class="chip ${c === activeCategory ? 'active' : ''}" data-cat="${c}">${c}</button>`)
    .join('');
  holder.querySelectorAll('.chip').forEach((el) => {
    el.addEventListener('click', () => {
      activeCategory = el.dataset.cat;
      renderTimeline(allActivities);
      renderTimelineFilters({ activities: allActivities });
    });
  });
}

function renderTimeline(activities) {
  const el = document.getElementById('timeline');
  const filtered = activeCategory === '全部'
    ? activities
    : activities.filter((a) => a.category === activeCategory);

  if (!filtered.length) {
    el.innerHTML = '<li>暂无匹配活动，试试切换筛选。</li>';
    return;
  }

  el.innerHTML = filtered.slice(0, 60).map((a) => `
    <li>
      <div class="row-top"><span class="time">${fmtTime(a.timestamp)}</span><span class="tag">${a.category}</span></div>
      <div class="line-text">${escapeHtml(a.text)}</div>
    </li>
  `).join('');
}

function detectPriority(text = '', explicitPriority = '') {
  const p = String(explicitPriority || '').toLowerCase();
  if (["high", "medium", "low"].includes(p)) return p;
  const t = text.toLowerCase();
  if (/(高优|紧急|关键|urgent|important|p0)/.test(t)) return 'high';
  if (/(低优|次要|later|p2)/.test(t)) return 'low';
  return 'medium';
}

function renderGoals(data) {
  const saved = JSON.parse(localStorage.getItem(GOAL_STATE_KEY) || '{}');
  data.goals = data.goals.map((g, idx) => ({
    ...g,
    text: g.text || g.title || `目标 ${idx + 1}`,
    done: saved[idx] ?? g.done ?? false,
    priority: detectPriority(g.text || g.title, g.priority)
  }));

  const el = document.getElementById('goals');
  if (!data.goals.length) {
    el.innerHTML = '<li>暂无目标数据</li>';
    return;
  }

  el.innerHTML = data.goals
    .map((g, idx) => `
      <li>
        <label>
          <input type="checkbox" data-idx="${idx}" ${g.done ? 'checked' : ''} />
          <span>${escapeHtml(g.text)}</span>
          <span class="priority ${g.priority}">${priorityLabel(g.priority)}</span>
        </label>
      </li>
    `)
    .join('');

  el.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', (e) => {
      const i = e.target.dataset.idx;
      saved[i] = e.target.checked;
      localStorage.setItem(GOAL_STATE_KEY, JSON.stringify(saved));
    });
  });

  return data.goals;
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

function renderWeeklySummary(data, goals = []) {
  const done = goals.filter((g) => g.done).length;
  const completionRate = data.weeklySummary.completionRate || (goals.length ? Math.round((done / goals.length) * 100) : 0);

  const items = [
    ['活跃天数（7天）', `${data.weeklySummary.activeDays} 天`],
    ['活动总数（7天）', `${data.weeklySummary.totalActivities}`],
    ['最聚焦方向', data.weeklySummary.topCategory],
    ['深度工作次数', `${data.weeklySummary.deepWorkSessions}`],
    ['目标完成率', `${completionRate}%`]
  ];

  document.getElementById('weeklySummary').innerHTML = items
    .map(([k, v]) => `<div class="summary-item"><div class="k">${k}</div><div class="v">${v}</div></div>`)
    .join('');
}

function setTodayFocus(data) {
  const focus = data.summary?.topFocus || data.weeklySummary?.topCategory || '综合推进';
  document.getElementById('todayFocus').textContent = `今日专注：${focus}`;
}

function priorityLabel(p) {
  if (p === 'high') return '高优先';
  if (p === 'low') return '低优先';
  return '中优先';
}

function escapeHtml(input = '') {
  return input
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
      const json = await res.json();
      return normalizeData(json);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('未找到可用数据文件');
}

async function main() {
  const data = await loadData();
  allActivities = data.activities;

  setTodayFocus(data);
  renderMetrics(data);
  renderTimelineFilters(data);
  renderTimeline(data.activities);
  const goals = renderGoals(data) || [];
  renderWeeklySummary(data, goals);
  renderQuickNotes();
  setupQuickNoteForm();

  document.getElementById('genInfo').textContent = `更新于：${new Date(data.generatedAt).toLocaleString('zh-CN')}`;
}

document.getElementById('refreshBtn').addEventListener('click', () => location.reload());
main().catch((err) => {
  document.getElementById('timeline').innerHTML = `<li>加载失败：${escapeHtml(err.message)}</li>`;
});
