const CHECKLIST_KEY = 'selfos.v4.checklists';

const TRACKS = {
  research: {
    id: 'research',
    name: 'Research',
    zh: '研究',
    subtitle: '论文阅读 · 实验推进 · 输出写作',
    checklist: [
      'Read 1 paper / 阅读 1 篇论文',
      'Run or refine 1 experiment / 推进 1 个实验',
      'Write research notes (>=100 words) / 写研究笔记'
    ]
  },
  english: {
    id: 'english',
    name: 'English',
    zh: '英语',
    subtitle: '词汇 · 听力 · 口语 · 写作',
    checklist: [
      'Review 15 vocab words / 复习 15 个单词',
      'Listening 20+ mins / 听力 20+ 分钟',
      'Speaking or shadowing 10+ mins / 口语跟读 10+ 分钟',
      'Write 1 short paragraph / 写 1 段英文'
    ]
  },
  fitness: {
    id: 'fitness',
    name: 'Fitness',
    zh: '健身',
    subtitle: '训练 · 步数/时长 · 恢复',
    checklist: [
      'Workout 20+ mins / 训练 20+ 分钟',
      'Reach step/duration target / 达成步数或运动时长',
      'Mobility or stretch 5+ mins / 拉伸恢复 5+ 分钟'
    ]
  }
};

const FACETS = {
  research: ['papers read', 'experiments', 'writing'],
  english: ['vocab', 'listening', 'speaking', 'writing'],
  fitness: ['workouts', 'steps/duration']
};

let allActivities = [];
let activeTrack = 'all';

function fmtTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function cleanText(text = '') {
  return String(text).replace(/\s+/g, ' ').trim();
}

function escapeHtml(input = '') {
  return String(input)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function trackFromText(text = '', category = '') {
  const low = `${text} ${category}`.toLowerCase();
  if (/(paper|论文|research|实验|experiment|benchmark|写作|writing|arxiv|review)/.test(low)) return 'research';
  if (/(english|英语|vocab|word|listening|shadowing|speak|speaking|ielts|toefl|作文)/.test(low)) return 'english';
  if (/(fitness|workout|gym|run|walk|steps|步数|训练|健身|拉伸|cardio|duration|exercise)/.test(low)) return 'fitness';
  return null;
}

function parseData(raw) {
  const src = raw || {};
  const activities = (Array.isArray(src.activities) ? src.activities : [])
    .map((a) => {
      const text = cleanText(a.text || a.title || '');
      const category = String(a.category || '其他');
      const track = a.track || trackFromText(text, category);
      return {
        timestamp: a.timestamp || a.ts || '',
        text,
        category,
        track,
        facet: a.facet || null
      };
    })
    .filter((a) => a.text)
    .sort((x, y) => (x.timestamp < y.timestamp ? -1 : 1));

  return {
    generatedAt: src.generatedAt || new Date().toISOString(),
    activities,
    weeklyTracks: src.weeklyTracks || {}
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadChecklistState() {
  try {
    return JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveChecklistState(state) {
  localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state));
}

function getTrackStats(trackId, activities, checklistState, weeklyTracks = {}) {
  const list = activities.filter((a) => a.track === trackId);
  const doneItems = (checklistState?.[todayKey()]?.[trackId] || []).filter((i) => i.done).length;
  const totalItems = (checklistState?.[todayKey()]?.[trackId] || []).length || TRACKS[trackId].checklist.length;
  const activityProgress = Math.min(100, list.length * 20);
  const checklistProgress = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;
  const daily = Math.max(activityProgress, checklistProgress);

  const weekly = weeklyTracks?.[trackId]?.progress ?? Math.min(100, list.length * 12);

  return {
    daily,
    weekly,
    count: list.length,
    doneItems,
    totalItems
  };
}

function renderGoalCards(activities, checklistState, weeklyTracks) {
  const el = document.getElementById('goalCards');
  const cards = ['research', 'english', 'fitness'].map((id) => {
    const stat = getTrackStats(id, activities, checklistState, weeklyTracks);
    return `
      <article class="card goal-card">
        <h2>${TRACKS[id].name} · ${TRACKS[id].zh}</h2>
        <p class="goal-meta">今日 ${stat.doneItems}/${stat.totalItems} checklist · 自动摄取 ${stat.count} 条活动</p>

        <div class="progress-row">
          <div class="progress-head"><span>Checklist 进度</span><strong>${stat.doneItems}/${stat.totalItems}</strong></div>
          <div class="meter"><div class="meter-fill" style="width:${Math.round((stat.doneItems / Math.max(stat.totalItems, 1)) * 100)}%"></div></div>
        </div>

        <div class="progress-row">
          <div class="progress-head"><span>Daily 总进度</span><strong>${stat.daily}%</strong></div>
          <div class="meter"><div class="meter-fill" style="width:${stat.daily}%"></div></div>
        </div>

        <div class="goal-stats"><span>Weekly ${stat.weekly}%</span><span>活动 ${stat.count} 条</span></div>
        <span class="badge">${FACETS[id].join(' · ')}</span>
      </article>
    `;
  }).join('');

  el.innerHTML = cards;
}

function ensureChecklistSeed(state) {
  const day = todayKey();
  state[day] = state[day] || {};
  ['research', 'english', 'fitness'].forEach((trackId) => {
    if (!Array.isArray(state[day][trackId]) || !state[day][trackId].length) {
      state[day][trackId] = TRACKS[trackId].checklist.map((text, idx) => ({ id: `${trackId}-${idx}`, text, done: false }));
    }
  });
  return state;
}

function renderTrackSections(activities, checklistState, weeklyTracks) {
  const day = todayKey();
  const holder = document.getElementById('trackSections');

  holder.innerHTML = ['research', 'english', 'fitness'].map((trackId) => {
    const track = TRACKS[trackId];
    const items = checklistState[day][trackId] || [];
    const stat = getTrackStats(trackId, activities, checklistState, weeklyTracks);
    const checklistPercent = Math.round((stat.doneItems / Math.max(stat.totalItems, 1)) * 100);
    return `
      <article class="card track-card" data-track="${trackId}">
        <h3>${track.name} · ${track.zh}</h3>
        <p class="track-sub">${track.subtitle}</p>
        <div class="track-progress-label">已完成 <strong>${stat.doneItems}/${stat.totalItems}</strong> · ${checklistPercent}%</div>
        <div class="meter"><div class="meter-fill" style="width:${checklistPercent}%"></div></div>
        <ul class="checklist">
          ${items.map((it, idx) => `
            <li class="item">
              <label>
                <input type="checkbox" data-track="${trackId}" data-idx="${idx}" ${it.done ? 'checked' : ''}>
                <span>${escapeHtml(it.text)}</span>
              </label>
            </li>
          `).join('')}
        </ul>
        <form class="inline-form" data-track="${trackId}">
          <input type="text" maxlength="120" placeholder="添加一条 ${track.name} 任务..." />
          <button type="submit">添加</button>
        </form>
        <p class="small-note">本地编辑（localStorage），不会上传。</p>
      </article>
    `;
  }).join('');

  holder.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', (e) => {
      const track = e.target.dataset.track;
      const idx = Number(e.target.dataset.idx);
      checklistState[day][track][idx].done = e.target.checked;
      saveChecklistState(checklistState);
      renderGoalCards(allActivities, checklistState, weeklyTracks);
      renderTrackSections(allActivities, checklistState, weeklyTracks);
    });
  });

  holder.querySelectorAll('.inline-form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const trackId = form.dataset.track;
      const input = form.querySelector('input');
      const text = input.value.trim();
      if (!text) return;
      checklistState[day][trackId].push({ id: `${trackId}-${Date.now()}`, text, done: false });
      saveChecklistState(checklistState);
      input.value = '';
      renderGoalCards(allActivities, checklistState, weeklyTracks);
      renderTrackSections(allActivities, checklistState, weeklyTracks);
    });
  });
}

