# Direção de arte — Coliseu das Mil Formas

Animais voxel originais, silhuetas compactas e legíveis e poses em passos de oito quadros por segundo. A câmera de combate precisa mostrar o animal, seu estado e o terreno sem depender de abrir uma ficha. A inspiração de jogos de animais voxel orienta proporções e ritmo; personagens, ícones e efeitos são próprios.

## Linguagem visual

- **Materiais do mundo:** cores de vértice, grandes planos claros, sombra curta e faces com contraste. Preservar as cores de pelagem, equipamentos e equipe. Evitar um filtro global que uniformize todos os animais.
- **Fogo:** laranja vivo, centro amarelo claro, contorno irregular e poucas brasas quadradas que sobem. O fogo aparece sobre o corpo e persiste enquanto houver queimadura, inclusive depois de sair da lava.
- **Frio / frost:** azul ciano, cristais curtos junto dos pés, aro de geada e brilho de borda discreto. Frost reduz movimento; não usar um bloco de gelo envolvendo todo o animal, porque isso sugeriria uma imobilização inexistente.
- **Veneno:** fragmentos verde-limão que flutuam perto do corpo. Diferenciar do verde quente e restaurador da cura; o movimento de fragmentos e o rótulo textual reforçam o significado.
- **Atordoamento:** estrelas acima da cabeça, separado dos cristais de frio. **Barreira:** aro verde-sálvia e indicação de absorção; reflexão conserva o violeta. Um personagem pode ter vários efeitos ao mesmo tempo.
- **Ilustrações:** composições de 64 × 64, silhueta central contrastada, planos facetados com luz e sombra próprias, fundo escuro e moldura fina. O significado precisa funcionar também a 35–48 pixels. Microdetalhes são secundários.

O estado de combate deve ter texto e forma, além da cor: fogo / frost / veneno no HUD; estrelas para atordoamento, cristais para frio e brasas para queimadura. Isso reduz a dependência da percepção de cores.

Quando há exatamente **uma categoria negativa**, o corpo recebe uma tonalidade leve: laranja para fogo, azul para frost/lentidão, verde para veneno ou amarelo para atordoamento. Múltiplas fontes de fogo ou de frio contam uma vez. Com duas ou mais categorias, a pelagem retorna à cor normal e os efeitos individuais continuam visíveis; fúria, barreira e reflexão não contam como negativos. A mistura de 20% preserva as cores de vértice; com fúria ativa, mistura apenas 12% sobre o vermelho existente. O material por ator é criado sob demanda e reutilizado, sem texturas ou passes extras.

Espólios no chão preservam a pequena placa voxel flutuante original; apenas a cor muda por raridade, sem halo ou feixe vertical: comum claro, raro azul, épico violeta, lendário dourado e heroico coral. O rótulo de hover inclui nome e raridade. As prévias das técnicas mostram círculo, cone, linha, barreira ou destino conforme o efeito real; azul/verde sinaliza região válida e vermelho indica bloqueio acompanhado de texto.

## Implementação dos efeitos persistentes

`src/status-effects.js` exporta `createStatusEffects(root, baseGeometry?)`, com `update(unit, time, enabled)` e `dispose()`. A simulação continua sendo a autoridade: o módulo apenas lê `dots.burn`, `dots.lava`, `dots.frost`, `dots.poison`, `frostUntil` e `solarUntil`, sempre comparando os tempos de término. A aura solar renova um intervalo curto em `solarUntil` quando causa dano; o fogo do alvo desaparece quando esse intervalo acaba.

Cada ator usa no máximo três meshes e três draw calls: fogo com suas brasas, geada com seus cristais e veneno com seus fragmentos. Geometrias e materiais são compartilhados entre atores. Não há texturas, luzes adicionais, pós-processamento em tela inteira nem centenas de partículas. Os shaders usam tempo quantizado a 8 Hz para acompanhar o movimento das poses.

