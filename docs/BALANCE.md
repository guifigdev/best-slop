# Revisão de game design e balanceamento

Revisão de 17/11/2026. Esta é uma primeira passagem sobre o código e os fluxos automatizados. Não é uma afirmação de equilíbrio competitivo ou de fidelidade a um patch de Custom Hero Survival: ainda falta o `.w3x` de referência e partidas humanas comparáveis.

## Restrições preservadas

- Nenhuma fórmula, faixa, custo, limite ou ganho dos seis atributos foi alterado nesta revisão.
- Nenhuma estatística base dos seis heróis foi alterada.
- Cada nível ganho concede 1 ponto de habilidade; aprender ou melhorar custa 1 ponto, até cinco níveis por técnica. A evolução não usa ouro.
- Atributos usam `5 + floor(nível / 5)` pontos ganhos por nível. O custo considera o próximo valor **base**: até 10 custa 1 ponto; de 11 a 20 custa 2; de 21 a 30 custa 3. Equipamentos não encarecem a distribuição.
- Cleave permanece em **15/25/35/45/55%**, por decisão do usuário. Esses números ainda não foram conferidos no mapa CHS.

## Ajustes aplicados

| Elemento | Antes | Agora | Motivo |
|---|---|---|---|
| Pisada sísmica | Stun PvE 3/4/5/6/7s; heróis 2/3/4/5/6s; recarga 6s | Stun PvE 2/2,5/3/3,5/4s; heróis 1/1,25/1,5/1,75/2s; recarga 8s | Impedir que uma única técnica mantenha o alvo permanentemente atordoado. Dano e alcance foram preservados. |
| Luz restauradora | Cura 200/400/600/800/1000; 65 mana; recarga 5s | Cura 200/350/500/650/800; 65/70/75/80/85 mana; recarga 8s | Criar uma janela de contra-ataque e reduzir a vantagem de sustentar a própria vida em todo tipo de build. |
| Impacto atordoante | Chance 20/30/40/50/60%; stun 2s, heróis 1s | Chance 15/18/21/24/27%; stun 0,9s, heróis 0,35s | Alta velocidade de ataque não deve equivaler a controle contínuo de heróis. O dano extra de 25 foi mantido. |
| Vampirismo | 15/30/45/55/65% | 10/15/20/25/30% | Reduzir sustentação obrigatória e preservar espaço para cura, poções e defesa. |
| Máscara da morte | 50% roubo de vida, 650 ouro | 20% roubo de vida, 650 ouro | Continuar sendo a opção de sustentação de ataques à distância sem alcançar sozinha a força da passiva corpo a corpo melhorada. Estoque raro de uma unidade preservado. |
| Golpe crítico | Multiplicadores 2/3/4/5/6× | 2/3/4/4,5/5× | Preservar a base clássica nos níveis 1–3 e moderar a interação dos níveis adicionais com chance crítica de LUK/equipamentos. Chance da skill permanece 15%. |
| Fervor | Movimento 10/20/30/40/50% | 10/20/30/35/40% | Moderar perseguição e fuga nos níveis extras. Velocidade de ataque preservada. |
| Espinhos | Reflexão 10/20/30/40/50% | 10/20/30/35/40% | Moderar o custo imposto às builds corpo a corpo nos níveis extras. |
| Presas de musgo | 4/7/10/13/16 dano por segundo | 4/8/12/18/24 dano por segundo | Dar uma progressão mais útil à opção de dano persistente, sem acumular veneno de um mesmo portador no alvo. |
| Coroa dos seis clãs | +5 nos seis atributos por 700 ouro | Mesmo efeito por 850 ouro | Cobrar o prêmio de versatilidade e dos vários marcos de atributo ativados ao mesmo tempo. |

O catálogo mantém as fontes históricas como **origem**. Técnicas alteradas possuem `balanceNote`, exibida na descrição: os números atuais de Pisada, cura, Bash e Vampirismo não devem ser apresentados como valores idênticos aos da Blizzard. Storm Bolt mantém 100/225/350 nos três primeiros níveis; o crítico mantém 2/3/4× nesses níveis.

## Comparações verificáveis no código

- A Pisada de nível 5 tinha 6s de stun em heróis para recarga de 6s. Agora aplica 2s em uma recarga de 8s. Isso deixa uma janela de reação contra **um portador isolado**; equipes ainda podem coordenar controles.
- Com 30 INT e sem outros modificadores, a cura de nível 5 passou de `1000 × 1,75 / 5 = 350` para `800 × 1,75 / 8 = 175` de vida por segundo teórica, antes de considerar falta de mana ou cura desperdiçada.
- Vampirismo máximo com Máscara antes atingia o limite de 80% de roubo de vida. A combinação com a Máscara básica agora soma 50%; com a Máscara evoluída ao nível 5, soma 70%. O limite do cálculo de atributos não foi alterado.
- A descrição agora informa duração de stun em heróis, ricochetes, alcance de deslocamento, empurrão, puxão e veneno por segundo, para permitir comparar escolhas antes de gastar o ponto.

## Direção das builds

- **Corpo a corpo ofensivo:** Cleave para grupos; crítico para alvo único; Vampirismo mantém combate prolongado, com menor proteção contra explosões de dano.
- **Distância:** ricochete recompensa inimigos próximos; DEX e posicionamento sustentam o dano; Máscara ocupa um espaço e ouro que poderiam ir para ataque ou mobilidade.
- **Mago de área:** INT amplifica dano e cura; Nevasca exige ficar canalizando, enquanto Cometa oferece explosão e recarga. Mobilidade e paredes permitem disputar o tempo de canalização.
- **Defensor:** VIT, armadura, Espinhos e barreiras protegem; precisam de colegas ou de uma segunda técnica para concluir provas em bom tempo.
- **Controle e terreno:** Blink, troca, repulsão, laço e gravidade devem criar decisões de posicionamento; lava, gelo e armadilhas são parte do risco para ambos os lados.

