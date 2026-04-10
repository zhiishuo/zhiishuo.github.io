const i18n = {
  en: {
    nav_about: 'About', nav_research: 'Research', nav_news: 'News', nav_projects: 'Projects', nav_resume: 'Resume', nav_portfolio: 'Portfolio', nav_blog: 'Blog', nav_contact: 'Contact',
    hero_tag: "Hi, I'm", hero_subtitle: 'Ph.D. candidate in Computer Science, focusing on multimodal learning, affective computing, and robust speech understanding.',
    hero_meta_1: 'Multimodal Affective Computing', hero_meta_2: 'Audio-Visual Language Modeling', hero_meta_3: 'Robust Speech Intelligence',
    hero_btn_contact: 'Contact', hero_btn_projects: 'View Research',
    hero_role: 'Ph.D. Candidate · Sichuan University',
    hero_point_1: 'Research focus: multimodal sentiment and affective intelligence',
    hero_point_2: 'Methods: cross-modal alignment, robust representation learning',
    hero_point_3: 'Open to academic collaboration and applied research transfer',
    about_title: 'About',
    about_body: 'I am a Ph.D. candidate at the School of Computer Science, Sichuan University. My research centers on multimodal learning, affective computing, and robust speech understanding under real-world conditions. I work on multimodal sentiment analysis, cross-modal contrastive optimization, and noise-resilient speech recognition, with an emphasis on interpretability and generalization.',
    research_title: 'Research Focus',
    r1_title: 'Multimodal Emotion Understanding', r1_body: 'Modeling emotion from speech, vision, and text with depth-aware representations.',
    r2_title: 'LLM + MoE Systems', r2_body: 'Task-adaptive routing and efficient expert collaboration for better generalization.',
    r3_title: 'Applied Research Systems', r3_body: 'Bridging method development with reproducible deployment and evaluation workflows.',
    projects_title: 'Selected Projects', projects_note: 'Representative directions across multimodal learning and system implementation.',
    p1_body: 'Hierarchical emotion modeling with adaptive multi-level mixture-of-experts.',
    p2_body: 'End-to-end pipeline for multimodal affect analysis and conversational intelligence.',
    p3_body: 'Hierarchical cross-modal denoising for robust audio-visual speech representation under noisy real-world conditions.',
    p4_body: 'Toolchain for transforming research prototypes into reproducible demos.',
    news_title: 'News', news_note: 'Latest paper and research updates.',
    news_1: '🎉 Our paper "AV-RISE: Hierarchical Cross-Modal Denoising for Learning Robust Audio-Visual Speech Representation" is accepted at ACM MM 2025.',
    news_2: '📖 Published "WinNet: Make Only One Convolutional Layer Effective for Time Series Forecasting" in ICIC 2025.',
    news_3: '🎉 Our paper "AMG-AVSR: Adaptive Modality Guidance for Audio-Visual Speech Recognition via Progressive Feature Enhancement" is accepted at ACML 2024.',
    resume_title: 'Resume', resume_btn: 'Open CV',
    resume_body: 'My latest CV is attached here as a PDF, including education, publications, projects, and research experience.',
    portfolio_title: 'Portfolio',
    portfolio_body: 'Selected representative work is listed in the Projects section, including research systems and implementation artifacts.',
    blog_title: 'Blog', blog_open: 'Open blog',
    blog_intro: 'Four focused notes on research workflow, AV-RISE, affective agents, and emotion language models.',
    blog_1_kicker: 'Workflow',
    blog_1_title: 'A practical research workflow paradigm',
    blog_1_body: 'How I structure literature, experiments, writing, and agent tooling into one continuous loop.',
    blog_2_kicker: 'Paper',
    blog_2_title: 'AV-RISE and robust audio-visual speech',
    blog_2_body: 'Why cross-modal denoising became central to how I think about noisy real-world speech representation.',
    blog_3_kicker: 'Agent',
    blog_3_title: 'What a good emotion agent should really do',
    blog_3_body: 'Not just empathy on the surface, but perception, calibration, clarification, and safe intervention.',
    blog_4_kicker: 'MLLM',
    blog_4_title: 'After emotion LLMs, what is the real bottleneck?',
    blog_4_body: 'Why I think the next step is not simply a bigger model, but better handling of conflict, uncertainty, and repair.',
    contact_title: 'Contact', contact_chip: 'Available for collaboration',
    contact_body: 'Open to collaboration, research exchange, and product building.',
    contact_email_label: 'Email',
    contact_response_label: 'Typical response', contact_response_value: 'Usually within 24–48 hours.',
    footer: 'Built with clarity and curiosity.'
  },
  zh: {
    nav_about: '关于', nav_research: '研究方向', nav_news: '新闻', nav_projects: '项目', nav_resume: '简历', nav_portfolio: '作品集', nav_blog: '博客', nav_contact: '联系',
    hero_tag: '你好，我是', hero_subtitle: '四川大学计算机学院博士研究生，研究方向为多模态学习、情感计算与鲁棒语音理解。',
    hero_meta_1: '多模态情感计算', hero_meta_2: '音视频语言建模', hero_meta_3: '鲁棒语音智能',
    hero_btn_contact: '联系我', hero_btn_projects: '查看研究',
    hero_role: '四川大学 · 计算机学院博士研究生',
    hero_point_1: '研究重点：多模态情感理解与情绪智能',
    hero_point_2: '方法方向：跨模态对齐与鲁棒表示学习',
    hero_point_3: '欢迎学术合作与研究成果转化交流',
    about_title: '关于我',
    about_body: '我目前在四川大学计算机学院攻读博士学位。研究聚焦于真实场景下的多模态学习、情感计算与鲁棒语音理解，具体包括多模态情感分析、跨模态对比优化以及抗噪语音识别，关注模型的可解释性与泛化能力。',
    research_title: '研究重点',
    r1_title: '多模态情感理解', r1_body: '用深度分层表示建模语音、视觉与文本中的情感信息。',
    r2_title: 'LLM + MoE 系统', r2_body: '通过任务自适应路由和专家协同提升模型泛化能力。',
    r3_title: '应用研究系统', r3_body: '面向可复现实验与稳健部署的研究系统化方法。',
    projects_title: '代表性项目', projects_note: '覆盖多模态学习方法与系统实现的关键方向。',
    p1_body: '分层情感建模与自适应多层专家混合框架。',
    p2_body: '多模态情感理解与对话智能的一体化研究流水线。',
    p3_body: '面向真实噪声场景的分层跨模态去噪音视频语音表征方法。',
    p4_body: '将研究原型转化为可复现演示系统的工具链。',
    news_title: '新闻', news_note: '最新论文与研究动态。',
    news_1: '🎉 论文 "AV-RISE: Hierarchical Cross-Modal Denoising for Learning Robust Audio-Visual Speech Representation" 已被 ACM MM 2025 接收。',
    news_2: '📖 发表 "WinNet: Make Only One Convolutional Layer Effective for Time Series Forecasting"（ICIC 2025）。',
    news_3: '🎉 论文 "AMG-AVSR: Adaptive Modality Guidance for Audio-Visual Speech Recognition via Progressive Feature Enhancement" 已被 ACML 2024 接收。',
    resume_title: '简历', resume_btn: '打开简历',
    resume_body: '最新简历已直接附在本站，可查看教育背景、论文、项目与研究经历。',
    portfolio_title: '作品集',
    portfolio_body: '代表性工作已在 Projects 展示，涵盖研究系统与工程实现。',
    blog_title: '博客', blog_open: '进入博客',
    blog_intro: '这里先放 4 篇聚焦主题：科研流程范式、AV-RISE、情感 agent、情感大模型。',
    blog_1_kicker: '流程',
    blog_1_title: '一个可执行的科研流程范式',
    blog_1_body: '我如何把文献、实验、写作和 agent 工具组织成一个连续闭环。',
    blog_2_kicker: '论文',
    blog_2_title: 'AV-RISE 与鲁棒音视频语音表征',
    blog_2_body: '为什么跨模态去噪会成为我理解真实噪声场景语音表征的核心问题。',
    blog_3_kicker: 'Agent',
    blog_3_title: '一个好的情感 Agent 应该做什么',
    blog_3_body: '不只是表面共情，而是感知、校准、澄清和安全干预。',
    blog_4_kicker: '情感大模型',
    blog_4_title: '情感大模型之后，真正的瓶颈是什么',
    blog_4_body: '我为什么认为下一步不是单纯做更大的模型，而是更好地处理冲突、不确定和修复。',
    contact_title: '联系方式', contact_chip: '可合作状态',
    contact_body: '欢迎交流合作、研究讨论与产品共建。',
    contact_email_label: '邮箱',
    contact_response_label: '响应时间', contact_response_value: '通常 24–48 小时内回复。',
    footer: '以清晰与好奇构建。'
  }
};

