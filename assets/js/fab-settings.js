// assets/js/fab-settings.js
// Add <script src="/assets/js/fab-settings.js" defer></script> before </body>
(function(){
  const btn = document.getElementById('settingsBtn');
  const sheet = document.getElementById('settingsSheet');
  if(!btn || !sheet) return;
  const backdrop = document.getElementById('sheetBackdrop');
  const closeBtn = document.getElementById('closeSheet');
  const panel = sheet.querySelector('.sheet-panel');

  function openSheet(){
    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden','false');
    btn.setAttribute('aria-expanded','true');
    // 阻止背景滚动（移动端）
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    // 将焦点移到 panel 以便屏幕阅读器用户
    if(panel) panel.focus();
  }

  function closeSheet(){
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden','true');
    btn.setAttribute('aria-expanded','false');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    btn.focus();
  }

  btn.addEventListener('click', openSheet);
  if(closeBtn) closeBtn.addEventListener('click', closeSheet);
  if(backdrop) backdrop.addEventListener('click', closeSheet);

  // ESC 关闭
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && sheet.classList.contains('open')) closeSheet();
  });

  // 简单暗黑模式演示（记住设置到 localStorage）
  const darkToggle = document.getElementById('darkModeToggle');
  if(darkToggle){
    const apply = (on) => {
      document.documentElement.setAttribute('data-theme', on ? 'dark' : 'light');
    };
    const saved = localStorage.getItem('site-dark') === '1';
    darkToggle.checked = saved;
    apply(saved);
    darkToggle.addEventListener('change', () => {
      const on = darkToggle.checked;
      localStorage.setItem('site-dark', on ? '1' : '0');
      apply(on);
    });
  }

})();
