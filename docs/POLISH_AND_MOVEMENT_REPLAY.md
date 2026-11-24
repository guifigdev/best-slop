# Polimento de ambientes, habilidades e interface

24/11/2026.

O pacote de ambiente tem 36 receitas voxel distintas em seis temas, com até 96 decorações e cinco lotes compartilhados. Colocação determinística respeita áreas jogáveis, pegadas de obstáculos e paredes de dungeon. Os objetos não entram em colisões ou alteram mapas da simulação. Folhas, insetos, névoa, brasas e vento usam tempo da simulação e poses discretas; não criam um material/objeto de cena por partícula. `voxelWeatherForState` resolve chuva, tempestade, vento, neve, faíscas e névoa nos modos.

Custom Hero ganhou 21 famílias de coreografia. Referências visuais originais da Blizzard estão em `CUSTOMHERO_SKILL_REFERENCES`; o código adapta suas silhuetas e movimentos para o mundo 3D. Os ingredientes de textura são locais, de Ragnarok, e não são apresentados como modelos ou animações extraídos de Warcraft III. Ataques básicos, regras de combate e avisos inimigos conservam suas rotas próprias. O renderer reserva a coreografia inteira antes de substituir a apresentação anterior e preserva o alfa do framebuffer HDR.

A HUD usa alças próprias para mover barras sem interceptar cliques de habilidade, itens ou joystick. Posições normalizadas ficam neste navegador por perfil, jogo e orientação, com limite de tela e restauração pelo menu. A lista de construção abre diretamente; o menu de pausa reúne configurações e retorno ao jogo. A configuração não sincroniza posições entre dispositivos.

## Comandos RTS

Todos os modos, com exceção de Ragnarok Survivors, usam `rts-target-feedback.js`. O alvo de ataque autoritativo recebe anel duplo, cantos sólidos e uma seta acima da cabeça; ataques automáticos podem usar o alvo do último evento real de ataque básico, com expiração. O hover sozinho não cria uma ordem de ataque. Os círculos de chão pertencem aos alvos individuais; vítimas apenas da prévia recebem somente o contorno vermelho no corpo, sem círculos ou cantos adicionais. A prévia da habilidade reutiliza a geometria já desenhada (círculo, cone, corredor ou retângulo) e contorna inimigos vivos visíveis dentro do efeito; o círculo de alcance de lançamento não conta como dano em área. Névoa de guerra e relações entre equipes continuam respeitadas.

Ordens de movimento aceitas criam um marcador verde de 1,55 s com três chevrons verticais apontando para o chão, haste e duas ondas. A apresentação possui três lotes e limite de 64 alvos, sem modificar materiais emprestados ou a simulação. A exclusão do Ragnarok conserva seus controles e marcadores próprios.

## Previsão com correção autoritativa

O transporte anterior já era cliente-servidor autoritativo com snapshots, não lockstep de atraso fixo. A opção negociada `movement-rollback-v1` adiciona números sequenciais aos comandos e confirmação privada por snapshot. Repetir o mesmo número não executa a ação novamente. A sequência é metadado de transporte: o cliente não escolhe tempo, dano ou posição aceita pelo servidor.

`src/movement-rollback.js` conserva uma base recebida e até 64 entradas locais por 500 ms. A cada atualização recebida restaura a base, retira entradas confirmadas e reexecuta as restantes, somente para apresentar a locomoção do próprio personagem. A extrapolação visual é limitada a 250 ms e para em conexão desatualizada, morte, oferta de melhoria, pausa ou troca de fase/mapa. Comandos de combate ou transações suspendem a previsão até confirmação. Snapshots, HP, SP, itens, inimigos, efeitos e RNG não são reexecutados nem alterados.

A primeira integração cobre **Ragnarok Survivors e os modos Custom Hero campanha, torre, Best of All e guerra de equipes**. Ragnarok usa a mesma função `stepRoMotion` do servidor, incluindo colisão, salto e inércia no gelo. Os modos RTS citados reutilizam navegação e colisão. Os demais modos conservam o transporte autoritativo anterior até terem adaptadores específicos para sua locomoção; não recebem uma aproximação que ignore seus mapas ou construção.

Reconexão limpa histórico e reinicia sequências. Clientes antigos continuam funcionando sem negociar o recurso; servidores antigos não anunciam suporte e o cliente apresenta snapshots normalmente. O servidor continua exclusivo para combate, economia, salas e persistência. Isto é previsão/reconciliação de movimento com rollback local, **não rollback completo de combate ou GGPO P2P**.

