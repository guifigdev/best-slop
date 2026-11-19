# Castle Fight: referência histórica e catálogo independente

## Versão fixada

A referência desta entrega é **Castle Fight v1.14b**, atribuída no próprio mapa a **gekko / geX**. O arquivo veio do [arquivo WC3Map](https://wc3map.com/maps/castle-fight-523/castle-fight-v1-14b-28959/), pelo [download de mapa 28959](https://wc3map.com/api/download/28959), consultado em 18/11/2026. Identidade do arquivo analisado:

```text
Tamanho: 843908 bytes
SHA-256: ea93d427d8171babdbb4b58a0db3352c9d27195597a9a5581bf8ff528d7e682d
```

O nome de uma versão, sozinho, não prova que dois arquivos sejam iguais: há exemplares de v1.14b com tamanhos diferentes nos arquivos comunitários. Esta referência fixa o hash do exemplar lido; não afirma possuir uma assinatura de autenticidade do autor. O site antigo indicado pelo mapa, `gex.eeve.org` / `eeve.org`, não estava acessível na pesquisa.

Como contraste, o [site mantido de Castle Fight Definitive Edition](https://castlefight.cfd/) e seu [compêndio](https://castlefight.cfd/compendium/) documentam uma continuação com alterações. Seus dados não foram misturados ao catálogo v1.14b. Desert, Panda e Elemental de continuações não se tornam raças do original por associação.

## Método e limites

O MPQ foi lido como dados. Foram extraídos arquivos de objetos (`w3u`, `w3t`, `w3a`), terreno (`w3e`), passagem (`wpm`), posições de decorações (`doo`) e texto JASS. O JASS foi inspecionado textualmente para localizar registros e constantes; **nenhum script do mapa foi executado**. Não foram importados modelos, texturas, sprites, áudio ou código executável de Warcraft para o jogo independente.

O arquivo tem cabeçalhos de arquivo e entradas duplicadas que não são aceitos diretamente pelo leitor MPQ simples. A leitura selecionou entradas de locale/plataforma neutros e os blocos válidos, verificando os tamanhos descomprimidos. Os originais de análise ficam em `outputs/castle-original`, fora do catálogo distribuído. A entrega contém números derivados, nomes de unidades/construções e implementação própria.

Hashes das fontes centrais:

| Arquivo | SHA-256 |
| --- | --- |
| `war3map.w3u` | `398b86bd67e3306f505c82a970c4e0e8e0dc7caa53d3298062c35b68aa7e4a3f` |
| `war3map.w3t` | `4d2775f3c4bb30855bdbe56d86583299098d03b206fbfc3a29ae90f8d86e555d` |
| `war3map.w3a` | `5bf5683e9776bc91c3c85617d7ce4bbaf960dfeeb7e4e15715e4fbfd6f8f5db8` |
| `Scripts/war3map.j` | `06fb90f4eab3e7302d9ab0890d7b798299fd98d37dcc7e8430a88e43fd93806a` |
| `war3mapMisc.txt` | `79774bb992ff3740af6568d767ef4477fba08de20d3d45b9c43a9ad50a27f0a4` |

## Raças realmente jogáveis

O registro `ti[0..9]` / `Go[0..9]` no JASS confirma **dez** raças:

| Chave independente | Nome da referência | Builder rawcode |
| --- | --- | --- |
| `human` | Human | `h00C` |
| `naga` | Naga | `h00E` |
| `chaos` | Chaos | `h00O` |
| `elf` | Elven Union | `h00P` |
| `undead` | Undead | `h018` |
| `orc` | Orc | `h019` |
| `north` | Northern | `h017` |
| `corrupted` | Corrupted | `u006` |
| `nightelf` | Night Elf | `h089` |
| `mech` | Mechanical | `h06P` |

Há um objeto chamado **Nature Builder** (`h01A`) no arquivo de objetos, mas ele não aparece nesse registro. Por isso não foi apresentado como raça selecionável. Esta distinção entre objeto residual e conteúdo jogável é relevante para outras extrações.

O catálogo cobre os menus `ubui` desses builders e as cadeias `uupt` de melhoria: **161 entradas de construção**, incluindo melhorias e cópias por raça de estruturas compartilhadas como Treasure Box; **107 perfis de tropas** vinculadas a essas construções; e os **14 objetos de item** encontrados. Isso não significa que 161 habilidades especiais tenham sido reproduzidas pelo motor.

## Dados confirmados e adaptações

`shared/castle-catalog.js` exporta `CASTLE_RACES`, `CASTLE_BUILDINGS`, `CASTLE_UNITS`, `CASTLE_ITEMS`, `CASTLE_MARKETPLACE_ITEMS`, `CASTLE_LAYOUT`, `CASTLE_REFERENCE`, `CASTLE_DAMAGE_MATRIX` e `castleDamageMultiplier()`.

Uma construção tem `race`, `cost`, `lumberCost`, `buildTime`, `spawnTime`/`spawnInterval`, `unit` como **chave de CASTLE_UNITS**, `upgradesTo`, `requiresBuilding`, `legendary`, `category`, `playable` e `provenance`. O custo explícito `ugol` prevalece; quando herdado e ausente, a constante do registro de construção no JASS serve de aproximação. `provenance.costSource` distingue as duas situações, e `scriptIncomeCost` preserva a constante separadamente: a base usada no cálculo de renda pode diferir do custo do objeto.

As tropas preservam em `sourceStats` o rawcode, base Warcraft, dano-base, dados de dano, intervalo, alcance, velocidade e tempo de treinamento que estavam disponíveis. HP, defesa, tipo de ataque e tipo de armadura também podem ser confirmados pelo tooltip factual da construção. Quando todos os dados de ataque estão presentes, o dano médio é:

```text
dano médio = dano-base + quantidade de dados × (faces + 1) / 2
```

Quando só o DPS arredondado do tooltip está disponível, `DPS × intervalo` é uma **aproximação marcada**. Alguns valores são herdados dos arquivos-base de Warcraft, que não acompanham o mapa; não foram apresentados como valores exatos extraídos. Os campos provisórios constam de `provenance.adapted`. `abilityIds` registra habilidades nativas conhecidas; **o registro do ID não implementa automaticamente o efeito**.

Exemplos conferidos:

| Construção → tropa | Custo em ouro | Vida | Defesa | Ataque | Tempo de treino |
| --- | ---: | ---: | ---: | --- | ---: |
| Chapel → Crusader | 280 | 600 | 6 | Hero, média 60 por golpe | 29 s |
| Gryphon Rock → Gryphon Rider | 250 | 500 | 2 | Magic, intervalo 2 s | 27 s |
| Spawning Grounds → Naga Guardian | 250 | 625 | 6 | Pierce, média 72,5 por golpe | 27 s |

A escala horizontal de runtime é **1/256** da unidade nativa. Existe um alcance mínimo de contato de 0,55 para as malhas independentes. Footprints foram simplificados a 2×2; meshes animais são novas representações. Essas são adaptações de apresentação/física, não fatos do mapa original.

Construções sem tropa mantêm `unit:null`. Torres, economia, cura e alguns efeitos diretos têm `castleEffect` próprio; não se tornam quartéis fictícios. Suportes complexos sem handler, como Heroic Shrine ou as variações de Eraser, permanecem `playable:false`. As limitações de madeira, alimento lendário, melhorias e habilidades registradas precisam ser aplicadas pelo motor; sua presença no catálogo não prova que estejam completas.

## Matriz de counters extraída

Estes são os multiplicadores de **`war3mapMisc.txt`**, e não o gráfico padrão de Warcraft escolhido de memória. A ordem nativa foi convertida em chaves explícitas. A defesa numérica da unidade é outra etapa da mitigação.

| Ataque \ armadura | Light | Medium | Heavy | Fortified | Normal | Hero | Divine | Unarmored |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Normal | 0,70 | 1,75 | 1,00 | 0,50 | 1,00 | 0,60 | 0,25 | 1,05 |
| Pierce | 1,75 | 1,00 | 0,70 | 0,45 | 1,00 | 0,60 | 0,25 | 1,05 |
| Siege | 0,70 | 0,70 | 0,70 | 1,60 | 0,80 | 0,40 | 0,20 | 1,00 |
| Magic | 1,00 | 0,70 | 1,75 | 0,40 | 1,00 | 0,60 | 0,25 | 1,05 |
| Hero | 1,10 | 1,10 | 1,10 | 0,60 | 1,10 | 0,60 | 0,40 | 1,10 |
| Chaos | 1,00 | 1,00 | 1,00 | 1,00 | 1,00 | 1,00 | 1,00 | 1,00 |
| Spells | 1,00 | 1,00 | 1,00 | 1,00 | 1,00 | 0,70 | 0,25 | 1,00 |

Assim, Normal favorece Medium, Pierce favorece Light, Magic favorece Heavy, Siege favorece Fortified e Chaos mantém dano completo contra Divine. O helper evita herança de propriedades ao receber chaves inválidas.

## Os nove itens do Main Castle

A lista `hcas.umki` é `I009,I00A,I008,I007,I005,I001,I003,I004,I006`. Ela define `CASTLE_MARKETPLACE_ITEMS`, em vez de vender todos os objetos técnicos encontrados no arquivo.

| Chave | Item da referência | Ouro | Efeito factual principal |
| --- | --- | ---: | --- |
| `repair_rune` | Rune of Repair | 450 provisório | Repara estruturas em 2,5 HP/s na área |
| `bassline` | Drum'n'Bass Bassline Generator | 600 | +15% movimento e +30% velocidade de ataque |
| `double_damage` | Double Damage | 600 | +100% dano por 30 s |
| `quad_damage` | Quad Damage | 1400 | +300% dano por 30 s |
| `stone_scroll` | Scroll of Stone | 150 | Cura 400 HP/200 mana e +8 defesa por 30 s |
| `blast_staff` | Blast Staff | 150 + 300 madeira | Um projétil de 60 dano mágico/s |
| `bass_drums` | Drum'n'Bass Bass Drums | 650 | +33% dano aliado |
| `cheese` | Cheese | 1500 | Mais um espaço de construção lendária |
| `chain_orb` | Orb of Lightning | 550 | 1000 dano inicial, dez alvos, −10%/salto, 60 s |

O custo de Rune of Repair é herdado do item-base `bgst` e não consta explicitamente no `w3t`; 450 é provisório, marcado. Os dados de estoque, reposição e disponibilidade inicial estão em `sourceStats`. Cooldowns por jogador, uso imediato e compra na torre central são adaptações do fluxo de inventário original. Greater Blast Staff, Gold, Tech Tent, Nuke Launcher e Explode Mine ficam fora dessa lista: existirem como objetos não os torna ofertas do Main Castle.

## Geometria do cenário

O W3E contém **97×65 vértices**, portanto **96×64 tiles**, tileset **Ashenvale**, origem (−6144, −4096). As malhas e biomas não são do campo Portais dos Fiordes.

- Castelos `hcas`: (−4864, 0) e (4864, 0), convertidos a X ±19, Z 0.
- Regiões das pistas: Y 704…1440 e −1440…−704, centros ±1072; em runtime, Z ∓4,1875.
- Territórios de construção: X −5632…−1536 e 1536…5632, Y ±2048; convertidos a X ±[6,22], Z ±8.
- Duas pistas contornam o maciço/floresta central. Os pontos de passagem têm origem nas regiões do JASS; não são duas linhas inventadas a partir de outro modo.

`CASTLE_LAYOUT.terrain` fornece uma matriz de 48×32 materiais, alturas e passagem, reamostrada de W3E/WPM. As alturas usam baseline nativo 269,5 e escala vertical 1/128. `CASTLE_LAYOUT.doodads` fornece **1029 posições**, incluindo **131 árvores** reconhecidas pelos rawcodes `ATtr`/`ATtc`; são coordenadas e classificações simples, sem caminhos para modelos proprietários. As máscaras nativas das decorações não foram reproduzidas como texturas de pathing; representar uma árvore por primitiva não dá automaticamente sua colisão original.

O pedido de uma **torre central de itens** é atendido como adaptação declarada em `CASTLE_LAYOUT.tower.adapted`. Na referência analisada, quem vende os nove itens é o Main Castle, não uma torre central. A posição relativa das bases/pistas e os materiais do terreno podem ser fiéis à fonte sem atribuir essa mudança ao autor original.

## Arma defensiva do castelo: adaptação declarada

Não foi confirmado ataque próprio do **Main Castle** no exemplar v1.14b fixado. O objeto `hcas` contém 5.000 HP e regeneração de 0,5 HP/s, a lista de itens e habilidades de interação, mas não sobrescreve dano, intervalo ou alcance de arma. O JASS cria os castelos e remove a invulnerabilidade no início da rodada; suas referências à reação do castelo atacado tratam a IA/Rescue Strike. Não foi localizado um disparador de arma próprio para `hcas`. A [tabela primária de construções humanas da Blizzard](https://classic.battle.net/war3/human/buildingstats.shtml) também separa o Castle sem arma das torres com estatísticas de ataque.

Para atender ao pedido de castelos defensivos sem atribuir números inventados ao original, a arma pode reutilizar a **Watch Tower do próprio v1.14b**, `h006` / `human_h006`: Pierce, **45 de dano médio**, intervalo de **0,5 s**, alcance nativo **950** (950/256 no catálogo). O tooltip registra 90 DPS; os dados incluem dano-base 39 e faces 11, compatíveis com a média de 45 do ataque herdado. A transferência dessa arma para o Main Castle é uma adaptação explícita; não significa que o castelo original a possuía.

## Blast Staff: aquisição e projétil

O item `I001` usa a habilidade `A02D`: dano 60, intervalo de 1 segundo, área de aquisição nativa 750 e velocidade de projétil `amsp = 1000`. `shared/castle-item-effects.js` converte distância/velocidade na mesma escala 1/256 do catálogo e mantém o dano-base.

O disparo precisa de um inimigo vivo e elegível dentro da área. Polling sem alvo não consome uma recarga. Depois do lançamento, o projétil segue o alvo e aplica dano somente ao impacto; sair do alcance inicial não cancela uma bala já lançada. Alvo morto ou convertido para aliado cancela a bala sem dano. A posição do projétil é independente da posição posterior do portador.

O dano usa a linha **Spells** da matriz: por exemplo, Hero recebe 70% e Divine recebe 25%. Armadura física e buffs de dano de ataque não ampliam/reduzem esse dano. Uma resistência mágica explícita já aplicada pelo motor pode reduzi-lo; o módulo não inventa efeitos a partir de IDs de habilidades nativas ainda não implementadas. Projéteis são dados serializáveis em `castleFight.projectiles`, permitindo representação visível durante o trajeto. Testes cobrem aquisição, cadência, trajetória, alvos voadores, counters e morte sem dano duplicado.

## Economia confirmada e diferenças restantes

O JASS registra, no modo padrão, **250 de ouro e 125 de madeira iniciais**. A renda parte de `yx = 0,5`; a conclusão da construção adiciona `fator × custo registrado / 100` à base, e `gI` calcula `floor(yx × pe × 10)` antes dos modificadores de Treasure Box, impostos e equipe. `pe` é **1 por padrão**; o JASS usa 1,33 para computadores na dificuldade Insane. Os fatores registrados são 0,20 para tropas comuns, 0,18 para cerco, 0,08 para torres e 0,09/0,12 para categorias especiais.

Madeira é concedida **ao concluir construções e melhorias de produção**: o custo registrado `Fx` inteiro para produção comum, ou `floor(Fx × 3/4)` para cerco. Torres e suportes não recebem essa recompensa. Há exceção de categoria explícita para Skull Shrine (`h056`), registrada como produção. Não há uma renda fixa universal de +15 madeira por período na fonte. As funções relevantes são `rf` (construção concluída), `Vf` (melhoria concluída) e `Db` (concessão de madeira, com limite opcional de modo).

O preço do objeto-alvo de uma melhoria é **o valor incremental cobrado naquela etapa**, não a diferença entre dois custos listados. Por exemplo, Barracks custa 100; Advanced Barracks cobra mais 175, totalizando investimento registrado de 275. `previousRegisteredCost` preserva a base acumulada anterior, extraída de `ca`. A contribuição antiga permanece durante a melhoria e é atualizada na conclusão. A morte remove a contribuição de `ro × (Fx + ca) / 100`.

Treasure Box multiplica a renda **depois** do primeiro truncamento: `floor(floor(taxa × pe × 10) × (1 + 0,25 × peso))`. Os pesos nativos para 0…9 caixas são `0; 1; 1,85; 2,57; 3,18; 3,7; 4,14; 4,52; 4,84; 5,11`; após nove, cada caixa acrescenta 0,25 ao peso. A fonte aplica impostos e modificadores de equipe posteriormente. Isso evita tratar a progressão arredondada original como uma série geométrica exata.

O motor independente agora usa os **250 ouro/125 madeira iniciais**, a base dinâmica de renda, os fatores e custos registrados, a tabela de Treasure Box e a recompensa de madeira somente ao concluir investimento produtivo. Construções vendidas ou destruídas deixam de contribuir; não se concede renda extra só por iniciar uma construção. `CASTLE_ECONOMY_REFERENCE`, `registeredIncomeFactor`, `registeredKind` e `previousRegisteredCost` tornam as regras verificáveis no catálogo.

Permanecem adaptações explícitas: **12 construções por jogador/60 tropas por equipe**, reembolso de **65% proporcional ao HP**, fluxo da torre central/inventário, ausência dos impostos/modificadores de equipe da fonte e das variantes completas de dificuldade. O motor preserva um espaço lendário ampliável por Cheese. Estoque/disponibilidade dos itens e custos em madeira são tratados separadamente. As habilidades nativas individuais das 107 tropas continuam sendo uma lacuna distinta; corrigir a economia não torna todo o modo equivalente ao executável original.

## Validação

`node --test tests/castle-catalog.test.js` verifica as dez raças efetivamente registradas, ligações de menu/melhorias, 161 construções/107 tropas, exemplos de estatísticas extraídas, matriz inteira, as nove ofertas do castelo e dimensões/posições do cenário derivado. Essa validação comprova consistência e proveniência do catálogo. Equivalência de combate, IA, pathing, economia e habilidades com o executável original exige testes adicionais de partidas.


## Construção presencial, reparo e produção

O construtor agora recebe uma fila autoritativa de obras. Colocar reserva os recursos e o espaço; ele caminha à borda, trabalha pelo `buildTime` do catálogo e só então libera renda e produção. Mover/Parar/Blink interrompe o trabalho; Continuar construção retoma a fila. A evolução também exige trabalho e mantém a renda anterior até concluir. A construção começa com 10% de HP e recebe os 90% restantes durante a obra. Saídas bloqueadas preservam a produção pronta junto ao produtor, sem teletransporte para a lane.

Reparar vem em automático. `R` escolhe um alvo; botão direito no botão alterna o automático; botão direito numa construção aliada manda reparar. Obras têm prioridade sobre reparo automático. A velocidade de 35 HP/s, busca de 14m e alcance de trabalho de 0,35m são adaptações de ritmo. O custo proporcional usa 35% do ouro da estrutura para restaurar uma barra completa; falta de ouro pausa o serviço. Não foi alegado que a cadência adaptada reproduz toda a lógica nativa de Repair. `A071` e `A08G` no mapa herdam `Ahrp` e descrevem explicitamente o auto reparo.

Selecionar o produtor ou uma de suas tropas mostra unidade produzida, progresso, próximo nascimento e prévia do ciclo contínuo. O limite populacional e a saída obstruída têm estados distintos. As duas próximas imagens representam o ciclo automático; não são compras adicionais de tropas.

## Auditoria dos alvos e armas

`shared/castle-weapon-data.js` registra 115 perfis de unidade/torre, gerados por `scripts/audit-castle-weapons.py`. `uaen`, `ua1g` e `ua2g` são lidos do W3U; campos ausentes são resolvidos com `UnitWeapons.slk` da [fixture primária de wc3libs](https://github.com/inwc3/wc3libs/blob/master/src/test/resources/wc3data/Units/UnitWeapons.slk). A versão exata do Warcraft dessa fixture não foi identificada: defaults herdados continuam uma limitação histórica, e campos explícitos do mapa prevalecem.

- Footman: terrestre; Sniper: terrestre e aéreo.
- Marksman e Roterothopter: arma contra tropas aéreas e segunda arma contra estruturas. Não atacam tropas terrestres com um perfil aéreo.
- Anti-Air Tower tem segunda arma terrestre: 70 de dano médio aéreo/0,4s e 22,5 terrestre/0,6s, com alcances próprios.
- `uaen=0`, como Gobbo Machinist, não ganha um ataque básico inventado. As habilidades nativas ainda não cobertas não são substituídas por uma arma fictícia.

A simulação escolhe arma válida para o alvo e aplica seu alcance, cadência e tipo de dano. A ficha mostra os alvos e, em unidades com duas armas, ambos os ataques. Fora desse modo, os atributos personalizados do Survival/Line Wars permanecem separados.

A travessia da saída agora aceita a passagem pelo plano do portão também quando a formação se dispersou lateralmente em combate. Voltar ao centro exato fazia grupos estacionarem e retornarem ali depois de cada escaramuça. A navegação até a próxima etapa continua verificando obstáculos.