São intenções de design, não tiers comprovados. Não houve redução de dano por trocar o herói ou por escolher determinado atributo.

## Validação e riscos restantes

Foram executados os testes de simulação e novas técnicas após os ajustes: **26 passaram**, incluindo uma campanha completa de 50 ondas com bots, nove bônus, cinco temas e uma final real. Esse teste confirma que a campanha segue concluível pela IA existente; não mede dificuldade para um jogador novo.

Pontos para os próximos playtests:

1. Medir taxa de escolha e vitória por técnica, tempo para concluir cada prova, tempo efetivamente atordoado e uso de mana/poções. A mesma build pode ter desempenho diferente em PvE isolado, cooperação e guerra.
2. Avaliar coordenação de múltiplos controles. Esta passagem evita loops de controle de um único portador, mas não implementa resistência progressiva ou imunidade temporária; essas seriam regras novas a discutir se os testes mostrarem necessidade.
3. Testar terreno procedural por posição inicial. Cada equipe precisa de caminhos e oportunidades comparáveis, sem aparecer sobre perigos ou obstáculos.
4. Testar pontuação em equipes: vida, falhas, distribuição de XP e desempates devem ter regras previsíveis. A inteligência dos bots ainda compra uma sequência fixa, por isso campanhas automáticas não demonstram diversidade real.
5. Avaliar economia depois da troca para pontos de habilidade. O ouro agora se concentra em equipamentos/consumíveis; preços de fim de jogo e estoque para 25 jogadores precisam de partidas humanas, sem alterar a distribuição de atributos.
6. Publicação do cliente não hospeda o servidor multiplayer. Matchmaking local deve ser validado com parties reais; autenticação, reconexão, proteção contra abuso e testes de carga continuam necessários antes de competição pública.

Esta revisão não muda as fórmulas dos atributos para compensar equipamentos ou técnicas fortes; ajustes futuros devem continuar acontecendo nos efeitos, percentuais, recargas, preços, estoque e encontros.

## Evolução de equipamentos

Equipamentos possuem **cinco níveis**. O exemplar comprado começa no nível 1 e cada melhoria conserva seu espaço no inventário. Melhorias exigem ouro e mercado aberto; não compram outro exemplar, não consomem estoque adicional e não utilizam pontos de habilidade. Poções permanecem no nível 1 e não evoluem. A validação dessas regras pertence à simulação; o catálogo fornece os valores e preços compartilhados para servidor e interface.

Os bônus básicos em `ITEMS` permanecem iguais. A função `itemAt(key, level)` retorna uma cópia independente com os bônus do nível solicitado; também produz uma descrição com os valores atualizados. Nível normalizado entre 1 e 5, poção sempre nível 1, chave desconhecida retorna `null`. `itemUpgradePrice(key, current)` informa o preço do nível atual para o próximo; retorna `null` para nível 5, consumíveis, chave desconhecida ou nível inválido.

| Bônus do equipamento | Níveis 1 / 2 / 3 / 4 / 5 |
|---|---|
| Atributos do equipamento | Valor base × 1 / 1,35 / 1,7 / 2,05 / 2,4; arredondado para inteiro |
| Dano, mana, vida, armadura e mana/s | Valor base × 1 / 1,3 / 1,65 / 2,05 / 2,5; dano, mana e vida arredondados para inteiro |
| Velocidade de ataque, movimento e esquiva comum | Valor base × 1 / 1,2 / 1,4 / 1,6 / 1,8 |
| Máscara: roubo de vida | 20 / 25 / 30 / 35 / 40% |
| Talismã: chance crítica direta | 10 / 12 / 14 / 16 / 18% |
| Talismã: multiplicador crítico mínimo | 2 / 2,1 / 2,2 / 2,3 / 2,4×; usa o maior multiplicador da build, sem multiplicá-los entre si |
| Resistência de broche/cachecol | 50 / 60 / 70 / 80 / 90% |

O preço de cada melhoria é o preço base do item multiplicado por **0,60 / 0,90 / 1,25 / 1,65**, respectivamente para 1→2, 2→3, 3→4 e 4→5, arredondado para inteiro. O custo total do exemplar no nível máximo fica próximo de 5,4 vezes seu preço básico. Exemplos:

| Equipamento | Compra | Melhorias 1→2 / 2→3 / 3→4 / 4→5 | Bônus no nível 5 |
|---|---|---|---|
| Garras de ataque | 220 | 132 / 198 / 275 / 363 | +23 dano físico |
| Máscara da morte | 650 | 390 / 585 / 813 / 1.073 | 40% roubo de vida |
| Coroa dos seis clãs | 850 | 510 / 765 / 1.063 / 1.403 | +12 nos seis atributos |
| Cachecol polar | 350 | 210 / 315 / 438 / 578 | +7 INT; 90% resistência de frio/lentidão ambiental |

A escolha é entre comprar outro equipamento disponível, reservar um espaço para poção ou investir mais ouro no exemplar atual. A evolução oferece maior eficiência por espaço e não contorna a disputa pelo estoque inicial. As curvas de bônus de equipamentos não alteram o custo de distribuir pontos nem as fórmulas dos atributos do herói. Limites de resistência, roubo de vida e crítico acima se referem ao bônus de um exemplar; somas de equipamentos continuam sujeitas às regras de acúmulo e limites da simulação.

Os preços são um ponto de partida para testes. Precisam ser comparados com ouro realmente acumulado por modo, não apenas com o poder do item isolado. Melhorias de estoque já adquirido também precisam ser atômicas no servidor para impedir gasto duplicado ou upgrades fora do mercado.

## Encantamentos de armas

A forja aceita apenas **Garras de ataque, Arco do horizonte e Cajado das estrelas**. Cada espaço de arma guarda um encantamento; substituir o anterior exige pagar novamente. O encantamento acompanha o nível da arma, sem uma segunda árvore de níveis nem pontos de habilidade. Compra/substituição acontece no mercado e a venda continua sendo uma ação explícita do inventário.

