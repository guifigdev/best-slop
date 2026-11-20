# Construções especiais de Castle Fight

Os 31 edifícios de apoio antes bloqueados têm descritores executáveis em `shared/castle-support-data.js`. O catálogo aplica esses descritores antes de calcular arte e área de construção. Custos, madeira, tempos de obra, raça, pré-requisitos e caminhos de evolução continuam vindo do catálogo original.

## Fontes primárias locais

Referência: **Castle Fight v1.14b**, extraída em `outputs/castle-original`. O jogo distribuído precisa apenas dos pequenos módulos de dados; não carrega nem executa o mapa ou JASS.

| Arquivo | SHA-256 |
| --- | --- |
| `castle-fight-v1.14b.w3x` | `ea93d427d8171babdbb4b58a0db3352c9d27195597a9a5581bf8ff528d7e682d` |
| `war3map.w3u` | `398b86bd67e3306f505c82a970c4e0e8e0dc7caa53d3298062c35b68aa7e4a3f` |
| `war3map.w3a` | `5bf5683e9776bc91c3c85617d7ce4bbaf960dfeeb7e4e15715e4fbfd6f8f5db8` |
| `Scripts_war3map.j` | `06fb90f4eab3e7302d9ab0890d7b798299fd98d37dcc7e8430a88e43fd93806a` |

Campos explícitos do mapa prevalecem sobre campos herdados dos SLKs originais. Dados realmente executados prevalecem sobre textos de descrição desatualizados. Cada entrada registra habilidades e campos consultados em `supportReference`.

## Chilling Mushroom: descrição antiga divergente

O edifício `h047` possui `A06P`. A função `SPELL_FrozenMushroom` escolhe uma unidade aérea inimiga e executa o lançador `kv`, registrado com a habilidade `A0AK` e ordem `thunderbolt`. Essa habilidade deriva de `AHtb`; o campo explícito `Htb1=300` determina **300 de dano**, e a duração herdada `Dur1=5` determina **5 segundos de atordoamento**. `A06P.amcs=8` e a regeneração de mana do edifício sustentam a cadência de **8 segundos**. O texto antigo do edifício diz 200 de dano, mas esse valor não corresponde ao campo executado. O jogo usa 300 e mostra esse valor no texto em português.

## Famílias de efeitos

| Edifício | Comportamento principal auditado |
| --- | --- |
| Heroic Shrine | 24% de chance de duplicar um treinamento aliado não lendário. |
| Gjallarhorn | Bênção de +66% de velocidade de ataque em área, 60s de duração, cadência 7s. |
| Artillery | Granada de 300–400 de dano de cerco, área nativa 320, cadência 12s. |
| Tidal Guardian | Onda terrestre de 270 de dano de caos a cada 15s. |
| Oracle of Sirens | Controle permanente de uma tropa inimiga a cada 18s. |
| Ancient Pyramide | 40 de dano e redução de 50% de movimento/ataque por 10s, área nativa 375, cadência 7s. |
| Magic Tower Ruin | Oito resultados caóticos, incluindo mutação, dano, controle, fortalecimento e falha. |
| Eraser I / II / III | Eliminação de uma família de tropas; cadências 50 / 37,5 / 25s. |
| Volcano | 100 DPS por 2,75s; até seis alvos simultâneos; estruturas recebem 40%. |
| Shrine of Destruction | Destrói um edifício não lendário a cada 35s; exclui castelo e recompensa. |
| Golden Shrine of Justice | Chance de 20% de ressurreição após 2s; até dois santuários contribuem. |
| City of Magic | Transforma inimigo em ovelha por 45s a cada 10s. |
| City of Decay | 8 DPS contra inimigos orgânicos; não acumula consigo. |
| Skull Pile / Skull Shrine | Consomem cadáveres para criar esqueletos; variantes e chance de general vêm de `sr[]`, `Jf` e `Kf`. |
| Ceremonial Totem | Fortalecimento permanente: +20 dano, +20% ataque, +3 armadura, +200 HP e um traço adicional. |
| Serpent Rock | Veneno de 20s: -5 armadura, -20% movimento/ataque, 10 DPS primário e 5 DPS secundário. |
| Chilling Mushroom | Exclusivamente antiaéreo; 300 de dano e atordoamento de 5s, cadência 8s. |
| Frost Launcher / Greater | Dano de caos e interrupção de edifícios; a evolução também congela uma área. |
| World Freezer | Três orbes móveis; fogo de gelo de 20 por 0,33s, aura lenta e controles periódicos. |
| Eye of Corruption | -12 de armadura por 20s em inimigos; cadência 50s. |
| Forgotten One | Seis tentáculos imóveis por 9s. |
| Obelisk of Wilderness | 55% de redução mágica e 40% de chance de bloquear 40 de dano de ataques. |
| Silver Glade | Bênção sob ataque: 175 HP, 50 mana e +6 armadura por 6s em área. |
| Starfall Obelisk | 50 DPS por 9s; área nativa 1000; estruturas recebem 40%; cadência 30s. |
| Power Plant | Fortalece edifícios e suas tropas recém-treinadas. |
| Blue / Red Shield Generator | Uma / duas cargas contra habilidades negativas; armadura 2 / 4; vermelho cura 100 na primeira ativação. |

Os perfis de esqueletos, mutação e tentáculos incluem os campos explícitos W3U e os dados herdados de `base-UnitBalance.slk` / `base-UnitWeapons.slk`. Por exemplo, tentáculos têm 225 HP, dano médio 21, intervalo 1s, movimento zero e duração de 9s. Nenhuma unidade fictícia genérica substitui os atributos extraídos.

## Adaptações explícitas de representação

As distâncias extraídas usam `native/256`, como o catálogo de armas. O adaptador de combate aplica a escala espacial vigente do campo; isso é separado do dado de origem. Power Plant usa diretamente raio de 3m (`worldSpace:true`): o raio nativo de 180/256m não alcançaria nenhuma construção adjacente com as áreas de construção visuais adotadas neste jogo.

A onda usa varredura de linha no servidor. A imprecisão da artilharia usa deslocamento circular determinístico. Os orbes usam movimento no servidor e duração limitada a 60s, com remoção antecipada nos limites do mapa. A geometria, animações e efeitos visuais são próprios desta adaptação. Essas escolhas de representação não devem ser descritas como código original reproduzido literalmente.
