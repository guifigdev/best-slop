# Castle Fight independente

Este é o terceiro jogo do seletor, separado de Custom Hero Survival e de Custom Hero Line Wars. A referência de dados é [Castle Fight v1.14b](CASTLE_FIGHT_REFERENCE.md), sem misturar o catálogo de continuações.

## Partida

Até quatro participantes entram em duas equipes alternadas por ordem de entrada. No treino, três construtores são IA; em sala local, o servidor recebe os mesmos comandos e mantém a simulação autoritativa. O cliente publicado continua sem um serviço WebSocket público hospedado.

Cada participante escolhe um animal que já determina sua raça: Bjorn/capivara — Humanos; Liv/coelha — União Élfica; Runa/raposa — Elfos Noturnos; Sten/tartaruga — Nagas; Vidar/coruja — Nórdicos; Eirik/guaxinim — Mecânicos. Não há escolha separada nem troca de raça. As dez raças históricas continuam no catálogo de referência, mas quatro ainda não possuem um construtor nesta seleção. O construtor é invulnerável, não ataca, não aprende técnicas, não recebe atributos de Survival e não usa os equipamentos daquele jogo. Ele move, usa Blink, constrói, evolui, demole e usa os itens próprios de Castle Fight.

Construções são colocadas numa grade de meio metro dentro da região da equipe, em toda a base verde, inclusive no alinhamento das lanes; apenas limites, castelo, construções e obstáculos reais bloqueiam a área. Quando a construção termina, a produção começa no intervalo próprio da tropa. A posição escolhe a lane mais próxima. A tropa nasce num espaço livre junto ao perímetro da construção produtora, caminha até a entrada da própria lane, atravessa o campo e avança para o castelo adversário. Se as saídas ou o caminho terrestre estiverem bloqueados, a produção fica pendente e tenta novamente; não há teleporte para a lane. As tropas marcham e atacam sozinhas; o jogador coordena a composição e os recursos. O objetivo é destruir o castelo adversário. Prédios de evolução exigem sua construção anterior, tempo, ouro e madeira; prédios lendários respeitam o limite do comprador, aumentado por Cheese.

## Referência e adaptações

Raças, vínculos produtor/tropa, preços definidos no mapa, intervalos, atributos extraídos e matriz de dano têm proveniência em `shared/castle-catalog.js`. Campos herdados de Warcraft que não estavam acessíveis têm marcação de adaptação, assim como conversão de coordenadas, alcance e modelo animal. Dano aleatório por dados usa sua média; a simulação não reproduz todas as habilidades nativas registradas em `abilityIds`.

O campo foi ampliado para **104 × 56**, em vez dos 48 × 32 da conversão anterior. A matriz W3E original permanece no catálogo; a apresentação reamostra seus biomas em 52 × 28 células de 2m, alonga o centro e estende as laterais. Cada base verde ocupa 26 × 48m e é plana e livre de vegetação. As duas lanes ficam em z±9, com 46m entre entradas; castelos em x±43. Árvores e rochas usam a transformação espacial da referência e são retiradas das áreas de construção, entradas e corredores. Uma lane continua sendo uma variante opcional. A torre de compras no centro é uma alteração solicitada: o original vendia seus itens no castelo principal. Arquiteturas e modelos voxel são próprios.

A prévia e o servidor usam `castleBuildCheck`, incluindo raça, fase, recursos, limites e obstáculos. Ela informa déficits exatos de ouro/madeira e não fica verde quando o servidor recusaria a construção. Construções alinhadas às lanes são permitidas dentro da própria base. A navegação das tropas usa A* com raio do corpo, segmentos verificados, rotas ao redor de florestas e revisão ao construir/demolir. Spawns procuram uma saída próxima do produtor com espaço para o corpo e caminho válido até a lane; se não houver, a produção aguarda. Uma falha não consome ID, contador de tropas ou o horário pendente da produção. A separação entre unidades também verifica o segmento para não atravessar árvores e paredes. As entradas das lanes são portões de passagem: a tropa pode cruzar pela largura do corredor, sem precisar ocupar o ponto central exato. Isso evita o bloqueio coletivo entre navegação e colisões em exércitos densos, inclusive voadores lentos. Se uma perseguição levar a tropa para dentro da base adversária antes de registrar a passagem, ela considera essa entrada concluída e segue ao castelo depois do combate, em vez de voltar ao marcador antigo.