O catálogo `shared/enchantments.js` exporta `ENCHANTMENTS`, `isEnchantable(key)`, `enchantAt(key, level)` e `enchantPrice(key, itemLevel)`. Os efeitos retornam nome, descrição com valores atuais, preço básico, cor CSS, chave, nível, dano por segundo e duração; frost também retorna `slow: 0.45`. Chaves de encantamento desconhecidas retornam `null`; o nível é normalizado de 1 a 5. `isEnchantable` não aceita consumíveis, armaduras ou acessórios.

| Encantamento | Dano/s nos níveis 1 / 2 / 3 / 4 / 5 | Duração | Preço para arma nos níveis 1 / 2 / 3 / 4 / 5 |
|---|---|---|---|
| Brasa viva — fogo | 6 / 9 / 12 / 15 / 18 | 4s | 300 / 375 / 450 / 525 / 600 |
| Geada breve — gelo | Sem dano direto | Frost de 45% por 0,6 / 0,7 / 0,8 / 0,9 / 1s | 450 / 563 / 675 / 788 / 900 |
| Peçonha de musgo — veneno | 4 / 6 / 8 / 10 / 12 | 5s | 260 / 325 / 390 / 455 / 520 |

Os preços seguem o custo básico multiplicado por **1 / 1,25 / 1,5 / 1,75 / 2**, arredondado para inteiro. Encantar cedo custa menos; melhorar a arma também evolui seu encantamento. O investimento de upgrade do equipamento já paga esse crescimento. O custo de substituir continua usando o nível atual da arma.

Regras para a simulação:

- Aplicação garantida em **acerto primário** que não foi evitado; um Miss ou esquiva perfeita não aplica o efeito.
- Cleave, ricochetes e outros danos secundários não geram outra aplicação. Crítico não duplica nem multiplica o dano do encantamento.
- No máximo uma aplicação por tipo por ataque do herói. Várias armas do mesmo tipo de encantamento usam o efeito mais forte, em vez de somar cópias.
- Fogo e veneno renovam sua duração sem acumular instâncias do mesmo tipo no alvo. Tipos distintos podem coexistir. Renovação não deve apagar o próximo pulso e impedir o DoT de causar dano durante ataques rápidos.
- O DoT não escala com INT, STR, multiplicador crítico ou roubo de vida. Resistências e imunidades compatíveis continuam pertencendo às regras de dano do jogo.
- Gelo usa a mesma intensidade de frost já existente, com duração curta. Não soma outra redução de movimento sobre frio ambiental. É o encantamento mais caro porque ataques rápidos podem manter sua duração renovada.

O fogo oferece maior dano por segundo; o veneno custa menos e persiste um segundo a mais, útil para trocar de alvo. Gelo troca dano por controle e exige avaliar fugas, perseguição e ataques à distância em partidas humanas. Nenhuma fórmula ou regra de distribuição de atributos foi alterada para esta forja.

## Equipamentos com efeitos de combate

