# Referências e limites de fidelidade

O projeto é um híbrido independente: Custom Hero Survival + atributos definidos pelo usuário + clima e narrativa originais. Não há arquivo `.w3x` no repositório e nenhuma equivalência completa a um patch de Warcraft III ou Ragnarok é alegada.

## Base histórica verificada

Fontes primárias: guia clássico da Blizzard, consultado em 17/11/2026. É referência histórica, não garantia de balanceamento do Reforged atual. Cada skill guarda `reference`, `source` e `originalRanks` no catálogo. A tabela abaixo registra os números históricos consultados. Os ajustes de balanceamento atuais aparecem em `balanceNote` no catálogo e em BALANCE.md; técnicas ajustadas não alegam valores idênticos ao original. Ranks extras são explícitos.

| Fonte | Campos usados como base |
|---|---|
| [Mountain King](https://classic.battle.net/war3/human/units/mountainking.shtml) | Storm Bolt: dano 100/225/350, mana 75, CD 9s; Bash: chance 20/30/40%, +25 dano; Avatar: +5 armor, +500 HP, +20 dano, 60s |
| [Tauren Chieftain](https://classic.battle.net/war3/orc/units/taurenchieftain.shtml) | War Stomp: 25/50/75 dano, mana 90, CD 6s; Shock Wave: 75/130/200, mana 100, CD 8s; Endurance: ataque +5/10/15%, movimento +10/20/30% |
| [Paladin](https://classic.battle.net/war3/human/units/paladin.shtml) | Holy Light: cura 200/400/600, mana 65, CD 5s; Devotion: +1,5/3/4,5 armor |
| [Far Seer](https://classic.battle.net/war3/orc/units/farseer.shtml) | Chain Lightning: 85/125/180 dano, 4/6/8 saltos, mana 120; Feral Spirit: dois lobos, 60s, mana 75, CD 30/25/25s |
| [Blademaster](https://classic.battle.net/war3/orc/units/blademaster.shtml) | Critical Strike: chance 15%, multiplicador 2/3/4× |
| [Archmage](https://classic.battle.net/war3/human/units/archmage.shtml) | Blizzard: 6/8/10 pulsos, 30/40/50 dano por pulso, mana 75; Brilliance: +0,75/1,5/2,25 mana/s |
| [Dread Lord](https://classic.battle.net/war3/undead/units/dreadlord.shtml) | Vampiric Aura: 15/30/45% roubo de vida corpo a corpo |
| [Keeper](https://classic.battle.net/war3/nightelf/units/keepergrove.shtml) | Thorns Aura: reflexão 10/20/30% |
| [Itens permanentes](https://classic.battle.net/war3/basics/heroitemspermanent.shtml) | Anel +3 armor, pingente +150 mana e garras +9 dano como referências clássicas; preços/estoque próprios |

## Extensões e adaptações

- Cinco níveis por skill: níveis 4–5 são extensões; Avatar é documentado em um nível e seus 2–5 são próprios.
- Disparo múltiplo, Cometa de brasas, Anel de inverno, Salto de cauda, Passos de névoa, Arco selvagem, Presas de musgo, Sopro voraz e Manto de pétalas são técnicas próprias.
- Holy Light vira cura própria; o alvo é diferente do original. Blizzard mantém canalização e cap por pulso, mas não tem fogo amigo. HP/ATQ dos lobos são adaptados. A redução por salto e os alcances usam escala própria do coliseu.
- As auras Fervor, Couraça e Fonte afetam heróis aliados próximos. Vampirismo e Espinhos são efeitos do portador nesta versão. Itens de lifesteal podem funcionar à distância.
- Ataques resolvem dano ao disparar; projéteis ainda são apresentação. Não há tabela completa de tipos de ataque, cast point, backswing, dispel/orb rules ou pathfinding equivalente ao WC3.
- INT e clima modificam o resultado das magias; a interface descreve seus valores base.
- Os seis atributos seguem as instruções do usuário com incrementos e limites próprios explicitados no README/UI. Não são as fórmulas oficiais de Ragnarok. O indicador de crítico usa explosão vermelha, centro claro e número ampliado; Miss usa texto claro inclinado, ambos originais em estilo inspirado em RO, sem copiar sprites.
- Ouro, preços, limites, potes, encontros, climas e IA exigem ajustes após playtests humanos. A campanha automatizada até 50 valida o fluxo; não demonstra equilíbrio competitivo.

Referência anterior de CHS: [hoihoi8 v1.21](https://www.hiveworkshop.com/threads/hoihoi8s-custom-hero-survival-v1-21.105943/). A versão recente do mapa desejada pelo usuário ainda não foi identificada.

## Novos controles de espaço e balanceamento

Cleave permanece **15/25/35/45/55%**, provisórios deste jogo, até obter o mapa CHS. O [guia do Pit Lord](https://classic.battle.net/war3/neutral/pitlord.shtml) documenta 30/55/80% em seu contexto; esses números não foram transferidos para CHS.

Ricochete, Blink, troca de posições, barreira de gelo, repulsão, laço e gravidade são implementações próprias com cinco níveis. O [site oficial de Warlock Brawl](https://www.warlockbrawl.com/) confirma a origem como arena baseada em física; usamos a disputa de posicionamento como inspiração, sem alegar reprodução das skills/valores de um patch de Warlock. Obstáculos são caixas com navegação em grade, e não o pathfinding nativo do Warcraft. Veja BALANCE.md para os ajustes deste protótipo.

## Inspiração de equipamentos e bestiário

Os efeitos dos equipamentos novos usam como referência conceitual os papéis de itens de Dota, consultados nos arquivos oficiais [6.84](https://www.dota2.com/684/) e [Mistwoods](https://www.dota2.com/mistwoods). Os números e exceções deste jogo estão no catálogo e em BALANCE.md. Animais e bestas mitológicas são modelos originais; suas técnicas não copiam assets, mapas ou scripts de Warcraft.
