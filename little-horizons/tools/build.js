// Build optimized GLB assets for Little Horizons from downloaded CC0 sources.
// usage: node build.js <srcDir> <outDir>
const fs = require('fs'), path = require('path');
const obj2gltf = require('obj2gltf');
const { NodeIO, Document } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { prune, dedup, weld, mergeDocuments, unpartition, resample, quantize, textureCompress } = require('@gltf-transform/functions');
const sharp = require('sharp');

const [SRC, OUT] = process.argv.slice(2);
fs.mkdirSync(path.join(OUT, 'chars'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'mobs'), { recursive: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

async function slim(doc, keepAnims, dropNodes = []) {
  const root = doc.getRoot();
  for (const a of root.listAnimations()) if (!keepAnims.includes(a.getName())) a.dispose();
  for (const n of root.listNodes()) if (dropNodes.includes(n.getName())) n.dispose();
  await doc.transform(resample(), prune(), dedup());
  return doc;
}
async function write(doc, file) {
  await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'png', resize: [256, 256] }), quantize(), prune(), unpartition());
  for (const a of doc.getRoot().listAccessors()) if (a.listParents().every(p => p.propertyType === 'Root')) a.dispose();
  await io.write(file, doc);
  console.log(path.basename(file), (fs.statSync(file).size / 1024).toFixed(0) + 'KB');
}

(async () => {
  // ---- player classes (KayKit Adventurers)
  const KA = ['Idle', 'Walking_A', 'Running_A', 'Jump_Full_Short', 'Jump_Idle', 'Cheer', 'PickUp', 'Interact', 'Sit_Floor_Idle', 'Spellcasting'];
  const kay = {
    Knight: ['1H_Sword_Offhand', 'Badge_Shield', 'Rectangle_Shield', 'Spike_Shield', '2H_Sword'],
    Mage: ['Spellbook', 'Spellbook_open', '1H_Wand'],
    Rogue_Hooded: ['Knife_Offhand', '1H_Crossbow', 'Knife', 'Throwable'],
    Rogue: ['1H_Crossbow', '2H_Crossbow', 'Throwable'],
    Barbarian: ['1H_Axe_Offhand', 'Barbarian_Round_Shield', '1H_Axe', '2H_Axe'],
  };
  for (const [n, drop] of Object.entries(kay))
    await write(await slim(await io.read(`${SRC}/kaykit/${n}.glb`), KA, drop), `${OUT}/chars/${n}.glb`);

  // ---- cute monsters / critters
  for (const n of ['Mushroom', 'Pig', 'Chicken', 'Bee', 'Crab', 'Deer', 'Penguin', 'Panda', 'Ghost'])
    await write(await slim(await io.read(`${SRC}/monsters/${n}.gltf`), ['Idle', 'Walk', 'Jump', 'Dance', 'Yes', 'Flying']), `${OUT}/mobs/${n}.glb`);

  // ---- static props: one GLB per group, each asset a named top-level node
  const groups = {
    nature: { texnature: ['Flower', 'Flower2', 'Flower3', 'Mushroom', 'Bush', 'BigBush', 'Tree', 'SmallTree', 'BigTree'],
              simplenature: ['Tree1', 'Tree2', 'Tree3', 'Tree4', 'Bush1', 'Bush2', 'Rock1', 'Rock2', 'Rock3', 'Grass1', 'Grass2'] },
    ruins: { ruins: ['Wall_ArchRound_Overgrown', 'Wall_Overgrown', 'Wall_Broken', 'Column_Round', 'Column_Round_Short', 'Statue_Fox', 'Statue_Stag',
                     'Pot1', 'Pot1_Broken', 'Pot2', 'Chest', 'Chest_Gold', 'Torch', 'Floor_Diamond', 'DeadTree_1', 'Bush_Round', 'Arch_Round', 'Grass'] },
    sea: { fish: ['Clownfish', 'BlueTang', 'Goldfish', 'Koi', 'Puffer', 'ButterflyFish', 'Betta', 'YellowTang', 'MoorishIdol', 'Dock_Long'],
           pirate: ['Environment_PalmTree_1', 'Environment_PalmTree_2', 'Environment_PalmTree_3', 'Prop_Bucket_Fishes', 'UI_Gem_Blue', 'UI_Gem_Pink'] },
  };
  for (const [g, packs] of Object.entries(groups)) {
    const doc = new Document(); doc.createBuffer(); const scene = doc.createScene('Scene');
    for (const [pack, names] of Object.entries(packs)) for (const n of names) {
      let d;
      const objF = `${SRC}/${pack}/${n}.obj`, gltfF = `${SRC}/${pack}/${n}.gltf`;
      if (fs.existsSync(objF)) d = await io.readBinary(await obj2gltf(objF, { binary: true, unlit: false }));
      else d = await io.read(gltfF);
      for (const a of d.getRoot().listAnimations()) a.dispose();
      const sc = d.getRoot().getDefaultScene() || d.getRoot().listScenes()[0];
      const wrap = d.createNode(n.replace(/^Environment_|^UI_|^Prop_/, ''));
      for (const c of sc.listChildren()) { sc.removeChild(c); wrap.addChild(c); }
      sc.addChild(wrap);
      const map = mergeDocuments(doc, d);
      const s2 = map.get(sc);
      for (const c of s2.listChildren()) { s2.removeChild(c); scene.addChild(c); }
      s2.dispose();
    }
    doc.getRoot().setDefaultScene(scene);
    await doc.transform(prune(), dedup(), weld());
    await write(doc, `${OUT}/${g}.glb`);
  }
  // second pass: drop orphaned data
  require('child_process').execSync('node ' + __dirname + '/repack.js ' + require('child_process').execSync('find ' + OUT + ' -name "*.glb"').toString().split('\n').join(' '), { stdio: 'inherit' });
})().catch(e => { console.error(e); process.exit(1); });