Blast Staff fica vinculado ao construtor: adquire inimigos em 750/256m, causa 60 de dano de magia por disparo e dispara a cada 1s, com projétil a 1000/256m/s conforme A02D. A recarga só começa ao lançar. Há esfera com rastro no mundo e dano no impacto; dano usa a linha Spells da matriz, sem armadura física, crítico ou aura de ataque. O painel indica o alcance e avisa quando é preciso aproximar o construtor.

A defesa armada do castelo é uma **adaptação solicitada**, usando a arma da Watch Tower v1.14b: 45 de dano Pierce, intervalo 0,5s, alcance 950/256 a partir do corpo da estrutura, contra terra/ar. O Main Castle hcas da referência não possuía arma própria. HP 5000 e regeneração 0,5HP/s são mantidos do objeto original. Ver proveniência em [CASTLE_FIGHT_REFERENCE.md](CASTLE_FIGHT_REFERENCE.md).

A economia padrão começa com 250 de ouro e 125 de madeira e usa renda dinâmica pelo investimento em construções concluídas; a madeira é concedida pela produção em vez de uma renda fixa universal. Esses dados foram lidos dos registros do mapa. Limite de doze construções por jogador, sessenta tropas vivas por equipe, reembolso parcial e fluxo de uso de itens são parâmetros da adaptação; modos opcionais de impostos e modificadores de equipe do original ainda não são reproduzidos. Estoques, atrasos de disponibilidade e requisitos de recursos dos itens são validados pela simulação. Os nove itens do marketplace têm efeitos próprios neste motor; passivos são associados ao construtor, e consumíveis são usados diretamente ao comprar e escolher a região, sem copiar o inventário de Warcraft. Construções especiais sem implementação ficam identificadas e desabilitadas, nunca cobram ouro por efeito ausente.

## Construções e informação de combate

A aparência combina a arquitetura da raça com a função do produtor: placa com espada/escudo, rifle/alvo, arco, cajado/cristal, canhão, asas/poleiro, cercas e símbolos de bestas. Decorações voxel são mescladas no mesh; não exigem textura ou animação separada. Melhorias acrescentam marcas de nível e reconstruem o modelo quando mudam tipo ou tamanho.

O terreno reservado varia por função, como adaptação espacial: torres 1,5×1,5m; quartéis/escolas 2,5×2,5m; estábulos 3×3m; artilharia 3,5×3m; viveiros grandes 4×3,5m. A prévia, o limite de construção, o colisor, a saída de tropas e o modelo usam o mesmo footprint. Uma melhoria que aumenta a construção reserva a área ao iniciar, impedindo sobreposição posterior. Os atributos e custos originais permanecem separados dessas escolhas visuais.

O Sniper conserva o alcance 500/256 do registro, mas agora é classificado como atirador para os efeitos, sem depender do antigo corte visual de 3m que mostrava slash. Recebe rifle e traço de tiro; o Marksman mantém 800/256. A ficha de uma tropa separa vida, tipo e valor de dano, armadura própria, alcance, intervalo e movimento. Vantagens de ataque e fraquezas/resistências defensivas vêm de linhas/colunas diferentes da matriz de counters. Selecionar uma tropa mostra seu círculo de alcance. Notas de extração e limitações de implementação ficam na documentação, fora da ficha.

## Controles

- Catálogo → terreno: construir; a prévia verde/vermelha indica posição válida/inválida.
- Segure **Enter** ao clicar no terreno para manter a mesma construção selecionada. Solte Enter e faça a última colocação para sair; **Esc** cancela. No toque, **Construir várias** liga/desliga o mesmo comportamento sem teclado. Cada colocação valida recursos, limites e ocupação separadamente; uma recusa mantém a prévia e não cobra recursos.
- Botão direito: mover construtor. Arrastar: mover ou girar a câmera conforme o botão de modo; pinça aproxima no toque.
- Q → terreno: Blink. W ou Esc: cancelar.
- Clique num prédio próprio: consultar vida, produção, demolir e evoluir. E demole o selecionado.
- G ou torre central: ir à loja. Ativos pedem área/alvo; passivos são comprados diretamente.
- Minha base, Batalha, Mapa e retratos dos castelos: navegar pelo campo.

Os testes cobrem isolamento dos sistemas de herói, autorização, limites, posições, recursos, produção, combate, counters, itens, evoluções, IA, vitória e colisões. Eles não certificam equilíbrio competitivo nem equivalência completa a todas as regras de v1.14b.