Referências de arquitetura: [previsão e reconciliação, Gabriel Gambetta](https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html), [guia original do GGPO](https://github.com/pond3r/ggpo/blob/master/doc/DeveloperGuide.md).

Verificação: testes de atraso e reexecução sobre correção, isolamento do estado autoritativo, colisões, pausa/reconexão, paridade real de locomoção Ragnarok e dois clientes WebSocket reais com confirmações, deduplicação e compatibilidade legada.

## Ajustes de usabilidade e apresentação

Recursos ficam no cabeçalho; vitais e narrador não usam alças. A migração remove suas posições antigas sem apagar os outros ajustes do jogador. A sala durante a partida pode ser movida pelo título, preservado entre snapshots. No desktop as alças aparecem no hover/foco; no mobile use Menu → Organizar HUD → Concluir organização. Atalhos usam apenas a largura dos itens disponíveis; o clássico mantém sete espaços de habilidade visíveis, inclusive vazios.

O padrão visual aprovado é Pixel atual em 5%, contornos ligados na força original (100%), terreno em blocos voxel, arredondamento em 100% e raios em 45%. Preferências já salvas são respeitadas. Visual e iluminação permite mostrar ou esconder barras de HP sobre unidades em todos os modos, sem ocultar os vitais fixos do jogador. Força dos contornos vai de 0% a 200%; em 100% executa o shader original sem alterações. Barras usam cores sem iluminação, moldura escura e escala limitada de distância.

Chuva e partículas ambientais usam células fixas no mundo com identidades determinísticas. Pan dentro da célula conserva as poses; atravessar uma borda recicla somente a coluna que saiu do campo. Folhas mantêm fase vinculada ao emissor, não ao índice na lista.

Clicar em unidade abre uma ficha flutuante, movível pelo título e fechável, com números reais, atributos, estados, habilidades e fraquezas disponíveis no snapshot/catálogo do modo. A ficha não pausa o jogo nem toma controle do mapa. Névoa de guerra e segredos de Phase Killer continuam protegidos. O guia de primeira habilidade abre Técnicas e seleciona a habilidade atual.

A mochila flutuante tem largura máxima de 290px, espaços de até 72px e ícones de até 64px. A restauração remove dimensões de arrastos antigos antes de medir o conteúdo; resize e layouts salvos passam pelo mesmo limite. Construir é um comando do personagem capaz de construir, na sua barra, e não um atalho global do painel lateral.

## Terreno e área física de unidades

O mesmo atlas pequeno agora cobre os solos de Castle Fight, Tree Tag, Kodo Tag, Warlock, Phase Killer, Dungeon e Bloody Tournament. IDs nativos de relva, terra e calçamento são reconhecidos; campos, trilhas e praças podem selecionar materiais por célula/vértice. Grama usa tufos sem juntas, terra tem grãos e sulcos, pedra conserva calçamento, gelo apresenta rachaduras e lava combina crosta com veios emissivos. Água conserva sua apresentação. O atlas é compartilhado e liberado por contagem de referências; nenhuma camada de terreno ou draw call foi acrescentada.

`shared/unit-footprint.js` define círculos físicos em metros do mundo. Seleção, hover e alvo RTS usam o mesmo raio da navegação/colisão, compensando a escala do modelo uma única vez; a borda da seleção fica dentro desse limite. O clássico foi calibrado pelo espaço dos pés/corpo, excluindo armas, caudas e asas; Fenrir tem base própria. Perfis nativos e raios explícitos continuam usando suas medidas reais. Unidades aliadas atravessam umas às outras; inimigos e obstáculos continuam sólidos, com varredura de contato para impedir travessia durante caminhada. Teleportes, fantasmas, camadas de voo, dimensões e arenas separadas preservam suas regras específicas.

## Água, terra, clima e lava

Água líquida tem simulação visual própria com 512 partículas, pressão/densidade, viscosidade entre vizinhos, gravidade e colisão com piso/obstáculos. Spatial hash, 48 vizinhos por partícula e até seis passos fixos de 1/60 limitam o trabalho. Água e espuma usam dois lotes; as fissuras e fragmentos de terra usam outros dois. Water Ball/Deluge são identificados pelos IDs para não herdar a aparência de gelo de seu elemento adaptado. Dano, SP e elementos do servidor continuam autoritativos. A admissão do efeito determina se o fallback pode ser suprimido; reset de mapa/teleporte libera a simulação visual.

Frentes de clima duram 90 s e deixam a maior parte do tempo seco; estações variam a cada 360 s. Bioma e seed disponíveis no snapshot determinam o plano, sem relógio real ou RNG de gameplay. Chuva/neve entram gradualmente; nuvens mudam a luz e os raios após a atualização dia/noite. Interiores, brasas e névoa ambiental mantêm suas regras próprias. O nome do clima no HUD acompanha o plano atual.

Warlock recebe oito pequenas ilhas reais na lava, determinísticas por rodada. Segurança, dano de lava, teleporte, impulso e IA usam o mesmo chão; elas encolhem e colapsam com o limite da arena, evitando refúgio permanente. Chamas baixas e fagulhas destacam a borda em três lotes. Contato real com lava publica `wlLavaContactUntil`, que liga o fogo volumétrico do corpo e expira ao voltar a terreno seguro. O campo de imunidade Lava Treads continua independente.

O meteoro de Warlock usa uma rocha esferoidal irregular com crosta, fissuras incandescentes, chamas distribuídas pela superfície, cauda oposta à queda e estilhaços no impacto. Três lotes fixos atendem até oito quedas e oito impactos, sem luzes extras; o dano, raio e instante de impacto permanecem iguais. O emissor legado do coliseu também obedece às frentes sazonais, evitando chuva permanente por cima do clima global.

## Magias elementais de Warlock

O impacto de Meteoro deixa fogo no chão por 4 s no raio anunciado. Entrar aplica uma queimadura de 2 s, renovada durante o contato, a 3 PV/s em pulsos de 0,5 s. Áreas sobrepostas renovam a mesma queimadura; não multiplicam seu dano nem empurram a cada pulso. A rodada seguinte limpa fogo e gelo. O dano inicial do meteoro permanece igual.

Parede de fogo, Parede de gelo e Lança glacial são adições desta adaptação, identificadas como `browserExtension`; os 30 feitiços nativos continuam separados no catálogo. A parede de fogo empurra para o lado de entrada, limita impulsos repetidos por alvo e aplica queimadura; a de gelo reflete projéteis e não aplica Frost nem lentidão por contato. A lança de gelo causa dano no primeiro inimigo atingido e aplica 40% de lentidão. Aliados e o conjurador não recebem esses efeitos hostis.

As paredes medem 4,2 / 4,9 / 5,6 / 6,3 / 7 m nos níveis 1–5, ficando 40% menores inicialmente e chegando a 100% no máximo. A espessura é 0,7 m e o alcance é 14 m. A roda ou os botões da mira giram 15°; clique coloca, Esc ou botão direito cancelam. Prévia e servidor usam o mesmo ângulo tangente e comprimento; a detecção varre a travessia entre passos. A navegação continua atravessável, com repulsão no fogo.

O estilo de gelo facetado é compartilhado pelos projéteis, impactos, campos e barreiras de todos os modos. Vapor usa até 256 partículas em posições históricas do mundo, com 1,6 s de vida, expansão e dissipação, sem nova emissão durante pausa. Water Ball e Deluge permanecem líquidos. Barreira de Fogo do Ragnarok reutiliza as novas chamas preservando seus números e sua zona autoritativa; Ice Wall usa seu diâmetro e orientação visual estável.

Combinações Warlock: uma bola de fogo que cruza uma parede do próprio dono renova o alcance normal a partir do contato, cresce 30% e causa 20% a mais de dano. O dano/tamanho são ampliados uma única vez por projétil, e a mesma parede não renova alcance a cada frame. Uma lança glacial que atinge qualquer parede de gelo a despedaça, consome o projétil e deixa uma faixa de 2,1 m de largura por 5 s. Exposição contínua de 1,5 s congela por 1,5 s e impede movimento/conjuração; sair limpa o acúmulo, e cada faixa congela a mesma unidade uma vez.

A parede de gelo de Warlock intercepta todos os projéteis móveis, incluindo os perfurantes, de controle e os orbes de retorno, pelo contato varrido com toda a extensão da barreira. O disparo é refletido pela normal da face atingida, inclusive nas extremidades de paredes giradas, sem destruir a parede. Velocidade, dano e alcance restante são preservados. Disparos comuns recebem dono/equipe da parede e podem atingir o conjurador original; famílias com vínculo próprio preservam sua identidade. A lança glacial mantém a exceção da combinação: despedaça a parede e produz a faixa congelante. Paredes expiradas ou disparos fora das extremidades não interceptam.

O contato com a parede de fogo dá um recuo de 0,85 m em cerca de 0,12 s, para o lado de entrada. Esse recuo breve tem distância limitada e prevalece sobre caminhada durante sua execução, sem acumular a velocidade de lançamento dos outros ataques. Pode repetir após 0,75 s de novo contato; aliados continuam seguros e a queimadura é preservada. Colisão com unidades e pilares continua válida durante o recuo.

As esculturas da parede de gelo ficaram cerca de 20% mais altas. O vapor tem uma única emissão histórica compartilhada: partículas translúcidas nascem no corpo da barreira, saem em direções variadas, crescem e perdem opacidade durante 1,6 s. A emissão esparsa evita a antiga faixa branca condensada; câmera e fonte não arrastam as partículas já emitidas. Mantém o orçamento existente de dois lotes e nenhuma luz adicional.
