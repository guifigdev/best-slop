# Tree Tag Final v5.13

Referência: 40k_ralle89, identificado no STRING 4 do próprio mapa. [Arquivo de referência](https://t2gm.net/download/TreeTag,TFI_5.13.w3x), 223.412 bytes, SHA-256 `7c1ad8d581f63a908ab5ada6062b008d57999c80b22d92f5d3d27e0e2eb945c5`. Não misturamos valores da versão 6.45 com esta revisão.

Os objetos `war3map.w3u`, `w3a`, `w3t`, pesquisas e JASS foram lidos como dados, sem executar o script original. `shared/tree-tag-catalog.js` preserva IDs, campos e hashes de origem. Modelos, árvores e construções voxel são próprios; nenhum mesh, textura ou áudio de Warcraft foi importado.

A partida dura 1.800 segundos; Infernals aguardam 30 segundos. Ent começa com 25 HP, 20 ouro e 40 madeira. Infernals começam com 100 ouro e 50 madeira. Blaze, Pyra e Burnin preservam dados próprios e atributos nativos derivados de herói. O catálogo registra 16 técnicas, 19 estruturas e nove itens, incluindo custos, mana, recargas e níveis. Pesquisas e treinamento usam os vínculos originais de construção. Combate, captura, prisão central, resgate, trabalho de construção, renda, evolução, reparo e navegação têm simulação autoritativa compartilhada pelo treino e servidor.

Há adaptações: escala espacial 1/128, floresta de 900 árvores amostradas de posições nativas, IA própria, navegação A*, resgate por proximidade e visão simplificada por distância/obstrução. Não reproduzimos integralmente o sistema de visibilidade, todos os ataques secundários/interações nativas de Warcraft ou todos os modos opcionais do mapa. Valores herdados de dados-base de Warcraft têm proveniência separada; não significam equivalência validada a um patch específico. A arte e a interface são versões novas para navegador.

Testes cobrem preços, recursos, construção, evolução, treinamento, pesquisa, captura e resgate, habilidades com mana/recarga, atributos derivados, inventário, visão e serialização. Eles não certificam fidelidade integral ou equilíbrio competitivo.
