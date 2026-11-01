// 「캠핑 가서 뭐 먹지?」 — 목록 갈래·검색, 레시피 영상 시간 이동
(() => {
  // 목록: 갈래 칩 + 검색
  const grid = document.getElementById('fgrid');
  if (grid) {
    const cards = [...grid.querySelectorAll('.rcard')];
    const q = document.getElementById('fq');
    const count = document.getElementById('fcount');
    const empty = document.getElementById('fempty');
    let cat = '';
    const params = new URLSearchParams(location.search);
    const apply = () => {
      const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let n = 0;
      for (const c of cards) {
        const hay = c.dataset.q.toLowerCase();
        const ok = (!cat || c.dataset.cat === cat) && words.every((w) => hay.includes(w));
        c.hidden = !ok;
        if (ok) n++;
      }
      count.textContent = `레시피 ${n}가지`;
      empty.hidden = n > 0;
    };
    document.querySelectorAll('.fchip').forEach((b) =>
      b.addEventListener('click', () => {
        cat = b.dataset.cat;
        document.querySelectorAll('.fchip').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
        apply();
      }),
    );
    q.addEventListener('input', apply);
    if (params.get('q')) q.value = params.get('q');
    if (params.get('c')) document.querySelector(`.fchip[data-cat="${CSS.escape(params.get('c'))}"]`)?.click();
    else apply();
  }

  // 레시피: 시간 버튼을 누르면 영상 그 지점부터
  const v = document.getElementById('rv');
  if (v) {
    document.querySelectorAll('.jump').forEach((b) =>
      b.addEventListener('click', () => {
        const t = Number(b.dataset.t);
        const go = () => {
          v.currentTime = Math.max(0, t - 0.3);
          v.play().catch(() => {});
        };
        if (v.readyState >= 1) go();
        else v.addEventListener('loadedmetadata', go, { once: true }), v.load();
        if (innerWidth < 920) v.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }),
    );
  }
})();
