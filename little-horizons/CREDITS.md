# Little Horizons — 3D model credits

All models are **CC0 1.0 (public domain)**: free for personal and commercial use; credit is appreciated, not required.

| Used for | Pack | Author | Source |
|---|---|---|---|
| Player classes & villagers (Knight, Mage, Rogue, Rogue_Hooded, Barbarian) | KayKit Adventurers Character Pack 1.0 | Kay Lousberg | https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 |
| Critters (Mushroom, Pig, Chicken, Panda, Penguin, Crab, Deer, Bee, Ghost) | Cute Animated Monsters | Quaternius | https://quaternius.com/packs/cutemonsters.html |
| Flowers, mushrooms, fantasy trees, bushes (+ colour textures) | Textured Fantasy Nature | Quaternius | https://quaternius.com/packs/texturedfantasynature.html |
| Trees, bushes, rocks, grass | Simple Nature Pack | Quaternius | https://quaternius.com/packs/simplenature.html |
| Ruins: columns, overgrown walls, arch, statues, pots, torches, chests, floor, seaweed | Ultimate Modular Ruins | Quaternius | https://quaternius.com/packs/ultimatemodularruins.html |
| Fish (Clownfish, Blue Tang, Koi, Puffer, …) | Cute Fish | Quaternius | https://quaternius.com/packs/cutefish.html |
| Palm trees, fish bucket, gems | Pirate Kit | Quaternius | https://quaternius.com/packs/piratekit.html |

## Files
- `models/chars/*.glb` — rigged characters (animations trimmed to Idle/Walk/Run/Jump/Cheer/PickUp/Interact…)
- `models/mobs/*.glb` — rigged critters
- `models/nature.glb`, `models/ruins.glb`, `models/sea.glb` — static props, one named node per model
- `models/tex/*.png` — gradient colour textures for flower/tree variants
- `lh-models.js` — loads the models and swaps them into the game (falls back to the original low-poly shapes if loading fails)
- `tools/build.js` — rebuilds the GLBs from the original downloads (`npm i && node build.js <src> ../models`)
