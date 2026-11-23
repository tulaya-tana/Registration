// Little Horizons — hidden chariot race: 3 tracks, AI rivals, lap/checkpoint timing and a score board.
// Horses: Quaternius Ultimate Animated Animals (CC0). Abandoned cart prop: Quaternius Ultimate Modular Ruins (CC0).
(() => {
  const LX = window.LHX, LM = window.LHM;
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const now = () => performance.now();
  const dry = (x, z, m = .5) => H(x, z) > WL + m;

  // ------------------------------------------------------------------ the hidden stable
  let stable = null;
  for (let k = 0; k < 200 && !stable; k++) { const a = -.9 + k * .05, r = 86 - (k % 5) * 3, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if ([0, 1, 2, 3].every(i => dry(x + Math.cos(i * P / 2) * 5, z + Math.sin(i * P / 2) * 5, .8)) && Math.hypot(x - 62, z - 5) > 15) stable = [x, z]; }
  stable = stable || [84, -30];
  // ------------------------------------------------------------------ tracks (loops checked against the terrain)
  const TRACKS = [
    { n: 'ทุ่งกังหันลม', lv: 'ง่าย', laps: 3, ai: 16.5, pts: [[46, -8], [60, -15], [76, -8], [84, 8], [81, 28], [67, 43], [50, 42], [41, 27], [47, 13], [42, 2]] },
    { n: 'ชายหาดสายลม', lv: 'กลาง', laps: 2, ai: 18.5, pts: [[-72, 38], [-50, 33], [-20, 33], [10, 34], [40, 33], [66, 30], [82, 38], [70, 47], [40, 47], [12, 44], [-18, 46], [-48, 48], [-70, 47]] },
    { n: 'ป่าลึกวิสเปอริง', lv: 'ยาก', laps: 2, ai: 20, pts: [[-62, -28], [-78, -32], [-90, -18], [-82, -2], [-90, 12], [-84, 30], [-88, 46], [-74, 52], [-62, 40], [-70, 26], [-60, 12], [-72, 0], [-62, -12]] }];
  const away = (x, z) => Math.hypot(x, z) > 30 && Math.hypot(x - 62, z - 5) > 8 && Math.hypot(x - 20, z - 55) > 5 && Math.hypot(x - stable[0], z - stable[1]) > 14;
  function buildTrack(t) {
    let pts = t.pts.map(p => p.slice()), curve, S; const N = 400;
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    // nudge control points until every sample of the racing line (and both edges of the road) is on dry land
    for (let it = 0; it < 40; it++) {
      curve = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], 0, p[1])), true, 'centripetal'); S = curve.getSpacedPoints(N).slice(0, N);
      const bad = S.findIndex((q, i) => { const b = S[(i + 1) % N], dx = b.x - q.x, dz = b.z - q.z, l = Math.hypot(dx, dz) || 1;
        return !(dry(q.x, q.z, .5) && dry(q.x - dz / l * 3.4, q.z + dx / l * 3.4, .3) && dry(q.x + dz / l * 3.4, q.z - dx / l * 3.4, .3) && away(q.x, q.z)); });
      if (bad < 0) break; const q = S[bad]; let bi = 0, bd = 1e9; pts.forEach((p, i) => { const d = Math.hypot(p[0] - q.x, p[1] - q.z); if (d < bd) { bd = d; bi = i; } });
      pts[bi][0] += (cx - pts[bi][0]) * .08; pts[bi][1] += (cz - pts[bi][1]) * .08;
    }
    return { ...t, curve, S, N, len: curve.getLength() };
  }
  // clear trees, rocks and bushes off the racing road (once per track)
  const cleared = {};
  function clearRoad(t) { if (cleared[t.n]) return; cleared[t.n] = 1; const near = (x, z, r) => { for (let i = 0; i < t.N; i += 2) { const q = t.S[i]; if ((q.x - x) ** 2 + (q.z - z) ** 2 < r * r) return true; } return false; };
    for (let i = cols.length - 1; i >= 0; i--) { const o = cols[i]; if (o[2] <= 1.6 && near(o[0], o[1], 4.6 + o[2])) cols.splice(i, 1); }
    const zero = new T.Matrix4().makeScale(0, 0, 0);
    (window.LHI || []).forEach(g => g.list.forEach((a, k) => { if (near(a[0], a[2], 4.6)) g.ims.forEach(im => { im.setMatrixAt(k, zero); im.instanceMatrix.needsUpdate = true; }); })); }
  let built = null; const tracks = () => built || (built = TRACKS.map(buildTrack));

  const SG = new T.Group(); SG.position.set(stable[0], H(stable[0], stable[1]), stable[1]); sc.add(SG);
  const wood = M(0x8b5a2b), dark = M(0x5a3a22);
  for (let i = 0; i < 14; i++) { const a = i / 14 * 2 * P; if (i == 3 || i == 4) continue; const x = Math.cos(a) * 5, z = Math.sin(a) * 5;
    SG.add(B(new T.BoxGeometry(.25, 1.3, .25), wood, x, .65, z)); const n = (i + 1) / 14 * 2 * P;
    if (i != 2) { const r = B(new T.BoxGeometry(.12, .12, 2.3), wood, (x + Math.cos(n) * 5) / 2, 1, (z + Math.sin(n) * 5) / 2); r.lookAt(SG.position.x + Math.cos(n) * 5, SG.position.y + 1, SG.position.z + Math.sin(n) * 5); SG.add(r); } }
  const roof = new T.Group(); roof.add(B(new T.BoxGeometry(4, .2, 3), dark, 0, 3.2, 0)); [[-1.8, -1.3], [1.8, -1.3], [-1.8, 1.3], [1.8, 1.3]].forEach(q => roof.add(B(new T.BoxGeometry(.25, 3.2, .25), wood, q[0], 1.6, q[1]))); roof.position.set(-2, 0, -1.5); SG.add(roof);
  const board = new T.Group(); board.add(B(new T.BoxGeometry(.2, 2.2, .2), wood, -.9, 1.1, 0), B(new T.BoxGeometry(.2, 2.2, .2), wood, .9, 1.1, 0), B(new T.BoxGeometry(2.2, 1.2, .12), M(0xe8d3a8), 0, 1.7, 0));
  board.position.set(2.5, 0, 3.2); board.rotation.y = .5; SG.add(board);
  cols.push([stable[0] - 2, stable[1] - 1.5, 2.2]);

  // ------------------------------------------------------------------ chariots
  const horseGL = [null, null];
  Promise.all([LM.ld('mobs/Horse.json'), LM.ld('mobs/Horse_White.json'), LM.ld('race.json')]).then(([a, b, c]) => { horseGL[0] = a; horseGL[1] = b;
    if (c) { const cart = c.scene.getObjectByName('Cart'); if (cart) { const o = LM.prep(cart.clone()); o.scale.setScalar(1.1); o.position.set(1.8, 0, -2.5); o.rotation.y = 1; SG.add(o); } }
    if (a) { const h = makeHorse(0); h.w.position.set(-2, 0, -1.5); h.w.rotation.y = 1.2; SG.add(h.w); stable.horse = h; } });
  const HS = .9;                                              // horse scale (about 3 units at the head)
  function makeHorse(i) { const g = horseGL[i] || horseGL[0]; const r = LM.rig(g, HS, { em: 0x181818 }); r.play('Idle'); return r; }
  function makeChariot(col, horseIdx) {
    const g = new T.Group(), body = new T.Group(); g.add(body);
    const cm = M(col);
    body.add(B(new T.BoxGeometry(1.9, .7, 1.5), cm, 0, 1, 0), B(new T.BoxGeometry(2, .18, 1.6), dark, 0, .62, 0), B(new T.BoxGeometry(1.9, .5, .12), cm, 0, 1.55, .72));
    [-1, 1].forEach(s => { const wh = new T.Group(); wh.position.set(s * 1.1, .75, -.1);
      wh.add(B(new T.TorusGeometry(.62, .09, 6, 16).rotateY(P / 2), dark)); for (let k = 0; k < 4; k++) { const sp = B(new T.BoxGeometry(.06, 1.2, .06), wood); sp.rotation.x = k * P / 4; wh.add(sp); }
      body.add(wh); (g.wheels = g.wheels || []).push(wh); });
    [-.45, .45].forEach(x => { const pole = B(new T.BoxGeometry(.1, .1, 3.2), wood, x, .95, 2.2); body.add(pole); });
    if (horseGL[0]) { const h = makeHorse(horseIdx); h.w.position.set(0, 0, 3.6); g.add(h.w); g.horse = h; }
    sc.add(g); return g;
  }

  // ------------------------------------------------------------------ UI
  const css = document.createElement('style');
  css.textContent = `#rhud{top:calc(env(safe-area-inset-top,0px) + 8px);left:50%;transform:translateX(-50%);text-align:center;font-weight:700;min-width:180px;display:none;z-index:4}
#rhud .big{font-size:22px}#rcount{position:fixed;inset:0;display:none;align-items:center;justify-content:center;font-size:90px;font-weight:900;color:#fff;text-shadow:0 4px 0 #e07a3f,0 0 18px #0008;pointer-events:none;z-index:7}
#rx{top:calc(env(safe-area-inset-top,0px) + 8px);right:112px;position:fixed;display:none;z-index:4;padding:6px 12px}
body.racing #st,body.racing #qs,body.racing #atk,body.racing .cb,body.racing #ib,body.racing #act,body.racing #fly,body.racing #pr{display:none!important}
.rt{width:100%;border-collapse:collapse;font-size:13px}.rt td{padding:3px 4px;border-bottom:1px solid #0001}.rt td:last-child{text-align:right}
.rtab{display:flex;gap:4px;justify-content:center;flex-wrap:wrap}.rtab button{padding:6px 10px;font-size:13px}.rtab button.on{outline:3px solid #fff}`;
  document.head.appendChild(css);
  const mk = h => { const d = document.createElement('div'); d.innerHTML = h; const n = d.firstChild; document.body.appendChild(n); return n; };
  const rhud = mk('<div class="p" id="rhud"></div>'), rcount = mk('<div id="rcount"></div>'), rx = mk('<button id="rx">ออกจากการแข่ง</button>');
  const fmt = ms => { const s = ms / 1000, m = Math.floor(s / 60); return `${m}:${(s % 60).toFixed(2).padStart(5, '0')}`; };
  const BOARD = () => lsGet('lh_race_board', [[], [], []]);
  function boardHTML(ti) { const b = BOARD()[ti] || [];
    return `<table class="rt">${b.length ? b.map((r, i) => `<tr><td>${['🥇', '🥈', '🥉', '4.', '5.'][i].replace(/[\u{1F300}-\u{1FAFF}]/gu, '') || ''}${i + 1}</td><td>${r.n.replace(/[<>&]/g, '')}</td><td>${r.p == 1 ? 'ที่ 1' : 'ที่ ' + r.p}</td><td>${fmt(r.t)}</td></tr>`).join('') : '<tr><td>ยังไม่มีสถิติ ลองแข่งดูสิ</td></tr>'}</table>`; }
  function menu(ti = 0, tab = 'race') {
    const e = $('inv'), T3 = tracks(), t = T3[ti], best = (BOARD()[ti] || [])[0];
    e.innerHTML = `<b>คอกม้าลับ · แข่งรถม้า</b><div class="rtab">${T3.map((q, i) => `<button data-t="${i}" class="${i == ti ? 'on' : ''}">${i + 1}. ${q.n}</button>`).join('')}</div>
      <div style="margin:6px 0">ระดับ <b>${t.lv}</b> · ${t.laps} รอบ · ยาว ${Math.round(t.len)} ม. · คู่แข่ง 2 คัน<br>สถิติดีที่สุด: <b>${best ? fmt(best.t) + ' (' + best.n.replace(/[<>&]/g, '') + ')' : '-'}</b></div>
      <div class="rtab"><button id="rgo">เริ่มแข่ง!</button><button id="rbd">${tab == 'board' ? 'ซ่อนบอร์ด' : 'บอร์ดคะแนน'}</button><button id="rcl">ปิด</button></div>
      ${tab == 'board' ? '<div style="margin-top:6px"><b>บอร์ดคะแนน · ' + t.n + '</b>' + boardHTML(ti) + '</div>' : ''}
      <div style="font-size:11px;opacity:.8;margin-top:6px">W/S หรือจอยขึ้น-ลง = เร่ง/เบรก · A/D หรือจอยซ้าย-ขวา = เลี้ยว · Space/ปุ่มกระโดด = ฟาดแส้เร่งความเร็ว · ผ่านธงทุกจุดตามลำดับ</div>`;
    e.style.display = 'block';
    e.querySelectorAll('button[data-t]').forEach(b => b.onclick = () => menu(+b.dataset.t, tab));
    $('rgo').onclick = () => { e.style.display = 'none'; startRace(ti); };
    $('rbd').onclick = () => menu(ti, tab == 'board' ? 'race' : 'board'); $('rcl').onclick = () => e.style.display = 'none';
  }
  LX.IA.push({ room: -1, x: stable[0] - 2, z: stable[1] + 1.5, r: 3.6, tx: 'ขึ้นรถม้า (แข่งรถม้า)', ok: () => !R, fn: () => menu(0) });
  LX.IA.push({ room: -1, x: stable[0] + 2.5, z: stable[1] + 3.2, r: 2.6, tx: 'ดูบอร์ดคะแนนแข่งรถม้า', ok: () => !R, fn: () => menu(0, 'board') });
  // villagers drop hints about the secret
  NP[1].chat.push('ตอนลมพัดจากตะวันออก ลุงได้ยินเสียงม้าควบอยู่หลังเนินกังหันลมไกลๆ นะ');
  NP[2].chat.push('เคยมีคนแข่งรถม้ากันที่คอกเก่าทางตะวันออกสุดของแผนที่ ป่านนี้จะยังอยู่ไหมนะ');

  // ------------------------------------------------------------------ race
  let R = null, boost = 0;
  function nearestIdx(t, x, z, from) { let bi = from, bd = 1e9; for (let k = -25; k <= 25; k++) { const i = (from + k + t.N) % t.N, s = t.S[i], d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < bd) { bd = d; bi = i; } } return [bi, Math.sqrt(bd)]; }
  function trackMesh(t) {
    const g = new T.Group(), W = 3.4, pos = [], idx = [];
    for (let i = 0; i <= t.N; i++) { const a = t.S[i % t.N], b = t.S[(i + 1) % t.N], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
      [[a.x + nx * W, a.z + nz * W], [a.x - nx * W, a.z - nz * W]].forEach(q => pos.push(q[0], Math.max(H(q[0], q[1]), WL + .05) + .08, q[1]));
      if (i < t.N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    g.add(new T.Mesh(geo, new T.MeshLambertMaterial({ color: 0xd9b98a, side: 2 })));
    const gates = []; const NG = 8;
    for (let k = 0; k < NG; k++) { const i = Math.floor(k / NG * t.N), a = t.S[i], b = t.S[(i + 1) % t.N], ang = Math.atan2(b.x - a.x, b.z - a.z), gg = new T.Group(), y = Math.max(H(a.x, a.z), WL);
      const col = k == 0 ? 0xffffff : 0xff8fab; [-1, 1].forEach(s => gg.add(B(new T.CylinderGeometry(.15, .15, 8.2, 6), wood, s * 4.2, 4.1, 0)));
      const cloth = B(new T.BoxGeometry(8.4, .8, .08), new T.MeshBasicMaterial({ color: col }), 0, 7.8, 0); gg.add(cloth);
      if (k == 0) for (let c = 0; c < 8; c++) gg.add(B(new T.BoxGeometry(1.05, .45, .12), new T.MeshBasicMaterial({ color: 0x222222 }), -3.68 + c * 1.05, 7.8 + (c % 2 ? .2 : -.2), .01));
      gg.position.set(a.x, y, a.z); gg.rotation.y = ang; g.add(gg); gates.push({ i, g: gg, cloth, x: a.x, z: a.z }); }
    sc.add(g); return { g, gates };
  }
  function startRace(ti) {
    const t = tracks()[ti]; if (!horseGL[0]) return toast('ม้ายังไม่พร้อม ลองใหม่อีกครั้ง'); clearRoad(t);
    const tm = trackMesh(t), s0 = t.S[0], s1 = t.S[3], h0 = Math.atan2(s1.x - s0.x, s1.z - s0.z), side = [-Math.cos(h0), Math.sin(h0)];
    const racers = [0, 1, 2].map(k => { const back = k == 0 ? 8 : 12 + k * 3, off = k == 0 ? 0 : (k == 1 ? 2.2 : -2.2);
      const i = (t.N - Math.round(back / t.len * t.N)) % t.N, p = t.S[i];
      const ch = makeChariot([0xe76f6f, 0x6fa8dc, 0xf2c14e][k], k == 0 ? 0 : (k % 2)); const r = { ch, x: p.x + side[0] * off, z: p.z + side[1] * off, h: h0, v: 0, idx: i, lap: k > 0 ? -1 : 0, gate: 1, done: 0, off, ai: k > 0, k };
      if (k > 0) { r.param = i / t.N; r.skill = t.ai * (k == 1 ? 1.02 : .96); } return r; });
    R = { t, ti, tm, racers, me: racers[0], t0: 0, state: 'count', cnt: 3, cntT: now(), finish: [] };
    window.RACING = 1; document.body.classList.add('racing'); rhud.style.display = 'block'; rx.style.display = 'block';
    beep(440, .25, .08);
  }
  function endRace(quit) {
    if (!R) return; R.racers.forEach(r => sc.remove(r.ch)); sc.remove(R.tm.g); window.RACING = 0; document.body.classList.remove('racing');
    rhud.style.display = 'none'; rx.style.display = 'none'; rcount.style.display = 'none';
    pl.position.set(stable[0] - 2, H(stable[0] - 2, stable[1] + 4), stable[1] + 4); vx = vz = 0; pm.position.y = 0; R = null; if (quit) toast('ออกจากการแข่งแล้ว');
  }
  rx.onclick = () => endRace(1); addEventListener('keydown', e => { if (e.key == 'Escape' && R) endRace(1); });
  $('jmp').addEventListener('pointerdown', () => { if (R) boost = 1; }); addEventListener('keydown', e => { if (e.key == ' ' && R) boost = 1; });
  function results() {
    const me = R.me, place = R.finish.indexOf(me) + 1, time = me.time, t = R.t, b = BOARD();
    const prize = [0, 120, 60, 30][place] + (place == 1 && !(lsGet('lh_race_won', [])[R.ti]) ? 100 : 0);
    if (place == 1) { const w = lsGet('lh_race_won', []); w[R.ti] = 1; lsSet('lh_race_won', w); }
    S.coins += prize; upd(); const name0 = lsGet('lh_race_name', 'ฉัน');
    const e = $('inv'); e.innerHTML = `<b>เข้าเส้นชัย! · ${t.n}</b><div style="font-size:30px;font-weight:900;margin:4px 0">อันดับที่ ${place}</div>
      เวลา <b>${fmt(time)}</b> · ได้ ${prize} เหรียญ<br><div style="margin:6px 0">ชื่อบนบอร์ด <input id="rname" maxlength="14" value="${name0.replace(/"/g, '')}" style="font:inherit;width:120px;border-radius:8px;border:1px solid #0003;padding:3px 6px"></div>
      <div class="rtab"><button id="rsave">บันทึกลงบอร์ด</button><button id="rclose">ข้าม</button></div><div id="rbd2"></div>`;
    e.style.display = 'block';
    const close = () => { e.style.display = 'none'; endRace(); };
    $('rsave').onclick = () => { const n = ($('rname').value || 'ฉัน').trim().slice(0, 14) || 'ฉัน'; lsSet('lh_race_name', n);
      const bb = BOARD(); bb[R.ti] = (bb[R.ti] || []).concat([{ n, t: time, p: place, d: Date.now() }]).sort((a, c) => a.t - c.t).slice(0, 5); lsSet('lh_race_board', bb);
      $('rbd2').innerHTML = '<b>บอร์ดคะแนน · ' + t.n + '</b>' + boardHTML(R.ti); $('rsave').remove(); $('rclose').textContent = 'กลับคอกม้า'; };
    $('rclose').onclick = close;
  }

  const p0 = window.post;
  window.post = (dt, tt, p) => {
    p0(dt, tt, p);
    if (stable.horse) { stable.horse.mx.update(dt); }
    if (!R) return;
    const t = R.t, n = now(), me = R.me;
    // countdown
    if (R.state == 'count') { const left = 3 - Math.floor((n - R.cntT) / 900);
      if (left != R.cnt) { R.cnt = left; beep(left > 0 ? 440 : 880, .3, .09); }
      rcount.style.display = 'flex'; rcount.textContent = left > 0 ? left : 'GO!'; if (left <= 0) { R.state = 'go'; R.t0 = n; R.gt = 0; setTimeout(() => rcount.style.display = 'none', 700); } }
    const go = R.state == 'go'; if (go) R.gt += dt * 1000;          // race clock runs on game time, fair on slow devices
    // player chariot
    const thr = go ? ((K.w || K.arrowup || jy < -.3) ? 1 : (K.s || jy > .3) ? -1 : 0) : 0, steer = (K.d ? 1 : 0) - (K.a ? 1 : 0) + jx;
    if (go && boost && !me.bT && (!me.bCd || n > me.bCd)) { me.bT = n + 1300; me.bCd = n + 4000; beep(660, .15, .08); } boost = 0; if (me.bT && n > me.bT) me.bT = 0;
    const [mi, md] = nearestIdx(t, me.x, me.z, me.idx); me.idx = mi;
    const offTrack = md > 4.2, wet = H(me.x, me.z) < WL + .1, vmax = (wet ? 6 : offTrack ? 12 : 23) * (me.bT ? 1.4 : 1);
    if (thr > 0) me.v += 15 * dt; else if (thr < 0) me.v -= (me.v > 0 ? 26 : 8) * dt; else me.v *= Math.pow(.6, dt);
    me.v = Math.max(-6, Math.min(vmax, me.v > vmax ? me.v - 30 * dt : me.v));
    if (!me.done) me.h -= steer * dt * 1.9 * Math.min(1, Math.abs(me.v) / 6 + .25) * (me.v < 0 ? -1 : 1);
    if (me.done) me.v *= Math.pow(.3, dt);
    { const nx = me.x + Math.sin(me.h) * me.v * dt, nz = me.z + Math.cos(me.h) * me.v * dt;   // the shoreline is a wall: chariots don't drive into water
      if (H(nx, nz) > WL + .25 || H(nx, nz) >= H(me.x, me.z)) { me.x = nx; me.z = nz; } else me.v *= Math.pow(.05, dt); }
    R.racers.forEach(r => { if (!r.ai) return; const dx = me.x - r.x, dz = me.z - r.z, l = Math.hypot(dx, dz); if (l < 2.6 && l > 0) { me.x = r.x + dx / l * 2.6; me.z = r.z + dz / l * 2.6; me.v *= Math.pow(.4, dt); } });
    for (const o of cols) { const dx = me.x - o[0], dz = me.z - o[1], l = Math.hypot(dx, dz), r = o[2] + 1.2; if (l < r && l > 0) { me.x = o[0] + dx / l * r; me.z = o[1] + dz / l * r; me.v *= Math.pow(.25, dt); } }
    me.x = cl(me.x, -97, 97); me.z = cl(me.z, -97, 97);
    // checkpoints (in order) and laps
    if (go && !me.done) { const g = R.tm.gates[me.gate % R.tm.gates.length]; if (Math.hypot(me.x - g.x, me.z - g.z) < 7.5) { me.gate++; beep(990, .08, .05);
      if ((me.gate - 1) % R.tm.gates.length == 0) { me.lap++; if (me.lap >= t.laps) { me.done = 1; me.time = R.gt; R.finish.push(me); setTimeout(results, 900); beep(1175, .4, .08); } else toast('รอบที่ ' + (me.lap + 1) + ' / ' + t.laps, 1200); } } }
    R.tm.gates.forEach((g, k) => { g.cloth.material.color.setHex(k == me.gate % R.tm.gates.length && !me.done ? 0x7fe7ff : k == 0 ? 0xffffff : 0xff8fab); });
    // AI rivals follow the racing line, slowing for bends
    R.racers.forEach(r => { if (!r.ai) return;
      const i = Math.floor(r.param * t.N) % t.N, a = t.S[i], b = t.S[(i + 12) % t.N], c = t.S[(i + 24) % t.N];
      const bend = Math.abs(Math.atan2(Math.sin(Math.atan2(c.x - b.x, c.z - b.z) - Math.atan2(b.x - a.x, b.z - a.z)), Math.cos(Math.atan2(c.x - b.x, c.z - b.z) - Math.atan2(b.x - a.x, b.z - a.z))));
      const target = go && !r.done ? r.skill * (1 - Math.min(.45, bend * .55)) * (1 + .04 * Math.sin(n / 900 + r.k)) : 0; r.v += (target - r.v) * Math.min(1, dt * 1.5);
      const prev = r.param; r.param = (r.param + r.v * dt / t.len) % 1; if (r.param < prev && go) { r.lap++; if (r.lap >= t.laps && !r.done) { r.done = 1; r.time = R.gt; R.finish.push(r); } }
      const q = t.curve.getPointAt(r.param), q2 = t.curve.getPointAt((r.param + .002) % 1), h = Math.atan2(q2.x - q.x, q2.z - q.z);
      r.x = q.x + Math.cos(h) * r.off; r.z = q.z - Math.sin(h) * r.off; r.h = h; });
    // place chariots on the ground, spin wheels, gallop
    R.racers.forEach(r => { const ch = r.ch, y = Math.max(H(r.x, r.z), WL - .3); ch.position.set(r.x, y, r.z); ch.rotation.y = r.h;
      const ahead = Math.max(H(r.x + Math.sin(r.h) * 3, r.z + Math.cos(r.h) * 3), WL - .3); ch.rotation.x = -Math.atan2(ahead - y, 3) * .8;
      (ch.wheels || []).forEach(w => w.rotation.x += r.v * dt / .62); if (ch.horse) { ch.horse.play(Math.abs(r.v) > 9 ? 'Gallop' : Math.abs(r.v) > .5 ? 'Walk' : 'Idle', Math.abs(r.v) > 9 ? Math.abs(r.v) / 16 : Math.max(.5, Math.abs(r.v) / 4)); ch.horse.mx.update(dt); } });
    // the player rides in the red chariot; the camera sits behind it
    p.set(me.x, Math.max(H(me.x, me.z), WL - .3) + .7, me.z); vx = vz = 0; vy = 0; ry = me.h; pl.rotation.y = me.h; pm.position.y = 0;
    yaw += Math.atan2(Math.sin(me.h + P - yaw), Math.cos(me.h + P - yaw)) * Math.min(1, dt * 4); pitch += (.32 - pitch) * Math.min(1, dt * 3); dist += (12 - dist) * Math.min(1, dt * 3);
    // positions and HUD
    const prog = r => r.done ? 100 + (10 - R.finish.indexOf(r)) : r.ai ? r.lap + r.param : me.lap + ((me.gate - 1) % R.tm.gates.length) / R.tm.gates.length + .0001 * ((me.idx - R.tm.gates[(me.gate - 1) % R.tm.gates.length].i + t.N) % t.N);
    const order = R.racers.slice().sort((a, b) => prog(b) - prog(a)), pos = order.indexOf(me) + 1;
    rhud.innerHTML = `${t.n}<div class="big">อันดับ ${pos}/3</div>รอบ ${Math.min(me.lap + 1, t.laps)}/${t.laps} · ${fmt(go ? (me.done ? me.time : R.gt) : 0)}<br><small>${me.bT ? 'ฟาดแส้! เร่งความเร็ว' : offTrack ? 'ออกนอกทาง ม้าวิ่งช้าลง' : 'ธงถัดไปเรืองแสงสีฟ้า'}</small>`;
  };
  window.LHR = { tracks, get R() { return R; }, stable };
})();