function setFocus(activities) {
  const count = { research: 0, english: 0, fitness: 0 };
  activities.forEach((a) => { if (a.track && count[a.track] !== undefined) count[a.track] += 1; });
  const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
  const label = top && top[1] ? TRACKS[top[0]].name : 'Balanced Day';
  document.getElementById('todayFocus').textContent = `今日主线：${label}（自动从本地会话映射）`;
}

function renderTimelineFilters(activities) {
  const options = ['all', 'research', 'english', 'fitness', 'other'];
  const labels = { all: '全部', research: 'Research', english: 'English', fitness: 'Fitness', other: '其他' };
  const holder = document.getElementById('timelineFilters');
  holder.innerHTML = options.map((k) => `<button class="chip ${activeTrack === k ? 'active' : ''}" data-track="${k}">${labels[k]}</button>`).join('');
  holder.querySelectorAll('.chip').forEach((c) => {
    c.addEventListener('click', () => {
      activeTrack = c.dataset.track;
      renderTimeline(activities);
      renderTimelineFilters(activities);
    });
  });
}

function renderTimeline(activities) {
  const filtered = activities.filter((a) => {
    if (activeTrack === 'all') return true;
    if (activeTrack === 'other') return !a.track;
    return a.track === activeTrack;
  });

  document.getElementById('timelineMeta').textContent = `${filtered.length} 条`;
  const list = document.getElementById('timeline');
  if (!filtered.length) {
    list.innerHTML = '<li>暂无匹配记录。</li>';
    return;
  }

  list.innerHTML = filtered.slice(-80).reverse().map((a) => `
    <li>
      <div class="row-top"><span class="time">${fmtTime(a.timestamp)}</span><span class="tag">${escapeHtml(a.track || a.category)}</span></div>
      <div>${escapeHtml(a.text.slice(0, 160))}</div>
    </li>
  `).join('');
}

async function loadData() {
  for (const path of ['./data/journal.json', './data/extracted_today.json']) {
    try {
      const res = await fetch(`${path}?_=${Date.now()}`);
      if (!res.ok) continue;
      const data = await res.json();
      return parseData(data);
    } catch (_) {}
  }
  return parseData({ activities: [] });
}

async function main() {
  const data = await loadData();
  allActivities = data.activities;

  let checklistState = ensureChecklistSeed(loadChecklistState());
  saveChecklistState(checklistState);

  setFocus(allActivities);
  renderGoalCards(allActivities, checklistState, data.weeklyTracks);
  renderTrackSections(allActivities, checklistState, data.weeklyTracks);
  renderTimelineFilters(allActivities);
  renderTimeline(allActivities);

  document.getElementById('genInfo').textContent = `更新于：${new Date(data.generatedAt).toLocaleString('zh-CN')} · local-only JSON + localStorage`;
}

document.getElementById('refreshBtn').addEventListener('click', () => location.reload());
main();