O fogo usa um único plano centralizado no personagem, sempre voltado para a câmera. O vertex shader mantém a âncora no mundo e aplica os deslocamentos do plano no espaço da câmera, preservando o tamanho do animal sem herdar sua rotação. Chamas e brasas são desenhadas no mesmo sprite, com duas faces triangulares e uma draw call. O contorno varia em células. O shader de geada usa as normais das faces para um Fresnel suave; isso não altera o material do personagem. Os cristais de gelo e fragmentos de veneno continuam sendo geometria 3D. A composição usa transparência normal e teste de profundidade para respeitar a oclusão pelo cenário. Atores ao longe podem desativar esses efeitos pelo argumento `enabled`; o orçamento de visibilidade pertence à view.

Ao remover um ator, chamar `statusEffects.dispose()` **antes** da limpeza genérica de suas meshes. O grupo é desanexado primeiro e os recursos compartilhados só são liberados quando o último ator que os usa é descartado. Chamadas repetidas de `dispose()` são seguras.

## Critérios para revisão

1. Um herói queimando deve continuar identificável sobre areia, lava e gelo, sem perder a leitura da pelagem.
2. Frost deve comunicar lentidão e frio, sem parecer um stun ou bloqueio de comandos.
3. A câmera afastada deve mostrar a silhueta principal de cada estado. O HUD mantém os rótulos quando o efeito visual estiver fora do orçamento de distância.
4. Eventos explosivos podem ter um pico breve de brilho; efeitos persistentes ficam menores para preservar a leitura de ataques e áreas perigosas.
5. Mais detalhe não deve exigir mais texturas ou sombras dinâmicas por partícula; reutilizar o material de tonalidade criado sob demanda por personagem.

Os efeitos são apresentações procedurais em passos de 8 Hz, não animações exportadas de Blender/VAT. Não alteram dano, duração, resistência ou qualquer regra de atributos.

## Bestiário de silhuetas

`src/monster-art.js` fornece corpos originais que a view reúne em meshes voxel e anima com as poses existentes. O leão se identifica pela juba larga dourada e ponta de cauda escura; o rinoceronte, pelo corpo cinza robusto e chifre em degraus. O grifo combina corpo leonino, cabeça clara, bico dourado e asas de penas. A quimera tem três cabeças diferentes — leão, cabra com chifres e serpente —, cauda serpentina e asas escuras. O dragão usa focinho alongado, chifres claros, crista dorsal, cauda longa e membranas de asas avermelhadas. A esfinge tem corpo leonino e máscara/listras azuis e douradas.

Os seis preservam uma leitura quadrúpede e o contraste de planos grandes. Diferenças de tamanho são aplicadas pela view, mantendo essas proporções e os mesmos clipes de poses a 8 Hz. As ilustrações de sopro de fogo, nuvem venenosa, mergulho elétrico, pele rochosa, brado, investida de chifre, projéteis de fogo/gelo e fúria seguem a mesma linguagem facetada do catálogo.

A linha de voadores acrescenta uma valquíria animal: coruja de olhos grandes com capacete azul e dourado, lança, escudo e asas claras. A harpia é uma ave de rapina inteira, com plumagem turquesa, bico curvo e asas amplas. A fênix usa corpo vermelho e dourado, crista e várias penas longas na cauda. A serpente alada de geada tem pescoço alongado, membranas azuis claras, chifres e cauda segmentada. O basilisco é um réptil terrestre verde-limão com crista e língua bifurcada. Os desenhos são originais e mantêm a linguagem de animais voxel; não são extrações de sprites ou modelos de Ragnarok.

Grifo, quimera, dragão e os novos voadores devolvem asas separadas pelo contrato `wings: [{side, pivot: [x,y,z], parts: [[x,y,z,w,h,d,color], ...]}]`. As posições das peças são **locais ao pivot**. A view cria um grupo por asa depois de consolidar o corpo, consolida cada asa em uma mesh e anima sua rotação em oito poses. As asas não fazem parte das caixas desenhadas no corpo, evitando asas duplicadas ou congeladas na consolidação. O basilisco e os animais sem asas devolvem um array vazio.

## Mercado físico

