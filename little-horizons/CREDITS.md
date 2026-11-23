# Little Horizons — 3D model credits

All models are **CC0 1.0 (public domain)**: free for personal and commercial use; credit is appreciated, not required.

| Used for | Pack | Author | Source |
|---|---|---|---|
| Player classes & villagers (Knight, Mage, Rogue, Rogue_Hooded, Barbarian) | KayKit Adventurers Character Pack 1.0 | Kay Lousberg | https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 |
| Village buildings (market, church, tavern, cottages, windmill, well) | KayKit Medieval Hexagon Pack 1.0 | Kay Lousberg | https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0 |
| Critters (Mushroom, Pig, Chicken, Panda, Penguin, Crab, Deer, Bee, Ghost) | Cute Animated Monsters | Quaternius | https://quaternius.com/packs/cutemonsters.html |
| Flowers, mushrooms, fantasy trees, bushes (+ colour textures) | Textured Fantasy Nature | Quaternius | https://quaternius.com/packs/texturedfantasynature.html |
| Trees, bushes, rocks, grass | Simple Nature Pack | Quaternius | https://quaternius.com/packs/simplenature.html |
| Ruins: columns, overgrown walls, arch, statues, pots, torches, chests, floor, seaweed | Ultimate Modular Ruins | Quaternius | https://quaternius.com/packs/ultimatemodularruins.html |
| Fish (Clownfish, Blue Tang, Koi, Puffer, …) | Cute Fish | Quaternius | https://quaternius.com/packs/cutefish.html |
| Palm trees, fish bucket, gems | Pirate Kit | Quaternius | https://quaternius.com/packs/piratekit.html |

## Files
- `models/chars/*.json` (+ `_0.png` texture) — rigged characters (glTF JSON; artifact hosting serves .json but not .glb) (animations trimmed to Idle/Walk/Run/Jump/Cheer/PickUp/Interact…)
- `models/mobs/*.json` — rigged critters
- `models/nature.json`, `models/ruins.json`, `models/sea.json` — static props, one named node per model
- `models/village.json` — medieval village buildings (`tools/build-village.js`)
- `models/tex/*.png` — gradient colour textures for flower/tree variants
- `lh-models.js` — loads the models and swaps them into the game (falls back to the original low-poly shapes if loading fails)
- `tools/build.js` — rebuilds the models from the original downloads: `npm i && node build.js <src> ../models && node tojson.js ../models/**/*.glb && node extract-images.js ../models/**/*.json`