Quatro equipamentos originais adicionam efeitos implementados pela simulação, em vez de apenas atributos. As inspirações são papéis conhecidos de itens de Dota/Warcraft III; nomes, preços, percentuais, alcances e progressão abaixo são próprios. Referências históricas primárias para os conceitos: [Valve — atualização 6.84](https://www.dota2.com/684/?l=english), com Radiance Burn, Damage Return e Restore; [Valve — Mistwoods](https://www.dota2.com/mistwoods?l=english), com Chain Lightning de Maelstrom. Essas fontes históricas não representam valores atuais de Dota nem uma promessa de equivalência ao original.

| Item | Inspiração | Compra / estoque | Bônus básicos | Efeito nos níveis 1 / 2 / 3 / 4 / 5 |
|---|---|---|---|---|
| Lâmina do sol errante (`solar`) | Radiance | 1.300 ouro / 1 | +18 ATQ físico | Aura de fogo 12 / 18 / 24 / 30 / 36 dano/s; raio 3,5 / 3,75 / 4 / 4,25 / 4,5m |
| Bobina da tormenta (`stormcoil`) | Maelstrom | 1.200 ouro / 1 | +9 ATQ físico; +10% velocidade de ataque | 25% de chance no acerto primário; dano inicial 35 / 48 / 62 / 76 / 90; até 3 / 3 / 4 / 4 / 5 alvos únicos, incluindo o alvo inicial; 5m por salto e perda de 20% de dano por salto |
| Couraça do contragolpe (`mirror`) | Blade Mail | 850 ouro / 1 | +4 armadura; +6 ATQ físico | Ativar: 35 / 40 / 45 / 50 / 55% de reflexão por 4s, recarga 25s, sem custo de mana |
| Relicário do recomeço (`restoration`) | Mekansm | 1.000 ouro / 1 | +2 armadura; +0,5 mana/s | Ativar: cura 150 / 225 / 300 / 375 / 450 vida do portador e aliados em 6m; recarga 30s, 75 mana |

`shared/equipment-effects.js` exporta `equipmentEffectAt(itemKey, level)`. A chave corresponde ao item do catálogo. O retorno contém `key`, `level`, `name`, `type`, `description` e somente os campos usados pelo efeito; nunca campos com valor `undefined`. Tipos: `aura`, `proc`, `active`. Chave desconhecida retorna `null`; nível é normalizado de 1 a 5. O catálogo usa essa função para manter a descrição dos equipamentos evoluídos coerente com seus efeitos. As melhorias de ouro e bônus de estatística seguem as mesmas curvas dos outros equipamentos.

Decisões para integração e testes:

- A aura solar causa dano contínuo por segundo apenas em fases de combate, contra alvos válidos do portador. Deve obedecer ao isolamento entre provas e às imunidades/resistências de fogo compatíveis, sem escalar com INT. Cópias no mesmo herói usam o nível mais forte; auras de heróis diferentes precisam de uma política explícita de acúmulo para não tornar o empilhamento obrigatório.
- A Bobina só testa chance depois de um acerto primário real. Miss, esquiva perfeita, Cleave, ricochetes, DoT e o próprio relâmpago não geram novos testes. Cada alvo é atingido no máximo uma vez por corrente. O dano secundário não gera outro crítico, encantamento ou roubo de vida.
- A Couraça reflete parte do **dano efetivamente recebido**, incluindo dano mágico de inimigos. Dano absorvido integralmente pela barreira não deve gerar reflexão; ambiente e outras reflexões não retornam dano. Isso evita ciclos de reflexão entre dois defensores. Não adiciona reflexão passiva permanente.
- O Relicário cura aliados vivos e o próprio portador, sem ressuscitar ou amplificar a cura por INT. É uma ação do inventário, não uma habilidade que ocupa um dos sete espaços. Em provas isoladas, não pode curar heróis de outra prova.
- A recarga dos ativos deve ser compartilhada por tipo de item no mesmo herói e não pode ser renovada comprando, vendendo ou melhorando uma cópia. Usar duas couraças ou relicários não deve contornar a janela de recarga.
- Os dois equipamentos ofensivos custam mais que os 1.100 de ouro iniciais, exigindo guardar ouro antes de acessar seus efeitos em área. O Relicário prioriza cooperação e consome mana; a Couraça exige acertar o momento da ativação, com apenas 4s de efeito em uma recarga de 25s.

Os quatro efeitos acrescentam decisões de posicionamento, alvo e tempo de ativação. O efeito solar não acrescenta automaticamente cegueira, os raios não aplicam todos os modificadores de ataque e o Relicário não adiciona uma aura extra de regeneração: essas diferenças fazem parte desta adaptação. Não houve alteração em atributos, distribuição de pontos ou estatísticas básicas dos heróis.

## Técnicas de monstros, projéteis e fúria

O catálogo passa de 31 para **40 técnicas**, todas com cinco níveis. Seis possuem `dropOnly: true`: Sopro da quimera, Névoa da hidra, Mergulho da tempestade, Pele de monólito, Rugido soberano e Investida do rinoceronte. A aquisição inicial depende do drop correspondente e não deve aparecer como compra normal indiscriminada. Descoberta, entrega do drop e aprendizagem são validadas pela simulação; a marca do catálogo é a mesma para servidor e interface. A evolução continua custando o ponto de habilidade universal, sem alterar atributos ou cobrar ouro por nível da técnica.

As três técnicas adicionais de uso normal são Esfera de repulsão, Orbe de inverno e Fúria rubra. As duas primeiras reinterpretam a disputa de posicionamento por projéteis de Warlock, com nomes, efeitos e números próprios. Não são uma importação das fórmulas de um patch do mapa original.

| Chave / técnica | Efeito nos níveis 1 / 2 / 3 / 4 / 5 | Recurso e recarga |
|---|---|---|
| `flamebreath` — Sopro da quimera | 90 / 140 / 190 / 240 / 290 dano mágico em cone; queimadura de 6 / 9 / 12 / 15 / 18 dano/s por 4s; alcance 5 / 5,5 / 6 / 6,5 / 7m | 75 mana; 10s |
| `venomcloud` — Névoa da hidra | Nuvem de 5s; 10 / 15 / 20 / 25 / 30 dano/s em raio de 2,4 / 2,6 / 2,8 / 3 / 3,2m | 85 mana; 16s |
| `stormdive` — Mergulho da tempestade | Deslocamento de 4 / 5 / 6 / 7 / 8m; impacto elétrico de 65 / 95 / 125 / 155 / 185 dano em raio de 2,7m; stun de 0,6s em monstros e 0,35s em heróis | 65 mana; 11s |
| `stonehide` — Pele de monólito | +3 / 4,5 / 6 / 7,5 / 9 armadura do portador, sem aura ou segunda camada de redução de dano | Passiva |
| `battlecry` — Rugido soberano | +20 / 30 / 40 / 50 / 60% dano dos ataques físicos por 6s, sem bônus de velocidade | 65 mana; 18s |
| `hornrush` — Investida do rinoceronte | Deslocamento de 4 / 5 / 6 / 7 / 8m; impacto de 55 / 85 / 115 / 145 / 175 dano em raio de 1,8m; empurrão de 1,5 / 1,75 / 2 / 2,25 / 2,5m; stun de 0,8s em monstros e 0,4s em heróis | 55 mana; 10s |
| `warlockfire` — Esfera de repulsão | Projétil de fogo: 100 / 150 / 200 / 250 / 300 dano; empurrão de 2,5 / 3 / 3,5 / 4 / 4,5m no primeiro inimigo atingido | 70 mana; 7s |
| `warlockfrost` — Orbe de inverno | Projétil de gelo: 55 / 85 / 115 / 145 / 175 dano; frost de 45% por 1 / 1,25 / 1,5 / 1,75 / 2s no primeiro inimigo atingido | 60 mana; 8s |
| `rage` — Fúria rubra | +10 / 15 / 20 / 25 / 30% dano dos ataques físicos e +10 / 15 / 20 / 25 / 30% velocidade de ataque por 7s | 80 mana; 20s |

Contrato dos campos para a simulação:

- `flamebreath.radius` é o alcance máximo do cone, e `cone: 0.7` seu meio-ângulo em radianos. `burn` é o dano base por segundo; `duration: 4` é a duração da queimadura. A direção vem do ponto clicado, sem transformar a técnica em um círculo distante.
- `venomcloud.damage` é dano base por segundo durante `duration`, dentro de `radius`; não é o dano total instantâneo da nuvem.
- `stormdive` e `hornrush` usam `distance` para limitar o deslocamento e `radius` para a área de impacto. Obstáculos e limites da prova continuam valendo; empurrão não permite atravessar paredes.
- `warlockfire` usa `projectileSpeed: 12`, `radius: 0.5` e `distance: 14`; `warlockfrost` usa `projectileSpeed: 11`, `radius: 0.55` e `distance: 14`. Aqui o raio representa a colisão do projétil. Ambos são esquiváveis, respeitam obstáculos e terminam no primeiro alvo válido, sem acertar instantaneamente o ponto clicado.
- As fúrias usam `rageDamage` e `rageSpeed`, como frações adicionais, mais `duration`. Rugido soberano tem `rageSpeed: 0`. Não somar duas fúrias nem permitir ativar uma segunda apenas para renovar recarga ou multiplicar o mesmo bônus.
- O frost do Orbe usa a intensidade ambiental existente e não cria outra lentidão cumulativa. Os bônus de velocidade da Fúria respeitam o limite de velocidade de ataque já existente.

Direção de balanceamento: Pele de monólito oferece mais armadura própria que Devoção, que permanece útil por proteger aliados; Rugido prioriza dano por golpe e Fúria combina dano e velocidade; projéteis permitem desviar e exigem boa mira; nuvem e cone premiam posicionamento. Atordoamentos curtos nos deslocamentos evitam criar mais uma fonte de controle permanente. Esses números precisam de testes de partidas humanas, em especial quando vários drops raros chegam à mesma equipe. Atributos, seus custos, marcos e ganhos por nível permanecem intactos.

## Fauna alada e especializações elementais

O bestiário contém **11 espécies especiais**, preservando o leão, rinoceronte, grifo, quimera, dragão e esfinge. Cinco acréscimos ampliam a leitura de distância, voo e elemento. As criaturas e descrições são originais; valquíria e grifo remetem a arquétipos de fantasia familiares a Ragnarok e Warcraft, sem reproduzir sprites, fórmulas ou estatísticas desses jogos. Nenhuma habilidade nova foi adicionada: os drops reutilizam o catálogo existente de 40 técnicas.

| Espécie | Primeira onda | Tipo / altura | Alcance de ataque | Técnica e drop | Resistência / fraqueza elementais |
|---|---|---|---|---|---|
| Harpia dos ventos frios (`harpy`) | 9 | Voadora / 1,4m | 4m | Orbe de inverno | Vento +20% resistência; eletricidade −15% resistência |
| Coruja valquíria do trovão (`valkyrie`) | 18 | Voadora / 1,7m | 5m | Mergulho da tempestade | Eletricidade +25%; veneno −15% |
| Fênix da alvorada (`phoenix`) | 23 | Voadora / 1,8m | 5m | Esfera de repulsão | Fogo +25%; gelo −20% |
| Serpente alada da geada (`frostwyrm`) | 30 | Voadora / 1,8m | 5m | Orbe de inverno | Gelo +25%; fogo −20% |
| Basilisco das raízes (`basilisk`) | 14 | Terrestre / 0m | 3m | Névoa da hidra | Veneno +25%; fogo −15% |
| Grifo das tempestades — atualizado | 12 | Voador / 1,3m | 4m | Mergulho da tempestade | Eletricidade +20%; gelo −15% |
| Dragão das brasas — atualizado | 25 | Voador / 1,6m | 5m | Sopro da quimera | Fogo +25%; gelo −20% |

O leão, rinoceronte, quimera e esfinge permanecem terrestres. Seus multiplicadores de vida, dano, armadura e ondas de entrada foram preservados. Grifo e dragão conservam vida, armadura e ondas de entrada anteriores, acrescentando voo, alcance e especialização. Os ataques básicos elementais receberam uma calibração própria, pois ignorar armadura física aumenta bastante a ameaça contra heróis com equipamentos defensivos. Não foram reduzidas suas habilidades, vida ou resistências.

| Especial elemental | Multiplicador de vida | Multiplicador de dano básico calibrado |
|---|---|---|
| Harpia | 0,95 | 0,65 |
| Grifo | 1,30 | 0,65 |
| Basilisco | 1,20 | 0,65 |
| Valquíria | 1,20 | 0,65 |
| Fênix | 1,20 | 0,65 |
| Dragão | 1,65 | 0,70 |
| Serpente alada | 1,45 | 0,70 |

Antes dessa calibração, a campanha automatizada com quatro bots terminou em derrota na onda 47: os heróis tinham cerca de 22–32 de armadura, que reduz dano físico por um fator de 2,32–2,92, mas não protegiam contra os novos ataques mágicos. Manter multiplicadores básicos de 0,95–1,20 ao mesmo tempo em que se adiciona voo e alcance aumentava três dimensões da ameaça de uma vez. Uma primeira redução para 0,65–0,80 deixou 24 inimigos vivos na derrota da onda 47, contra cerca de 50 antes. A redução final para 0,65, mantendo dragão e serpente alada em 0,70, permitiu à mesma campanha concluir as 50 ondas e a final em aproximadamente 39,4 minutos simulados. Isso compensa parte da diferença sem trocar as fórmulas de armadura, adicionar resistência geral aos heróis ou remover a identidade elemental. Uma execução de bots não estabelece a dificuldade ideal para humanos.

Depois da integração da IA que caminha até os NPCs de equipamentos, encantamentos e melhorias, o teste completo da campanha foi executado novamente e passou: 50 ondas, nove desafios bônus, cinco temas, dez visitas ao mercado e um único vencedor na final. Portanto, a conclusão automatizada não depende de ignorar distância de compra ou gastar ouro fora do comerciante adequado. Isso valida o fluxo integrado; a dificuldade humana e a justiça competitiva ainda exigem playtests.

Contrato compartilhado com a simulação:

- Cada espécie tem `flying` e `altitude`. `range` só substitui o alcance padrão quando definido. `element` identifica os ataques básicos elementais e a especialização; não deve converter também habilidades físicas neutras em dano de outro elemento.
- `resistances` usa chaves `fire`, `ice`, `lightning`, `poison` e `wind`. Valor positivo reduz o dano daquele elemento; valor negativo representa fraqueza, por exemplo `ice: -0.2` significa receber 20% a mais de dano de gelo. Ausência da chave significa resistência neutra.
- São modificadores da criatura, separados dos equipamentos do herói e aplicados uma vez por fonte elemental. A integração deve evitar aplicar duas vezes resistência de equipamento ou aumentar dano físico neutro apenas porque o monstro tem um elemento.
- Voo precisa ser simulado, além de desenhado. A implementação deve distinguir terrenos que exigem contato com o solo de regiões frias, clima, projéteis e ataques que ainda alcançam o alvo. Limites do campo e isolamento entre provas continuam valendo.
- Os campos `skill` e `preferredDropSkill` indicam a preferência da espécie; o conjunto efetivamente sorteado pode variar conforme as regras de loadout descritas adiante. O drop deve corresponder a uma técnica que o monstro realmente possuía, sem uma segunda técnica oculta fora das 40 existentes. A fênix não recebe ressurreição implícita pelo nome.

`monsterKind` continua deixando **55% da faixa de seleção** para a fauna anterior e usando os 45% restantes para espécies especiais liberadas. O crescimento do bestiário não transforma toda onda em uma onda de voadores. Chefes preferem o conjunto `mythic` disponível, agora incluindo as cinco novidades, além de grifo, quimera, dragão e esfinge; antes do primeiro mítico, leão e rinoceronte continuam elegíveis como antes. A mistura preserva míticos terrestres — basilisco, quimera e esfinge — junto aos alados. Todos os seis especiais anteriores permanecem no catálogo e no conjunto de ondas normais.

Não foi adicionada imunidade elemental. As resistências de 20–25% e fraquezas de 15–20% incentivam trocar técnicas ou alvo sem invalidar uma build inteira. Ainda são necessárias partidas humanas para avaliar alcance de ataques corpo a corpo contra voadores, segurança acima de obstáculos, duração real das perseguições e diferença entre o dano visual e o efetivamente aplicado. Atributos e sua progressão permanecem inalterados.

## Mercado com NPCs e livros de experiência

O mercado passa a usar cinco prestadores de serviço físicos e uma configuração compartilhada em `shared/shops.js`. Isso permite que cenário, interface e servidor consultem os mesmos nomes, posições e raios de interação.

| Serviço / chave | NPC / aparência | Posição | Atividade |
|---|---|---|---|
| `equipment` — Arsenal dos seis clãs | Brás / capivara (`knight`) | X −10, Z −10,8 | Comprar equipamentos |
| `consumables` — Botica de Cora | Cora / coelha (`mage`) | X −5, Z −10,8 | Comprar poções e consumíveis comuns |
| `books` — Biblioteca de Orfeu | Orfeu / coruja (`owl`) | X 0, Z −10,8 | Comprar livros de experiência |
| `smith` — Forja de Nico | Nico / guaxinim (`raccoon`) | X 5, Z −10,8 | Melhorar equipamentos existentes |
| `enchanter` — Ateliê de Faísca | Faísca / raposa (`ranger`) | X 10, Z −10,8 | Encantar armas existentes |

Todos usam raio de interação de **2,7m**. O destino sugerido de aproximação é o mesmo X com **Z −8,8**, voltado para a arena, a 2m do NPC. Os cinco podem receber vendas; comprar, melhorar ou encantar continua dependendo do serviço adequado, da fase, da distância e da validação do servidor. Um comando inválido não deve cobrar ouro nem remover o item.

Contrato dos helpers:

- `shopForItem(itemKey)` retorna o **id do serviço**, como string: `books` se o item concede XP, `consumables` para outros consumíveis e `equipment` para equipamentos; chave desconhecida retorna `null`.
- `shopCanSell(shopId)` retorna `true` para qualquer um dos cinco NPCs conhecidos e `false` para uma chave desconhecida.
- `shopPosition(shopId)` retorna uma cópia `{ x, z, range }`, ou `null` se o serviço não existe. A posição é a do NPC, não o destino de aproximação. Alterar essa cópia não altera a configuração compartilhada.

Dois livros ampliam o uso de ouro sem modificar a regra de progressão:

| Item / chave | Preço | Estoque por visita | Efeito |
|---|---|---|---|
| Caderno do aprendiz (`xpbook`) | 350 ouro | 3 | +80 experiência |
| Tomo das grandes provas (`epicbook`) | 900 ouro | 1 | +200 experiência |

Ambos são `consumable: true`, ocupam o inventário e só podem ser utilizados durante a preparação/mercado. Não recebem melhorias ou encantamentos e não acionam nem dependem da recarga de poções. Consumir uma carga concede XP pela função normal da simulação: se o total cruzar o requisito do nível, os mesmos pontos de habilidade e de atributo já definidos são concedidos. Os livros não distribuem pontos diretamente e não alteram requisitos de XP, custos de atributos ou marcos de bônus.

O Caderno custa 4,375 ouro por XP; o Tomo, 4,5. O livro maior oferece mais XP em um exemplar e tem estoque raro, sem ser mais eficiente em ouro. Comprar XP disputa o orçamento com equipamento, poções, melhorias e encantamentos. O estoque compartilhado pode favorecer quem compra cedo; precisa de playtests para avaliar se o ganho de níveis no mercado inicial cria vantagem excessiva em modos competitivos. A configuração não adiciona venda automática nem teletransporte até o comerciante.

## Perfis de combate e conjuntos de técnicas dos monstros

A fauna comum recebe **12 perfis próprios** em `MONSTER_PROFILES`, com nome, tamanho, movimento, intervalo entre ataques, precisão, esquiva, crítico e multiplicador de ataque. Os 11 especiais em `MONSTERS` também recebem movimento, intervalo, precisão, esquiva e crítico. Os dados anteriores de voo, altura, elemento, resistência, vida, armadura, progressão e dano especial foram preservados; o novo perfil não deve multiplicar novamente `damageMultiplier` de um especial.

| Fauna comum | Movimento (m/s) | Intervalo (s) | Multiplicador ATQ | Precisão | Esquiva | Crítico / multiplicador |
|---|---|---|---|---|---|---|
| Pintinho (`goblin`) | 3,4 | 1,25 | 0,85 | 82% | 3% | 2% / 1,6× |
| Pato (`duck`) | 2,8 | 1,5 | 1,05 | 90% | 2% | 2% / 1,6× |
| Sapo (`frog`) | 3,2 | 1,6 | 0,90 | 85% | 8% | 0% / 1,6× |
| Lebre (`hare`) | 4,7 | 0,95 | 0,80 | 80% | 16% | 6% / 1,7× |
| Javali (`brute`) | 2,3 | 1,9 | 1,20 | 88% | 0% | 8% / 2× |
| Carneiro (`ram`) | 3,2 | 1,65 | 1,10 | 87% | 2% | 5% / 1,8× |
| Morcego (`bat`) | 4,2 | 1,7 | 0,80 | 80% | 13% | 2% / 1,6× |
| Cágado (`tortoise`) | 1,85 | 1,9 | 1,15 | 90% | 0% | 0% / 1,6× |
| Ouriço (`hedgehog`) | 2,6 | 1,3 | 0,85 | 87% | 7% | 3% / 1,6× |
| Urso campeão (`champion`) | 2,5 | 1,7 | 1,15 | 93% | 3% | 10% / 2× |
| Lobo (`wolf`) | 4,8 | 0,8 | 0,90 | 88% | 10% | 6% / 1,7× |
| Eco de prova (`bonus`) | 1,8 | 1,8 | 0,75 | 75% | 0% | 0% / 1,6× |

O multiplicador ATQ incide uma única vez sobre o dano base da onda. Não foi adicionado outro multiplicador de vida aos perfis comuns: as diferenças de vida e armadura já existentes da onda continuam valendo. Os perfis de lobo e Eco são padrões; um lobo invocado com estatísticas explícitas pela habilidade deve preservar os dados da invocação, sem perder os bônus de nível dos Espíritos lobos.

As diferenças trocam vantagens em vez de aumentar todas as estatísticas: a lebre ataca e corre rápido, mas tem dano por golpe menor e só 80% de precisão; o javali causa golpes mais fortes, porém espaçados; o cágado se move lentamente; o morcego paga esquiva e mobilidade com dano menor. Críticos continuam obedecendo às regras já existentes de acerto e esquiva perfeita do alvo, sem alterar qualquer atributo do herói.

| Especial | Movimento (m/s) | Intervalo (s) | Precisão | Esquiva | Crítico / multiplicador |
|---|---|---|---|---|---|
| Leão | 3,8 | 1,55 | 90% | 3% | 8% / 1,9× |
| Rinoceronte | 2,7 | 1,9 | 88% | 0% | 10% / 2,1× |
| Grifo | 4,2 | 1,8 | 87% | 12% | 5% / 1,7× |
| Quimera | 2,8 | 1,7 | 90% | 2% | 5% / 1,8× |
| Dragão | 2,9 | 1,9 | 92% | 1% | 10% / 2× |
| Esfinge | 2,2 | 1,9 | 94% | 0% | 4% / 1,8× |
| Valquíria | 3,9 | 1,65 | 93% | 9% | 8% / 1,9× |
| Harpia | 4,6 | 1,7 | 82% | 18% | 3% / 1,6× |
| Fênix | 4,1 | 1,7 | 88% | 10% | 7% / 1,8× |
| Serpente alada | 3,1 | 1,9 | 90% | 4% | 6% / 2× |
| Basilisco | 2,8 | 1,8 | 90% | 3% | 4% / 1,7× |

O dano básico elemental calibrado em 0,65–0,70 continua valendo. A maioria desses ataques usa intervalos de 1,65–1,9s, compensando a adição de esquiva e crítico e mantendo janelas de resposta. Não foi criado bônus automático de dano por nível além do crescimento da onda já existente.

### Quantidade, nível e sorteio de habilidades

`monsterLoadout(kind, level, boss, random)` retorna objetos novos com `{ level, rank, rarity, skills, skillLevels }`. Não altera o catálogo nem usa `Math.random`: recebe a função aleatória da simulação. Um retorno pode ser modificado pelo chamador sem afetar os próximos sorteios. O nível é um número final fornecido pelo servidor — a função não acrescenta novamente os bônus de chefe.

- **Normal:** fauna comum sem sinal de chefe recebe zero técnicas.
- **Especial:** uma das 11 espécies especiais recebe uma técnica.
- **Chefe ou minichefe:** recebe `min(5, 1 + floor(nível / 15))` técnicas únicas. Assim, níveis 1–14 têm uma, 15–29 têm duas, 30–44 têm três, 45–59 têm quatro e, a partir de 60, cinco.
- **Nível das técnicas:** `clamp(1 + floor((nível − 1) / 10), 1, 5)`. Níveis de monstro 1–10 usam técnicas de nível 1; 11–20 usam nível 2; 21–30 usam nível 3; 31–40 usam nível 4; 41+ usam nível 5.
- **Nível de entrada:** o servidor usa a onda, mais 2 para especiais, 5 para minichefes ou 10 para chefes. A classificação de chefe prevalece sobre o bônus de especial.
- **Preferência:** no primeiro espaço de um especial, sua técnica característica tem 65% de chance. Os 35% restantes escolhem entre as outras técnicas. Espaços adicionais de chefes são sorteados entre as elegíveis ainda não escolhidas. Chefes sem espécie especial podem usar todo o catálogo sem uma preferência de espécie.
- **Cobertura:** as 40 técnicas, inclusive as exclusivas de drop, participam do conjunto. Itens e seus efeitos não entram no sorteio. Isso inclui passivas, cura, invocação, deslocamento, controle, projéteis e fúria.

Um chefe recebe no máximo **uma técnica de controle forte** entre Martelo, Pisada, Bash, Mergulho, Investida, Repulsão, Laço, Gravidade e Esfera de repulsão; e no máximo **uma de sustentação** entre cura, Vampirismo, Dreno, Barreira e Avatar. Os grupos impedem sortear cinco atordoamentos ou várias fontes de cura/proteção no mesmo chefe, sem excluir qualquer técnica do jogo. Controle entre monstros distintos ainda pode se combinar e deve ser acompanhado nos testes.

`rarity` identifica `normal`, `special`, `miniboss` ou `boss`; `rank` é o nível das técnicas, não o nível do monstro. `preferredDropSkill` continua documentando a preferência da espécie, enquanto o conjunto real informa o que aquele inimigo sabe usar e pode oferecer como drop. A interface deve mostrar essa distinção, além de movimento, ataque, esquiva e crítico, sem inventar pontos de atributo para monstros.

Validação desta passagem: os 23 perfis foram conferidos quanto a valores válidos; 500 conjuntos de chefes respeitaram quantidade máxima, ausência de duplicatas e limites de controle/sustentação; uma varredura de sorteios dos especiais cobriu as 40 técnicas. Depois da integração dos perfis especiais ao servidor, o teste completo da campanha passou novamente com as habilidades aleatórias, chefes progressivos, os cinco NPCs e a final real. Não foi necessário reduzir novamente dano, habilidades ou atributos para esse fluxo. Esses ensaios confirmam consistência e conclusão automatizada, sem estabelecer equilíbrio competitivo entre os conjuntos possíveis.

## Porte e separação física

Os tamanhos diferentes já são dados de cada espécie e dos heróis; chefes recebem ainda um fator de porte de 1,2. O tamanho afeta a separação física entre corpos, e não apenas o modelo desenhado. Adicionar uma variação individual aleatória de ±8%, mesmo sem mudar o RNG de dano ou de habilidades, alterou a formação dos grupos, o acesso a alvos e os momentos em que auras alcançam aliados. Por isso, uma mudança aparentemente visual pode mudar a dificuldade da campanha.

Para distinguir esse efeito de um problema geral nos números de ataque, foram executadas dez campanhas automáticas: cinco seeds com variação individual e as mesmas cinco com tamanho fixo por espécie/chefe. A comparação manteve atributos, estatísticas, habilidades, equipamentos e sequência de RNG de combate iguais; o tamanho fixo foi aplicado ao inimigo imediatamente após sua criação, antes da próxima atualização física.

| Seed | Porte com ±8% | Porte fixo da espécie/chefe |
|---|---|---|
| 7381 | Derrota na onda 40 | Concluiu onda 50 e final |
| 42 | Derrota na onda 37 | Derrota na onda 40 |
| 101 | Derrota na onda 49 | Derrota na onda 47 |
| 2026 | Concluiu onda 50 e final | Concluiu onda 50 e final |
| 98765 | Derrota na onda 39 | Derrota na onda 40 |

A taxa de conclusão nesta amostra foi 1/5 com variação e 2/5 com porte fixo; a média da última onda alcançada foi 43 e 45,4, respectivamente. A seed 101 piorou ao retirar a variação, indicando que não se trata de um aumento ou redução uniforme de dano. São efeitos de posicionamento em uma amostra pequena, não uma estimativa confiável da taxa de vitória humana.

A recomendação é manter o porte previsível de cada espécie e chefe, que já atende à variedade de tamanhos pedida, e retirar a randomização individual opcional. Não reduzir dano, velocidade ou habilidades apenas para compensar a colisão alterada ou recuperar uma seed específica. Os 23 perfis de combate, a diferença entre chefes e normais e as fórmulas de atributos permanecem intactos. Se a variação individual voltar no futuro, deve ser testada junto com navegação, separação de grupos e alcance real de contato, com múltiplas seeds e partidas humanas.

## Adição posterior solicitada: regeneração de Vitalidade

Por solicitação explícita do usuário, VIT agora também concede +0,1% de vida máxima por segundo a cada dez pontos totais. A nova parcela soma à regeneração plana já existente (`1,5 + 0,03 × VIT` por segundo). O marco considera equipamento; os custos de distribuição continuam por valor base e nenhuma outra regra de atributo foi alterada. A porcentagem inicial é uma escolha de implementação explicitada ao usuário, não uma fórmula oficial de RO.



## Tomos, armas e proteções elementais

Hugin vende 18 tomos: +1/+5/+10 de cada um dos seis atributos, por 150/800/1700 ouro e estoque 3/2/1 por visita. A compra coloca o consumível na mochila, até três cargas iguais por espaço; consumi-lo no mercado soma `tomeAttributes` aos atributos totais. O investimento base, custo por dezena, pontos distribuíveis e limite 99 da distribuição permanecem separados. Os bônus persistem após ondas e recuperação, não concedem XP nem acionam a recarga de poções. A mesma regra vale no Line Wars, onde o uso durante combate exige uma sessão válida de mercado.

O arsenal ganhou espada rúnica, machado, lança, varinha, arco lunar, adaga e cota rúnica, com ilustrações próprias. Todas as onze armas, incluindo Lâmina de Sol e Bobina de Mjolnir, aceitam fogo/gelo/veneno. Proteções aceitam resistência a fogo, gelo, veneno ou raio: 15% no nível 1, +5 pontos percentuais por nível, até 35%. Resistências iguais usam somente a maior; elementos distintos coexistem. A mitigação ocorre uma vez no dano elemental, incluindo dano periódico e ambiental, sem virar defesa física. O encanto permanece e escala com a melhoria do item, entra no preço de revenda e desaparece ao vender o equipamento. Freya mostra os equipamentos elegíveis diretamente na conversa.

Chefes das ondas 10/20 têm 40% de chance de deixar uma das seis novas armas; nas ondas 30/40/50, 65%. Nível do drop: 1 nas ondas 10/20, 2 nas 30/40 e 3 na 50. O sorteio é independente do fragmento de habilidade. O espólio pertence ao herói responsável, expira em 180s e precisa ser recolhido na tela Espólios. Mochila cheia preserva o drop e impede a coleta; ele nunca substitui equipamentos automaticamente. Outros monstros, minibosses e invocações não deixam essas armas.
