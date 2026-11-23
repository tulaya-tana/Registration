// Horses (Quaternius Ultimate Animated Animals, CC0) + cart (Quaternius Ultimate Modular Ruins, CC0) for the hidden race.
// usage: node build-race.js <srcDir> <modelsDir>
const fs = require('fs'), obj2gltf = require('obj2gltf');
const { NodeIO } = require('@gltf-transform/core'); const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { prune, dedup, resample, quantize, unpartition } = require('@gltf-transform/functions');
const [SRC, OUT] = process.argv.slice(2); const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
(async () => {
  for (const n of ['Horse', 'Horse_White']) { const d = await io.read(`${SRC}/${n}.gltf`);
    d.getRoot().listAnimations().forEach(a => { if (!['Gallop', 'Idle', 'Walk', 'Idle_2'].includes(a.getName())) a.dispose(); });
    await d.transform(resample(), dedup(), quantize(), prune(), unpartition()); await io.write(`${OUT}/mobs/${n}.glb`, d);
    const d2 = await io.read(`${OUT}/mobs/${n}.glb`); await d2.transform(prune()); await io.write(`${OUT}/mobs/${n}.glb`, d2); console.log(n, fs.statSync(`${OUT}/mobs/${n}.glb`).size >> 10, 'KB'); }
  const d = await io.readBinary(await obj2gltf(`${SRC}/Cart.obj`, { binary: true })); const sc = d.getRoot().listScenes()[0], w = d.createNode('Cart');
  sc.listChildren().forEach(c => { sc.removeChild(c); w.addChild(c); }); sc.addChild(w);
  await d.transform(dedup(), quantize(), prune(), unpartition()); await io.write(`${OUT}/race.glb`, d); console.log('race', fs.statSync(`${OUT}/race.glb`).size >> 10, 'KB');
})();
