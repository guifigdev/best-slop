# Kodo Tag pursuit reference

Verified 2026-11-20 against the pinned **TinyTauren Kodo Tag V1.6** archive already used by the project. This identifies a concrete version; it does not claim that every Kodo Tag variant uses identical values or AI.

## Source evidence

- [Map archive and author description](https://wc3maps.com/map/347521/Kodo_Tag_V1.6): TinyTauren, 64×64, Warcraft III 1.04–1.05. The description explains fleeing, building defenses, mining, towers, rescue and timed Kodo escalation.
- [Pinned download source](https://www.epicwar.com/maps/346546/). The archive retained locally is `outputs/kodo-tag-reference/KodoTagv1.6.w3m`, SHA-256 `8b3ed66313ae54d46002b8c059340f80248097f916196d37082892c9d3020635`.
- Extracted `outputs/kodo-tag-reference/original/war3map.w3u.json` and `war3map.j` are the primary numerical and trigger evidence. The W3U SHA-256 is `e139e0c5e2bdd927694677e0e13a999e2c9b1debdbb9fdf459160bad8929a896`.
- [Kodo map author discussion of maze AI](https://www.hiveworkshop.com/threads/help-me-with-my-kodo-tags-ai.325255/) describes walking through a route when one exists, and breaking structures when the player is sealed in. The reply explicitly distinguishes other variants whose AI destroys buildings more aggressively. This supports the maze design direction, not TinyTauren-specific timing constants.

## Verified movement and combat values

The source object overrides explicitly set these movement speeds. This project converts Warcraft coordinates by `1 / 128`; expanding the browser battlefield does not multiply actor speeds.

| Unit | Source speed | Browser speed | Relative to Runner |
| --- | ---: | ---: | ---: |
| Runner `uC13` | 300 | 2.34375 | 1 |
| CraZy Kodo `oC06` | 305 | 2.3828125 | 1.0166667, about 1.67% faster |
| Enhanced Kodo `oC22` | 280 | 2.1875 | 0.9333333, about 6.67% slower |

Ordinary Kodo attack range is explicitly 60 source units, or 0.46875 browser units; enhanced range is 150, or 1.171875. The browser collision footprints remain authored adaptations. They are not certified native collision radii.

The regression was separate from the speed values: spawning enlarged a Kodo's logical collision radius using its visual model size. The melee code then enlarged its attack distance from that radius. Ordinary Kodos consequently used about 1.043 as their strike distance before adding the victim radius. The fix uses the catalog collision footprint and the source attack range, with only a small contact allowance when a custom physical body would otherwise prevent contact.

## Native orders and browser adaptations

In `war3map.j`, `Trig_Attack_Func001002002` (line 633) and `Trig_attack_peons_Func001002` (line 661) issue **point** attack orders at a sampled player's location. Enhanced Kodos use equivalent point orders at lines 766 and 2016. Those order destinations capture a coordinate at the time of the order. They do not establish that a Kodo continually knows an unseen player's current position.

The old browser `huntRunner` repeatedly queried every live player's current coordinates across the entire expanded map. That was global tracking, including hidden players.

The browser now uses these explicit adaptations:

- Acquisition requires distance and an unobstructed sight line. Day sight is 1400/128 = 10.9375, inherited from the repository's `owar` base-balance fixture; this inherited sight value is **not certified as a patch 1.04 override**. Completed buildings, cliffs, trees and resource obstacles occlude sight consistently with the browser's exploration design.
- Losing sight freezes the last observed coordinate. Investigation lasts at most six seconds and never refreshes from hidden movement. Arrival or expiry ends the search. **Six seconds is a gameplay tuning choice, not a verified original-map constant.**
- Visible, reachable Runners take priority. A building becomes a breach target only if there is no complete walking route to the known target, and it is the first real structure intersecting the alternative terrain route. An open maze is walked rather than demolished.
- Without a known Runner, Kodos sweep deterministic map sectors using navigable terrain waypoints. Patrol does not sample hidden players and does not repeatedly circle near the spawn point.

`tests/kodo-sensing.test.js` verifies native speed ratios and close-range attacks, occlusion, identical AI positions under different hidden-player paths, reacquisition, memory expiry, actual 60-second sector traversal, sealed-route demolition and maze preservation. The older routing stress fixtures grant explicit long sight and transparent walls so they continue to isolate routing rather than depending on global acquisition.
