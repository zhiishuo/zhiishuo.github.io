const year = document.getElementById('year');
const menuToggle = document.getElementById('menuToggle');
const primaryNav = document.getElementById('primaryNav');
const navLinks = [...document.querySelectorAll('.primary-nav a')];
const toTop = document.getElementById('toTop');
const revealItems = [...document.querySelectorAll('.reveal')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let ticking = false;

function closeMenu() {
  primaryNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}

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
  .filter((link) => link.getAttribute('href').startsWith('#'))
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
sections.forEach((section) => sectionObserver.observe(section));

if (reduceMotion) {
  revealItems.forEach((item) => item.classList.add('in'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );
  revealItems.forEach((item) => revealObserver.observe(item));
}

function handleScroll() {
  toTop.classList.toggle('show', window.scrollY > 420);
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (ticking) return;
  window.requestAnimationFrame(handleScroll);
  ticking = true;
});

toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
});

year.textContent = String(new Date().getFullYear());