As cinco lojas usam as posições, nomes e serviços de `shared/shops.js`, compartilhados com a simulação. `src/market.js` desenha Brás, a capivara do arsenal; Cora, a coelha da botica; Orfeu, a coruja dos livros; Nico, o guaxinim ferreiro; e Faísca, a raposa encantadora. Cada balcão tem toldo próprio e produtos reconhecíveis: armas e escudo, frascos coloridos, estante de livros, bigorna e fornalha, ou cristais e grimórios.

Cada loja usa duas meshes consolidadas: cenário estático e animal com balanço discreto em oito poses. Assim os toldos ficam imóveis enquanto o comerciante parece vivo. Os cinco NPCs não entram na lista de combatentes, não têm vida nem recebem ataques. Os rótulos são botões DOM projetados acima dos personagens, com nome, serviço e indicação da distância de conversa. Fora da preparação, cenário e rótulos se ocultam. Alcance, estoque, compras e melhorias continuam validados pela simulação, não pelo componente visual.

## Pré-seleção por mouse

O modelo sob o mouse recebe contorno verde para aliado ou vermelho para inimigo, acompanhado de anel no chão e nome com o mesmo código de cor. A relação usa o jogador real, inclusive suas invocações e tropas enviadas a um campo rival. Corpo, pernas e asas usam a mesma geometria animada; o contorno não altera as cores de vértice e só é desenhado para o alvo do mouse.

No Castle Fight, símbolos de função ficam na frente e acima da linha dos telhados para leitura isométrica: espada, rifle, arco, cajado, canhão, asas, garras/patas e moedas. A arquitetura de raça permanece como base, com anexos de oficina, viveiro ou escola. Torres defensivas têm corpo próprio compacto. O Sniper carrega rifle e usa traço de projétil, em vez do slash que era escolhido pelo corte visual de alcance.


A fonte do Line Wars mostra cruzes verdes, recuperação numérica e estado no HUD. Lojas durante a batalha não pausam a simulação local: antes o modal interrompia a própria cura. Guia e narrativa mantêm sua pausa local. A fonte conserva as regras existentes de 6% da vida máxima e 4% da mana máxima por segundo.


## Revisão conjunta: projéteis e movimento

O time de game design, jogabilidade e UI convergiu em legibilidade por silhueta, altura e cor. `projectile-art.js` fornece sete famílias originais: flecha de madeira com penas, bala com núcleo claro, runa arcana, brasa angular, cristal de gelo, fragmento de veneno e pedra de cerco. Cada família compartilha geometria e material com cores de vértice; projéteis de Warlock e Blast Staff usam os mesmos assets. A trajetória permanece contínua, com rotação/pulsação em poses de 8Hz. O impacto termina em lascas blocadas curtas, sem novos passes de pós-processamento.

Flechas, tiros, raios, crítico, escudo e roubo de vida usam proporção e elevação do modelo ou altura do terreno. A barreira verde-sálvia acompanha a ilustração. Formações deixam de marchar em fase idêntica; animais pesados têm salto visual menor, preservando velocidade e atributos. O construtor ganha ciclo de trabalho próprio, sem travar no primeiro quadro de ataque.

Em combate cheio, o orçamento de 32 textos e 96 efeitos prioriza avisos de chefe, críticos, MISS e feedback do jogador. Efeitos repetidos de tropas são descartados primeiro. A direção segue formas voxel originais; não foi aplicado filtro global.

Recomendações futuras de UI discutidas: rodapé estável na seleção, painel contextual recolhível no celular, alvos de toque maiores e tratamento consistente de foco em modais. Essas sugestões não alteram regras de combate.


## Aquisição e builds híbridas

Aquisições pelo catálogo e por essências reservam a técnica a um herói. A exceção é aplicada à origem real: uma técnica aprendida por fragmento recebe `skillOrigins[key] = "loot"`, pode coexistir com a cópia reservada e continua evoluindo com pontos. Os seis poderes iniciais e as técnicas exclusivas de bestas permanecem compartilhados. Substituir a cópia reservada libera a técnica; melhorar por fragmento uma técnica já comprada não libera sua reserva. `LOOT_SKILLS` define os loadouts de monstros, sem anular as reservas do catálogo. O HUD identifica o portador e mantém o fragmento utilizável.