const html = document.documentElement;
const langToggle = document.getElementById('langToggle');
const year = document.getElementById('year');
const menuToggle = document.getElementById('menuToggle');
const primaryNav = document.getElementById('primaryNav');
const navLinks = [...document.querySelectorAll('.primary-nav a')];
const toTop = document.getElementById('toTop');
const revealItems = [...document.querySelectorAll('.reveal')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lang = localStorage.getItem('lang') || 'en';
let ticking = false;

function renderLanguage() {
  html.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang] && i18n[lang][key]) {
      el.textContent = i18n[lang][key];
    }
  });
  langToggle.textContent = lang === 'en' ? '中文' : 'EN';
  localStorage.setItem('lang', lang);
}

function closeMenu() {
  primaryNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}

langToggle.addEventListener('click', () => {
  lang = lang === 'en' ? 'zh' : 'en';
  renderLanguage();
});

menuToggle.addEventListener('click', () => {
  const willOpen = !primaryNav.classList.contains('open');
  primaryNav.classList.toggle('open', willOpen);
  menuToggle.setAttribute('aria-expanded', String(willOpen));
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 860px)').matches) closeMenu();
  });
});

window.addEventListener('resize', () => {
  if (!window.matchMedia('(max-width: 860px)').matches) closeMenu();
});

const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', active);
      });
    });
  },
  { threshold: 0.35, rootMargin: '-20% 0px -45% 0px' }
);
sections.forEach((s) => sectionObserver.observe(s));

if (reduceMotion) {
  revealItems.forEach((item) => item.classList.add('in'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealItems.forEach((item) => revealObserver.observe(item));
}

function handleScroll() {
  const show = window.scrollY > 420;
  toTop.classList.toggle('show', show);
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(handleScroll);
    ticking = true;
  }
});

toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
});

year.textContent = String(new Date().getFullYear());
renderLanguage();
