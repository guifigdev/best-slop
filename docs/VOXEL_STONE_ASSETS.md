# Shared stone artwork

The visual pass uses complete stone sculptures instead of stacked rectangular proxy blocks. Collision data, placement seeds and route clearances remain unchanged.

| Sculpture | Render consumers |
| --- | --- |
| Rounded fractured boulders, moss/ice/basalt palettes | Phase Killer forest stones and graveyard rubble; Bloody Tournament biome boulders/basalt/vents; Dungeon rocks/rubble/stalagmites; Custom Hero Survival, Line Wars and Castle Fight arena scenery |
| Fluted stone columns with carved capitals and broken variants | Dungeon pillars and columns; Bloody Tournament column decorations |
| Chiseled runestone with inset rune panel and a stepped, weathered crown | Shared Custom Hero Survival / Line Wars / Castle Fight scenery |

`src/stone-landmark-art.js` caches 32 normalized boulder silhouettes per wall/non-wall variant. Each boulder stays within 112 parts. Columns use fewer than 50 parts. Parts feed the existing merged/instanced world batches; they do not create a mesh per small voxel. World updates with an unchanged layout reuse the same GPU batch.

Voxel columns sit on the ground and form asymmetric rounded shoulders with terraced heights. Surface lips and thin fracture seams touch the mass underneath; there are no floating debris cubes. The same topology receives subdued moss, pale ice or basalt/ember tints according to biome.

The Castle Fight keep pass is independent: one cached vertex-color mesh per cultural keep, 5.06–5.36 m high on the original 3 × 5 footprint. Ten rooflines retain their cultural identity. Gates, stone voussoirs, portcullises, battlements, masonry, arrow slits and banners provide close detail. Production-building facade details are part of the same model specs used for inventory portraits.
