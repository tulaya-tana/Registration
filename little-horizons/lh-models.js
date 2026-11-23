// Little Horizons — 3D model pack (all CC0)
// Characters: KayKit Adventurers (Kay Lousberg) · Critters/flowers/trees/ruins/fish/palms: Quaternius
(() => {
  if (!T.GLTFLoader || !T.SkeletonUtils) return;
  const BASE = 'models/', GL = new T.GLTFLoader(), TL = new T.TextureLoader(), cache = {};
  const LX = window.LHX, LT = window.LHT;
  let total = 0, loaded = 0;
  const bar = document.createElement('div');
  bar.style.cssText = 'font-size:11px;opacity:.85;margin-top:4px';
  $('menu').appendChild(bar);
  const prog = () => { bar.textContent = loaded < total ? `กำลังโหลดโมเดล 3D… ${loaded}/${total}` : 'โมเดล 3D: KayKit · Quaternius (CC0)'; };
  const ld = f => cache[f] || (cache[f] = new Promise(res => { total++; prog();
    GL.load(BASE + f, g => { loaded++; prog(); res(g); }, undefined, e => { loaded++; prog(); console.warn('model', f, e); res(null); }); }));
  const tex = f => cache['t' + f] || (cache['t' + f] = new Promise(res => TL.load(BASE + 'tex/' + f + '.png', t => { t.flipY = false; t.encoding = T.LinearEncoding; res(t); }, undefined, () => res(null))));

  // ---------- materials: convert to the game's Lambert look (linear output, like the rest of the world)
  function lam(m, o = {}) {
    const n = new T.MeshLambertMaterial({ color: m.color ? m.color.clone() : 0xffffff, map: m.map || null, skinning: !!o.sk,
      vertexColors: !!m.vertexColors, side: m.side, transparent: !!m.transparent, opacity: m.opacity == null ? 1 : m.opacity, alphaTest: m.alphaTest || 0 });
    if (n.map) { n.map.encoding = T.LinearEncoding; n.map.needsUpdate = true; }
    if (o.em) n.emissive = new T.Color(o.em);
    return n;
  }
  function prep(root, o = {}) {
    root.traverse(c => { if (!c.isMesh) return;
      if (!c.geometry.attributes.normal) { c.geometry = c.geometry.clone(); c.geometry.computeVertexNormals(); }
      const ms = Array.isArray(c.material) ? c.material : [c.material], nm = ms.map(m => lam(m, { sk: c.isSkinnedMesh, em: o.em }));
      c.material = nm.length > 1 ? nm : nm[0]; if (c.isSkinnedMesh) c.frustumCulled = false; });
    return root;
  }
  // hue-shift a texture (skips skin/brown tones and greys) — used for outfit colours
  const HC = {};
  function hueTex(t, deg) {
    if (!deg || !t || !t.image) return t; const k = t.uuid + deg; if (HC[k]) return HC[k];
    const im = t.image, c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height), a = d.data, col = new T.Color(), h = {};
    for (let i = 0; i < a.length; i += 4) { col.setRGB(a[i] / 255, a[i + 1] / 255, a[i + 2] / 255).getHSL(h);
      if (h.s < .2 || (h.h > .03 && h.h < .14)) continue; col.setHSL((h.h + deg / 360) % 1, h.s, h.l);
      a[i] = col.r * 255; a[i + 1] = col.g * 255; a[i + 2] = col.b * 255; }
    x.putImageData(d, 0, 0); const n = new T.CanvasTexture(c); n.flipY = t.flipY; n.encoding = T.LinearEncoding;
    n.wrapS = t.wrapS; n.wrapT = t.wrapT; return HC[k] = n;
  }
  // outfit recolour for the player: paints outfit/armour pixels in the chosen outfit colour (keeping their shading),
  // so what you pick in the character menu is what you see. Skin, hair/leather browns, black and white are kept.
  function outfitTex(t, hex) {
    if (!t || !t.image) return t; const k = t.uuid + 'o' + hex; if (HC[k]) return HC[k];
    const im = t.image, c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height), a = d.data, col = new T.Color(), h = {}, tg = {};
    new T.Color(hex).getHSL(tg); const skin = q => q.h > .03 && q.h < .14;
    const grey = tg.s < .12;
    for (let i = 0; i < a.length; i += 4) { col.setRGB(a[i] / 255, a[i + 1] / 255, a[i + 2] / 255).getHSL(h);
      if (h.l < .1 || h.l > .92 || (h.s >= .2 && skin(h))) continue;
      const l = Math.min(.85, h.l * .6 + tg.l * .45), sat = grey ? 0 : h.s >= .2 ? Math.max(tg.s, h.s) * .9 : tg.s * .5;
      col.setHSL(tg.h, sat, l); a[i] = col.r * 255; a[i + 1] = col.g * 255; a[i + 2] = col.b * 255; }
    x.putImageData(d, 0, 0); const n = new T.CanvasTexture(c); n.flipY = t.flipY; n.encoding = T.LinearEncoding; n.wrapS = t.wrapS; n.wrapT = t.wrapT; return HC[k] = n;
  }
  function dressOutfit(o, hex, cape) {
    o.traverse(c => { if (!c.isMesh) return; const m = c.material, nm = c.name + ' ' + (c.parent && c.parent.name);
      if (/Cape/.test(nm)) { m.map = null; m.color.set(cape); }
      else if (/Body|Arm|Leg|Head|Hat|Helmet/.test(nm) && m.map) m.map = outfitTex(m.map, hex);
      m.needsUpdate = true; });
  }
  function dress(o, hue, cape) {
    o.traverse(c => { if (!c.isMesh) return; const m = c.material; if (hue && m.map) m.map = hueTex(m.map, hue);
      if (cape != null && /Cape/.test(c.name + (c.parent && c.parent.name))) { m.map = null; m.color.set(cape); } m.needsUpdate = true; });
  }

  // ---------- animated rigs
  function rig(g, s, o = {}) {
    const m = prep(T.SkeletonUtils.clone(g.scene), o); m.scale.setScalar(s); const w = new T.Group(); w.add(m);
    const mx = new T.AnimationMixer(m), A = {}; g.animations.forEach(c => A[c.name] = mx.clipAction(c));
    const r = { w, o: m, mx, A, cur: '', lock: 0,
      play(n, ts = 1, f = .25) { const a = A[n]; if (!a) return; a.timeScale = ts; if (r.cur == n) return; const p = A[r.cur];
        a.reset().setLoop(T.LoopRepeat, Infinity).setEffectiveWeight(1).fadeIn(f).play(); if (p) p.fadeOut(f); r.cur = n; },
      once(n, ts = 1) { const a = A[n]; if (!a) return; const p = A[r.cur]; a.reset().setLoop(T.LoopOnce, 1); a.clampWhenFinished = true;
        a.timeScale = ts; a.setEffectiveWeight(1).fadeIn(.12).play(); if (p && p !== a) p.fadeOut(.12); r.cur = n;
        r.lock = performance.now() + a.getClip().duration / ts * 900; } };
    return r;
  }
  const hideKids = (g, keep) => g.children.forEach(c => { if (!keep.includes(c)) c.visible = false; });

  // ---------- static model library (nature / ruins / sea): named top-level nodes
  const LIB = {};
  function libAdd(g) { if (g) g.scene.children.forEach(c => { prep(c); LIB[c.name] = c; }); }
  const part = (n) => { const s = LIB[n]; if (!s) return null; const c = s.clone(); c.position.set(0, 0, 0); return c; };
  function retex(o, t, col) { o.traverse(c => { if (c.isMesh) { c.material = c.material.clone(); if (t) { c.material.map = t; c.material.color.set(0xffffff); } if (col != null) c.material.color.set(col); } }); return o; }
  // instanced placement of a library model: list = [x,y,z,scale,rotY]
  function inst(n, list, s = 1, opt = {}) {
    const src = LIB[n]; if (!src || !list.length) return [];
    src.updateMatrixWorld(true); const inv = new T.Matrix4().copy(src.matrixWorld).invert(), out = [];
    src.traverse(c => { if (!c.isMesh) return;
      const rel = new T.Matrix4().multiplyMatrices(inv, c.matrixWorld); let mat = c.material;
      if (opt.map || opt.col != null) { mat = mat.clone(); if (opt.map) { mat.map = opt.map; mat.color.set(0xffffff); } if (opt.col != null) mat.color.set(opt.col); }
      const im = new T.InstancedMesh(c.geometry, mat, list.length), d = new T.Object3D(), tm = new T.Matrix4();
      list.forEach((a, i) => { d.position.set(a[0], a[1], a[2]); d.rotation.set(0, a[4] || 0, 0); d.scale.setScalar((a[3] || 1) * s); d.updateMatrix();
        im.setMatrixAt(i, tm.multiplyMatrices(d.matrix, rel)); });
      im.frustumCulled = false; sc.add(im); out.push(im); });
    (window.LHI = window.LHI || []).push({ ims: out, list, rel: out.map(() => null) });
    return out;
  }
  const put = (n, x, z, s = 1, ry = 0, y) => { const o = part(n); if (!o) return null; o.userData.placed = n;
    if (H(x, z) < WL + .3) { const q = findDry(x, z, .8, 12); if (y != null) y += H(q[0], q[1]) - H(x, z); x = q[0]; z = q[1]; } o.scale.setScalar(s); o.rotation.y = ry; o.position.set(x, y == null ? H(x, z) : y, z); sc.add(o); return o; };
  const RD = () => R();

  // ================= PLAYER & NPCs (KayKit Adventurers)
  const CM = ['Knight', 'Mage', 'Rogue_Hooded', 'Rogue'], KS = 1.05;
  let PR = null, want = '';
  async function playerModel() {
    const C = LX.CH, key = C.c + '_' + C.o + '_' + C.h; want = key;
    if (!PR || PR.key != key) { const g = await ld('chars/' + CM[C.c] + '.json'); if (!g || want != key) return;
      const r = rig(g, KS, { em: 0x1a1a1a }); dressOutfit(r.o, LX.CL[C.c].cols[C.o][0], C.h); r.key = key; r.play('Idle'); PR = r; }
    if (PR.w.parent !== pm) pm.add(PR.w); hideKids(pm, [PR.w, LX.wg]);
  }
  window.onRebuild = playerModel;

  const NPM = [['Mage', 110, 0xff9fc8], ['Barbarian', 0, 0x4f7fd9], ['Rogue_Hooded', 0, null], ['Mage', 0, 0xb8a1ff]];
  async function npcModels() {
    await Promise.all(NP.map(async (n, i) => { const [f, hue, cape] = NPM[i], g = await ld('chars/' + f + '.json'); if (!g) return;
      const r = rig(g, KS, { em: 0x1a1a1a }); dress(r.o, hue, cape); r.play('Idle'); n.rig = r; n.m.add(r.w); hideKids(n.m, [r.w]); n.px = n.x; n.pz = n.z; n.m.position.set(n.x, Math.max(H(n.x, n.z), WL), n.z); }));
    if (window.SHOPK) { const g = await ld('chars/Rogue.json'); if (g) { const r = rig(g, KS, { em: 0x1a1a1a }); dress(r.o, 200, 0xf2c14e); r.play('Idle');
      SHOPK.add(r.w); hideKids(SHOPK, [r.w]); SHOPK.rig = r; } }
  }

  // ================= CRITTERS (Quaternius Cute Monsters)
  const MS = { Mushroom: .7, Pig: .66, Chicken: .58, Panda: .7, Penguin: .62, Crab: .6, Deer: .85, Bee: .5, Ghost: .8 }, mobs = [];
  async function mob(kind, x, z, o = {}) {
    const g = await ld('mobs/' + kind + '.json'); if (!g) return null;
    const r = rig(g, MS[kind] * (o.s || 1), { em: 0x202020 }); r.play(o.fly ? 'Flying' : 'Idle');
    if (o.ghost) r.o.traverse(c => { if (c.isMesh) { c.material.transparent = true; c.material.opacity = .8; c.material.emissive.set(0x7788aa); } });
    r.w.position.set(x, H(x, z), z); r.w.rotation.y = RD() * 6; sc.add(r.w);
    const m = { r, kind, hx: x, hz: z, x, z, a: RD() * 6, w: 0, mv: 0, ...o }; mobs.push(m); return m;
  }
  async function critters() {
    // village critters take over the bunnies' AI
    const RB = ['Mushroom', 'Pig', 'Chicken', 'Mushroom', 'Panda', 'Pig', 'Chicken', 'Penguin'];
    await Promise.all(rab.map(async (a, i) => { const g = await ld('mobs/' + RB[i] + '.json'); if (!g) return;
      const r = rig(g, MS[RB[i]], { em: 0x202020 }); r.play('Idle'); a.g.add(r.w); hideKids(a.g, [r.w]); a.rig = r; }));
    const spot = (n, ok, f) => { for (let i = 0, k = 0; i < n && k < 600; k++) { const x = -92 + RD() * 184, z = -92 + RD() * 184, h = H(x, z); if (ok(x, z, h, reg(x, z))) { i++; f(x, z); } } };
    const jobs = [];
    spot(6, (x, z, h, r) => r == 1 && h > -.4 && h < 1, (x, z) => jobs.push(mob('Crab', x, z, { rad: 5, ok: (x, z) => { const h = H(x, z); return h > -.6 && h < 1.2; } })));
    spot(4, (x, z, h, r) => r == 4 && h > .5, (x, z) => jobs.push(mob('Deer', x, z, { rad: 9, ok: (x, z) => H(x, z) > .4 })));
    spot(3, (x, z, h, r) => r == 5 && h > .5, (x, z) => jobs.push(mob('Pig', x, z, { rad: 8, ok: (x, z) => H(x, z) > .4 })));
    items.filter(i => i.t == 'flower').slice(0, 6).forEach(f => jobs.push(mob('Bee', f.x, f.z, { fly: 1.3, rad: 4 })));
    [[-62, -48], [-48, -62], [-50, -50]].forEach(q => jobs.push(mob('Ghost', q[0], q[1], { fly: .6, rad: 7, ghost: 1, night: 1 })));
    await Promise.all(jobs);
  }

  // ================= WORLD: trees, flowers, bushes, rocks, ruins, sea
  const kill = arr => (arr || []).forEach(o => { if (o) { o.visible = false; if (o.parent) o.parent.remove(o); } });
  async function world() {
    const [gN, gR, gS] = await Promise.all([ld('nature.json'), ld('ruins.json'), ld('sea.json')]);
    [gN, gR, gS].forEach(libAdd);
    const TX = {}; (await Promise.all(['Flower', 'Flower2', 'Flower3', 'Flower4', 'Mushroom', 'Tree', 'Tree2', 'Tree3', 'Tree4', 'Tree5', 'Tree6', 'Tree7'].map(async n => [n, await tex(n)]))).forEach(([n, t]) => TX[n] = t);
    const split = (l, k) => Array.from({ length: k }, (_, j) => l.filter((_, i) => i % k == j));

    if (gN) {
      // ---- trees (same spots & collisions as before)
      kill(LT.treeM);
      const [t0a, t0b, t0c] = split(LT.TY[0], 3);            // whispering woods
      inst('Tree', t0a, 1.15, { map: TX.Tree }); inst('BigTree', t0b, .8, { map: TX.Tree2 }); inst('Tree', t0c, 1.1, { map: TX.Tree6 });
      const [t1a, t1b] = split(LT.TY[1], 2);                 // round green
      inst('Tree1', t1a, 1.1); inst('Tree3', t1b, 1.1);
      const [t2a, t2b, t2c] = split(LT.TY[2], 3);            // blossom / fantasy trees
      inst('SmallTree', t2a, 1.25, { map: TX.Tree7 }); inst('Tree', t2b, 1.1, { map: TX.Tree4 }); inst('SmallTree', t2c, 1.2, { map: TX.Tree5 });
      const [t3a, t3b] = split(LT.TY[3], 2);                 // tall slim
      inst('Tree2', t3a, .95); inst('Tree4', t3b, .7, { map: null });
      // ---- bushes & rocks
      kill([LT.buM, LT.rkM]);
      const [b1, b2, b3] = split(LT.bu.map(a => [a[0], a[1] - .1, a[2], a[3], a[4]]), 3);
      inst('Bush', b1, .45, { map: TX.Tree }); inst('Bush1', b2, .75); inst('BigBush', b3, .38, { map: TX.Tree3 });
      const [r1, r2, r3] = split(LT.rk.map(a => [a[0], a[1] - a[3] * .3, a[2], a[3], a[4]]), 3);
      inst('Rock1', r1, .7, { col: 0xb3b0a6 }); inst('Rock2', r2, .8, { col: 0xd8d4c8 }); inst('Rock3', r3, .6, { col: 0x9a9890 });
      // ---- collectible flowers & mushrooms
      const FL = [['Flower', .72], ['Flower2', .6], ['Flower3', .55]], FT = ['Flower', 'Flower2', 'Flower3', 'Flower4'];
      items.forEach((it, k) => {
        if (it.t == 'flower') { const [n, s] = FL[k % 3], o = part(n); if (!o) return; retex(o, TX[FT[(k * 7) % 4]]); o.scale.setScalar(s); o.rotation.y = k; it.g.add(o); hideKids(it.g, [o]); }
        if (it.t == 'mushroom') { const o = part('Mushroom'); if (!o) return; retex(o, TX.Mushroom); o.scale.setScalar(.5); it.g.add(o); hideKids(it.g, [o]); }
      });
      // ---- decorative flower meadows, forest mushrooms & grass tufts
      const deco = (n, ok) => { const o = []; for (let k = 0; k < n * 10 && o.length < n; k++) { const x = -94 + RD() * 188, z = -94 + RD() * 188, h = H(x, z);
        if (Math.hypot(x, z) > 9 && ok(h, reg(x, z))) o.push([x, h, z, .7 + RD() * .6, RD() * 6]); } return o; };
      const meadow = deco(260, (h, r) => h > .35 && (r == 0 || r == 5 || r == 6));
      FL.forEach(([n, s], i) => FT.forEach((t, j) => inst(n, meadow.filter((_, k) => k % 12 == i * 4 + j), s * .8, { map: TX[t] })));
      inst('Mushroom', deco(45, (h, r) => h > .4 && r == 4), .38, { map: TX.Mushroom });
      inst('Grass2', deco(220, (h, r) => h > .3 && r != 1 && r != 2), 3.2);
    }

    if (gR) {
      // weathered stone: lift the very dark source colours to a soft sandstone grey
      const stone = new T.Color(0xd9d2bf);
      gR.scene.traverse(c => { if (c.isMesh) [].concat(c.material).forEach(m => { const l = m.color.r * .3 + m.color.g * .59 + m.color.b * .11; if (l < .35 && m.color.g <= m.color.r * 1.15) m.color.lerp(stone, .6); else if (l < .35) m.color.multiplyScalar(1.6); }); });
      // ---- Mystery Ruins
      const ringCyl = [];
      sc.children.forEach(o => { if (o.isMesh && o.geometry.type == 'CylinderGeometry' && o.geometry.parameters.radiusTop == .6 && o.geometry.parameters.radiusBottom == .7
        && Math.hypot(o.position.x + 55, o.position.z + 55) < 9) ringCyl.push(o); });
      kill(ringCyl); kill(LT.ruM);
      for (let i = 0; i < 8; i++) { const a = i * P / 4, x = -55 + Math.cos(a) * 8, z = -55 + Math.sin(a) * 8;
        put(i % 3 == 2 ? 'Column_Round_Short' : 'Column_Round', x, z, i % 3 == 2 ? 1.5 : 1.05 + (i % 2) * .15, a, H(x, z) - .1); }
      put('Wall_ArchRound_Overgrown', -40, -55, 1.15, P / 2, H(-40, -55) - .1);
      [[-40, -58.6], [-40, -51.4]].forEach(q => put('Torch', q[0], q[1], 1.2, P / 2, H(q[0], q[1]) + .3));
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = -57 + i * 2, z = -57 + j * 2; put('Floor_Diamond', x, z, 1, 0, H(-55, -55) + .06); }
      put('Statue_Fox', -66.5, -55, .85, P / 2); put('Statue_Stag', -55, -67, .75, 0); cols.push([-66.5, -55, 1], [-55, -67, 1.1]);
      [[-47, -64, 'Pot1'], [-48.5, -65, 'Pot1_Broken'], [-63, -47, 'Pot2'], [-64.5, -46, 'Pot1'], [-45, -47, 'Pot1_Broken'], [-66, -62, 'Pot2']].forEach(q => put(q[2], q[0], q[1], 1.1, RD() * 6));
      [[0.4, 'Wall_Overgrown'], [1.3, 'Wall_Broken'], [2.6, 'Wall_Overgrown'], [3.5, 'Wall_Broken'], [4.6, 'Wall_Overgrown'], [5.5, 'Wall_Broken']].forEach(q => {
        const x = -55 + Math.cos(q[0]) * 15, z = -55 + Math.sin(q[0]) * 15; put(q[1], x, z, 1.2, -q[0] + P / 2, H(x, z) - .15); cols.push([x, z, 1.2]); });
      [[-70, -45], [-42, -68], [-68, -66]].forEach(q => { put('DeadTree_1', q[0], q[1], 1.6, RD() * 6); cols.push([q[0], q[1], .5]); });
      [[-50, -44], [-61, -64], [-44, -58], [-66, -50]].forEach(q => put('Bush_Round', q[0], q[1], 1.2, RD() * 6));
      // ---- treasure chests → real chests (closed / open-with-gold)
      const chestify = (g, s, getOpen) => { const c = part('Chest'), o = part('Chest_Gold'); if (!c || !o) return; [c, o].forEach(m => { m.scale.setScalar(s); g.add(m); });
        hideKids(g, [c, o]); g.userData.ch = [c, o, getOpen]; chestList.push(g); };
      chests.forEach(h => chestify(h.g, 1, () => h.open));
      if (LX.sky) { const sk = LX.sky; sk.children.slice(2).forEach(c => c.visible = false); const c = part('Chest'), o = part('Chest_Gold');
        if (c && o) { [c, o].forEach(m => { m.position.y = .4; sk.add(m); }); sk.userData.ch = [c, o, () => S && S.x && S.x.sky]; chestList.push(sk); } }
      if (LX.uw) { const c = part('Chest'); if (c) { LX.uw.material.visible = false; c.position.y = -.4; LX.uw.add(c); } }
      // seaweed (ruins grass, tinted)
      const sw = []; for (let k = 0; k < 900 && sw.length < 110; k++) { const lake = k % 2, x = lake ? 45 + (RD() - .5) * 34 : -90 + RD() * 180, z = lake ? -55 + (RD() - .5) * 34 : 60 + RD() * 34, h = H(x, z);
        if (h < WL - .9) sw.push([x, h, z, 1.2 + RD() * 1.4, RD() * 6]); }
      const [w1, w2] = split(sw, 2); inst('Grass', w1, 1, { col: 0x3fae7a }); inst('Grass', w2, 1, { col: 0x6fcf9a });
    }

    if (gS) {
      // ---- palms, gems, fish
      (LT.palms || []).forEach((g, i) => { g.visible = false; put('PalmTree_' + (i % 3 + 1), g.position.x, g.position.z, 1.45, RD() * 6, g.position.y); });
      for (let k = 0, n = 0; k < 400 && n < 8; k++) { const x = -70 + RD() * 140, z = 50 + RD() * 10, h = H(x, z); if (h > .1 && h < 1.4) { n++; put('PalmTree_' + (n % 3 + 1), x, z, 1.3 + RD() * .3, RD() * 6); cols.push([x, z, .4]); } }
      { const q = BLDG._bucket || [10.5, 46]; put('Bucket_Fishes', q[0], q[1], 1.1, .5); }
      items.forEach((it, k) => { if (it.t != 'gem') return; const o = part(k % 2 ? 'Gem_Pink' : 'Gem_Blue'); if (!o) return;
        o.scale.setScalar(.85); o.position.y = .55; o.traverse(c => { if (c.isMesh) c.material.emissive = new T.Color(k % 2 ? 0x551122 : 0x114433); }); it.g.add(o); hideKids(it.g, [o]); gems.push(o); });
      const FN = ['Clownfish', 'BlueTang', 'Goldfish', 'Koi', 'Puffer', 'ButterflyFish', 'Betta', 'YellowTang', 'MoorishIdol'];
      const school = (cx, cz, n, rad, ok) => { for (let k = 0, i = 0; k < 300 && i < n; k++) { const r = 3 + RD() * rad, a = RD() * 6, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
        if (!ok(H(x, z))) continue; i++; const o = part(FN[(i + k) % FN.length]); if (!o) continue; const s = .2 + RD() * .1; o.scale.setScalar(s); sc.add(o);
        fishes.push({ o, cx, cz, r, a, sp: (.25 + RD() * .35) * (RD() < .5 ? 1 : -1), d: .35 + RD() * Math.min(.8, WL - H(x, z) - .6), ph: RD() * 9 }); } };
      school(45, -55, 14, 11, h => h < WL - 1.4);
      for (let j = 0; j < 4; j++) school(-60 + j * 40, 72, 6, 10, h => h < WL - 1.4);
    }
  }
  const chestList = [], gems = [], fishes = [], jumps = [];

  // fishing: a real fish leaps out of the water when you catch one
  const t1 = toast; toast = function (s, ms) { const str = String(s);
    if (PR && /สำเร็จ|ได้ปีก|ชั้นหนังสือเปิด|พื้นสั่น/.test(str)) PR.once('Cheer');
    else if (PR && /^ได้ /.test(str) && !/ปลา/.test(str)) PR.once('PickUp', 1.6);
    if (/^ได้ .*ปลา/.test(str) && LIB.Koi) { const o = part(['Clownfish', 'Koi', 'Puffer'][(Rn() * 3) | 0]); o.scale.setScalar(.16); o.position.set(fx, WL, fz); sc.add(o); jumps.push({ o, t: 0 }); if (PR) PR.once('Cheer'); }
    return t1(s, ms); };

  // ---------- per-frame
  let lastPrev = 0;
  const pv = window.prev; window.prev = now => { pv(now); const dt = lastPrev ? Math.min(.05, (now - lastPrev) / 1000) : 0; lastPrev = now;
    if (PR) { PR.play('Idle'); PR.mx.update(dt); } };
  const p0 = window.post;
  window.post = (dt, t, p) => { p0(dt, t, p); lastPrev = 0;
    const now = performance.now(), near = (x, z, d = 60) => Math.hypot(x - p.x, z - p.z) < d;
    // player
    if (PR) { const spd = Math.hypot(vx, vz), sw = !window.IN && !window.FLY && H(p.x, p.z) < WL - .35;
      if (now > PR.lock) { if (window.FLY) PR.play('Jump_Idle', .6); else if (sw) PR.play('Running_A', .75); else if (!gr) PR.play('Jump_Idle');
        else if (spd > 6.2) PR.play('Running_A', spd / 7); else if (spd > .35) PR.play('Walking_A', Math.max(.6, spd / 3.6)); else PR.play('Idle'); }
      PR.mx.update(dt); pm.position.y = sw ? .45 : 0; }
    keepNpcsDry();
    // villagers
    NP.forEach(n => { const r = n.rig; if (!r || !near(n.x, n.z)) return; const mv = Math.hypot(n.x - n.px, n.z - n.pz) / Math.max(dt, 1e-3); n.px = n.x; n.pz = n.z;
      const d = Math.hypot(n.x - p.x, n.z - p.z);
      if (d < 3.6 && !n.greet) { n.greet = 1; r.once('Interact'); } else if (d > 6) n.greet = 0;
      if (d < 3.6 && mv < .1) n.m.rotation.y = Math.atan2(p.x - n.x, p.z - n.z);
      if (now > r.lock) r.play(mv > .2 ? 'Walking_A' : 'Idle', .8); r.mx.update(dt); });
    if (window.SHOPK && SHOPK.rig && window.IN) SHOPK.rig.mx.update(dt);
    // bunny-AI critters
    rab.forEach(a => { if (!a.rig) return; const q = a.g.position; if (!near(q.x, q.z)) return; const fl = Math.hypot(q.x - p.x, q.z - p.z) < 6;
      q.y = H(q.x, q.z); a.rig.play(a.m || fl ? 'Walk' : 'Idle', fl ? 1.8 : 1); a.rig.mx.update(dt); });
    // free-roaming critters
    const night = S.t > 19 || S.t < 5.5;
    mobs.forEach(m => { const w = m.r.w; if (m.night) w.visible = night; if (!w.visible || !near(m.x, m.z)) return;
      m.w -= dt; if (m.w <= 0) { m.w = 1.5 + Rn() * 3; m.mv = Rn() < .6; const back = Math.hypot(m.x - m.hx, m.z - m.hz) > m.rad; m.a = back ? Math.atan2(m.hx - m.x, m.hz - m.z) : Rn() * 6; }
      if (m.mv) { const sp = m.fly ? 1.2 : m.kind == 'Crab' ? .9 : 1.3, nx = m.x + Math.sin(m.a) * sp * dt, nz = m.z + Math.cos(m.a) * sp * dt;
        if (!m.ok || m.ok(nx, nz)) { m.x = nx; m.z = nz; } else m.w = 0; }
      const gy = Math.max(H(m.x, m.z), m.fly ? WL : -99);
      w.position.set(m.x, gy + (m.fly ? m.fly + Math.sin(t * 2 + m.hx) * .25 : 0), m.z);
      w.rotation.y += Math.atan2(Math.sin(m.a - w.rotation.y), Math.cos(m.a - w.rotation.y)) * Math.min(1, dt * 6);
      if (!m.fly) m.r.play(m.mv ? 'Walk' : 'Idle'); m.r.mx.update(dt); });
    if (fan) fan.rotation.z += dt * .8;
    // chests, gems, fish
    chestList.forEach(g => { const [c, o, op] = g.userData.ch, v = !!op(); c.visible = !v; o.visible = v; });
    gems.forEach((o, i) => { o.rotation.y = t * .8 + i; o.position.y = .55 + Math.sin(t * 2 + i) * .08; });
    fishes.forEach(f => { if (!near(f.cx, f.cz, 80)) return; f.a += f.sp * dt * (1 + .3 * Math.sin(t + f.ph)) / Math.max(1, f.r * .25);
      const x = f.cx + Math.cos(f.a) * f.r, z = f.cz + Math.sin(f.a) * f.r; f.o.position.set(x, WL - f.d + Math.sin(t * 1.3 + f.ph) * .12, z);
      f.o.rotation.y = Math.atan2(-Math.sin(f.a) * Math.sign(f.sp), Math.cos(f.a) * Math.sign(f.sp)) + Math.sin(t * 9 + f.ph) * .18; });
    for (let i = jumps.length - 1; i >= 0; i--) { const j = jumps[i]; j.t += dt; const k = j.t / 1.1;
      j.o.position.set(fx + (pl.position.x - fx) * k, WL + Math.sin(Math.min(1, k) * P) * 2.2, fz + (pl.position.z - fz) * k); j.o.rotation.x = k * 7;
      if (k >= 1) { sc.remove(j.o); jumps.splice(i, 1); } }
  };

  // ================= VILLAGE: medieval buildings (KayKit Medieval Hexagon)
  let fan = null;
  // ================= GROUND PADS: buildings stand on flat dry land, never in the water
  // Each pad flattens the ground to one height (and lifts it above the water line when needed), blending out over 3 units.
  const PADS = [];
  const dryAt = (x, z, r, minH = WL + .6) => { for (let a = 0; a < 8; a++) { if (H(x + Math.cos(a * P / 4) * r, z + Math.sin(a * P / 4) * r) < minH) return false; } return H(x, z) >= minH; };
  function findDry(x0, z0, r, maxD, ok = () => true) { for (let d = 0; d <= maxD; d += 1) for (let a = 0; a < 16; a++) { const x = x0 + Math.cos(a * P / 8) * d, z = z0 + Math.sin(a * P / 8) * d; if (dryAt(x, z, r) && ok(x, z)) return [x, z]; } return [x0, z0]; }
  const BLDG = { Shop: [-14, -8, 6.5, 6.2], Library: [14, -9, 7.8, 5], Cafe: [15, 12, 7, 5.2], PipHouse: [-15, 13, 7, 4.4], MyHouse: [0, -19, 10, 4.8], HomeYellow: [22, 22, 7, 4.4] };
  function groundPads() {
    // the blue cottage used to sit in the pond: find it a dry spot on the village edge
    const far = (x, z, d) => Object.values(BLDG).every(b => Math.hypot(b[0] - x, b[1] - z) > d);
    let hb = null; for (let k = 0; k < 64 && !hb; k++) { const a = P + k * P / 32, r = 27 + (k % 3) * 3, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (dryAt(x, z, 5, WL + .8) && far(x, z, 12) && NP.every(n => Math.hypot(n.h[0] - x, n.h[1] - z) > 7) && reg(x, z) != 2 && reg(x, z) != 3) hb = [x, z]; }
    BLDG.HomeBlue = [...(hb || [-28, -14]), 10, 4.8];
    Object.values(BLDG).forEach(b => PADS.push([b[0], b[1], b[3], Math.max(H(b[0], b[1]), WL + 1)]));
    PADS.push([62, 5, 3, H(62, 5)], [20, 55, 2.6, 0], [-55, -55, 3.4, H(-55, -55)]);
    // uncle Salt's spot (and his fish bucket) was in the sea
    const salt = NP[1], s2 = findDry(salt.h[0], salt.h[1], 1.5, 14); salt.h = s2; salt.x = s2[0]; salt.z = s2[1]; salt.t = s2.slice(); BLDG._bucket = [s2[0] + 2.2, s2[1] - 1];
    const h0 = H;
    H = (x, z) => { let h = h0(x, z); for (const q of PADS) { const d = Math.hypot(x - q[0], z - q[1]); if (d < q[2] + 3) { const k = d < q[2] ? 1 : 1 - sm(0, 1, (d - q[2]) / 3); h += (q[3] - h) * k; } } return h; };
    // reshape the terrain mesh and the minimap to match
    const ter = sc.children.find(o => o.isMesh && o.geometry.parameters && o.geometry.parameters.width == 200 && o.material.vertexColors);
    if (ter) { const pa = ter.geometry.attributes.position, co = ter.geometry.attributes.color, c = new T.Color();
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i); if (!PADS.some(q => Math.hypot(x - q[0], z - q[1]) < q[2] + 3)) continue;
        const h = H(x, z); pa.setY(i, h); if (h > WL + .5) { c.set(reg(x, z) == 3 ? 0xa8b58a : 0x9bd47a); co.setXYZ(i, c.r, c.g, c.b); } }
      pa.needsUpdate = co.needsUpdate = true; ter.geometry.computeVertexNormals(); }
    const b = mb.getContext('2d'); for (let i = 0; i < 80; i++) for (let j = 0; j < 80; j++) { const x = i * 2.5 - 100, z = j * 2.5 - 100, h = H(x, z); b.fillStyle = h < WL ? '#6cc6e8' : h < .3 ? '#f0dca8' : reg(x, z) == 4 ? '#6fa05a' : '#9bd47a'; b.fillRect(i * 2, j * 2, 2, 2); }
    items.forEach(it => it.g.position.y = H(it.x, it.z));
    // the lamp post that stood right in front of my front door moves aside
    sc.children.filter(o => o.isInstancedMesh && o.count == 11).forEach(m => { const mt = new T.Matrix4(), ps = new T.Vector3(), q = new T.Quaternion(), sv = new T.Vector3();
      m.getMatrixAt(8, mt); mt.decompose(ps, q, sv); if (Math.hypot(ps.x, ps.z + 14) < .1) { ps.set(3.4, H(3.4, -13), -13); mt.compose(ps, q, sv); m.setMatrixAt(8, mt); m.instanceMatrix.needsUpdate = true; } });
  }
  // villagers never wander onto the water
  function keepNpcsDry() { NP.forEach(n => { if (H(n.x, n.z) < WL + .25) { n.x = n.dx == null ? n.h[0] : n.dx; n.z = n.dz == null ? n.h[1] : n.dz; n.t = n.h.slice(); } else { n.dx = n.x; n.dz = n.z; } }); }

  // ================= VILLAGE: medieval buildings (KayKit Medieval Hexagon), sized so the doors fit a person
  async function village() {
    const g = await ld('village.json'); if (!g) return; libAdd(g); if (!LIB.Shop) return;
    const HX = [[-14, -8], [14, -9], [15, 12], [-15, 13], [0, -19]], names = ['Shop', 'Library', 'Cafe', 'PipHouse', 'MyHouse'];
    sc.children.filter(o => o.isGroup && HX.some(q => Math.abs(o.position.x - q[0]) < .01 && Math.abs(o.position.z - q[1]) < .01)).forEach(o => o.visible = false);
    const doorZ = {};
    Object.entries(BLDG).forEach(([n, b]) => { if (n[0] == '_') return; const o = put(n, b[0], b[1], b[2], 0, H(b[0], b[1]) - .2); if (!o) return;
      const bb = new T.Box3().setFromObject(o), hw = (bb.max.x - bb.min.x) / 2, hd = (bb.max.z - bb.min.z) / 2;
      const c = cols.find(q => Math.abs(q[0] - b[0]) < .01 && Math.abs(q[1] - b[1]) < .01); const R = Math.max(hw, hd) * .92;
      if (c) c[2] = R; else cols.push([b[0], b[1], R]); doorZ[n] = bb.max.z; });
    // move the "enter" spots to the new, bigger front doors
    (LX.IA || []).forEach(a => { if (a.room != -1 || !/^เข้า/.test(a.tx)) return; const i = HX.findIndex(q => Math.abs(q[0] - a.x) < .01); if (i < 0 || doorZ[names[i]] == null) return;
      a.z = doorZ[names[i]] + .9; a.r = 2.6; });
    if (LX.HS) LX.HS.forEach((h, i) => { if (doorZ[names[i]] != null) h[1] = doorZ[names[i]] - 3.5 + 1.6; });   // where you come out
    // windmill on the hill (spinning fan) and the village well
    if (typeof wm !== 'undefined' && LIB.Windmill) { wm.children.forEach(c => c.visible = false); const w = put('Windmill', wm.position.x, wm.position.z, 8, -P / 2, H(wm.position.x, wm.position.z) - .3);
      w && w.traverse(c => { if (/fan/.test(c.name) && !fan) fan = c; }); cols.push([wm.position.x, wm.position.z, 3.4]); }
    const well = sc.children.find(o => o.isGroup && Math.abs(o.position.x - 8) < .01 && Math.abs(o.position.z - 3) < .01);
    if (well && LIB.Well) { well.visible = false; put('Well', 8, 3, 2.8, 0, H(8, 3) - .1); }
  }


  // ================= INTERIORS: medieval furniture (KayKit Dungeon Remastered + Furniture Bits, Quaternius bookcase)
  async function interiors() {
    const g = await ld('interior.json'); if (!g) return;
    g.scene.traverse(c => { if (c.isMesh && /Bookcase/.test(c.parent && c.parent.name || '')) [].concat(c.material).forEach(m => { if (m.color.r * .3 + m.color.g * .59 + m.color.b * .11 < .35) m.color.multiplyScalar(1.7); }); });
    libAdd(g);
    // room i lives at (200 + i*30, 100, 0); children 0-4 are floor, 3 walls and door mat
    const rooms = [0, 1, 2, 3, 4].map(i => sc.children.find(o => o.isGroup && o.position.y == 100 && Math.abs(o.position.x - (200 + i * 30)) < .01));
    const KEEP = { 1: [7], 2: [8] };                          // library book plank (puzzle), cafe menu board
    const wood = M(0x6b4430), plaster = 0xf3e8d2;
    rooms.forEach((rm, i) => { if (!rm) return;
      rm.children.forEach((c, k) => { if (c.isMesh && k >= 5 && !(KEEP[i] || []).includes(k)) c.visible = false; });
      [1, 2, 3].forEach(k => rm.children[k].material = M(plaster));
      // half-timbered walls: posts + a beam along the top, like the houses outside
      for (let x = -7.5; x <= 7.5; x += 3.75) rm.add(B(new T.BoxGeometry(.35, 4, .2), wood, x, 2, -7.25));
      for (let z = -7.5; z <= 7.5; z += 3.75) [-1, 1].forEach(sd => rm.add(B(new T.BoxGeometry(.2, 4, .35), wood, sd * 7.25, 2, z)));
      rm.add(B(new T.BoxGeometry(15, .3, .25), wood, 0, 3.9, -7.25)); [-1, 1].forEach(sd => rm.add(B(new T.BoxGeometry(.25, .3, 15), wood, sd * 7.25, 3.9, 0)));
      rm.add(B(new T.BoxGeometry(15, .2, .2), wood, 0, 1.4, -7.3));
    });
    const add = (i, n, x, z, s = 1, ry = 0, y = 0) => { const rm = rooms[i], o = part(n); if (!rm || !o) return; const K = /rug|torch/.test(n) ? 1 : 1.25; if (y > 0 && y < 2) y *= K; o.scale.setScalar(s * K); o.rotation.y = ry; o.position.set(x, y, z); rm.add(o); return o; };
    rooms.forEach((rm, i) => { add(i, 'torch_mounted', -3.75, -7.05, 1.1, 0, 2.4); add(i, 'torch_mounted', 3.75, -7.05, 1.1, 0, 2.4); });
    // 0 shop
    if (window.SHOPK) { SHOPK.position.set(4.3, 0, -3); SHOPK.rotation.y = -.5; }
    add(0, 'table_long_tablecloth_decorated_A', 0, -2.4, 1.05, P / 2); add(0, 'coin_stack_large', 1.8, -2.4, .45, 0, 1.05);
    add(0, 'keg_decorated', -5, -6.3, .9); add(0, 'crates_stacked', 4.8, -6.1, 1.1); add(0, 'barrel_large', -6.2, -3.5, 1);
    add(0, 'barrel_small_stack', 6, 1, 1, -P / 2); add(0, 'shelf_small_candles', 0, -7.15, 1.4, 0, 2.6); add(0, 'rug_rectangle_stripes_A', 0, 2.5, 1.4);
    // 1 library (the coloured puzzle books stay on their plank)
    add(1, 'Bookcase_Full', -5.4, -7, 1.3); add(1, 'Bookcase_Full', 5.4, -7, 1.3);
    [-3, 1.5].forEach(z => { add(1, 'Bookcase_Full', -7, z, 1.3, P / 2); add(1, 'Bookcase_Full', 7, z, 1.3, -P / 2); });
    add(1, 'table_medium_decorated_A', 0, -3, 1.05); add(1, 'book_set', -.4, -3, 1.2, .3, 1.05); add(1, 'chair', 0, -1.6, 1.3, P);
    add(1, 'candle_lit', .7, -3.4, 1, 0, 1.05); add(1, 'rug_oval_A', 0, 1.5, 1.6);
    // 2 cafe
    [[-3, -2], [3, -2], [0, 2]].forEach(q => { add(2, 'table_small_decorated_A', q[0], q[1], 1.4); add(2, 'stool', q[0] - 1.3, q[1], 1.3); add(2, 'stool', q[0] + 1.3, q[1], 1.3); });
    add(2, 'keg_decorated', -5.4, -6.4, 1.1); add(2, 'barrel_large', 6, -6.2, 1); add(2, 'barrel_small_stack', 6.2, -2.5, 1, -P / 2); add(2, 'plate_food_A', -3, -2.3, .6, 0, 1.05);
    // 3 pip's house
    add(3, 'table_medium_decorated_A', 0, -3, 1.05); add(3, 'stool', -1.6, -3, 1.3); add(3, 'stool', 1.6, -3, 1.3);
    add(3, 'crates_stacked', -5.6, -6, 1.1); add(3, 'barrel_large', 5.8, -6, 1); add(3, 'trunk_large_A', -5.8, 2.5, 1.1, P / 2);
    add(3, 'sword_shield', 0, -7.2, 1, 0, 2.6); add(3, 'rug_rectangle_stripes_A', 0, 2, 1.3);
    // 4 my house: bed where the old bed was, chest where the wardrobe was
    add(4, 'bed_decorated', -4.5, -5, 1.25); add(4, 'trunk_large_A', 4.5, -6.6, 1.3); add(4, 'shelf_small_candles', 4.5, -7.15, 1.4, 0, 2.3);
    add(4, 'table_small_decorated_A', 3, -1.5, 1.4); add(4, 'chair', 3, -.2, 1.3, P); add(4, 'rug_oval_A', -1, 1.5, 1.6); add(4, 'candle_triple', -6.6, -2.6, 1.2);
  }

  // shared with lh-combat.js
  window.LHM = { get PR() { return PR; }, rig, ld, MS, mobs, prep };

  // ---------- go
  groundPads();
  playerModel();
  Promise.all([world(), village(), interiors(), npcModels(), critters()]).then(() => prog());
})();
