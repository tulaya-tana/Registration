// Build models/village.glb from KayKit Medieval Hexagon buildings (CC0) — one named top-level node per building
// usage: node build-village.js <dir with building_*.gltf> <out.glb>
const { NodeIO, Document } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { prune, dedup, weld, mergeDocuments, quantize, unpartition } = require('@gltf-transform/functions');
const fs = require('fs');
const [SRC, OUT] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const PICK = { Shop: 'market_red', Library: 'church_blue', Cafe: 'tavern_yellow', PipHouse: 'home_B_green', MyHouse: 'home_A_red',
  Windmill: 'windmill_yellow', Well: 'well_blue', HomeBlue: 'home_A_blue', HomeYellow: 'home_B_yellow' };
(async () => {
  const doc = new Document(); doc.createBuffer(); const scene = doc.createScene('Scene');
  for (const [name, f] of Object.entries(PICK)) {
    const d = await io.read(`${SRC}/building_${f}.gltf`), sc = d.getRoot().listScenes()[0], wrap = d.createNode(name);
    for (const c of sc.listChildren()) { sc.removeChild(c); wrap.addChild(c); } sc.addChild(wrap);
    const s2 = mergeDocuments(doc, d).get(sc); for (const c of s2.listChildren()) { s2.removeChild(c); scene.addChild(c); } s2.dispose();
  }
  doc.getRoot().setDefaultScene(scene);
  await doc.transform(dedup(), weld(), quantize(), prune(), unpartition());
  await io.write(OUT, doc); const d2 = await io.read(OUT); await d2.transform(prune()); await io.write(OUT, d2);
  console.log(OUT, (fs.statSync(OUT).size >> 10) + 'KB');
})();
