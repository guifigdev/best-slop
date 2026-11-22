# Ragnarok Survivors: skills and job coverage

Reviewed on 2026-11-21. This mode now contains **681 distinct Ragnarok skill identities**, of which 641 were added to the previous 40-skill selection. The scope is the twelve playable lineage paths already present in this game, through their fourth jobs, including the relevant transcendent second-job skills. It is not a claim that expanded jobs such as Ninja, Gunslinger, Taekwon or Doram have been implemented.

The catalogue uses factual names, Aegis identifiers, numeric skill IDs and job membership checked against the primary rAthena renewal database and skill trees. The official Ragnarok character guide was also checked for the original job hierarchy and recognizable class techniques. All damage values, costs, effect durations, descriptions and adaptations for this solo survivor game are local; the MMO's damage multipliers and resource economy are not copied into a different combat system.

- [rAthena renewal skill database](https://github.com/rathena/rathena/blob/master/db/re/skill_db.yml)
- [rAthena renewal job skill trees](https://github.com/rathena/rathena/blob/master/db/re/skill_tree.yml)
- [Official Ragnarok job guide: Guillotine Cross and full job hierarchy](https://ragnarokonline.gungho.jp/gameguide/character/thief/guillotine-cross.html)

## Playable paths

| Lineage | Source jobs | Distinct learnable skills |
| --- | --- | ---: |
| Dragon Knight | Swordman, Knight, Lord Knight, Rune Knight, Dragon Knight | 53 |
| Imperial Guard | Swordman, Crusader, Paladin, Royal Guard, Imperial Guard | 66 |
| Arch Mage | Mage, Wizard, High Wizard, Warlock, Arch Mage | 75 |
| Elemental Master | Mage, Sage, Professor, Sorcerer, Elemental Master | 80 |
| Windhawk | Archer, Hunter, Sniper, Ranger, Windhawk | 58 |
| Troubadour | Archer, Bard, Clown, Minstrel, Troubadour | 64 |
| Cardinal | Acolyte, Priest, High Priest, Arch Bishop, Cardinal | 70 |
| Inquisitor | Acolyte, Monk, Champion, Sura, Inquisitor | 73 |
| Meister | Merchant, Blacksmith, Whitesmith, Mechanic, Meister | 61 |
| Biolo | Merchant, Alchemist, Creator, Genetic, Biolo | 51 |
| Shadow Cross | Thief, Assassin, Assassin Cross, Guillotine Cross, Shadow Cross | 53 |
| Abyss Chaser | Thief, Rogue, Stalker, Shadow Chaser, Abyss Chaser | 53 |

Shared skills have one identity but an unlock tier for each path: Heal is an Acolyte first-job skill and a Crusader second-job skill; Double Strafe is an Archer first-job skill and a Rogue second-job skill. `roSkillTier(lineage,key)` and `lineage.skillTiers` preserve that distinction. Transcendent second jobs unlock in the existing second-job stage rather than inventing an extra evolution between the game's four stages.

Both mage paths now start with **Fire Ball**. Their primary attack is a visible fire projectile with a small explosion; Fire Bolt, Cold Bolt and the other first-job spells remain optional learnable skills.

## Effects and budgets

The catalogue includes weapon strikes, focused combos, projectiles, chains, circular attacks, persistent ground zones, traps, summons, dashes, healing, defensive barriers, temporary buffs and permanent passives. It contains 290 distinct combinations of damage, area, element, cadence and mechanical effects, rather than one generic attack with a different name. Skills can share a combat family, as their original variants do.

- Persistent fields and summons distribute their listed damage budget over their lifetime. Their damage is not multiplied by the number of ticks or summoned projections.
- Summons are bounded, temporary combat projections in this mode. They are not a full independent homunculus or pet management subsystem.
- Traps and elemental walls slow, root, blind or damage enemies without permanently sealing the physical map. Bosses have capped control durations.
- Self-only and party support spells that are useful while alone apply to the player. Party-wide healing becomes a local heal; protective equipment coatings become temporary defenses. Furtivity becomes brief evasion/protection and does not hide enemy telegraphs.
- Crafting reagents and fourth-job AP are normalized to the game's SP costs and cooldowns. Existing forty skill costs are retained. Asura Strike and large persistent effects have their own higher cost/cadence budgets.
- Passives do not take an active bar slot. Their combined stat bonuses are capped by the authoritative effect engine. Learned skills remain in the library when another skill is equipped.
- Auto Spell and Auto Shadow Spell have bounded proc damage and a separate cooldown. Their echoes cannot trigger more echoes. Multihit animations split one attack budget rather than multiplying damage by the hit count.

## Deliberate exclusions

**108 skill identities are excluded**, each with a source ID and written reason in `RO_SKILL_EXCLUSIONS`. The exclusion list is explicit and tested; these skills never enter the offer pool as placeholder rewards.

| Reason | Examples |
| --- | --- |
| Town commerce, manufacturing, appraisal or cosmetics without a combat purpose here | Vending, Discount, Overcharge, Arrow Crafting, smithing recipes, Prepare Potion, Twilight Alchemy, Bionic Pharmacy, Decorate Cart |
| Another player, a dead party member or a PvP equipment system is required | Resurrection, Redemptio, Sacrifice, Marionette Control, most Divest skills, Strip Accessory, Ultimate Sacrifice |
| Managing a state or item subsystem absent from this mode | Cast Cancel, Encore, Create Elemental Converter, Remove Trap, Talkie Box, Four Spirit Analysis, Preserve/Reproduce, FAW Removal |
| Duplicated HUD information, noncombat collection or bypassing the guarded world route | Sense, Find Stone, Steal/Mug, Greed, Teleport, Warp Portal, Graffiti |

Useful combat support was kept: Heal, Safety Wall, Blessing, Increase AGI, Hiding, Back Slide, Enchant Poison, Weapon Blocking, Quagmire, Fiber Lock, Ankle Snare, Sanctuary, the elemental spirits, Warg attacks, robot auxiliaries and fourth-job techniques all have executable local mechanics.

## Verification

`tests/ro-expanded-skills.test.js` checks every catalogue entry for valid engine fields, finite numeric budgets, primary source identity, supported mechanic and meaningful effects. It checks all 54 source-job groups, every lineage and unlock tier, all exclusions and both mage starting attacks. It also executes every included nonpassive skill through the real `Game.command('bkCast')` path against a live target with real SP and cooldown consumption, so a named entry cannot pass merely by appearing in a list.

The full balance and integration suites remain responsible for progression speed, enemy durability, level-up offers, saved skill libraries, equipment loadouts, automatic/manual activation and visual effects.
