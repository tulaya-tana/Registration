// Little Horizons — sound, music, stats (HP / MP / stamina / EXP), skills and monsters you can fight.
// Sound effects: Kenney starter kits (MIT). Music: generated live with WebAudio.
(() => {
  const LX = window.LHX, LM = window.LHM;
  const now = () => performance.now();
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  // =====================================================================  AUDIO
  const AU = { ctx: null, master: null, sfx: null, mus: null, amb: null, buf: {}, muted: lsGet('lh_mute', false) };
  const SND = ['coin', 'jump', 'land', 'walking', 'break', 'fall', 'enemy_hurt', 'enemy_destroy', 'enemy_attack', 'blaster', 'weapon_change', 'ambience', 'placement-a', 'toggle', 'impact'];
  function audioInit() {
    if (AU.ctx) { if (AU.ctx.state != 'running') AU.ctx.resume(); return; }
    try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const c = AU.ctx; AU.master = c.createGain(); AU.master.gain.value = AU.muted ? 0 : .9; AU.master.connect(c.destination);
    AU.sfx = c.createGain(); AU.sfx.gain.value = .75; AU.sfx.connect(AU.master);
    AU.mus = c.createGain(); AU.mus.gain.value = .16; AU.mus.connect(AU.master);
    AU.amb = c.createGain(); AU.amb.gain.value = 0; AU.amb.connect(AU.master);
    SND.forEach(n => fetch('sounds/' + n + '.mp3').then(r => r.arrayBuffer()).then(b => c.decodeAudioData(b)).then(b => { AU.buf[n] = b; if (n == 'ambience') loopStart('ambience', AU.amb); if (n == 'walking') AU.walk = loopStart('walking', AU.sfx, 0); }).catch(() => {}));
    music.start();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(e => addEventListener(e, audioInit, { passive: true }));
  function sfx(n, o = {}) {
    const c = AU.ctx, b = AU.buf[n]; if (!c || !b) return;
    const s = c.createBufferSource(), g = c.createGain(); s.buffer = b; s.playbackRate.value = (o.rate || 1) * (1 + ((o.vary == null ? .08 : o.vary) * (Math.random() - .5)));
    g.gain.value = o.vol == null ? 1 : o.vol; s.connect(g).connect(AU.sfx); s.start();
  }
  function loopStart(n, out, vol = 1) {
    const c = AU.ctx, s = c.createBufferSource(), g = c.createGain(); s.buffer = AU.buf[n]; s.loop = true; g.gain.value = vol; s.connect(g).connect(out); s.start(); return { s, g };
  }
  // the old random-beep background is replaced by the music below; short UI beeps still play
  const beep0 = beep;
  beep = function (f, d = .2, v = .07) { if (d >= 1.5 && v <= .02) return; if (!AU.ctx || AU.muted) return; try {
    const c = AU.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.value = v * 1.4;
    g.gain.exponentialRampToValueAtTime(.001, c.currentTime + d); o.connect(g).connect(AU.sfx); o.start(); o.stop(c.currentTime + d); } catch (e) { beep0(f, d, v); } };

  // ---- generated music: cozy pentatonic by day, softer at night, faster minor groove in battle
  const music = (() => {
    const MOODS = {
      day: { bpm: 92, chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], scale: [72, 74, 76, 79, 81, 84], mel: .75, drum: 0 },
      night: { bpm: 66, chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]], scale: [69, 72, 74, 76, 79], mel: .35, drum: 0 },
      battle: { bpm: 132, chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]], scale: [69, 71, 72, 74, 76, 77, 81], mel: .85, drum: 1 } };
    let mood = 'day', next = 0, step = 0, timer = null, last = 76;
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    function note(m, t, d, type, v, out = AU.mus) { const c = AU.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = hz(m);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + Math.min(.05, d * .3)); g.gain.exponentialRampToValueAtTime(.0008, t + d); o.connect(g).connect(out); o.start(t); o.stop(t + d + .05); }
    function hit(t, v, hi) { const c = AU.ctx, n = c.createBufferSource(), b = c.createBuffer(1, c.sampleRate * .12, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, hi ? 6 : 2); n.buffer = b; const g = c.createGain(), f = c.createBiquadFilter();
      f.type = hi ? 'highpass' : 'lowpass'; f.frequency.value = hi ? 6000 : 180; g.gain.value = v; n.connect(f).connect(g).connect(AU.mus); n.start(t); }
    function tick() {
      const c = AU.ctx; if (!c || !play) return; const M = MOODS[mood], sp = 60 / M.bpm / 2;   // eighth notes
      if (next < c.currentTime) next = c.currentTime + .05;
      while (next < c.currentTime + .25) {
        const bar = Math.floor(step / 8) % 4, beat = step % 8, ch = M.chords[bar];
        if (beat == 0) { ch.forEach(m => note(m - 12, next, sp * 8.5, 'sine', .11)); note(ch[0] - 24, next, sp * 3, 'triangle', .22); }
        if (beat == 4) note(ch[0] - 24, next, sp * 3, 'triangle', .18);
        if (M.drum) { if (beat % 4 == 0) hit(next, .5, 0); if (beat % 2 == 1) hit(next, .12, 1); }
        if (Math.random() < M.mel && (beat % 2 == 0 || mood == 'battle')) {
          const sc = M.scale, i = sc.indexOf(last), j = Math.max(0, Math.min(sc.length - 1, (i < 0 ? 2 : i) + [-2, -1, -1, 0, 1, 1, 2][(Math.random() * 7) | 0]));
          last = sc[j]; note(last, next, sp * (mood == 'battle' ? 1.2 : 2.2), mood == 'night' ? 'sine' : 'triangle', mood == 'battle' ? .09 : .1);
        }
        next += sp; step++;
      }
    }
    return { start() { if (!timer) timer = setInterval(tick, 90); }, set(m) { if (m != mood) { mood = m; } }, get mood() { return mood; } };
  })();

  // =====================================================================  UI
  const css = document.createElement('style');
  css.textContent = `
#st{top:calc(env(safe-area-inset-top,0px) + 44px);left:8px;width:172px;padding:6px 9px;font-size:11px;line-height:1.2}
#qs{top:calc(env(safe-area-inset-top,0px) + 128px)!important}
#st .bar{position:relative;height:11px;border-radius:6px;background:#0002;margin-top:3px;overflow:hidden}
#st .bar i{position:absolute;inset:0 auto 0 0;border-radius:6px;transition:width .15s}
#st .bar span{position:absolute;inset:0;text-align:center;font-size:9px;line-height:11px;color:#fff;text-shadow:0 1px 2px #0009;font-weight:700}
#st .xp{height:5px}
.b.cb{width:56px;height:56px;overflow:hidden}
#atk,.b.cb{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;line-height:1}
.b .ic{display:block;height:24px;line-height:0}.b .ic img{width:24px!important;height:24px!important}#atk .ic,#atk .ic img{width:30px!important;height:30px!important}
#atk{right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 156px);width:62px;height:62px;background:#e0634f}
#sk1{right:90px;bottom:calc(env(safe-area-inset-bottom,0px) + 158px)}#sk2{right:164px;bottom:calc(env(safe-area-inset-bottom,0px) + 158px)}#sk3{right:164px;bottom:calc(env(safe-area-inset-bottom,0px) + 92px)}
#sk1{background:#8e5bd9}#sk2{background:#4caf7a}#sk3{background:#4f8fd9}
.b .cd{position:absolute;inset:0;border-radius:50%;pointer-events:none}
.b .mp{position:relative;font-size:10px;font-weight:800;letter-spacing:.2px;padding:1px 6px;border-radius:8px;background:#0003;pointer-events:none;white-space:nowrap}.b .mp:empty{display:none}
#fxl{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:3}
.dmg{position:absolute;font-weight:900;font-size:20px;color:#ffb347;text-shadow:0 2px 0 #7a2d00,0 0 4px #000a;transform:translate(-50%,-50%);white-space:nowrap}
.dmg.crit{color:#ff5e5e;font-size:26px}.dmg.me{color:#c23bff}.dmg.heal{color:#5be37d}.dmg.xp{color:#7fe7ff;font-size:14px}
.mhp{position:absolute;transform:translate(-50%,-100%);font-size:10px;font-weight:700;color:#fff;text-shadow:0 1px 2px #000;text-align:center;white-space:nowrap}
.mhp b{display:block;width:54px;height:6px;margin:2px auto 0;border-radius:3px;background:#0007;overflow:hidden}.mhp b i{display:block;height:100%;background:#ff5e5e}
#hurt{position:fixed;inset:0;pointer-events:none;box-shadow:inset 0 0 90px #ff2a2a;opacity:0;transition:opacity .25s;z-index:2}
#snd{top:calc(env(safe-area-inset-top,0px) + 110px);right:8px;width:38px;height:38px;padding:0;border-radius:50%;position:fixed;background:var(--p);box-shadow:0 2px 8px #0003}
body.menu #st,body.menu .cb,body.menu #atk,body.menu #snd{display:none!important}
body.inroom #atk,body.inroom .cb{opacity:.35}`;
  document.head.appendChild(css);
  const el = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); const n = d.firstChild; document.body.appendChild(n); return n; };
  const st = el(`<div class="p" id="st"><div><b id="stlv">Lv 1</b> <span id="stcl"></span></div>
    <div class="bar"><i id="bhp" style="background:#ff5e6c"></i><span id="thp"></span></div>
    <div class="bar"><i id="bmp" style="background:#5b8cff"></i><span id="tmp"></span></div>
    <div class="bar"><i id="bst" style="background:#ffc93c"></i><span id="tst"></span></div>
    <div class="bar xp"><i id="bxp" style="background:#7fe7ff"></i></div></div>`);
  const fxl = el('<div id="fxl"></div>'), hurt = el('<div id="hurt"></div>');
  // canvas icons in the game's own hand-drawn style
  function icon(k) { const c = document.createElement('canvas'); c.width = c.height = 48; const x = c.getContext('2d'); x.lineWidth = 3; x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineJoin = x.lineCap = 'round';
    const L = (...p) => { x.beginPath(); p.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.stroke(); };
    if (k == 'sword') { L([12, 36], [36, 12]); L([32, 10], [38, 16]); L([10, 30], [18, 38]); L([12, 36], [8, 40]); }
    if (k == 'bolt') { x.beginPath(); x.arc(24, 24, 9, 0, 7); x.fill(); L([6, 24], [14, 24]); L([34, 24], [42, 24]); L([24, 6], [24, 14]); L([24, 34], [24, 42]); }
    if (k == 'bow') { x.beginPath(); x.arc(18, 24, 15, -1.2, 1.2); x.stroke(); L([24, 10], [24, 38]); L([10, 24], [42, 24]); L([36, 19], [42, 24], [36, 29]); }
    if (k == 'daggers') { L([10, 38], [30, 14]); L([38, 38], [18, 14]); L([8, 32], [16, 40]); L([40, 32], [32, 40]); }
    if (k == 'spin') { x.beginPath(); x.arc(24, 24, 14, .3, 5.6); x.stroke(); L([34, 8], [38, 13], [32, 16]); x.beginPath(); x.arc(24, 24, 4, 0, 7); x.fill(); }
    if (k == 'fire') { x.beginPath(); x.moveTo(24, 6); x.quadraticCurveTo(40, 22, 32, 36); x.quadraticCurveTo(24, 44, 16, 36); x.quadraticCurveTo(8, 22, 24, 6); x.fill(); }
    if (k == 'tri') { L([10, 38], [24, 10]); L([24, 40], [24, 10]); L([38, 38], [24, 10]); }
    if (k == 'storm') { [0, 2.1, 4.2].forEach(a => L([24 + Math.cos(a) * 6, 24 + Math.sin(a) * 6], [24 + Math.cos(a + .6) * 18, 24 + Math.sin(a + .6) * 18])); }
    if (k == 'heal') { x.fillRect(19, 9, 10, 30); x.fillRect(9, 19, 30, 10); }
    if (k == 'dash') { L([10, 14], [22, 24], [10, 34]); L([24, 14], [36, 24], [24, 34]); }
    if (k == 'snd' || k == 'mute') { x.strokeStyle = x.fillStyle = '#5a4036'; x.beginPath(); x.moveTo(8, 19); x.lineTo(16, 19); x.lineTo(26, 10); x.lineTo(26, 38); x.lineTo(16, 29); x.lineTo(8, 29); x.closePath(); x.fill();
      if (k == 'snd') { x.beginPath(); x.arc(28, 24, 8, -.9, .9); x.stroke(); x.beginPath(); x.arc(28, 24, 15, -.9, .9); x.stroke(); } else { L([32, 18], [42, 30]); L([42, 18], [32, 30]); } }
    return `<img src="${c.toDataURL()}" style="width:28px;height:28px;vertical-align:middle;pointer-events:none">`; }
  const btn = (id, cls) => { const b = document.createElement('button'); b.className = 'b ' + cls; b.id = id; b.innerHTML = '<span class="ic"></span><div class="cd"></div><div class="mp"></div>'; document.body.appendChild(b); return b; };
  const BA = btn('atk', ''), B1 = btn('sk1', 'cb'), B2 = btn('sk2', 'cb'), B3 = btn('sk3', 'cb');
  const sb = document.createElement('button'); sb.id = 'snd'; document.body.appendChild(sb);
  const sndUI = () => { sb.innerHTML = icon(AU.muted ? 'mute' : 'snd'); };
  sb.onpointerdown = e => { e.preventDefault(); audioInit(); AU.muted = !AU.muted; lsSet('lh_mute', AU.muted); if (AU.master) AU.master.gain.value = AU.muted ? 0 : .9; sndUI(); };
  sndUI();
  const menuObs = new MutationObserver(() => document.body.classList.toggle('inroom', !!window.IN)); menuObs.observe(document.body, { attributes: true });

  // =====================================================================  STATS
  const CLS = [ // per class: hp/mp multipliers, basic attack, skill 1 (class power)
    { n: 'นักรบ', hp: 1.3, mp: .9, armor: .25, atk: { k: 'melee', ic: 'sword', anim: '1H_Melee_Attack_Slice_Diagonal', dmg: 13, range: 2.8, arc: 1.9, cd: .55, st: 9, snd: 'impact' },
      s1: { n: 'หมุนดาบ', ic: 'spin', anim: '2H_Melee_Attack_Spin', mp: 12, cd: 5, k: 'aoe', r: 3.8, mul: 2.2 } },
    { n: 'จอมเวทย์', hp: .9, mp: 1.5, armor: 0, atk: { k: 'shot', ic: 'bolt', anim: 'Spellcast_Shoot', dmg: 12, speed: 17, cd: .6, st: 6, mpc: 0, col: 0x9fe7ff, snd: 'blaster' },
      s1: { n: 'ลูกไฟ', ic: 'fire', anim: 'Spellcast_Shoot', mp: 15, cd: 4, k: 'fireball', r: 3.4, mul: 3 } },
    { n: 'นักธนู', hp: 1, mp: 1.1, armor: .05, atk: { k: 'shot', ic: 'bow', anim: '2H_Ranged_Shoot', dmg: 12, speed: 26, cd: .7, st: 7, col: 0xe0a458, bolt: 1, snd: 'blaster' },
      s1: { n: 'ยิงสามดอก', ic: 'tri', anim: '2H_Ranged_Shoot', mp: 10, cd: 4, k: 'multishot', mul: 1.4 } },
    { n: 'จอมโจร', hp: 1, mp: 1, armor: .05, crit: .3, atk: { k: 'melee', ic: 'daggers', anim: 'Dualwield_Melee_Attack_Stab', dmg: 9, range: 2.4, arc: 1.6, cd: .38, st: 5, snd: 'break' },
      s1: { n: 'พายุมีด', ic: 'storm', anim: '2H_Melee_Attack_Spin', mp: 12, cd: 5, k: 'aoe', r: 3.4, mul: 1.1, hits: 3 } }];
  const S2 = { n: 'ฟื้นฟู', ic: 'heal', anim: 'Spellcast_Raise', mp: 16, cd: 10 }, S3 = { n: 'พุ่งหลบ', ic: 'dash', anim: 'Dodge_Forward', st: 25, cd: 1.4 };
  const cls = () => CLS[LX.CH.c] || CLS[0];
  let C = null;                                   // live stats (saved inside S.x.cb)
  const maxHp = () => Math.round((80 + C.lv * 20) * cls().hp), maxMp = () => Math.round((30 + C.lv * 8) * cls().mp), maxSt = () => 100 + C.lv * 4;
  const needXp = () => Math.round(25 * Math.pow(C.lv, 1.55));
  const atkPow = () => cls().atk.dmg + C.lv * 3;
  function initStats() { const x = S.x; x.cb = Object.assign({ lv: 1, xp: 0, hp: 0, mp: 0, kills: 0 }, x.cb || {}); C = x.cb;
    if (!C.hp) C.hp = maxHp(); if (!C.mp) C.mp = maxMp(); C.st = maxSt(); hudUI(); skillUI(); }
  const s0 = start; start = function (s) { s0(s); initStats(); DEAD = 0; };
  function hudUI() { if (!C) return; C.hp = Math.min(C.hp, maxHp()); C.mp = Math.min(C.mp, maxMp());
    const set = (b, t, v, m) => { $(b).style.width = (100 * v / m) + '%'; if (t) $(t).textContent = `${Math.ceil(v)} / ${m}`; };
    $('stlv').textContent = 'Lv ' + C.lv; $('stcl').textContent = cls().n;
    set('bhp', 'thp', C.hp, maxHp()); set('bmp', 'tmp', C.mp, maxMp()); set('bst', 'tst', C.st, maxSt()); set('bxp', null, C.xp, needXp()); }
  function skillUI() { const k = cls(); BA.querySelector('.ic').innerHTML = icon(k.atk.ic); B1.querySelector('.ic').innerHTML = icon(k.s1.ic); B2.querySelector('.ic').innerHTML = icon(S2.ic); B3.querySelector('.ic').innerHTML = icon(S3.ic);
    B1.querySelector('.mp').textContent = k.s1.mp + ' MP'; B2.querySelector('.mp').textContent = S2.mp + ' MP'; B3.querySelector('.mp').textContent = S3.st + ' ST'; }
  const rb0 = window.onRebuild; window.onRebuild = function () { rb0 && rb0(); if (C) { hudUI(); skillUI(); } };

  // =====================================================================  FX helpers
  const V = new T.Vector3();
  function scr(x, y, z) { V.set(x, y, z).project(cam); if (V.z > 1) return null; return [(V.x + 1) / 2 * innerWidth, (1 - V.y) / 2 * innerHeight]; }
  const pops = [];
  function pop(txt, x, y, z, cls2 = '') { const d = document.createElement('div'); d.className = 'dmg ' + cls2; d.textContent = txt; fxl.appendChild(d); pops.push({ d, x, y, z, t: 0, dx: (Math.random() - .5) * .6 }); }
  const parts = [];
  function burst(x, y, z, col, n = 10, sp = 4) { for (let i = 0; i < n; i++) { const m = new T.Mesh(new T.OctahedronGeometry(.09 + Math.random() * .08), new T.MeshBasicMaterial({ color: col, transparent: true }));
    m.position.set(x, y, z); sc.add(m); parts.push({ m, v: new T.Vector3((Math.random() - .5) * sp, Math.random() * sp * .9, (Math.random() - .5) * sp), t: 0 }); } }
  function ring(x, y, z, r, col) { const m = new T.Mesh(new T.RingGeometry(r * .8, r, 32).rotateX(-P / 2), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .8, side: 2 }));
    m.position.set(x, y + .15, z); m.scale.setScalar(.2); sc.add(m); parts.push({ m, ring: 1, t: 0 }); }
  let shake = 0;
  function hurtFlash() { hurt.style.opacity = .85; setTimeout(() => hurt.style.opacity = 0, 160); }

  // =====================================================================  MONSTERS
  const KIND = {
    Mushroom: { n: 'เห็ดซน', lv: 1, hp: 32, dmg: 6, sp: 2.4, xp: 9, gold: 4, drop: ['mushroom', .3] },
    Pig: { n: 'หมูป่าหัวร้อน', lv: 2, hp: 48, dmg: 8, sp: 2.6, xp: 14, gold: 6 },
    Bee: { n: 'ผึ้งยักษ์', lv: 3, hp: 36, dmg: 9, sp: 3, xp: 15, gold: 6, fly: 1.3, drop: ['flower', .35] },
    Crab: { n: 'ปูก้ามโต', lv: 3, hp: 58, dmg: 9, sp: 2, xp: 16, gold: 7, drop: ['shell', .35] },
    Ghost: { n: 'วิญญาณซากเมือง', lv: 5, hp: 85, dmg: 14, sp: 2.4, xp: 32, gold: 12, fly: .5, night: 1, drop: ['relic', .12] },
    King: { m: 'Mushroom', n: 'ราชาเห็ด', lv: 8, hp: 420, dmg: 22, sp: 2.2, xp: 220, gold: 150, scale: 2.4, boss: 1, drop: ['gem', 1], respawn: 240 } };
  const foes = [];
  // the wild critters from lh-models become proper monsters; deer and the village pets stay friendly
  const tameWild = () => { if (LM && LM.mobs) for (let i = LM.mobs.length - 1; i >= 0; i--) { const m = LM.mobs[i]; if (m.kind != 'Deer') { sc.remove(m.r.w); LM.mobs.splice(i, 1); } } };
  async function spawn(kind, x, z, ok) {
    const K = KIND[kind]; if (!K) return console.error('no kind', kind); const g = await LM.ld('mobs/' + (K.m || kind) + '.json'); if (!g) return;
    const r = LM.rig(g, LM.MS[K.m || kind] * (K.scale || 1), { em: 0x202020 });
    r.o.traverse(c => { if (c.isMesh) { if (K.night) { c.material.transparent = true; c.material.opacity = .82; c.material.emissive.set(0x7788aa); } if (K.boss) c.material.emissive.set(0x331100); } });
    r.play(K.fly ? 'Flying' : 'Idle'); sc.add(r.w);
    const f = { K, kind, r, hx: x, hz: z, x, z, a: Math.random() * 6, w: 0, mv: 0, hp: K.hp, ok: ok || (() => true), atkT: 0, dead: 0, respawn: 0, hitT: 0, ui: null };
    f.r.w.position.set(x, H(x, z), z); foes.push(f);
  }
  function placeFoes() {
    const spot = (n, ok, f) => { for (let i = 0, k = 0; i < n && k < 900; k++) { const x = -92 + Math.random() * 184, z = -92 + Math.random() * 184, h = H(x, z); if (Math.hypot(x, z) > 30 && ok(x, z, h, reg(x, z))) { i++; f(x, z); } } };
    const land = (x, z) => H(x, z) > .3 && Math.hypot(x, z) > 25, beach = (x, z) => { const h = H(x, z); return h > -.6 && h < 1.3 && z > 50; };
    spot(8, (x, z, h, r) => r == 4 && h > .5, (x, z) => spawn('Mushroom', x, z, land));
    spot(4, (x, z, h, r) => r == 6 && h > .5, (x, z) => spawn('Mushroom', x, z, land));
    spot(4, (x, z, h, r) => r == 5 && h > .5, (x, z) => spawn('Pig', x, z, land));
    spot(4, (x, z, h, r) => (r == 5 || r == 6) && h > .5, (x, z) => spawn('Bee', x, z, (x, z) => Math.hypot(x, z) > 25));
    spot(5, (x, z, h, r) => r == 1 && h > -.4 && h < 1, (x, z) => spawn('Crab', x, z, beach));
    [[-62, -47], [-47, -62], [-50, -49], [-63, -62]].forEach(q => spawn('Ghost', q[0], q[1], (x, z) => Math.hypot(x + 55, z + 55) < 22));
    let kx = -72, kz = 12; for (let k = 0; k < 60; k++) { const x = -80 + Math.random() * 20, z = -10 + Math.random() * 40; if (H(x, z) > .8) { kx = x; kz = z; break; } }
    spawn('King', kx, kz, (x, z) => H(x, z) > .3 && x < -24);
  }
  function hpBar(f, show) {
    if (!show) { if (f.ui) f.ui.style.display = 'none'; return; }
    if (!f.ui) { f.ui = document.createElement('div'); f.ui.className = 'mhp'; f.ui.innerHTML = `${f.K.n} Lv${f.K.lv}<b><i></i></b>`; fxl.appendChild(f.ui); if (f.K.boss) f.ui.style.color = '#ffd166'; }
    const top = (f.K.fly || 0) + 1.6 * (f.K.scale || 1), q = scr(f.x, f.r.w.position.y + top - (f.K.fly || 0), f.z);
    if (!q) { f.ui.style.display = 'none'; return; }
    f.ui.style.display = 'block'; f.ui.style.left = q[0] + 'px'; f.ui.style.top = q[1] + 'px'; f.ui.querySelector('i').style.width = (100 * f.hp / f.K.hp) + '%';
  }
  function damageFoe(f, d, o = {}) {
    if (f.dead) return; const crit = Math.random() < (cls().crit || .08) || o.crit; if (crit) d *= 1.8; d = Math.round(d * (.9 + Math.random() * .2));
    f.hp -= d; f.hitT = now(); f.aggro = 1; pop(d, f.x, f.r.w.position.y + 1.4 * (f.K.scale || 1), f.z, crit ? 'crit' : '');
    sfx('enemy_hurt', { rate: f.K.boss ? .7 : 1.1 }); burst(f.x, f.r.w.position.y + .7, f.z, crit ? 0xff5e5e : 0xffd166, crit ? 12 : 6);
    const kb = o.kb == null ? .8 : o.kb; if (!f.K.boss) { const a = Math.atan2(f.x - pl.position.x, f.z - pl.position.z); f.x += Math.sin(a) * kb; f.z += Math.cos(a) * kb; }
    f.r.o.traverse(c => { if (c.isMesh) c.material.emissive.setHex(0xff3333); }); setTimeout(() => f.r.o.traverse(c => { if (c.isMesh) c.material.emissive.setHex(f.K.night ? 0x7788aa : f.K.boss ? 0x331100 : 0x202020); }), 120);
    if (f.hp <= 0) kill(f); else if (now() > f.r.lock) f.r.once('HitRecieve', 1.4);
  }
  function kill(f) {
    f.dead = 1; f.hp = 0; f.r.once('Death', 1); f.r.lock = now() + 99999; hpBar(f, 0); sfx('enemy_destroy', { rate: f.K.boss ? .6 : 1 });
    burst(f.x, f.r.w.position.y + .6, f.z, 0xffffff, 14, 5); f.respawn = now() + (f.K.respawn || 35) * 1000; f.fade = now() + 1400;
    const g = f.K.gold + Math.floor(Math.random() * f.K.gold); S.coins += g; C.kills++;
    pop('+' + g + ' G', f.x, f.r.w.position.y + 2, f.z, 'xp'); sfx('coin', { vol: .7 });
    if (f.K.drop && Math.random() < f.K.drop[1]) { add(f.K.drop[0]); toast('ได้ ' + ITEMS[f.K.drop[0]][0] + ' ' + ITEMS[f.K.drop[0]][1] + ' จาก' + f.K.n); }
    if (f.K.boss) { add('relic'); toast('ปราบ' + f.K.n + 'สำเร็จ! 🎉'); }
    gainXp(f.K.xp); upd();
  }
  function gainXp(n) { C.xp += n; pop('+' + n + ' EXP', pl.position.x, pl.position.y + 3, pl.position.z, 'xp');
    while (C.xp >= needXp()) { C.xp -= needXp(); C.lv++; C.hp = maxHp(); C.mp = maxMp(); C.st = maxSt();
      toast('เลเวลอัป! Lv ' + C.lv + ' ✨ พลังเพิ่มขึ้น'); ring(pl.position.x, pl.position.y, pl.position.z, 3, 0xffd166); burst(pl.position.x, pl.position.y + 1, pl.position.z, 0xffd166, 24, 6);
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, .25, .06), i * 90)); if (LM.PR) LM.PR.once('Cheer'); }
    hudUI(); }

  // =====================================================================  PLAYER COMBAT
  let DEAD = 0, deadAt = null, inv = 0, lastHurt = 0, cdA = 0, cd = [0, 0, 0], dash = null, tired = 0;
  const shots = [];
  const canFight = () => play && C && !DEAD && !window.IN && !D && !window.RACING;
  function nearest(maxD, cone) { let best = null, bd = maxD; const p = pl.position;
    foes.forEach(f => { if (f.dead || !f.r.w.visible) return; const d = Math.hypot(f.x - p.x, f.z - p.z); if (d > bd) return;
      if (cone) { const a = Math.atan2(f.x - p.x, f.z - p.z), da = Math.abs(Math.atan2(Math.sin(a - ry), Math.cos(a - ry))); if (da > cone) return; } bd = d; best = f; }); return best; }
  function face(f) { if (f) { ry = Math.atan2(f.x - pl.position.x, f.z - pl.position.z); pl.rotation.y = ry; } }
  function anim(n, ts = 1.3) { if (LM.PR) LM.PR.once(n, ts); }
  function meleeHit(range, arc, d, o) { const p = pl.position; let n = 0;
    foes.forEach(f => { if (f.dead || !f.r.w.visible) return; const dist = Math.hypot(f.x - p.x, f.z - p.z) - (f.K.scale ? f.K.scale * .5 : 0); if (dist > range) return;
      const a = Math.atan2(f.x - p.x, f.z - p.z); if (Math.abs(Math.atan2(Math.sin(a - ry), Math.cos(a - ry))) > arc / 2) return; damageFoe(f, d, o); n++; }); return n; }
  function aoe(r, d, o) { const p = pl.position; foes.forEach(f => { if (!f.dead && f.r.w.visible && Math.hypot(f.x - p.x, f.z - p.z) < r + (f.K.scale || 1) * .4) damageFoe(f, d, o); }); }
  function shoot(dir, o) { const geo = o.bolt ? new T.BoxGeometry(.08, .08, .8) : new T.SphereGeometry(o.big ? .45 : .2, 10, 8);
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: o.col })); const p = pl.position; m.position.set(p.x + Math.sin(dir) * .8, p.y + 1.3, p.z + Math.cos(dir) * .8); m.rotation.y = dir; sc.add(m);
    if (!o.bolt) { const l = new T.Mesh(new T.SphereGeometry((o.big ? .45 : .2) * 1.9, 10, 8), new T.MeshBasicMaterial({ color: o.col, transparent: true, opacity: .3 })); m.add(l); }
    shots.push({ m, vx: Math.sin(dir) * o.speed, vz: Math.cos(dir) * o.speed, life: 1.1, ...o }); }
  function useStam(n) { if (C.st < n) { toast('เหนื่อยแล้ว… พักให้ Stamina ฟื้นก่อน', 1200); return false; } C.st -= n; return true; }
  function attack() { if (!canFight() || now() < cdA) return; const k = cls().atk; if (!useStam(k.st)) return;
    cdA = now() + k.cd * 1000; const t = nearest(k.k == 'melee' ? 5 : 16, k.k == 'melee' ? 1.6 : 1.1) || nearest(k.k == 'melee' ? 3 : 10); face(t); anim(k.anim, k.k == 'melee' ? 1.6 : 1.5);
    if (k.k == 'melee') setTimeout(() => { if (meleeHit(k.range, k.arc, atkPow())) { sfx(k.snd, { vol: .8 }); shake = .12; } else sfx('toggle', { rate: .7, vol: .6 }); if (cls().crit) setTimeout(() => meleeHit(k.range, k.arc, atkPow() * .7), 140); }, 160);
    else setTimeout(() => { shoot(ry, { col: k.col, speed: k.speed, d: atkPow(), bolt: k.bolt }); sfx(k.snd, { rate: k.bolt ? 1.6 : 1.2, vol: .55 }); }, 180); }
  function skill(i) { if (!canFight() || now() < cd[i]) return; const k = cls(), p = pl.position;
    if (i == 0) { const s = k.s1; if (C.mp < s.mp) return toast('MP ไม่พอ', 1000); C.mp -= s.mp; cd[0] = now() + s.cd * 1000; face(nearest(14)); anim(s.anim, 1.2); sfx('weapon_change');
      if (s.k == 'aoe') { const n = s.hits || 1; for (let h = 0; h < n; h++) setTimeout(() => { aoe(s.r, atkPow() * s.mul, { kb: 1.4 }); ring(p.x, p.y, p.z, s.r, LX.CH.c == 3 ? 0xb8a1ff : 0xffd166); sfx('impact', { rate: 1.2 }); shake = .2; }, 250 + h * 180); }
      if (s.k == 'fireball') setTimeout(() => { shoot(ry, { col: 0xff7a2a, speed: 13, d: atkPow() * s.mul, big: 1, boom: s.r }); sfx('blaster', { rate: .7 }); }, 250);
      if (s.k == 'multishot') setTimeout(() => { [-.22, 0, .22].forEach(o => shoot(ry + o, { col: 0xffd166, speed: 26, d: atkPow() * s.mul, bolt: 1 })); sfx('blaster', { rate: 1.4 }); }, 200);
    }
    if (i == 1) { if (C.mp < S2.mp) return toast('MP ไม่พอ', 1000); C.mp -= S2.mp; cd[1] = now() + S2.cd * 1000; anim(S2.anim, 1.3);
      const h = Math.round(maxHp() * (LX.CH.c == 1 ? .5 : .35)); C.hp = Math.min(maxHp(), C.hp + h); pop('+' + h, p.x, p.y + 2.6, p.z, 'heal');
      ring(p.x, p.y, p.z, 2.4, 0x5be37d); burst(p.x, p.y + 1, p.z, 0x5be37d, 16, 3); [660, 880, 1100].forEach((f, j) => setTimeout(() => beep(f, .3, .05), j * 70)); }
    if (i == 2) { if (!useStam(S3.st)) return; cd[2] = now() + S3.cd * 1000; const a = (Math.hypot(vx, vz) > .5) ? Math.atan2(vx, vz) : ry; ry = a; anim(S3.anim, 1.6);
      dash = { a, t: 0 }; inv = now() + 450; sfx('jump', { rate: .8 }); }
    hudUI(); }
  BA.onpointerdown = e => { e.preventDefault(); audioInit(); attack(); };
  [B1, B2, B3].forEach((b, i) => b.onpointerdown = e => { e.preventDefault(); audioInit(); skill(i); });
  addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (k == 'j') attack(); if (k == '1') skill(0); if (k == '2') skill(1); if (k == '3') skill(2);
    if (k == 'shift' && tired) K.shift = 0; });
  function hurtPlayer(d, f) {
    if (DEAD || now() < inv) return; d = Math.round(d * (1 - cls().armor) * (.9 + Math.random() * .2)); C.hp -= d; lastHurt = now();
    pop(d, pl.position.x, pl.position.y + 2.4, pl.position.z, 'me'); hurtFlash(); sfx('enemy_attack', { vol: .9 }); shake = .18;
    if (LM.PR && now() > LM.PR.lock) LM.PR.once('Hit_A', 1.6);
    if (C.hp <= 0) die(); hudUI(); }
  function die() { DEAD = now(); C.hp = 0; deadAt = pl.position.clone(); if (LM.PR) { LM.PR.once('Death_A', 1); LM.PR.lock = now() + 99999; }
    sfx('fall', { rate: .6 }); toast('หมดสติ… กำลังพากลับหมู่บ้าน', 2600);
    setTimeout(() => { const lost = Math.floor(S.coins * .1); S.coins -= lost; pl.position.set(0, H(0, -8), -8); vx = vz = 0; C.hp = maxHp(); C.mp = maxMp(); C.st = maxSt();
      if (LM.PR) { LM.PR.lock = 0; LM.PR.play('Idle'); } DEAD = 0; toast('ฟื้นแล้ว! ' + (lost ? `(ทำเหรียญหล่น ${lost})` : '') + ' ระวังมอนสเตอร์ด้วยนะ', 2600); upd(); hudUI(); }, 2600); }
  // sleeping restores everything
  const t2 = toast; toast = function (s, ms) { if (C && /ตื่นเช้า/.test(String(s))) { C.hp = maxHp(); C.mp = maxMp(); C.st = maxSt(); hudUI(); }
    if (/^ได้ /.test(String(s)) || /ขายได้|ซื้อ/.test(String(s))) sfx('coin'); else if (/สำเร็จ|ได้ปีก|ค้นพบ/.test(String(s))) [784, 988, 1175, 1568].forEach((f, i) => setTimeout(() => beep(f, .3, .05), i * 100));
    return t2(s, ms); };
  // red dots for monsters on the mini-map
  const dm1 = drawMap; drawMap = function () { dm1(); mx.fillStyle = '#e63946'; foes.forEach(f => { if (!f.dead && f.r.w.visible && Math.hypot(f.x - pl.position.x, f.z - pl.position.z) < 45) mx.fillRect((f.x + 100) * .8 - 1.5, (f.z + 100) * .8 - 1.5, 3, 3); }); };

  // =====================================================================  PER FRAME
  let wasGr = 1, lastStep = 0, combatT = 0;
  const p1 = window.post;
  window.post = (dt, t, p) => {
    p1(dt, t, p); if (!C) return; tameWild();
    const n = now(), spd = Math.hypot(vx, vz), sw = !window.IN && !window.FLY && H(p.x, p.z) < WL - .35;
    // death: stay put
    if (DEAD) { if (deadAt) p.copy(deadAt); vx = vz = 0; }
    // dash
    if (dash) { dash.t += dt; const s = 22 * Math.max(0, 1 - dash.t / .28); p.x += Math.sin(dash.a) * s * dt; p.z += Math.cos(dash.a) * s * dt; if (dash.t > .28) dash = null; }
    // stamina: sprinting drains it
    const sprint = (K.shift || K.shift_) && spd > 5.5 && !sw && !window.FLY;
    if (sprint) { C.st -= 16 * dt; if (C.st <= 0) { C.st = 0; tired = 1; K.shift = 0; $('spr').style.opacity = .6; toast('เหนื่อยแล้ว หยุดพักแป๊บ', 1200); } }
    else C.st = Math.min(maxSt(), C.st + (sw ? 6 : 24) * dt);
    if (tired && C.st > maxSt() * .35) tired = 0;
    if (tired) K.shift = 0;
    // regen
    const safe = Math.hypot(p.x, p.z) < 26 || window.IN, calm = n - lastHurt > 5000;
    if (calm && !DEAD) C.hp = Math.min(maxHp(), C.hp + (safe ? 6 : 1.2) * dt);
    C.mp = Math.min(maxMp(), C.mp + (safe ? 4 : 1.4) * dt);
    // jump / land sounds and footsteps
    if (wasGr && !gr && vy > 0) sfx('jump', { vol: .6 }); if (!wasGr && gr) sfx('land', { vol: .7 }); wasGr = gr;
    if (AU.walk) { const on = gr && spd > .6 && !sw && !window.FLY && !DEAD; AU.walk.g.gain.value += ((on ? .45 : 0) - AU.walk.g.gain.value) * Math.min(1, dt * 12); AU.walk.s.playbackRate.value = .75 + spd / 12; }
    // ambience: birds by day, quieter at night and indoors
    if (AU.amb) { const day = S.t > 6 && S.t < 19 ? 1 : .25; AU.amb.gain.value += (((window.IN ? .05 : .28) * day * (wxI == 2 ? .4 : 1)) - AU.amb.gain.value) * Math.min(1, dt); }
    // monsters
    const night = S.t > 19 || S.t < 5.5; let fighting = 0;
    foes.forEach(f => { const w = f.r.w;
      if (f.dead) { if (n > f.fade) w.visible = false; if (n > f.respawn) { f.dead = 0; f.hp = f.K.hp; f.x = f.hx; f.z = f.hz; f.aggro = 0; f.r.lock = 0; w.visible = true; f.r.play(f.K.fly ? 'Flying' : 'Idle'); } else return; }
      if (f.K.night) { w.visible = night; if (!night) { hpBar(f, 0); return; } }
      const d = Math.hypot(f.x - p.x, f.z - p.z); if (d > 70) { hpBar(f, 0); return; }
      const pv = Math.hypot(p.x, p.z) < 24 || window.IN || window.RACING || DEAD || (window.FLY && p.y - H(p.x, p.z) > 6);
      const home = Math.hypot(f.x - f.hx, f.z - f.hz);
      if (!pv && d < (f.aggro ? 16 : 8) && home < (f.K.boss ? 30 : 22)) { f.aggro = 1; fighting = 1;
        f.a = Math.atan2(p.x - f.x, p.z - f.z); f.mv = d > 1.4 + (f.K.scale || 1) * .5;
        if (!f.mv && n > f.atkT && n > f.r.lock) { f.atkT = n + (f.K.boss ? 1900 : 1500); f.r.once(f.K.fly ? 'Bite_Front' : 'Bite_Front', 1.3);
          setTimeout(() => { if (!f.dead && Math.hypot(f.x - pl.position.x, f.z - pl.position.z) < 2.3 + (f.K.scale || 1) * .5) hurtPlayer(f.K.dmg + C.lv * .5, f); }, 380); } }
      else { if (f.aggro && (pv || home > 22 || d > 18)) { f.aggro = 0; f.hp = Math.min(f.K.hp, f.hp + f.K.hp * .5); }
        f.w -= dt; if (f.w <= 0) { f.w = 1.5 + Math.random() * 3; f.mv = Math.random() < .55; f.a = home > 8 ? Math.atan2(f.hx - f.x, f.hz - f.z) : Math.random() * 6; } }
      if (f.mv && n > f.r.lock) { const sp = f.K.sp * (f.aggro ? 1.25 : .55), nx = f.x + Math.sin(f.a) * sp * dt, nz = f.z + Math.cos(f.a) * sp * dt;
        if (f.ok(nx, nz) && Math.hypot(nx, nz) > 24) { f.x = nx; f.z = nz; } else f.w = 0; }
      w.position.set(f.x, Math.max(H(f.x, f.z), f.K.fly ? WL : -99) + (f.K.fly ? f.K.fly + Math.sin(t * 2 + f.hx) * .2 : 0), f.z);
      w.rotation.y += Math.atan2(Math.sin(f.a - w.rotation.y), Math.cos(f.a - w.rotation.y)) * Math.min(1, dt * 8);
      if (n > f.r.lock) f.r.play(f.K.fly ? 'Flying' : f.mv ? 'Walk' : 'Idle', f.aggro ? 1.4 : 1);
      f.r.mx.update(dt); hpBar(f, d < 22 && (f.aggro || f.hp < f.K.hp || d < 10));
    });
    if (fighting) combatT = n; music.set(n - combatT < 4000 ? 'battle' : (S.t > 19.5 || S.t < 5.5) ? 'night' : 'day');
    // projectiles
    for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.life -= dt; s.m.position.x += s.vx * dt; s.m.position.z += s.vz * dt; s.m.rotation.x += dt * 6;
      let hit = null; for (const f of foes) { if (f.dead || !f.r.w.visible) continue; if (Math.hypot(f.x - s.m.position.x, f.z - s.m.position.z) < .9 * (f.K.scale || 1) + (s.big ? .4 : 0)) { hit = f; break; } }
      const ground = s.m.position.y < H(s.m.position.x, s.m.position.z) + .2;
      if (hit || s.life <= 0 || ground) { if (s.boom) { const q = s.m.position; ring(q.x, H(q.x, q.z), q.z, s.boom, 0xff7a2a); burst(q.x, q.y, q.z, 0xff7a2a, 22, 7); shake = .25; sfx('impact', { rate: .8 });
          foes.forEach(f => { if (!f.dead && Math.hypot(f.x - q.x, f.z - q.z) < s.boom) damageFoe(f, s.d, { kb: 1.6 }); }); }
        else if (hit) damageFoe(hit, s.d); sc.remove(s.m); shots.splice(i, 1); } }
    // particles, floating numbers, screen shake
    for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.t += dt;
      if (q.ring) { q.m.scale.setScalar(.2 + q.t * 3); q.m.material.opacity = Math.max(0, .8 - q.t * 1.6); }
      else { q.v.y -= 9 * dt; q.m.position.addScaledVector(q.v, dt); q.m.material.opacity = Math.max(0, 1 - q.t * 1.6); }
      if (q.t > .7) { sc.remove(q.m); parts.splice(i, 1); } }
    for (let i = pops.length - 1; i >= 0; i--) { const q = pops[i]; q.t += dt; const s = scr(q.x + q.dx * q.t, q.y + q.t * 1.4, q.z);
      if (s) { q.d.style.left = s[0] + 'px'; q.d.style.top = s[1] + 'px'; q.d.style.opacity = Math.min(1, 2.2 - q.t * 2); q.d.style.display = ''; } else q.d.style.display = 'none';
      if (q.t > 1.1) { q.d.remove(); pops.splice(i, 1); } }
    if (shake > 0) { shake -= dt; cam.position.x += (Math.random() - .5) * shake; cam.position.y += (Math.random() - .5) * shake; }
    // cooldown dials
    const dial = (b, until, total) => { const left = Math.max(0, until - n) / (total * 1000); b.querySelector('.cd').style.background = left > 0 ? `conic-gradient(#0008 ${left * 360}deg, transparent 0)` : ''; };
    dial(BA, cdA, cls().atk.cd); dial(B1, cd[0], cls().s1.cd); dial(B2, cd[1], S2.cd); dial(B3, cd[2], S3.cd);
    B1.style.opacity = C.mp < cls().s1.mp ? .55 : 1; B2.style.opacity = C.mp < S2.mp ? .55 : 1;
    document.body.classList.toggle('inroom', !!window.IN);
    hudUI();
  };
  // after the models are in, place the monsters
  const waitModels = setInterval(() => { if (LM && LM.PR) { clearInterval(waitModels); try { placeFoes(); } catch (e) { console.error('placeFoes', e); } } }, 500);
  window.LHC = { foes, get C() { return C; } };
})();
