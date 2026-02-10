const i18n = {
  en: {
    nav_about: 'About', nav_research: 'Research', nav_projects: 'Projects', nav_contact: 'Contact',
    hero_tag: "Hi, I'm", hero_subtitle: 'Multimodal AI researcher focused on emotion understanding, LLM systems, and practical intelligent products.',
    hero_meta_1: 'Multimodal Affective Computing', hero_meta_2: 'LLM + MoE Systems', hero_meta_3: 'Applied AI Productization',
    hero_btn_contact: 'Work with me', hero_btn_projects: 'View projects',
    hero_role: 'AI Researcher & Builder',
    hero_point_1: 'Research-to-product execution mindset',
    hero_point_2: 'Strong in language-vision-audio systems',
    hero_point_3: 'Open to research and product collaborations',
    about_title: 'About',
    about_body: 'I build intelligent systems that connect language, vision, and audio. My interests include multimodal affective computing, robust routing for experts, and turning research prototypes into products that people can actually use.',
    research_title: 'Research Focus',
    r1_title: 'Multimodal Emotion Understanding', r1_body: 'Modeling emotion from speech, vision, and text with depth-aware representations.',
    r2_title: 'LLM + MoE Systems', r2_body: 'Task-adaptive routing and efficient expert collaboration for better generalization.',
    r3_title: 'Applied AI Products', r3_body: 'Bridging research and deployment through reliable workflows and automation.',
    projects_title: 'Selected Projects', projects_note: 'Representative directions across research and productization.',
    p1_body: 'Hierarchical emotion modeling with adaptive multi-level mixture-of-experts.',
    p2_body: 'End-to-end pipeline for multimodal emotion analysis and conversational AI.',
    p3_body: 'Personal automation workflows for research, coding, and assistant orchestration.',
    p4_body: 'Templates and scripts to accelerate turning academic ideas into usable demos.',
    contact_title: 'Contact', contact_chip: 'Available for collaboration',
    contact_body: 'Open to collaboration, research exchange, and product building.',
    contact_email_label: 'Email',
    contact_response_label: 'Typical response', contact_response_value: 'Usually within 24–48 hours.',
    footer: 'Built with clarity and curiosity.'
  },
  zh: {
    nav_about: '关于', nav_research: '研究方向', nav_projects: '项目', nav_contact: '联系',
    hero_tag: '你好，我是', hero_subtitle: '专注多模态情感理解、LLM系统与可落地智能产品的研究者。',
    hero_meta_1: '多模态情感计算', hero_meta_2: 'LLM + MoE 系统', hero_meta_3: 'AI 产品化落地',
    hero_btn_contact: '联系合作', hero_btn_projects: '查看项目',
    hero_role: 'AI 研究者与构建者',
    hero_point_1: '具备从研究到产品的执行能力',
    hero_point_2: '擅长语言-视觉-音频智能系统',
    hero_point_3: '欢迎研究合作与产品共建',
    about_title: '关于我',
    about_body: '我主要做连接语言、视觉和音频的智能系统。兴趣集中在多模态情感计算、专家路由机制，以及把研究原型快速产品化。',
    research_title: '研究重点',
    r1_title: '多模态情感理解', r1_body: '用深度分层表示建模语音、视觉与文本中的情感信息。',
    r2_title: 'LLM + MoE 系统', r2_body: '通过任务自适应路由和专家协同提升模型泛化能力。',
    r3_title: 'AI产品化落地', r3_body: '将研究成果转化为稳定、可用、可持续迭代的实际产品。',
    projects_title: '代表性项目', projects_note: '覆盖研究与产品化的核心方向。',
    p1_body: '分层情感建模与自适应多层专家混合框架。',
    p2_body: '多模态情感分析与对话系统一体化流水线。',
    p3_body: '用于研究与开发的个人自动化工作流系统。',
    p4_body: '从论文到Demo的快速转化模板与脚本工具集。',
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
