/* 오늘낚시 홈페이지 동작.
 * 움직임은 이유가 있는 곳에만: 첫 화면 등장(위계), 스크롤 등장(읽는 순서), 숫자 세기·점수 링(값 강조), 버튼 눌림(피드백).
 * prefers-reduced-motion 이면 모두 끄고 최종 모습만 보여 준다. 스크롤 이벤트 리스너는 쓰지 않는다(IntersectionObserver·ScrollTrigger).
 */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fmtSec = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const pad2 = (n) => String(n).padStart(2, '0');

  /* ---------- 알림 띠 ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  }

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

  /* ---------- 숫자 세기 ---------- */
  function countUp(el) {
    const end = Number(el.dataset.count);
    const comma = el.dataset.format === 'comma';
    const show = (v) => (el.textContent = comma ? Math.round(v).toLocaleString('ko-KR') : String(Math.round(v)));
    if (reduce || !window.gsap) return show(end);
    const o = { v: 0 };
    window.gsap.to(o, { v: end, duration: 1.4, ease: 'power3.out', onUpdate: () => show(o.v) });
  }
  const countIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        countIO.unobserve(e.target);
        countUp(e.target);
      }),
    { threshold: 0.6 },
  );
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* ---------- 출조 점수 예시 ---------- */
  const SAMPLES = {
    sea: {
      place: '통영 척포 방파제',
      score: 75,
      grade: '좋음',
      color: '#3ddc84',
      why: '바람 5m/s, 파도 낮음 0.3m, 들물 흐름 좋음',
      best: '오늘은 17:00~19:00가 가장 좋아 보여요',
      weather: [
        ['ph-sun', '맑음', '날씨'],
        ['ph-thermometer-simple', '16°', '기온'],
        ['ph-wind', '5m/s', '바람'],
        ['ph-waves', '0.3m', '파고'],
        ['ph-moon', '7물', '물때'],
      ],
    },
    fresh: {
      place: '예산 예당저수지',
      score: 62,
      grade: '보통',
      color: '#ffd95a',
      why: '바람 3m/s로 잔잔, 오후 늦게 비 소식',
      best: '오늘은 06:00~09:00가 가장 좋아 보여요',
      weather: [
        ['ph-cloud-sun', '구름', '날씨'],
        ['ph-thermometer-simple', '15°', '기온'],
        ['ph-wind', '3m/s', '바람'],
        ['ph-drop', '30%', '강수'],
        ['ph-sun-horizon', '06:41', '해 뜸'],
      ],
    },
  };
  const ringBar = $('.ring .bar');
  const CIRC = 326.7;
  let scoreShown = false;
  function renderScore(key, animate) {
    const s = SAMPLES[key];
    $('#scorePlace').textContent = s.place;
    $('#scoreGrade').textContent = s.grade;
    $('#scoreGrade').style.setProperty('--grade', s.color);
    $('#scoreWhy').textContent = s.why;
    $('#scoreBest').textContent = s.best;
    $('#scoreWeather').innerHTML = s.weather.map(([icon, v, label]) => `<div><i class="ph ${icon}" aria-hidden="true"></i><b>${v}</b><span>${label}</span></div>`).join('');
    const num = $('#scoreNum');
    ringBar.style.strokeDashoffset = String(CIRC * (1 - s.score / 100));
    if (!animate || reduce || !window.gsap) {
      num.textContent = String(s.score);
      return;
    }
    const o = { v: Number(num.textContent) || 0 };
    window.gsap.to(o, { v: s.score, duration: 1.1, ease: 'power3.out', onUpdate: () => (num.textContent = String(Math.round(o.v))) });
  }
  $$('.score-switch button').forEach((b) =>
    b.addEventListener('click', () => {
      $$('.score-switch button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      renderScore(b.dataset.sample, true);
    }),
  );
  // 링은 보일 때 0에서 차오르게
  ringBar.style.strokeDashoffset = String(CIRC);
  $('#scoreWeather').innerHTML = '';
  new IntersectionObserver(
    ([e], io) => {
      if (!e.isIntersecting || scoreShown) return;
      scoreShown = true;
      io.disconnect();
      renderScore('sea', true);
    },
    { threshold: 0.45 },
  ).observe($('.score-card'));

  /* ---------- 초보 영상 ---------- */
  // 95편 모두 assets/video/<slug>.mp4 로 올라가 있어 어느 포스터든 바로 재생된다.
  const player = $('#player');
  const postersEl = $('#posters');
  const moreBtn = $('#postersMore');
  let guides = [];
  let gcat = 'all';
  let gAll = false;
  let current = '01-urek';

  function renderPosters() {
    const list = guides.filter((g) => gcat === 'all' || g.cat === gcat);
    const shown = gAll ? list : list.slice(0, 12);
    $('#railCount').textContent = `${list.length}편`;
    postersEl.innerHTML = shown
      .map(
        (g) => `<button class="poster${g.slug === current ? ' is-current' : ''}" type="button" data-slug="${g.slug}" aria-label="${pad2(g.num)}편 ${g.title} 재생">
          <img src="assets/img/posters/${g.slug}.webp" alt="" loading="lazy" width="360" height="640" />
          <span class="num">${pad2(g.num)}</span>
          <span class="play"><i class="ph-fill ph-play" aria-hidden="true"></i></span>
        </button>`,
      )
      .join('');
    moreBtn.hidden = gAll || list.length <= 12;
    moreBtn.textContent = `${list.length}편 모두 보기`;
    if (!reduce && window.gsap && !renderPosters.first) {
      window.gsap.from(postersEl.children, { opacity: 0, y: 16, scale: 0.96, duration: 0.45, stagger: { each: 0.03 }, ease: 'back.out(1.4)', clearProps: 'all' });
    }
    renderPosters.first = false;
  }
  renderPosters.first = true;

  function play(slug) {
    const g = guides.find((x) => x.slug === slug);
    if (!g) return;
    current = slug;
    player.src = `assets/video/${slug}.mp4`;
    player.poster = `assets/img/posters/${slug}.webp`;
    player.setAttribute('aria-label', `${g.title} 영상`);
    $('#playerTitle').textContent = `${pad2(g.num)} ${g.title}`;
    $('#playerSub').textContent = `${g.cat === 'sea' ? '바다' : '민물'} · ${fmtSec(g.sec)}`;
    player.play().catch(() => {});
    $$('.poster', postersEl).forEach((p) => p.classList.toggle('is-current', p.dataset.slug === slug));
    if (window.innerWidth <= 760) $('.player-wrap').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }

  postersEl.addEventListener('click', (e) => {
    const b = e.target.closest('.poster');
    if (b) play(b.dataset.slug);
  });
  $$('[data-gcat]').forEach((b) =>
    b.addEventListener('click', () => {
      gcat = b.dataset.gcat;
      gAll = false;
      $$('[data-gcat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      renderPosters();
    }),
  );
  moreBtn.addEventListener('click', () => {
    gAll = true;
    renderPosters();
  });

  // 보일 때만 재생(데이터·배터리 아끼기)
  new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting && !reduce) player.play().catch(() => {});
      else player.pause();
    },
    { threshold: 0.35 },
  ).observe(player);

  const soundBtn = $('#soundBtn');
  soundBtn.addEventListener('click', () => {
    player.muted = !player.muted;
    if (!player.muted) player.play().catch(() => {});
    soundBtn.setAttribute('aria-pressed', String(!player.muted));
    soundBtn.setAttribute('aria-label', player.muted ? '소리 켜기' : '소리 끄기');
    soundBtn.firstElementChild.className = `ph ${player.muted ? 'ph-speaker-slash' : 'ph-speaker-high'}`;
  });

  fetch('assets/data/guides.json')
    .then((r) => r.json())
    .then((d) => {
      guides = d;
      renderPosters();
    })
    .catch(() => {
      postersEl.innerHTML = '<p class="empty">영상 목록을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>';
      moreBtn.hidden = true;
    });

  /* ---------- 어종 도감 ---------- */
  const fishGrid = $('#fishGrid');
  const fishMore = $('#fishMore');
  const fishSearch = $('#fishSearch');
  let species = [];
  let fcat = 'sea';
  let fAll = false;
  const thisMonth = new Date().getMonth() + 1;

  function renderFish() {
    const q = fishSearch.value.trim();
    const list = species.filter((s) => (q ? s.name.includes(q) : s.cat === fcat));
    const shown = fAll || q ? list : list.slice(0, 12);
    if (!list.length) {
      fishGrid.innerHTML = `<p class="empty">「${q.replace(/[<>&"]/g, '')}」은(는) 도감에 아직 없어요.</p>`;
      fishMore.hidden = true;
      return;
    }
    fishGrid.innerHTML = shown
      .map((s) => {
        const tags = [];
        if (s.months.includes(thisMonth)) tags.push('<span class="tag">제철</span>');
        if (s.rule) tags.push(`<span class="tag ${/보호|교란/.test(s.rule) ? 'warn' : 'rule'}">${s.rule}</span>`);
        if (s.guide) tags.push('<span class="tag video"><i class="ph-fill ph-play" aria-hidden="true"></i>1분 영상</span>');
        return `<article class="fish">
          <figure><img src="assets/img/species/${s.id}.webp" alt="${s.name} 그림" loading="lazy" /></figure>
          <div class="body"><h3>${s.name}</h3><div class="tags">${tags.join('')}</div></div>
        </article>`;
      })
      .join('');
    fishMore.hidden = fAll || q || list.length <= 12;
    fishMore.textContent = `${fcat === 'sea' ? '바다' : '민물'} ${list.length}종 모두 보기`;
  }
  $$('[data-fcat]').forEach((b) =>
    b.addEventListener('click', () => {
      fcat = b.dataset.fcat;
      fAll = false;
      fishSearch.value = '';
      $$('[data-fcat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      renderFish();
    }),
  );
  fishMore.addEventListener('click', () => {
    fAll = true;
    renderFish();
  });
  fishSearch.addEventListener('input', renderFish);
  fetch('assets/data/species.json')
    .then((r) => r.json())
    .then((d) => {
      species = d;
      renderFish();
    })
    .catch(() => {
      fishGrid.innerHTML = '<p class="empty">도감을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>';
      fishMore.hidden = true;
    });

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

    // 첫 화면: 글 → 버튼 → 폰 순서(읽는 순서대로)
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('[data-hero]', { opacity: 0, y: 28, duration: 1, stagger: 0.12 }).from('[data-hero-phone]', { opacity: 0, y: 60, duration: 1.2, stagger: 0.15 }, 0.15);
    // 「한 번에」 아래 노란 물결이 왼쪽부터 그려짐(앱 시그니처 물결)
    gsap.fromTo('.hero h1 .accent', { '--u': 0 }, { '--u': 1, duration: 0.9, delay: 0.55, ease: 'power2.out' });

    // 앞 폰은 스크롤하면 살짝 다르게 움직여 깊이감(히어로 안에서만)
    gsap.to('.phone-front', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.phone-back', { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    ST.batch('[data-reveal]', {
      start: 'top 88%',
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'expo.out', overwrite: true }),
    });
    // 이미 화면 안에 있던 것(새로고침 위치 등)
    ST.refresh();
  });
  // GSAP 를 못 받았을 때도 내용은 보이게
  setTimeout(() => {
    if (!window.gsap) showAll();
  }, 2500);
})();