A separação entre tipo físico e mágico descreve a escala e a defesa, sem impedir builds híbridas. Requisitos mecânicos de ataque corpo a corpo/à distância continuam nas técnicas que precisam deles. Os seis animais podem investir em magia e em defesas, mantendo suas identidades e o sistema de atributos acordado.

## Revisão do mundo e identidade dos ataques

O Survival agora tem uma construção elíptica de coliseu: quatro terraços, arcadas externas, quatro portões monumentais e bandeiras por bioma. A arquitetura estática usa um batch instanciado; 288 animais de plateia compartilham oito grupos instanciados e poses previamente calculadas de descanso e comemoração a 8 Hz. Eventos como crítico, explosão e evolução provocam a reação da torcida. A borda pontilhada acompanha a interseção real entre os limites quadrados e circulares da simulação.

A lava intercala crosta de obsidiana, canais e bolsões incandescentes, com brasas blocadas. Gelo, água e regiões de frost possuem superfícies diferentes. O shader é procedural, sem texturas; o círculo visível continua com o raio exato do perigo. Arenas de guerra usam a mesma apresentação dos perigos. A arquitetura é ocultada corretamente no Line Wars e Castle Fight.

`world-landscape.js` prolonga cada campo até o horizonte com terreno escalonado, árvores, rochas, montanhas e detalhes de cinco biomas. O interior dos mapas importados é preservado, inclusive a água; o coliseu reserva quarenta metros de espaço para sua arquitetura. O relevo é criado em até três batches e não é reconstruído quando o jogador move a câmera. O horizonte e a névoa acompanham a paleta do bioma. Materiais próprios impedem que a coloração de um cenário altere animais ou outro modo de jogo.

Ataques básicos têm objetos próprios dos animais quando apropriado: galinhas lançam ovos, coelhos cenouras, guaxinins sucata, corujas penas, tartarugas pequenos cascos, sapos gotas e ouriços espinhos. Armas explícitas, como o rifle do Sniper, e elementos mágicos preservam suas identidades. São mudanças cosméticas; alcance, dano e classificação física/mágica continuam definidos pela simulação. Geometrias, materiais e cores de vértice são compartilhados.

O crítico usa número amarelo ligeiramente maior sobre uma explosão laranja, sem exclamação. Sua centelha 3D também usa âmbar. Não depende apenas da cor para se diferenciar de dano comum.

O arraste esquerdo puxa o terreno; o botão do meio gira a câmera sem modificadores. No toque, o botão Mover/Girar permanece disponível, junto aos gestos de dois dedos para deslocar e aproximar.

## Movimento coerente com o cenário

Árvores bloqueiam pelo tronco, com copas levantadas para permitir passagem abaixo delas. Pedras bloqueiam pela base visível. A navegação usa o raio real do corpo, verifica os segmentos entre os nós, evita cortar quinas e busca aproximação segura quando o destino está ocupado. Ao perder progresso, recalcula o percurso; aliados parados podem ser contornados. A animação considera o deslocamento efetivo depois das colisões, evitando o ciclo de caminhada sem sair do lugar.

Os efeitos liberam buffers de instâncias ao expirar, sair do orçamento ou trocar de arena. Recursos compartilhados dos projéteis são preservados. A otimização foi validada por testes de descarte e regressões de navegação; não há promessa de FPS sem medição no dispositivo do jogador.

## Identidade própria do Castle Fight

`castle-building-models.js` fornece modelos para as 161 entradas do catálogo, incluindo suas evoluções. Fábricas, laboratórios, templos, viveiros e torres têm composições diferentes, mesmo ao ignorar todas as cores. Mecânicos incluem hangares e heliportos, depósitos de sucata, laboratórios de explosivos, serrarias, forjas de golems e baias de tanques. As evoluções alteram a volumetria, não apenas o nome. O maior modelo usa 27 caixas consolidadas em uma mesh, com cache e descarte por referências. Os retratos isométricos mostram a mesma geometria do mundo.

