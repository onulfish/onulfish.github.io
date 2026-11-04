/* 캠핑 사운드 맛보기 — 앱(src/data/soundscapes.ts)과 같은 분위기 8가지·같은 소리 재료.
 * 바탕 소리는 Web Audio 로 끊김 없이 반복, 가끔 나는 소리는 무작위 간격·크기·빠르기.
 * 소리 파일은 처음 누를 때만 받는다(assets/audio, 분위기 하나에 약 1~3MB). */
(() => {
  const root = document.getElementById('sound-player');
  if (!root) return;

  const A = 'assets/audio/';
  const BEDS = {
    fire: ['bed_fire'], crickets: ['bed_crickets'], rain_tent: ['bed_rain_tent'], wind: ['bed_wind'],
    stream: ['bed_stream'], birds: ['bed_birds'], waves: ['bed_waves'], music_yoga: ['music_yoga_1', 'music_yoga_2'],
  };
  const LAYERS = [
    ['fire', '모닥불', 'ph-flame'], ['rain_tent', '텐트 빗소리', 'ph-cloud-rain'], ['crickets', '풀벌레', 'ph-bug'],
    ['wind', '숲 바람', 'ph-leaf'], ['stream', '계곡물', 'ph-drop'], ['birds', '아침 새', 'ph-bird'],
    ['waves', '파도', 'ph-waves'], ['music_yoga', '요가 음악', 'ph-music-notes'],
  ];
  const SCENES = {
    fire: { beds: { fire: 0.9, crickets: 0.25 }, sp: [[['log_pop1', 'log_pop2'], 7, 22, 0.55], [['owl1', 'owl2'], 70, 180, 0.35], [['stick'], 90, 240, 0.3]] },
    sleep: { beds: { rain_tent: 0.85, wind: 0.2 }, sp: [[['drip'], 25, 70, 0.35], [['thunder1', 'thunder2'], 150, 360, 0.3]] },
    yoga: { beds: { music_yoga: 0.7, stream: 0.3, birds: 0.15 }, sp: [[['bird1', 'bird2', 'bird3'], 20, 50, 0.25]] },
    morning: { beds: { birds: 0.8, wind: 0.35 }, sp: [[['bird1', 'bird2', 'bird3'], 8, 24, 0.5], [['woodpecker'], 40, 110, 0.4], [['cuckoo'], 60, 150, 0.35]] },
    valley: { beds: { stream: 0.9, birds: 0.25 }, sp: [[['bird1', 'bird3'], 18, 45, 0.35], [['fish_jump'], 50, 140, 0.35]] },
    beach: { beds: { waves: 0.9, wind: 0.25 }, sp: [[['seagull1', 'seagull2'], 25, 80, 0.35]] },
    night: { beds: { crickets: 0.8, wind: 0.2 }, sp: [[['frog'], 25, 70, 0.35], [['owl1', 'owl2'], 60, 160, 0.35]] },
    read: { beds: { rain_tent: 0.5, fire: 0.55 }, sp: [[['log_pop1', 'log_pop2'], 12, 35, 0.4], [['drip'], 35, 90, 0.3]] },
  };
  const LEVELS = [0, 0.15, 0.3, 0.5, 0.7, 0.9];
  const XFADE = 6; // 음악 두 곡을 이어 틀 때 겹치는 초

  let ctx = null;
  let master = null;
  const buffers = new Map();
  const layers = {}; // id → { gain, stop() }
  let timers = [];
  let scene = null;
  let playing = false;
  let vol = 0.8;
  let mix = {};
  let token = 0;

  const $ = (s) => root.querySelector(s);
  const tiles = [...root.querySelectorAll('.snd-tile')];
  const bar = $('.snd-now');
  const nowTitle = $('#snd-title');
  const nowState = $('#snd-state');
  const pauseBtn = $('#snd-pause');
  const stopBtn = $('#snd-stop');
  const volIn = $('#snd-vol');
  const mixBox = $('#snd-mix');

  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }
    return ctx;
  }
  function load(name) {
    if (!buffers.has(name)) {
      buffers.set(
        name,
        fetch(A + name + '.m4a')
          .then((r) => { if (!r.ok) throw new Error(name); return r.arrayBuffer(); })
          .then((b) => ac().decodeAudioData(b))
          .catch((e) => { buffers.delete(name); throw e; }),
      );
    }
    return buffers.get(name);
  }
  const ramp = (param, v, sec) => {
    const t = ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(v, t + sec);
  };

  /** 바탕 소리 하나: 파일 하나면 loop, 여러 개(음악)면 끝나기 XFADE초 전에 다음 곡을 겹쳐 튼다 */
  async function startBed(id, level) {
    const names = BEDS[id];
    const bufs = await Promise.all(names.map(load));
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(master);
    const srcs = new Set();
    let next = null;
    let i = 0;
    const play = (when) => {
      const b = bufs[i % bufs.length];
      const s = ctx.createBufferSource();
      s.buffer = b;
      const g = ctx.createGain();
      s.connect(g).connect(gain);
      srcs.add(s);
      s.onended = () => srcs.delete(s);
      if (bufs.length === 1) {
        s.loop = true;
        s.start(when, Math.random() * b.duration); // 같은 소리라도 시작점을 달리
        return;
      }
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(1, when + XFADE);
      g.gain.setValueAtTime(1, when + b.duration - XFADE);
      g.gain.linearRampToValueAtTime(0, when + b.duration);
      s.start(when);
      i += 1;
      const at = when + b.duration - XFADE;
      next = setTimeout(() => play(at), Math.max(0, (at - ctx.currentTime - 1) * 1000));
    };
    play(ctx.currentTime + 0.05);
    ramp(gain.gain, level, 1.2);
    layers[id] = {
      gain,
      stop() {
        clearTimeout(next);
        ramp(gain.gain, 0, 0.6);
        setTimeout(() => { srcs.forEach((s) => { try { s.stop(); } catch {} }); gain.disconnect(); }, 700);
      },
    };
  }

  function sprinkle([ids, lo, hi, v], my) {
    const wait = (lo + Math.random() * (hi - lo)) * 1000;
    const t = setTimeout(async () => {
      if (my !== token) return;
      if (playing) {
        try {
          const b = await load('shot_' + ids[Math.floor(Math.random() * ids.length)]);
          if (my !== token || !playing) return;
          const s = ctx.createBufferSource();
          s.buffer = b;
          s.playbackRate.value = 0.92 + Math.random() * 0.16;
          const g = ctx.createGain();
          g.gain.value = v * (0.7 + Math.random() * 0.3);
          s.connect(g).connect(master);
          s.start();
        } catch {}
      }
      sprinkle([ids, lo, hi, v], my);
    }, wait);
    timers.push(t);
  }

  function clearScene() {
    token += 1;
    timers.forEach(clearTimeout);
    timers = [];
    Object.keys(layers).forEach((k) => { layers[k].stop(); delete layers[k]; });
  }

  async function playScene(id) {
    ac();
    if (ctx.state === 'suspended') await ctx.resume();
    clearScene();
    const my = token;
    scene = id;
    mix = { ...SCENES[id].beds };
    playing = true;
    render('불러오는 중…');
    try {
      await Promise.all(Object.entries(mix).map(([k, v]) => startBed(k, v)));
    } catch {
      if (my === token) { playing = false; render('소리를 불러오지 못했어요. 다시 눌러 주세요.'); }
      return;
    }
    if (my !== token) return;
    ramp(master.gain, vol, 1.5);
    // 첫 「가끔 나는 소리」는 조금 일찍 한 번 들려준다
    SCENES[id].sp.forEach((x, n) => sprinkle(n === 0 ? [x[0], 2, Math.min(6, x[2]), x[3]] : x, my));
    setTimeout(() => { if (my === token) { timers.forEach(clearTimeout); timers = []; SCENES[id].sp.forEach((x) => sprinkle(x, my)); } }, 7000);
    render();
  }

  function togglePause() {
    if (!ctx || !scene) return;
    playing = !playing;
    if (playing) { ctx.resume(); ramp(master.gain, vol, 0.8); }
    else { ramp(master.gain, 0, 0.5); setTimeout(() => { if (!playing) ctx.suspend(); }, 550); }
    render();
  }

  function stop() {
    if (!ctx) return;
    ramp(master.gain, 0, 0.5);
    clearScene();
    scene = null;
    playing = false;
    render();
  }

  async function setLayer(id, v) {
    mix[id] = v;
    if (layers[id]) {
      ramp(layers[id].gain.gain, v, 0.4);
      if (v === 0) { layers[id].stop(); delete layers[id]; }
    } else if (v > 0 && scene) {
      const my = token;
      try { await startBed(id, v); } catch { return; }
      if (my !== token) { layers[id]?.stop(); delete layers[id]; }
    }
    renderMix();
  }

  function renderMix() {
    const color = scene ? root.querySelector(`.snd-tile[data-scene="${scene}"]`).style.getPropertyValue('--c') : '';
    mixBox.style.setProperty('--c', color);
    mixBox.innerHTML = LAYERS.map(([id, label, icon]) => {
      const v = mix[id] || 0;
      const idx = LEVELS.reduce((b, x, n) => (Math.abs(x - v) < Math.abs(LEVELS[b] - v) ? n : b), 0);
      const cells = LEVELS.map((x, n) =>
        `<button type="button" class="snd-cell${n === 0 ? ' off' : ''}${n > 0 && n <= idx ? ' on' : ''}" data-layer="${id}" data-v="${x}" aria-label="${label} ${n}단계"${n === idx ? ' aria-pressed="true"' : ''}>${n === 0 ? '<i class="ph ph-speaker-simple-slash" aria-hidden="true"></i>' : ''}</button>`,
      ).join('');
      return `<div class="snd-layer${idx === 0 ? ' mute' : ''}"><span class="snd-ln"><i class="ph ${icon}" aria-hidden="true"></i>${label}</span><span class="snd-cells">${cells}</span></div>`;
    }).join('');
  }

  function render(msg) {
    tiles.forEach((t) => {
      const on = t.dataset.scene === scene;
      t.classList.toggle('on', on);
      t.setAttribute('aria-pressed', on && playing ? 'true' : 'false');
      const ic = t.querySelector('.snd-badge i');
      if (ic) ic.className = `ph-fill ph-${on && playing ? 'pause' : 'play'}`;
    });
    bar.hidden = !scene;
    mixBox.hidden = !scene;
    if (!scene) return;
    const tile = root.querySelector(`.snd-tile[data-scene="${scene}"]`);
    nowTitle.textContent = tile.querySelector('b').textContent;
    nowState.textContent = msg || (playing ? '재생 중 · 소리마다 길이가 달라 오래 들어도 같은 순간이 잘 안 와요' : '멈춤');
    pauseBtn.innerHTML = `<i class="ph-fill ph-${playing ? 'pause' : 'play'}" aria-hidden="true"></i>`;
    pauseBtn.setAttribute('aria-label', playing ? '멈추기' : '다시 틀기');
    bar.style.setProperty('--c', tile.style.getPropertyValue('--c'));
    renderMix();
  }

  tiles.forEach((t) =>
    t.addEventListener('click', () => (t.dataset.scene === scene ? togglePause() : playScene(t.dataset.scene))),
  );
  pauseBtn.addEventListener('click', togglePause);
  stopBtn.addEventListener('click', stop);
  volIn.addEventListener('input', () => {
    vol = Number(volIn.value) / 100;
    if (ctx && playing) ramp(master.gain, vol, 0.15);
  });
  mixBox.addEventListener('click', (e) => {
    const b = e.target.closest('.snd-cell');
    if (b) setLayer(b.dataset.layer, Number(b.dataset.v));
  });
})();
