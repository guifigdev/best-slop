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
- A rotação da curva de Arc, divisão em cinco fragmentos e espelhos simplificados são aproximações funcionais. Controle, Vetor e demais rotinas auditadas abaixo substituem as aproximações anteriores. Há diferenças no detalhe da acumulação de veneno/queimadura, maldições, impulso e interação entre projéteis. Não há invisibilidade de rede completa em Wind Walk.
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

## Auditoria de comportamento de 19/11/2026

Foi comparada a execução das famílias com o JASS da mesma revisão 1.02. As correções abaixo usam callbacks e também as regras compartilhadas de colisão e de tempo; olhar somente o callback de uma magia pode esconder filtros de equipe ou reflexões executadas por pilares.

| Família | Comportamento implementado nesta auditoria | Evidência no JASS legível |
| --- | --- | --- |
| Vínculo / Hook | Gancho ligado visualmente ao usuário durante voo e retorno. Prende mago ou pilar, mantém o elo sem timeout arbitrário de 4s e puxa o alvo, ou puxa o conjurador até o pilar. Repetir Y recolhe o gancho; depois cancela ou solta o elo mesmo durante recarga. | fF 10183–10204, IF 10048–10058, BF 10082–10100, movimento 5346–5458, NN 3207–3223 |
| Controle / Enemy cast | Orbe segue voando depois de amaldiçoar o inimigo; os feitiços do afetado passam a mirar na posição atual do orbe. Não converte os projéteis já lançados pela equipe. | QF 10359–10378, pF 10323–10344, DG 12179–12205 |
| Domo | Entidade independente, raio 180 nativos, 4s × duração e metade do movimento voluntário inicial. Reflete radialmente projéteis inimigos que entram, com metade da velocidade; não impede pessoas caminhando. | Rg 10815–10839, Og 10759–10812, filtro externo oc 5508–5510 |
| Vetor | Marca por 6s; ao ultrapassar 225 nativos redireciona o impulso para a marca, preservando sua magnitude. Cura somente acima do limiar nativo de impulso 16. | Vg/Eg 10724–10751, ng 10698–10722 |
| Deslocamento temporal | Mantém cura recebida depois da conjuração e recupera a fração original dos pontos de dano; quebra elos no retorno, não ao criar a marca. | Hg 11054–11124 |
| Drenar / Slow | Dano e lentidão em inimigos, cura/velocidade em aliados, mudança de direção no fim do primeiro trecho e cura própria entregue por um orbe que retorna sem colisões. Mantém a cura imediata adicional da maestria. | Jf 9443–9476, gf 9284–9329, Hf 9399–9433, Ff 9267–9282, lb 4270–4315 |
| Gravidade / Dark Matter | Atração até 450 nativos, dano até 250 e desvio de projéteis até 600. Velocidade 400 e vida 2,25s × alcance. Não adiciona cura integral; aplica somente a maestria de roubo de vida existente. | eF 9879–9890, zf 9840–9875, KI 2530, Mb 4317–4357 |

O pulso `te` ocorre a cada **0,18 s**, não a cada 0,1 s: `oc` incrementa um contador a cada 0,03 s e ativa `te` a cada seis passos (5252–5267, timer 5694). Vínculo e Gravidade usam esse pulso. O Vínculo tem dano maior nos primeiros instantes, reduzindo até o valor-base por pulso do catálogo. A interface mostra o dano-base por segundo como valor por pulso dividido por 0,18.

A física compartilhada também confirma que Gravidade e Drenar ricocheteiam elasticamente em pilares, preservando dono, equipe e velocidade (`kc` 6028 → `Vc` 5698–5737, `Ov=1`). O Domo não reflete projéteis aliados no padrão: o filtro externo impede que a colisão aliada alcance `Og`, apesar de `Og` não repetir o filtro.

Escudo, Ímpeto, Domo e Espelhos rompem vínculos inimigos recebidos ao conjurar, preservando o elo lançado pelo próprio jogador. Vetor rompe recebidos somente ao disparar; Deslocamento temporal rompe recebidos e o próprio elo ao retornar. A magia pessoal pode romper o Hook de um inimigo que está na lava.

O placar de encerramento ordena os pontos acumulados e mantém posições compartilhadas em empates. Os pontos continuam sendo vitórias de rodada, sem criar bônus por abates. Avatares e pontuações vêm do estado da partida.

### Limites que continuam explícitos

A auditoria percorreu as 30 famílias na implementação. As sete famílias acima receberam confronto direto com as rotinas indicadas; isso não certifica equivalência integral de todas as 30. As variantes alternativas Induction, Weaken, Force Field e Silence ainda não são opções de seleção. Permanecem aproximações já declaradas em Arc, espelhos, projéteis especiais, efeitos secundários de itens e algumas interações de maldições/colisões. Controle redireciona a mira e reduz a duração das magias durante o efeito; outros multiplicadores secundários do original não foram todos reproduzidos. Os passos variáveis do navegador também aproximam as integrações físicas originais de 0,03 s.

### Regressão de inicialização corrigida

A seleção de construções acessava `snapshot.units` durante a prévia inicial, quando ainda não existe partida. A exceção interrompia a primeira animação e deixava cenário vazio em todos os modos. O acesso passou a aceitar estado ausente. O teste de primeira renderização agora percorre prévia vazia e cada um dos seis jogos, incluindo a troca Warlock → Kodo Tag → Survival.
