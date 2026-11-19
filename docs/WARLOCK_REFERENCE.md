# Warlock — referência fixada e cobertura do modo independente

## Fonte primária e identidade

O modo usa **Warlock 1.02**, distribuição estável dos próprios autores, **Zymoran e Adynathos**. A [página oficial de downloads](https://www.warlockbrawl.com/download/) separa esta versão das versões de teste 1.03 e da versão para Dota 2. O arquivo de referência foi obtido diretamente do [servidor oficial](https://www.warlockbrawl.com/files/wc3/Warlock1.02.w3x) em 19/11/2026.

- Arquivo: `Warlock1.02.w3x`, **4.179.116 bytes**.
- SHA-256: `04fa1696fbb988af2fd77f05178b601f7fe0b8bd15d57206ca3aa12ce3bf9cb8`.
- `Scripts/war3map.j`: `0646252fa628aeb0ef0ffa56f45bf167558d266e81f77e100f61af3b981893f5`.
- `war3map.w3u`: `239fbf4dcb882e24674997525e78c484c8ad813301bf1a47aa5139873f7cb2ca`.
- `war3map.w3a`: `b5a977f1fab4e0867561ba2ccf0c100c851e207c656950b9dbf065648c547422`.
- `war3map.w3q`: `b2dfb08b74bfc9c234f2b24958ae3cf99384f2b0bc5c9a6cb09f4877aa345f42`.

O MPQ foi lido como contêiner de dados. Objetos e texto JASS foram inspecionados; **nenhum script JASS foi executado**. Modelos, texturas e sons de Warcraft não são distribuídos no jogo independente. A leitura local e os arquivos de análise ficam em `outputs/warlock-reference`, fora do pacote publicado. Foram aproveitados os leitores MPQ já disponíveis no checkout, sem instalar outra ferramenta.

O [manual oficial](https://www.warlockbrawl.com/handbook/) também confirma que Fireball e a magia `F` vêm inicialmente, que as magias são organizadas por colunas, que inventário é uma pesquisa e que o anel Stone of Jordan abre evoluções acima do nível normal. Dados da continuação para Dota 2 não foram usados para preencher números ausentes.

## Personagens e valores confirmados

`h000` Warlock, `h003` Heretic, `h009` Occultist e `h00J` Inquisitor têm nos objetos do mapa:

- **100 HP**, **210 de movimento nativo**, regeneração do objeto desativada e **nenhum ataque básico** (`uaen=0`).
- **10.000 de mana** no objeto; as magias normais verificadas custam **0**. Mana não vira um novo recurso inventado.
- Magias pessoais: `S001` Scourge, `S022` Bane, `S051` Ritual e `S023` Redemption, respectivamente.
- Ouro inicial **20**, constante `Ir` do JASS.
- Movimento customizado usa `To = 210 × 0,03`, e o corpo físico usa raio `Uo=30`.

A apresentação autoral usa escala uniforme **1/64** para movimento, alcance, raios e velocidade. Assim, 210 vira 3,28125 unidades de cenário por segundo. Dano, HP, preços e tempos permanecem em suas unidades originais.

O JASS inicializa `Br[id]=0,9`; `YB` roda a cada **0,1 s**, portanto lava causa **9 HP/s**. `rE[id]=0,05` na mesma rotina resulta em **0,5 HP/s** de regeneração fora da lava. A fricção de impulso é **0,96 a cada 0,03 s**. A fórmula de impulso de `Wb` usa `(100 + pontos de dano) × dano`, multiplicadores do alvo e o passo de 0,03 s; a simulação independente converte a velocidade resultante para a mesma escala espacial.

## Habilidades

`shared/warlock-catalog.js` contém **30 identidades**: 26 magias de loja e quatro magias pessoais. Os objetos de interface contêm vários níveis adicionais para modos alternativos; esses registros não foram confundidos com o máximo normal de compra. O JASS `ek`, por volta das linhas 19707–19900, confirma a exclusão das demais escolhas da coluna e os limites das rotas de evolução.

| Coluna | Magias |
| --- | --- |
| G | Fireball |
| D | Lightning, Homing, Boomerang, Arc |
| R | Teleport, Thrust, Swap |
| T | Drain, Fire Spray, Bouncer |
| E | Meteor, Splitter, Wind Walk, Repeater, Burst |
| C | Shield, Time Shift, Rush, Mirror, Vector, Dome |
| Y | Disable, Gravity, Link, Control |
| F | Scourge / Bane / Ritual / Redemption, conforme o personagem |

Exemplos conferidos diretamente:

| Magia | Valores de nível 1 | Fonte |
| --- | --- | --- |
| Fireball | dano **7**, recarga **4,8 s**, velocidade **1000**, duração de voo **1 s**, raio de colisão **25** | `S000` + JASS `QC` / `PC` |
| Lightning | dano **7**, recarga **16,5 s**, alcance **545** | `S002` + JASS `rd` |
| Boomerang | dano **7**, recarga **16 s** | `S004` |
| Homing | dano **7** mais carga após **2,25 s**; voo de **4,5 s**; recarga **15 s** | `S003` + JASS `Bd` / `nd` |
| Teleport | alcance **770**, recarga **16 s**, reduz impulso em **20%** | `S011` + JASS `yD` |
| Thrust | dano máximo **5,4**, alcance **700**, recarga **16,5 s** | `S012` |
| Meteor | dano **4–11**, raio **225**, recarga **20 s**, atraso **0,55 s** | `S008` + JASS `wd` |
| Shield | duração **2,8 s**, recarga **25 s** | `S005` + JASS `og` |
| Time Shift | retorno após **3,5 s**, recarga **23 s** | `S006` + JASS `mg` |
| Fire Spray | dano **2,6** por míssil, **6** mísseis, **60%** de recuo, recarga **15,5 s** | `S015` |
| Scourge | dano **10** também ao usuário, recarga **3 s**, canalização **0,7 s**, raio **250** | `S001` + JASS `Mg` |

Fireball possui máximo normal **10**, Teleport e Thrust **7**, Gravity **5**, e as outras rotas normais **6**. O anel permite duas evoluções extras na magia escolhida. As magias `F` chegam aos seus três níveis pelas melhorias de combate próximo, não por pontos de atributo de Custom Hero.

Cuidados de extração: o `aare=75` herdado de Blizzard no objeto `S000` não é a colisão ativa da bola de fogo. O JASS usa `Dv[ab]=25`; a implementação e os testes usam esse último número. Da mesma forma, o número **6** da Fire Spray não foi atribuído a Fireball: Fireball dispara **um** projétil.

## Equipamentos e inventário

As **14 famílias** de compra vêm das unidades comerciantes: Boots, Pendant, Cape, Helmet, Staff of Fireball, Stone of Jordan Ring, Blood Sword, Aegis, Lava Treads, Pocket Watch, Cursed Pendant, Warden, Mask of Death e Scroll of Fireball. Preços são os campos `ugol` das respectivas unidades. Níveis usam as cadeias dos 29 objetos de item; não representam 29 itens independentes.

Exemplos: Boots custam **5** por compra/nível e dão **18/29/40** de movimento; Pendant custa **2** e dá **5/10/15 HP**; Cape custa **3** e dá **0,20/0,35/0,45 HP/s**; Helmet custa **6**, reduz recuo em **16/24/32%** e alcance em **12/24/36%**. Blood Sword e Aegis são mutuamente exclusivos. A pesquisa de inventário custa **2**. O HUD mostra seis espaços, mantendo os espaços ainda não liberados identificados.

## Cobertura e adaptações declaradas

O modo é jogável: loja entre rodadas, escolha por coluna, quatro personagens, IA local, projéteis que podem errar, reflexão, impulso, teleporte/troca, explosões anunciadas, canalização cancelável, fragmentação, projéteis perseguidores e de retorno, drenagem, névoa, emissores, imagens, efeitos periódicos, lava, onze rodadas e placar.

Isso **não equivale a fidelidade integral do executável original**. As seguintes diferenças permanecem explícitas:

- A arena circular de 22 unidades, o cronograma de redução, as posições de pilares e o limite local de quatro jogadores são autorais. O original tem vários terrenos, modos e comandos de host.
- Dano, recargas e números visíveis por nível foram extraídos, mas nem todas as velocidades, raios e regras secundárias de cada variante foram auditadas de forma independente. Algumas famílias usam parâmetros de trajetória compartilhados, registrados como adaptação no catálogo.
- As variantes alternativas por coluna e os upgrades de Ultimate não estão implementados. Registros residuais e cosméticos dos objetos não foram anunciados como magias disponíveis.
- A rotação da curva de Arc, divisão em cinco fragmentos, espelhos simplificados, captura de Control e cura de Vector são aproximações funcionais. Há diferenças no detalhe da acumulação de veneno/queimadura, maldições, impulso e interação entre projéteis. Não há invisibilidade de rede completa em Wind Walk.
- Pilares são estáticos e destrutíveis com HP provisório. O modo original inclui física adicional de obstáculos e combos de projéteis ainda ausentes.
- O formato de placar local usa vitórias de rodada; o desempate final com rodada extra, presets competitivos, assistências e comandos de host do original não estão implementados.
- O primeiro inventário de quatro espaços e a abertura direta de seis por uma pesquisa condensam a apresentação da pesquisa de inventário original. Venda e restrições de itens foram preservadas quando verificadas; alguns modificadores secundários de vulnerabilidade e interações entre maldições e equipamentos continuam incompletos.

`tests/warlock.test.js` valida as identidades fixadas, stats, compras, exclusão de coluna, projéteis físicos, dano/recuo, reflexão, atraso de Meteor, Teleport, cancelamento da magia pessoal, inventário, lava, transição de rounds e execução finita das 26 magias compráveis. Os mapas originais não são dependência de execução dos testes.


## Auditoria de partidas públicas e maestrias

A configuração pública padrão do mapa é **11 rodadas**, **20 ouro inicial** e **10 ouro por rodada para cada participante**, incluindo derrotados. Não há ouro adicional por vitória, eliminação, assistência ou maior dano nessa configuração. O modo MGL de 10 rodadas é um preset competitivo separado, não o padrão público.

Evidência reproduzível em `outputs/warlock-reference/jass-readable.txt` da mesma versão fixada acima:

| Regra | Evidência no JASS original |
| --- | --- |
| 20 ouro inicial, 10 por rodada | globais `Ir=20`, `Rr=$A` nas linhas 230–231; reset padrão `vh`, linhas 13200–13224; guia de partidas padrão na linha 2945 |
| 11 rodadas públicas | global `lX=$B`, linha 562; início público `KH`, linhas 15206–15211; título de início automático `-11`, linha 15277 |
| 10 rodadas no MGL | preset `dh`, linhas 13510–13516 |
| Sem bônus de ouro por kill/win/dano | globais `rr=0`, `ir=0`, `nr=0`, `Vr=0`, linhas 223–227; reset `vh`; pagamento de vitória por `nr` na linha 3618 |
| Pagamento para participantes | soma de `Rr` no fechamento de rodada, linhas 18047–18049, com variantes equivalentes em outros fluxos |

As pesquisas originais `war3map.w3q` agora estão disponíveis na loja entre rodadas, sem consumir inventário:

| Pesquisa | ID | Preço inicial e incremento | Efeito por nível | Limite |
| --- | --- | --- | --- | --- |
| Duration Mastery | `R00I` | 4, +1 por nível já comprado | +8% de duração | 6 |
| Range Mastery | `R00Y` | 5, +1 por nível já comprado | +12% de alcance de projéteis | 6 |
| Life steal Mastery | `R00D` | 6, +1 por nível já comprado | cura 10% do dano e remove 5% em pontos de dano | 6 |
| Jack of all Trades | `R01E` | 13 + soma dos níveis individuais | melhora as três em um nível; economia de 2 ouro | requer as três abaixo de 6 |

Cada nível individual também soma **5% de regeneração** e reduz o recuo recebido em **2,5%**. São três níveis totais por compra de Jack. O bônus de regeneração multiplica a regeneração após equipamentos; o alcance soma as maestrias com a penalidade do Helmet antes de formar o multiplicador. A duração não altera os avisos de Meteor nem a canalização fixa da magia pessoal. Teleport e Meteor mantêm seus alcances fixos originais. Homing usa seu modificador especial de duração de voo de 1,5 vezes o bônus de alcance.

Fontes: preços e limites dos quatro objetos de pesquisa; handler JASS de pesquisas nas linhas **19650–19706**; regeneração `GE` nas linhas **5148–5151**; roubo de vida nas linhas **4310–4311**, com cura e recuperação de metade do valor em pontos de dano em `hR`, linhas **1902–1908**; alcance fixo de Teleport em `yD`, linhas **8805–8834**, e de Meteor em `wd`, linhas **7913–7928**. A cobertura de maestrias se aplica às famílias de magias implementadas; as diferenças de trajetória e interações secundárias já declaradas acima continuam válidas.