As 107 tropas usam seu `unitKey` para escolher o modelo e o retrato. Helicópteros possuem cabine, cauda, esquis e rotores em poses de 8 Hz; tanques têm esteiras e armas, sem pernas ou salto de animal. Golems, soldados, arqueiros, mortos-vivos, nagas e criaturas aladas seguem a identidade de seus nomes. Os ataques básicos de máquinas usam munição coerente; projéteis explícitos de armas e habilidades são preservados. Essa apresentação é específica de Castle Fight; os animais dos outros jogos permanecem iguais.

## Controles estáveis de Castle Fight

O HUD e os cards usam reconciliação de DOM com identidade por comando ou construção. Atualizar vida, recursos, progresso ou recargas mantém o botão existente, evitando perder um clique entre pressionar e soltar. Listeners substituíveis não se acumulam em cada atualização. O estado aberto dos detalhes e o foco também são preservados.

Duplo clique esquerdo seleciona entidades do mesmo tipo e dono cujos modelos intersectam o campo visível da câmera. O botão Selecionar iguais visíveis oferece a mesma ação por toque. Prédios selecionados compartilham um batch de anéis; o controle de produção atua no grupo, respeitando posse e limites no servidor. Evoluções e demolição aparecem na seleção individual. A produção pausada tem estado explícito e a retomada sincronizada inicia um ciclo inteiro.

O Golpe de resgate possui uma carga por partida e mira com alcance/raio reais. Seu aviso breve é dourado, seguido de uma explosão blocada branca, azul e dourada. A geometria do aviso e da explosão é independente dos telegraphs de chefes do Survival. Referências, números e limites estão em `CASTLE_EMERGENCY.md`.


## Faixa de lava do coliseu

Na Forja de Muspelheim, um canal animado contorna o limite externo do campo e termina antes da primeira arquibancada. Reutiliza o material de lava opaca do Warlock, com fissuras e pulsos em oito quadros por segundo; basalto e quatro pontes de pedra ligam o campo aos portões. Toda a lava fica além do limite de movimento, sem acrescentar perigos à simulação. O canal usa apenas duas chamadas de desenho e acompanha a visibilidade do coliseu: fica oculto nos demais temas, no Line Wars, no Castle Fight e em campos expandidos. Recursos próprios são liberados ao descartar o cenário; a geometria base compartilhada permanece válida.


## Distribuição de objetos na arena

Árvores, pedras e runas passam a usar amostragem uniforme em toda a área útil do coliseu, recortada pelo mesmo quadrado de cantos arredondados do movimento. Foi removido o anel central de 4,8–8,2m. A quantidade permanece dez objetos por campo; o afastamento mínimo entre centros aumenta para 3,25m e há margem para circulação junto à borda. O centro de entrada, as fachadas e o acesso das lojas, os perigos do bioma e os corpos de unidades vivas ficam livres. O terreno é igual nas arenas privadas dos competidores, varia por onda e usa uma nova semente em cada partida iniciada pela interface ou sala online. O plantio ao entrar no PvP também respeita as posições finais dos heróis. As margens das lanes continuam seguindo os caminhos e as marcações de seus mapas.

## Bash e leitura do ataque de espada

O estudo usa a silhueta do [Knight oficial](https://ragnarokonline.gungho.jp/gameguide/character/swordman/knight.html), os quadros de ataque do sprite do Knight e o mapeamento do Bash (skill 5 → hit effect 1) disponibilizados pelo [renderizador ragassets](https://github.com/adsonpleal/ragassets). O impacto original contém raios curtos de `lens1/lens2`, com desaparecimento rápido. A pose voxel e os pixels do efeito são autorais; os sprites consultados permanecem apenas nas referências locais de revisão.

A espada prepara acima do ombro, desce rapidamente e recupera com inclinação do tronco. O Bash acrescenta um clarão no alvo, separado do rastro. Ambos continuam legíveis com câmera alta; o impacto fica centralizado e deslocado para a frente da superfície do alvo para evitar desaparecer dentro dele. A mudança é visual. Alcance, acerto, dano e recarga continuam na simulação. O limite permanece 64 eventos e oito lotes de desenho; os buffers comportam até 128 quads para os pares de corte e impacto e um atlas adicional de 192 KiB.
