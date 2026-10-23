// 베타 테스터 모집 페이지(beta.html): 머리 유리 배경, 휴대폰 메뉴, 영상 소리, 등장 움직임. site.js 의 같은 동작을 이 페이지 요소만큼만 옮겼다.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 머리: 스크롤하면 유리 배경 ---------- */
  const head = $('.site-head');
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;height:8px;width:1px;';
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => head.classList.toggle('is-stuck', !e.isIntersecting)).observe(sentinel);

  /* ---------- 휴대폰 메뉴 ---------- */
  const menuBtn = $('.menu-btn');
  const nav = $('#nav');
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    menuBtn.firstElementChild.className = open ? 'ph ph-x' : 'ph ph-list';
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a') && nav.classList.contains('is-open')) menuBtn.click();
  });

  /* ---------- 모집 영상: 화면에 보이면 소리 없이 재생, 버튼으로 소리 ---------- */
  const video = $('#recruitVideo');
  const sound = $('#soundBtn');
  if (video) {
    new IntersectionObserver(([e]) => (e.isIntersecting ? video.play().catch(() => {}) : video.pause()), { threshold: 0.4 }).observe(video);
    sound.addEventListener('click', () => {
      video.muted = !video.muted;
      if (!video.muted) video.play().catch(() => {});
      sound.setAttribute('aria-pressed', String(!video.muted));
      sound.setAttribute('aria-label', video.muted ? '소리 켜기' : '소리 끄기');
      sound.firstElementChild.className = video.muted ? 'ph ph-speaker-slash' : 'ph ph-speaker-high';
    });
  }

  /* ---------- 등장 움직임 (GSAP) ---------- */
  function showAll() {
    $$('[data-reveal]').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }
  window.addEventListener('load', () => {
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    if (reduce || !gsap || !ST) return showAll();
    gsap.registerPlugin(ST);
    gsap
      .timeline({ defaults: { ease: 'expo.out' } })
      .from('[data-hero]', { opacity: 0, y: 28, duration: 1, stagger: 0.1 })
      .from('.b-hero-art .phone', { opacity: 0, y: 70, rotate: 8, duration: 1.2 }, 0.15)
      .from('.b-float', { opacity: 0, x: -40, scale: 0.85, duration: 1 }, 0.55);
    gsap.from('.badge-stage .medal', {
      scale: 0.3,
      rotate: -120,
      opacity: 0,
      duration: 1.3,
      ease: 'back.out(1.6)',
      scrollTrigger: { trigger: '.badge-band', start: 'top 70%', once: true },
    });
    ST.batch('[data-reveal]', {
      start: 'top 88%',
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'expo.out', overwrite: true }),
    });
    ST.refresh();
  });
  setTimeout(() => {
    if (!window.gsap) showAll();
  }, 2500);
})();
