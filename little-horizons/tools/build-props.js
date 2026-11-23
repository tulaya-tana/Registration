// Merge several glTF/GLB files into one GLB with one named top-level node per file.
// usage: node build-props.js <out.glb> <srcDir> name1 name2 ...   (looks for <name>.glb or <name>.gltf in srcDir)
const { NodeIO, Document } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { prune, dedup, weld, mergeDocuments, quantize, unpartition } = require('@gltf-transform/functions');
const fs = require('fs');
const [OUT, SRC, ...NAMES] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
(async () => {
  const doc = new Document(); doc.createBuffer(); const scene = doc.createScene('Scene');
  for (const n of NAMES) {
    const f = fs.existsSync(`${SRC}/${n}.glb`) ? `${SRC}/${n}.glb` : `${SRC}/${n}.gltf`;
    const d = await io.read(f); d.getRoot().listAnimations().forEach(a => a.dispose());
    const sc = d.getRoot().listScenes()[0], wrap = d.createNode(n.replace(/^f_/, ''));
    for (const c of sc.listChildren()) { sc.removeChild(c); wrap.addChild(c); } sc.addChild(wrap);
    const s2 = mergeDocuments(doc, d).get(sc); for (const c of s2.listChildren()) { s2.removeChild(c); scene.addChild(c); } s2.dispose();
  }
  doc.getRoot().setDefaultScene(scene);
  await doc.transform(dedup(), weld(), quantize(), prune(), unpartition());
  await io.write(OUT, doc); const d2 = await io.read(OUT); await d2.transform(prune()); await io.write(OUT, d2);
  console.log(OUT, (fs.statSync(OUT).size >> 10) + 'KB');
})();
