const i18n = {
  en: {
    nav_about: 'About', nav_research: 'Research', nav_projects: 'Projects', nav_contact: 'Contact',
    hero_tag: "Hi, I'm", hero_subtitle: 'Multimodal AI researcher focused on emotion understanding, LLM systems, and practical intelligent products.',
    hero_btn_contact: 'Work with me', hero_btn_projects: 'View projects',
    about_title: 'About',
    about_body: 'I build intelligent systems that connect language, vision, and audio. My interests include multimodal affective computing, robust routing for experts, and turning research prototypes into products that people can actually use.',
    research_title: 'Research Focus',
    r1_title: 'Multimodal Emotion Understanding', r1_body: 'Modeling emotion from speech, vision, and text with depth-aware representations.',
    r2_title: 'LLM + MoE Systems', r2_body: 'Task-adaptive routing and efficient expert collaboration for better generalization.',
    r3_title: 'Applied AI Products', r3_body: 'Bridging research and deployment through reliable workflows and automation.',
    projects_title: 'Selected Projects',
    p1_body: 'Hierarchical emotion modeling with adaptive multi-level mixture-of-experts.',
    p2_body: 'End-to-end pipeline for multimodal emotion analysis and conversational AI.',
    p3_body: 'Personal automation workflows for research, coding, and assistant orchestration.',
    p4_body: 'Templates and scripts to accelerate turning academic ideas into usable demos.',
    contact_title: 'Contact', contact_body: 'Open to collaboration, research exchange, and product building.',
    footer: 'Built with clarity and curiosity.'
  },
  zh: {
    nav_about: '关于', nav_research: '研究方向', nav_projects: '项目', nav_contact: '联系',
    hero_tag: '你好，我是', hero_subtitle: '专注多模态情感理解、LLM系统与可落地智能产品的研究者。',
    hero_btn_contact: '联系合作', hero_btn_projects: '查看项目',
    about_title: '关于我',
    about_body: '我主要做连接语言、视觉和音频的智能系统。兴趣集中在多模态情感计算、专家路由机制，以及把研究原型快速产品化。',
    research_title: '研究重点',
    r1_title: '多模态情感理解', r1_body: '用深度分层表示建模语音、视觉与文本中的情感信息。',
    r2_title: 'LLM + MoE 系统', r2_body: '通过任务自适应路由和专家协同提升模型泛化能力。',
    r3_title: 'AI产品化落地', r3_body: '将研究成果转化为稳定、可用、可持续迭代的实际产品。',
    projects_title: '代表性项目',
    p1_body: '分层情感建模与自适应多层专家混合框架。',
    p2_body: '多模态情感分析与对话系统一体化流水线。',
    p3_body: '用于研究与开发的个人自动化工作流系统。',
    p4_body: '从论文到Demo的快速转化模板与脚本工具集。',
    contact_title: '联系方式', contact_body: '欢迎交流合作、研究讨论与产品共建。',
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

let lang = localStorage.getItem('lang') || 'en';

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

window.addEventListener('scroll', () => {
  const show = window.scrollY > 420;
  toTop.classList.toggle('show', show);
});

toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

year.textContent = String(new Date().getFullYear());
renderLanguage();
