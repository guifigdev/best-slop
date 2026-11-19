# Tree Tag Final v5.13

Referência: 40k_ralle89, identificado no STRING 4 do próprio mapa. [Arquivo de referência](https://t2gm.net/download/TreeTag,TFI_5.13.w3x), 223.412 bytes, SHA-256 `7c1ad8d581f63a908ab5ada6062b008d57999c80b22d92f5d3d27e0e2eb945c5`. Não misturamos valores da versão 6.45 com esta revisão.

Os objetos `war3map.w3u`, `w3a`, `w3t`, pesquisas e JASS foram lidos como dados, sem executar o script original. `shared/tree-tag-catalog.js` preserva IDs, campos e hashes de origem. Modelos, árvores e construções voxel são próprios; nenhum mesh, textura ou áudio de Warcraft foi importado.

A partida dura 1.800 segundos; Infernals aguardam 30 segundos. Ent começa com 25 HP, 20 ouro e 40 madeira. Infernals começam com 100 ouro e 50 madeira. Blaze, Pyra e Burnin preservam dados próprios e atributos nativos derivados de herói. O catálogo registra 16 técnicas, 19 estruturas e nove itens, incluindo custos, mana, recargas e níveis. Pesquisas e treinamento usam os vínculos originais de construção. Combate, captura, prisão central, resgate, trabalho de construção, renda, evolução, reparo e navegação têm simulação autoritativa compartilhada pelo treino e servidor.

Há adaptações: escala espacial 1/128, floresta de 1.353 árvores amostradas de posições nativas e reescaladas para um campo de 116 × 116, IA própria, navegação A*, resgate por proximidade e visão simplificada por distância/obstrução. Não reproduzimos integralmente o sistema de visibilidade, todos os ataques secundários/interações nativas de Warcraft ou todos os modos opcionais do mapa. Valores herdados de dados-base de Warcraft têm proveniência separada; não significam equivalência validada a um patch específico. A arte e a interface são versões novas para navegador.

Testes cobrem preços, recursos, construção, evolução, treinamento, pesquisa, captura e resgate, habilidades com mana/recarga, atributos derivados, inventário, visão e serialização. Eles não certificam fidelidade integral ou equilíbrio competitivo.


## Workers e tamanho do mapa — correção de fidelidade

A versão fixada **já começa com um Ent construtor**, não com uma barraca. O `uC12:ubui` oferece Tree of Life (`e000`) e outras nove estruturas. Não há edifício com nome “Tent” neste catálogo; “tents” pode significar os Ents ou uma versão diferente do mapa. Não criamos um edifício supostamente original sem evidência.

A Tree of Life possui `utra=e002,e001,uC43`. Agora o treinamento cria unidades independentes, com posição, vida, mana, seleção, ordens e fila reais. Não converte mais o Ent em “construtor avançado” por uma flag invisível. Workers treinados não expiram como invocações, não perseguem inimigos automaticamente e nascem junto à estrutura produtora; saída ocupada mantém a unidade aguardando na fila sem cobrar novamente.

| Objeto | Função no mapa | Custo ouro / madeira | Treinamento | Ações |
| --- | --- | --- | --- | --- |
| `e001`, base `ewsp` | Wisp | 80 / 0 | 10s | Coletar madeira de árvores; Detonar |
| `e002` | Nature Lover | 75 / 100 | 15s | Blink e Regrow Trees |
| `uC43` | Advanced Builder | 60 / 60 | 15s herdados | Desenraizar; construir estruturas avançadas |

O conjunto **nativo** de construção do Advanced Builder é `n005,h003,eC03,eC04,eC42,eC45`: Tunnel Entrance, Infernalkiller, Big Tree, Armored Big Tree, Item Shop e Upgrade Center. O Ent continua limitado ao seu próprio conjunto; uma melhoria por evolução de estrutura é distinta de colocação direta pelo construtor avançado.

A coleta usa os dados herdados de `Awha`, presente em `e001:uabi`: **5 madeira a cada 8 segundos**, sem consumir a árvore. A navegação e a aproximação do Wisp são próprias desta engine; os dados herdados não têm equivalência de patch certificada. A habilidade Detonar (`Adtn`) usa raio 300/128, dreno de 50 mana e dano de 225 a invocações; o motor não reproduz todo o sistema de dispel de Warcraft.

Regrow Trees (`A00F`) custa **100 mana** no objeto do mapa. Herda **8s de recarga e 500/128 de alcance** de `Adsm`. O script `Trig_Regrow_Trees2_Actions`, linha 142 do JASS legível extraído, restaura os destructibles em **raio 200/128**. Nesta adaptação, árvores que sobreporiam unidades ou construções ocupadas não são restauradas, para preservar as colisões.

O campo passou de **94 × 94 para 116 × 116** a pedido do usuário. Isso é uma adaptação espacial declarada: posições de decorações do mapa multiplicadas por 116/94, amostragem de 1.353 entre 4.939 árvores nativas, mesma clareira/prisão central. Os valores de velocidade, alcance, mana, recarga, dano e treinamento continuam na escala de referência 1/128 e não foram multiplicados junto ao terreno.

Comandos compartilhados entre cliente e servidor: `ttMove`, `ttStop`, `ttBuild`, `ttRepair`, `ttUpgrade` e `ttCast` aceitam `workerId` numérico de um worker vivo do próprio jogador. `ttGather` recebe `workerId` e `target` como ID de árvore. Recursos são sempre debitados/creditados na carteira do jogador, sem criar ouro ou madeira paralelos no worker. Captura do Ent elimina suas estruturas e workers, conforme a regra de perda da base já aplicada ao modo.

## Controles RTS e construção no navegador

As construções são selecionadas pelo modelo 3D, incluindo a copa, e mostram dono, vida, armadura e função. Duplo clique seleciona prédios iguais do mesmo dono visíveis na câmera. Unidades treinadas podem ser selecionadas individualmente, por duplo clique ou Ctrl + arraste; o botão Selecionar oferece o mesmo gesto sem teclado. Ordens de grupo são validadas pela simulação e nunca comandam unidades alheias.

Tropas treinadas mantêm posição e revidam em alcance, sem perseguir inimigos distantes automaticamente. Mover, atacar, parar e coletar com Wisps são ordens explícitas. O grupo se desloca para destinos próximos distintos. Ataque ao mover usa uma ordem de deslocamento quando não há alvo clicado; não reproduz integralmente o comportamento nativo de aquisição de alvos em trânsito.

Novas obras encomendadas ao mesmo construtor entram em fila; cada uma só progride enquanto ele trabalha ao alcance dela. Mover ou parar interrompe o trabalho. Continuar construção (ou botão direito na fundação própria) retoma uma obra sem nova cobrança. O ponto de aproximação é estável e respeita o perímetro, evitando oscilações junto a prédios próximos. A fila de obras é uma adaptação de usabilidade, mantendo os tempos do catálogo.

Desenraizar identifica a árvore ou construção própria clicada, aproxima o usuário até a borda e remove o alvo; construções de aliados não podem ser removidas. A demolição de estruturas próprias usa a regra de cancelamento já implementada, sem tratar essas construções como madeira coletável.

Treinar, evoluir, continuar obras e desenraizar aceitam grupos de prédios próprios do mesmo tipo. Recursos são cobrados por prédio; o resultado informa quantos receberam a ação e quantos não tinham recursos/requisitos. Treinamento mostra retratos, descrições, progresso, tempo restante e sequência real. Retratos e modelos dos oito combatentes usam os mesmos descritores voxel próprios.
