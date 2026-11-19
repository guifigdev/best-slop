# Evoluções — Castle Fight v1.14b

Auditoria de dados: 51 ligações nos objetos e 51 nos registros EC/RC/IC do JASS, sem ligações ausentes ou adicionais no catálogo. São 41 caminhos completos, incluindo ramificações; 46 destinos estão executáveis. Cinco melhorias de suporte continuam indisponíveis por depender de efeitos nativos ainda não implementados.

Murloc Hut → Camp → Village → Fortress produz Murloc → Warrior → Champion → Assassin. Preços incrementais: 120 / 130 / 150 / 200 ouro; vida: 180 / 325 / 520 / 750; dano médio: 15 / 30 / 45 / 62,5. Melhorias mudam as próximas unidades, preservando as tropas já produzidas.

O script scripts/audit-castle-upgrades.py compara grafo, custos, predecessor e unidade com os arquivos extraídos do mapa fixado. shared/castle-upgrade-data.js guarda o resultado, sem arquivos originais ou execução de JASS. Modelos e retratos próprios diferenciam os quatro Murlocs e as demais unidades evoluídas.

| Raça | Construções | Unidades |
| --- | --- | --- |
| human | Chapel → Church | h03B → h03C |
| human | Sniper Nest → Marksmen's Encampment | hrif → h05C |
| human | Sniper Nest → Gunner's Hall | hrif → h0A2 |
| human | Barracks → Stronghold | hfoo → h03A |
| naga | Swamp Well → Lernaean Fountain | n004 → n01P |
| naga | Murloc Hut → Murloc Camp → Murloc Village → Murloc Fortress | n003 → n00I → n00J → n00K |
| naga | Spawning Grounds → Royal Spawning Grounds | n002 → n00X |
| chaos | Eraser (Level 1) → Eraser (Level 2) → Eraser (Level 3) | suporte → suporte → suporte |
| chaos | Lesser Demon Cage → Greater Demon Cage | n00A → z000 |
| chaos | Chaos Citadel → Greater Chaos Citadel | n009 → n00Z |
| elf | School of Wizardry → Tower of Supreme Magic | h07B → h00W |
| elf | Hall of Honor → Hall of the Eldest | n006 → n00Y |
| elf | Archery Range → Archery Tower | n022 → n023 |
| undead | Temple of Bone → Temple of Necromancy → High Citadel of Necromancy | u005 → u009 → u00D |
| undead | Skull Pile → Skull Shrine | suporte → suporte |
| undead | Crypt → Graveyard | h01U → h05H |
| undead | Rotting Hay Cart → Tainted Farm → Defiled Granary | n00B → n01K → u007 |
| orc | Kodo Farm → Spellbreaker Kodo Farm | o007 → o00B |
| orc | Kodo Farm → Offensive Kodo Farm | o007 → o008 |
| orc | Kodo Farm → Defensive Kodo Farm | o007 → o006 |
| orc | Fighters' Hall → Advanced Fighters' Hall → Superior Fighters' Hall | o002 → o004 → o005 |
| orc | Troll Hut → Trapper's Hut | n00V → n01O |
| north | Frost Launcher → Greater Frost Launcher | suporte → suporte |
| north | Snowy Rocks → Icy Rocks → Glacier | n017 → n018 → n016 |
| north | Ice Claws → Frost Claws | n012 → n013 |
| north | Ice Troll Hut → Ice Troll Voodoo Lounge | n015 → o00A |
| corrupted | Corrupted Ancient of Battle → Corrupted Ancient of War → Corrupted Ancient of Annihilation | n01I → n01H → n027 |
| corrupted | Hell's Gate → Hell's Portal | n01F → n01E |
| corrupted | Nether Ancient → Shadow Ancient | n01D → n01B |
| corrupted | Void Portal → Portal of the Abyss | n019 → n01A |
| nightelf | Moon Shrine → Moon Altar | e007 → e00J |
| nightelf | House of Shadows → Guild of Shadows | n01Z → n020 |
| nightelf | Pillaged Hut → Scorched Mansion | e00B → e00A |
| nightelf | Hunter's Hall → Ranger's Hall → Amazon's Hall | e001 → e003 → e004 |
| mech | Blue Shield Generator → Red Shield Generator | suporte → suporte |
| mech | Gun Smith → Arsenal | z002 → z003 |
| mech | Aircraft Factory → Bomber Factory | h06Q → h06R |
| mech | Golem Factory → Precious Golem Factory | n01X → n024 |
| mech | Tank Factory → Mine Layer Factory | h06T → h06U |
| mech | Tank Factory → Assault Tank Factory | h06T → h099 |
| mech | Tank Factory → Heavy Tank Factory → Rocket Tank Factory | h06T → h06S → h098 |
