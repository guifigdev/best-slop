# Arquétipos e acesso às habilidades

O tipo de combate do herói é explícito; o alcance não transforma um mago em arqueiro nem permite misturar dano físico e magia.

| Herói | Arquétipo | Função |
| --- | --- | --- |
| Bjorn, capivara | `physical_melee` | Guardião |
| Sten, tartaruga | `physical_melee` | Tanque |
| Eirik, guaxinim | `physical_melee` | Assassino |
| Runa, raposa | `physical_ranged` | Arqueira |
| Liv, coelha | `magic` | Arcanista |
| Vidar, coruja | `magic` | Controle mágico |

Os perfis são registrados em `HEROES.archetype`, `combatRole` e `attackType`. O arquétipo deriva da chave de herói do catálogo, sem confiar num campo `u.archetype` enviado/forjado. Os atributos e seus ganhos não são redefinidos por esse módulo.

## Classificação completa

Todas as 52 habilidades possuem `allowedArchetypes`, `skillStyle` e `compatibilityLabel`. O catálogo rejeita habilidades sem classificação ou classificadas duas vezes.

- **Somente físico corpo a corpo:** cleave.
- **Somente físico à distância:** multishot, bounce.
- **Ambos os físicos:** stomp, shockwave, bash, dash, hornrush, critical, avatar, battlecry, rage.
- **Comuns aos três:** vampiric, endurance, devotion, evasion, thorns, stonehide.
- **Somente mágicos:** todas as outras habilidades, incluindo dano elemental, veneno ofensivo, magias de Warlock, invocações, cura, escudo, regeneração de mana, teleporte, troca de posição e barreira de gelo.

Stomp e shockwave passam a usar `damageType:'physical'` e `atkCoefficient`. As habilidades comuns oferecem defesa/mobilidade passiva neutra; thorns é resposta defensiva, não uma magia ofensiva aprendida por físicos. A exceção explícita de vampirismo serve tanto a ataques físicos quanto mágicos elegíveis. Sua aplicação no combate não deve se multiplicar por pulsos, procs ou dano periódico.

## Contrato dos helpers

`shared/archetypes.js` exporta:

```js
heroArchetype(unit); // physical_melee | physical_ranged | magic | null
canUseSkill(unit, key); // apenas compatibilidade, sem nível/recarga/mana
skillCompatibility(unit, key);
// { allowed, code, reason, label, archetype, allowedArchetypes, skillStyle }
```

`reason` contém uma frase em português quando incompatível e é `null` quando permitido. `code` serve para lógica estável; `label` é a categoria curta para a interface. Os arrays retornados são cópias. Heróis desconhecidos e chaves inválidas são recusados. Monstros e invocações sem a propriedade `hero` mantêm seus loadouts nativos, mesmo que combinem habilidades; a restrição pertence aos heróis jogáveis.

`canLearnSkill(unit,key,rank)` em `shared/skill-access.js` combina compatibilidade com os requisitos de nível já existentes. Não substitui verificação de pontos, propriedade exclusiva, número de slots ou cooldown. A compatibilidade de uso não depende do nível de aquisição: monstros e habilidades válidas já carregadas não ficam presos a esse requisito.

## Portas de entrada e dados forjados

Compra/upgrade e aprendizado por bot devem usar `canLearnSkill`. O resgate de loot verifica o próximo rank antes de qualquer alteração; um drop incompatível permanece disponível para reciclagem. Rolagens de técnicas filtram o pool; a escolha revalida o rank herdado e a compatibilidade atual. A troca interna de slot também valida rank/estilo, antes de remover a habilidade anterior. A destilação de pontos requer sete habilidades máximas compatíveis, impedindo usar uma barra forjada para desbloquear recursos.

O sistema não apaga silenciosamente habilidades incompatíveis inseridas em saves/fixtures. O combate e as passivas precisam consultar `canUseSkill`, impedindo que um dado forjado produza efeito. A mesma regra vale em todos os modos de competição; monstros e receitas nativas de Line Wars continuam usando seus perfis próprios.

`tests/archetypes.test.js` verifica a matriz completa de seis heróis × 52 habilidades, aquisição em cinco modos, exceção do vampirismo, requisitos dos cinco ranks, NPCs, ofertas, resgate, upgrade forjado, troca direta e destilação.
