const REFLECTION_KEY = 'selfos.reflection';
const GOAL_STATE_KEY = 'selfos.goalState';

function fmtTime(iso) {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function renderStats(data) {
  const stats = document.getElementById('stats');
  const goals = data.goals || [];
  const done = goals.filter(g => g.done).length;
  const cards = [
    ['今日活动', data.activities?.length || 0],
    ['学习条目', data.learning?.length || 0],
    ['完成目标', `${done}/${goals.length}`],
    ['专注方向', data.summary?.topFocus || '综合推进']
  ];
  stats.innerHTML = cards.map(([k,v]) => `<div class="stat"><div class="label">${k}</div><div class="value">${v}</div></div>`).join('');
}

function renderTimeline(data) {
  const el = document.getElementById('timeline');
  const items = (data.activities || []).slice(0, 30);
  if (!items.length) {
    el.innerHTML = '<li>今天还没有抓取到活动数据，先运行一次 ingest 脚本。</li>';
    return;
  }
  el.innerHTML = items.map(i => `<li><span class="time">${fmtTime(i.timestamp)}</span>${i.text}<span class="tag">${i.category}</span></li>`).join('');
}

function renderLearning(data) {
  const el = document.getElementById('learning');
  const items = data.learning || [];
  el.innerHTML = items.length ? items.map(i => `<li>${i}</li>`).join('') : '<li>暂无学习提炼</li>';
}

function renderGoals(data) {
  const saved = JSON.parse(localStorage.getItem(GOAL_STATE_KEY) || '{}');
  const goals = (data.goals || []).map((g, idx) => ({ ...g, done: saved[idx] ?? g.done ?? false }));
  data.goals = goals;
  const el = document.getElementById('goals');
  el.innerHTML = goals.map((g, idx) => `
    <li>
      <label>
        <input type="checkbox" data-idx="${idx}" ${g.done ? 'checked' : ''} />
        <span>${g.text}</span>
      </label>
    </li>
  `).join('');

  el.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const i = e.target.dataset.idx;
      saved[i] = e.target.checked;
      localStorage.setItem(GOAL_STATE_KEY, JSON.stringify(saved));
    });
  });
}

async function main() {
  const res = await fetch('./data/journal.json?_=' + Date.now());
  const data = await res.json();
  renderStats(data);
  renderTimeline(data);
  renderLearning(data);
  renderGoals(data);

  const ta = document.getElementById('reflection');
  ta.value = localStorage.getItem(REFLECTION_KEY) || '';
  ta.addEventListener('input', () => localStorage.setItem(REFLECTION_KEY, ta.value));

  document.getElementById('genInfo').textContent = `数据更新于：${new Date(data.generatedAt).toLocaleString('zh-CN')}`;
}

document.getElementById('refreshBtn').addEventListener('click', () => location.reload());
main().catch(err => {
  document.getElementById('timeline').innerHTML = `<li>加载失败：${err.message}</li>`;
});
