// 오늘캠핑 홈페이지 — 별, 메뉴, 나타나기, 숫자 세기, 캠핑 지수 계산기
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 머리글: 히어로를 지나면 밝은 바탕
  const head = document.querySelector('.site-head');
  const onScroll = () => head.classList.toggle('is-stuck', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 모바일 메뉴
  const btn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    btn.querySelector('i').className = open ? 'ph ph-x' : 'ph ph-list';
  };
  btn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));
  addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

  // 나타나기 + 숫자 세기
  const count = (el) => {
    const to = Number(el.dataset.count);
    const fmt = (v) => (el.dataset.format === 'comma' ? v.toLocaleString('ko-KR') : String(v));
    if (reduce) return (el.textContent = fmt(to));
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1100);
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        e.target.querySelectorAll('[data-count]').forEach(count);
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

  // 캠핑 지수 계산기 — 앱 src/lib/camp-score.ts 와 같은 감점(평균 풍속·습도·자외선·특보는 앱에서만)
  const $ = (id) => document.getElementById(id);
  const inputs = { gust: $('in-gust'), rain: $('in-rain'), min: $('in-min'), max: $('in-max'), setup: $('in-setup') };
  if (!inputs.gust) return;
  let style = 'auto';
  let dust = 'good';
  const GRADES = [
    [85, '아주 좋음', '#12925A'],
    [70, '좋음', '#1F5A54'],
    [50, '보통', '#7A6A2E'],
    [30, '주의', '#C77700'],
    [0, '비추천', '#D63D3D'],
  ];
  const bagOf = (m) =>
    m >= 15 ? '여름용 침낭이나 얇은 이불' : m >= 5 ? '3계절 침낭 (컴포트 5℃)' : m >= -5 ? '동계 침낭 (컴포트 -5℃)' : '혹한기 침낭 (컴포트 -15℃) · 일산화탄소 경보기';
  const ICON = { wind: 'ph-wind', rain: 'ph-cloud-rain', cold: 'ph-thermometer-cold', heat: 'ph-sun', dust: 'ph-warning' };

  const calc = () => {
    const gust = Number(inputs.gust.value);
    const rain = Number(inputs.rain.value);
    const min = Number(inputs.min.value);
    const max = Math.max(Number(inputs.max.value), min);
    const setup = inputs.setup.checked && rain >= 0.5;
    const r = [];
    const add = (key, p, text) => p > 0 && r.push({ key, p, text });
    const windK = style === 'car' || style === 'glamping' ? 0.6 : 1;
    add('wind', Math.round((gust >= 14 ? 45 : gust >= 11 ? 30 : gust >= 8 ? 15 : 0) * windK), gust >= 11 ? `돌풍 최대 ${gust}m/s — 타프는 접고 팩은 단단히` : `바람 최대 ${gust}m/s — 타프는 낮게 쳐요`);
    add('rain', (rain >= 10 ? 40 : rain >= 3 ? 25 : rain >= 0.5 ? 12 : 0) + (setup ? 6 : 0), `${setup ? '설치할 때부터 ' : ''}비 ${rain < 1 ? '조금' : `${Math.round(rain)}mm`} — 방수포·여분 타프 챙기기`);
    const coldK = style === 'glamping' ? 0.5 : 1;
    add('cold', Math.round((min <= -10 ? 35 : min <= -5 ? 22 : min <= 0 ? 12 : min <= 5 ? 5 : 0) * coldK), `밤 최저 ${min}℃ — ${min <= 0 ? '동계 침낭과 난방, 일산화탄소 경보기 필수' : '침낭은 넉넉하게'}`);
    add('heat', max >= 33 ? 20 : max >= 30 ? 10 : 0, `낮 최고 ${max}℃ — 그늘 타프와 물 넉넉히`);
    add('dust', dust === 'worst' ? 30 : dust === 'bad' ? 15 : 0, dust === 'worst' ? '미세먼지 매우 나쁨 예보 — 야외 활동은 줄이세요' : '미세먼지 나쁨 예보 — 마스크 챙기고 바깥 요리는 짧게');
    r.sort((a, b) => b.p - a.p);
    const score = Math.max(0, 100 - r.reduce((a, x) => a + x.p, 0));
    const [, label, color] = GRADES.find(([m]) => score >= m);

    const ring = $('calc-ring');
    ring.style.setProperty('--p', score);
    ring.style.setProperty('--c', color);
    $('calc-score').textContent = score;
    const g = $('calc-grade');
    g.textContent = label;
    g.style.color = color;
    const top = r[0];
    $('calc-verdict').innerHTML = `<i class="ph${top ? '' : '-fill'} ${top ? ICON[top.key] : 'ph-moon-stars'}" aria-hidden="true"></i><span></span>`;
    $('calc-verdict').querySelector('span').textContent = top ? top.text : '바람도 비도 잔잔해요. 캠핑하기 좋은 날이에요';
    const ul = $('calc-reasons');
    ul.textContent = '';
    for (const x of r) {
      const li = document.createElement('li');
      li.innerHTML = '<span></span><b></b>';
      li.firstChild.textContent = x.text.split(' — ')[0];
      li.lastChild.textContent = `-${x.p}`;
      ul.appendChild(li);
    }
    $('calc-bag').querySelector('span').textContent = `추천 침낭: ${bagOf(min)}`;

    $('v-gust').textContent = `${gust}m/s`;
    $('v-rain').textContent = `${rain}mm`;
    $('v-min').textContent = `${min}℃`;
    $('v-max').textContent = `${Number(inputs.max.value)}℃`;
    for (const k of ['gust', 'rain', 'min', 'max']) {
      const el = inputs[k];
      el.style.setProperty('--fill', `${((el.value - el.min) / (el.max - el.min)) * 100}%`);
    }
  };
  const radio = (sel, attr, set) =>
    document.querySelectorAll(sel).forEach((b) =>
      b.addEventListener('click', () => {
        document.querySelectorAll(sel).forEach((o) => o.setAttribute('aria-checked', String(o === b)));
        set(b.dataset[attr]);
        calc();
      }),
    );
  radio('.seg button', 'style', (v) => (style = v));
  radio('.dust button', 'dust', (v) => (dust = v));
  Object.values(inputs).forEach((el) => el.addEventListener('input', calc));
  calc();
})();
