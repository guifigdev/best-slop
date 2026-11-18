# Castle Fight independente

Este é o terceiro jogo do seletor, separado de Custom Hero Survival e de Custom Hero Line Wars. A referência de dados é [Castle Fight v1.14b](CASTLE_FIGHT_REFERENCE.md), sem misturar o catálogo de continuações.

## Partida

Até quatro participantes entram em duas equipes alternadas por ordem de entrada. No treino, três construtores são IA; em sala local, o servidor recebe os mesmos comandos e mantém a simulação autoritativa. O cliente publicado continua sem um serviço WebSocket público hospedado.

Cada participante escolhe sua raça e um animal apenas como representação do construtor. O construtor é invulnerável, não ataca, não aprende técnicas, não recebe atributos de Survival e não usa os equipamentos daquele jogo. Ele move, usa Blink, constrói, evolui, demole e usa os itens próprios de Castle Fight.

Construções são colocadas numa grade de meio metro dentro da região da equipe, preservando corredores e colisões. Quando a construção termina, a produção começa no intervalo próprio da tropa. A posição escolhe a lane mais próxima. As tropas marcham e atacam sozinhas; o jogador coordena a composição e os recursos. O objetivo é destruir o castelo adversário. Prédios de evolução exigem sua construção anterior, tempo, ouro e madeira; prédios lendários respeitam o limite do comprador, aumentado por Cheese.

## Referência e adaptações

Raças, vínculos produtor/tropa, preços definidos no mapa, intervalos, atributos extraídos e matriz de dano têm proveniência em `shared/castle-catalog.js`. Campos herdados de Warcraft que não estavam acessíveis têm marcação de adaptação, assim como conversão de coordenadas, alcance e modelo animal. Dano aleatório por dados usa sua média; a simulação não reproduz todas as habilidades nativas registradas em `abilityIds`.

O mapa usa a matriz de terreno W3E reamostrada em 48 × 32 células, com nove materiais nativos reinterpretados na paleta voxel e as alturas extraídas. Castelos e posições das duas lanes derivam da referência em escala 1/256. Árvores e rochas usam suas coordenadas originais e modelos voxel próprios; a área central da loja fica livre, e as 822 decorações de função desconhecida não são convertidas em vegetação arbitrária. A apresentação comprime a altura pelo mesmo fator no chão, estruturas e animais. Colisores voxel substituem as texturas nativas de passagem. Uma lane é uma variante opcional. A torre de compras no centro é uma alteração solicitada: o original vendia seus itens no castelo principal. As arquiteturas de dez raças são próprias, assim como modelos de tropas e cenário voxel.

A economia padrão começa com 250 de ouro e 125 de madeira e usa renda dinâmica pelo investimento em construções concluídas; a madeira é concedida pela produção em vez de uma renda fixa universal. Esses dados foram lidos dos registros do mapa. Limite de doze construções por jogador, sessenta tropas vivas por equipe, reembolso parcial e fluxo de uso de itens são parâmetros da adaptação; modos opcionais de impostos e modificadores de equipe do original ainda não são reproduzidos. Estoques, atrasos de disponibilidade e requisitos de recursos dos itens são validados pela simulação. Os nove itens do marketplace têm efeitos próprios neste motor; passivos são associados ao construtor, e consumíveis são usados diretamente ao comprar e escolher a região, sem copiar o inventário de Warcraft. Construções especiais sem implementação ficam identificadas e desabilitadas, nunca cobram ouro por efeito ausente.

## Controles

- Catálogo → terreno: construir; a prévia verde/vermelha indica posição válida/inválida.
- Botão direito: mover construtor. Arrastar: mover ou girar a câmera conforme o botão de modo; pinça aproxima no toque.
- Q → terreno: Blink. W ou Esc: cancelar.
- Clique num prédio próprio: consultar vida, produção, demolir e evoluir. E demole o selecionado.
- G ou torre central: ir à loja. Ativos pedem área/alvo; passivos são comprados diretamente.
- Minha base, Batalha, Mapa e retratos dos castelos: navegar pelo campo.

Os testes cobrem isolamento dos sistemas de herói, autorização, limites, posições, recursos, produção, combate, counters, itens, evoluções, IA, vitória e colisões. Eles não certificam equilíbrio competitivo nem equivalência completa a todas as regras de v1.14b.
