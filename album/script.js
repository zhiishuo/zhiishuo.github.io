async function loadPhotos() {
  const res = await fetch('./data/photos.json');
  if (!res.ok) throw new Error('Failed to load album data');
  return await res.json();
}

function groupByMonth(items) {
  const groups = new Map();
  for (const item of items) {
    const key = `${item.year}-${String(item.month).padStart(2, '0')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function createMonthLabel(key) {
  const [year, month] = key.split('-');
  return `${year}.${month}`;
}

function renderNav(keys) {
  const nav = document.getElementById('monthNav');
  keys.forEach((key) => {
    const a = document.createElement('a');
    a.href = `#m-${key}`;
    a.textContent = createMonthLabel(key);
    nav.appendChild(a);
  });
}

function openLightbox(item) {
  const dialog = document.getElementById('lightbox');
  document.getElementById('lightboxImage').src = item.full;
  document.getElementById('lightboxDate').textContent = item.display_date;
  document.getElementById('lightboxName').textContent = item.file_name;
  dialog.showModal();
}

function renderGroups(items) {
  const root = document.getElementById('albumGroups');
  const groups = groupByMonth(items);
  const keys = [...groups.keys()];
  renderNav(keys);
  document.getElementById('photoCount').textContent = String(items.length);

  keys.forEach((key) => {
    const section = document.createElement('section');
    section.className = 'album-group';
    section.id = `m-${key}`;

    const head = document.createElement('div');
    head.className = 'album-group-head';
    const h2 = document.createElement('h2');
    h2.textContent = createMonthLabel(key);
    const p = document.createElement('p');
    p.textContent = `${groups.get(key).length} photos`;
    head.append(h2, p);

    const grid = document.createElement('div');
    grid.className = 'album-grid';

    groups.get(key).forEach((item) => {
      const button = document.createElement('button');
      button.className = 'album-card';
      button.type = 'button';
      button.addEventListener('click', () => openLightbox(item));

      const img = document.createElement('img');
      img.src = item.thumb;
      img.alt = `Photo taken on ${item.display_date}`;
      img.loading = 'lazy';

      const meta = document.createElement('div');
      meta.className = 'album-card-meta';
      const date = document.createElement('p');
      date.className = 'album-card-date';
      date.textContent = item.display_date;
      const name = document.createElement('p');
      name.className = 'album-card-name';
      name.textContent = item.file_name;
      meta.append(date, name);

      button.append(img, meta);
      grid.appendChild(button);
    });

    section.append(head, grid);
    root.appendChild(section);
  });
}

loadPhotos().then(renderGroups).catch((err) => {
  const root = document.getElementById('albumGroups');
  root.innerHTML = `<p>${err.message}</p>`;
});
