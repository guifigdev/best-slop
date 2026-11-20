# Phase Killer: functional reference and browser adaptation

The pinned source is **Phase Killer 1.2.8**, Dark.Revenant, SHA-256 `b55f329235abd78c969b7f656551740991be61908d5e9cde8398b03cff4c3255`. Original map: [EpicWar listing](https://www.epicwar.com/maps/137550/). Object and script evidence is under `outputs/phase-killer-reference`. Native scripts, models and textures are not executed or bundled. This project supplies its own simulation and voxel art.

The generated catalog exposes **85 public skills**, **137 items**, **63 item recipes**, one separate global world recipe, and **145 hidden/internal abilities**. Public entries comprise 77 active families, five passives and three expandable groups. A catalog entry is evidence about a mechanic; it is not proof of engine equivalence. Tests separately exercise the implemented behavior.

## Confirmed and implemented behavior

| Family | Evidence and browser behavior |
| --- | --- |
| Blood vial | Civilian `A05Z` expands to Invoke, Blood Forge and Blood Steal. Killer `A061` also supplies blood-to-power and blood-to-soul exchanges. |
| Charges | Item `iuse` is the charge count; `iusa` is the usable flag. Match Box has two charges, Locator three and XR Vial two. Charged casts debit the granting item even when the client omits `itemSlot`; mismatched slots cannot bypass costs. |
| Equipment | Attached ability rank one is resolved independently from unused higher object records. Left and right hand limits are separate. Attack speed modifiers retain their sign. Movement bonuses are converted from native coordinates with `/128`. |
| Armor | `A005/A00G/A00H` toggle native civilian profiles `h002/h004/h003`; using the currently equipped suit returns to `hpea`. Armor does not stack merely because several suits are carried. Absolute movement speeds and attack intervals remain distinct from percentage modifiers. |
| Item recipes | Equal-ingredient recipes include `I01T+I01T→I01U` and `I01U+I01U→I01S`. The global recipe `I01C+I01R` consumes both items only inside native region `DR` in Aether, opens the Omniworld passage and produces no inventory item. |
| Blood Forge | `HQV` reads the first inventory slot, retains its Power/Master Orb, spends its family-specific blood cost and creates a uniformly selected item on the ground. Mundane costs 8/4 blood, Survival 10/5, Research 15/8, Aether and Exotic 20/10; Weapon and Armor cost 25. |
| Invoke | `JLV` uses Master Orbs and blood. Mundane relocates within the current dimension; Survival restores life/mana; Research reveals orbs; Exotic performs its native sacrifice/result branch. Aether creates a ten-second entry rift, one initial Nova and, after three seconds, three waves of fifteen scattered Novas. |
| Dimensional tools | Phase Cube reveals phaser clues; it does not transport. Phase Sphere transports the caster; Perfect Phase Sphere transports a real target. Materialize alternates ghost dimensions. Transmaterialize is the native Blink-based ability. |
| Ghosts and zombies | Ghosts use the extracted HP 200, mana 50, movement `125/128` and no attack. Arcanum prepares a resurrection for two seconds and is blocked in Aether. Soul Skull creates a zombie linked to its master. A zombie consumes a nearby decayed corpse to become a free human. |
| Physical passives | Native level-one critical, cleave, bash, evasion, lifesteal, block and attached orb procs use the shared passive helper. Misses suppress attack procs. Creep applies the native fade to idle nighttime units. |
| Native spell effects | Soul Burn, Lightning Shield, Shadow Strike, Silence-based Impeders, Mana Burn, Chain Lightning, Fan of Knives, Purge and Storm Bolt use their extracted fields rather than a shared invented damage value. |
| Bombs and traps | Dynamite has a five-second fuse. Rift Bomb has a four-second fuse, native blast bands and the script's additional damage/phase transition. Novas have a one-second preparation. Net/poison traps trigger on approach; their positions are private unless owned or revealed. |
| Placed objects | Barricades, torches, bonfires and Storage Cubes retain native HP/profile data. Objects with HP can be attacked. Destroyed torches return their item. Storage has three slots, proximity checks and the native protected-item exclusions. |
| Utility | Matches create temporary light without damage. Smoke resets cooldowns. Poison is voluntarily applied to the user. Locator marks a person and produces clues when subsequently used on oneself. |
| Before role assignment | Real humans can suffer damage; native `Avul` belongs to projections and ghosts. The role lottery includes only living eligible participants. A browser match with fewer than two survivors before assignment ends explicitly instead of choosing a ghost as killer. |
| Online state | Canonical deadlines remain server-side. Viewer snapshots contain cooldown seconds remaining and private role/inventory data only for that viewer. Lobby chat survives persistence, and its rate limit does not depend on a paused game clock. |

## Environmental monsters and drops

`RXV/IVV` start the environmental population during exploration, before the role timer expires. At normal difficulty, the first Aether spawn occurs immediately. The first stage uses Shade/Spirit/Spectre/Phantom tickets `6/5/4/3` and a 20–35 second interval; Banshee, Shadow and Forgotten enter at native time thresholds 1500, 2100 and 3000 seconds. Their HP, mana, attack, armor, range and movement come from the extracted profiles. The Unphased boss starts in Omniworld at `(-28.80078125, 124.3078125)` with 750 HP.

The full functional extraction is recorded in `ambient-facts.json`. Native drop score is `(pointValue + randomInteger(1,20)) × randomReal(.5,3)`. An important original script defect is preserved in the evidence: high score bands and the boss branch select result items but omit their actual creation calls. The browser **deliberately repairs those branches**, materializing the selected pool results, including the boss's fourteen selections. This is a documented fix, not a claim that the source map spawned those items successfully.

## Practical limits

### Terrain, forest and nighttime presentation

The browser woodland now reads numeric terrain painting and doodad coordinates from the pinned map's `war3map.w3e` and `war3map.doo`. The extraction script verifies their SHA-256 hashes before generating `shared/phase-killer-terrain-data.js`: W3E is a 129 × 193 vertex Dalaran Ruins terrain; DOO contains 6,555 doodads. Tree, rock, lamp, fountain, wall and village-building positions are taken from that evidence. The forested western half and eastern settlement replace the former invented repeated grid of fifteen houses. Each dimension uses its own source placements.

This remains a browser adaptation: source elevation is compressed into surface coloration, playable ground is level, and native decorative models are replaced with original voxel geometry. Trunk/rock/fountain/column footprints participate in authoritative navigation, while foliage above the trunks does not block walking. Narrow arterial routes, spawn areas and gateways receive explicit clearance; some overlapping source objects are omitted to keep these routes usable. Thus the seven native village-building placements can produce fewer visible houses after route clearance. Native pathing masks, exact height profiles and every doodad are not claimed to be reproduced.

Nighttime uses moon-colored scene lighting, a material shader with subtle ground mist, restrained glowing windows/lamps and a dithered canopy near the controlled character. Instance batches bound draw calls across thousands of forest objects. Automated checks verify source anchors, real navigation corridors, collider-to-trunk geometry, realm switching and shader hooks. Browser visual/GPU compilation QA was unavailable in this session, so the shader's final rendered appearance still requires that check. Numeric layout extraction does not establish commercial redistribution rights for the original map design; review those rights before selling a source-faithful adaptation.

- Native movement/pathing, projectile physics, camera, models and feedback are implemented with browser-specific code. Item casting is processed through validated commands; engine-specific cast-point/channel interruption is not reproduced for every native ability.
- The Nova's `.25s` pulse cadence is a deliberate browser interpretation of the native damage/buff fields. It is tested as a bounded periodic area effect, not asserted to match every internal Warcraft engine tick.
- Normal ambient difficulty is implemented. Additional native difficulty settings, scripted disruption events and every special victory/event branch are not all reproduced. Population throttling counts living browser creatures; the native group can retain old unit handles.
- NPC target acquisition and wandering use browser navigation while retaining the native combat profiles. Native statistical base fixtures come from repository SLK data whose exact original patch equivalence is not certified.
- The five upgrade commands retain the existing browser upgrade progression; their technology-research effect tables have not yet been independently resolved from the map's upgrade object file. They must not be advertised as verified native increments.
- Native conditional charge handling inside every recipe branch is not fully emulated. The normal item-combine operation consumes its two supplied ingredient entries; this distinction remains separate from the validated per-cast charge rules.
- Some native selection/control conveniences, such as commanding a zombie through the original control item, remain browser adaptations. Secret roles remain authoritative regardless of visual adaptations.

Validation covers actual cast effects, resources and cooldowns, armor reversibility, visible/private field snapshots, dimensional transitions, bomb fuses, trap triggering, storage, resurrection, native ambient generation, repaired boss loot, concurrent D1 chat and optimistic state persistence. Model/icon coverage tests alone are not used to establish gameplay fidelity.


## Readability and bot ambush adaptation

The initial ground loot is deliberately capped at 28 caches across all three dimensions (12 normal, 10 Aether, 6 Omni). Spawn points are seeded, at least seven metres apart and at least nine metres from the player arrival point. The full 137-item catalog, recipes and native ambient/boss drop pools remain available; a run no longer places the entire eligible catalog on every map at once. These counts and spacing are browser readability/balance rules, not verified native quantities.

The killer bot now treats two nearby combatants as a crowd. It withdraws before transforming, chooses an isolated visible victim, stages at least eight metres away, and waits for the actual Shift cooldown/resources. A revealed or badly wounded killer attempts only escape abilities it genuinely owns (Phase, Fade, Teleport or Sprint), preserves their real mana and cooldown rules, and delays another ambush. It can return to human form after reaching a clear location. These tactics are new browser AI, not a claim about native map AI.

Shift keeps the same participant id, owner, position and health fraction. It emits a dedicated `phaseTransform` event containing the prior and next public appearance, facing and 1.1-second visual duration. Other viewers receive that silhouette event only when the transforming participant is visible to them; it does not disclose a hidden role or a distant hidden transformation. Environmental Shade/Spirit/etc. actors are explicitly marked as creatures in public packets and do not use the killer's Beast appearance. Ambient spawns also reject locations within fourteen metres of living players in that dimension.

Navigation now uses the forest/rock footprints and village structures from the Phase world module. Per-game, per-dimension navigation objects are cached so the dense forest does not rebuild its collision index for every unit query. Body separation uses the shared solid-aware resolver, including recovery of embedded legacy positions. All caches stay outside multiplayer snapshots.

## Scale and architecture adaptation — 20 November2026

Each realm now spans212×90m, with128m between dimensional layers. The original numeric source and native coordinate reference are retained separately; world positions are scaled2×, while actor dimensions, movement, spell ranges and combat values are preserved. Houses use matching physical footprints of approximately5.4×3.6m, doors1.8×3.65m and one-floor heights4.8–5.6m. The citizen mesh measures approximately2.215m tall×1.35m wide. Fountains, barrels, trees and lanterns retain individual object scales instead of receiving the global positional multiplier.

Four nearby point lights, one256px shadow map and instanced ground light pools provide local night illumination without creating a shadow light for every post. Stone/timber facades, rooflines, tree silhouettes and native fountain/ruin footprints now have distinct original voxel art.

Legacy rooms are migrated once through `migratePhaseKillerScale` during D1/SQLite hydration. Position fields and navigation goals are converted, regenerated village footprints preserve destroyed IDs, and health, inventory, ranges, radii and timers remain intact. The serialized `phaseWorldScale` marker prevents repeated conversion in lobby polls.
