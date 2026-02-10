const $ = (id) => document.getElementById(id);
const today = new Date();
$("todayLabel").textContent = today.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

$("refreshHintBtn").addEventListener("click", () => {
  alert("Refresh is done from terminal: npm run refresh (or python3 scripts/ingest_sessions.py)");
});

async function load() {
  const [stateRes, extractedRes] = await Promise.all([
    fetch("./data/state.json", { cache: "no-store" }),
    fetch("./data/extracted_today.json", { cache: "no-store" }),
  ]);
  const state = await stateRes.json();
  const extracted = await extractedRes.json();

  const learningItems = [...(state.learningLog || []), ...(extracted.learning || [])]
    .sort((a, b) => (b.ts || "").localeCompare(a.ts || ""));
  const timelineItems = [...(state.timeline || []), ...(extracted.timeline || [])]
    .sort((a, b) => (b.ts || "").localeCompare(a.ts || ""));

  renderGoals(state.goals || []);
  renderLearning(learningItems);
  renderTimeline(timelineItems);
  renderStreaks(state.streaks || {});

  $("activityCount").textContent = (state.activities || []).length + (extracted.activities || []).length;
  $("learningCount").textContent = learningItems.length;
  $("goalCount").textContent = (state.goals || []).filter(g => g.status !== "done").length;
  $("bestStreak").textContent = `${Math.max(state.streaks?.learningStreak || 0, state.streaks?.activityStreak || 0)} days`;
  $("lastSync").textContent = `Last sync: ${state.lastUpdated || extracted.generatedAt || "Never"}`;
}

function renderGoals(goals) {
  const list = $("goalList");
  list.innerHTML = "";
  if (!goals.length) return empty(list);
  goals.forEach(g => {
    const li = document.createElement("li");
    const chipClass = g.status === "blocked" ? "goal-chip blocked" : "goal-chip";
    li.innerHTML = `<strong>${escape(g.title)}</strong> <span class="${chipClass}">${escape(g.status || "active")}</span><div class="muted">${escape(g.note || "")}</div>`;
    list.appendChild(li);
  });
}

function renderLearning(items) {
  const list = $("learningList");
  list.innerHTML = "";
  if (!items.length) return empty(list);
  items.slice(0, 30).forEach(it => {
    const li = document.createElement("li");
    li.innerHTML = `<div><strong>${escape(it.title || "Learning")}</strong></div><div class="muted">${escape(it.note || it.text || "")}</div>`;
    list.appendChild(li);
  });
}

function renderTimeline(items) {
  const list = $("timelineList");
  list.innerHTML = "";
  if (!items.length) return empty(list);
  items.slice(0, 50).forEach(it => {
    const li = document.createElement("li");
    const time = new Date(it.ts || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    li.innerHTML = `<div class="time">${time}</div><div>${escape(it.text || it.title || "")}</div>`;
    list.appendChild(li);
  });
}

function renderStreaks(streaks) {
  const list = $("streakList");
  list.innerHTML = "";
  const entries = [
    ["Learning", streaks.learningStreak || 0],
    ["Activity", streaks.activityStreak || 0],
  ];
  entries.forEach(([k, v]) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${k}</strong>: ${v} day${v === 1 ? "" : "s"}`;
    list.appendChild(li);
  });
}

function empty(parent) {
  parent.appendChild(document.getElementById("emptyTemplate").content.cloneNode(true));
}

function escape(str) {
  return String(str).replace(/[&<>"]/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s]));
}

load().catch((err) => {
  console.error(err);
  $("lastSync").textContent = `Failed loading data: ${err.message}`;
});
