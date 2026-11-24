# Polimento de ambientes, habilidades e interface

24/11/2026.

O pacote de ambiente tem 36 receitas voxel distintas em seis temas, com até 96 decorações e cinco lotes compartilhados. Colocação determinística respeita áreas jogáveis, pegadas de obstáculos e paredes de dungeon. Os objetos não entram em colisões ou alteram mapas da simulação. Folhas, insetos, névoa, brasas e vento usam tempo da simulação e poses discretas; não criam um material/objeto de cena por partícula. `voxelWeatherForState` resolve chuva, tempestade, vento, neve, faíscas e névoa nos modos.

Custom Hero ganhou 21 famílias de coreografia. Referências visuais originais da Blizzard estão em `CUSTOMHERO_SKILL_REFERENCES`; o código adapta suas silhuetas e movimentos para o mundo 3D. Os ingredientes de textura são locais, de Ragnarok, e não são apresentados como modelos ou animações extraídos de Warcraft III. Ataques básicos, regras de combate e avisos inimigos conservam suas rotas próprias. O renderer reserva a coreografia inteira antes de substituir a apresentação anterior e preserva o alfa do framebuffer HDR.

A HUD usa alças próprias para mover barras sem interceptar cliques de habilidade, itens ou joystick. Posições normalizadas ficam neste navegador por perfil, jogo e orientação, com limite de tela e restauração pelo menu. A lista de construção abre diretamente; o menu de pausa reúne configurações e retorno ao jogo. A configuração não sincroniza posições entre dispositivos.

## Comandos RTS

Todos os modos, com exceção de Ragnarok Survivors, usam `rts-target-feedback.js`. O alvo de ataque autoritativo recebe anel duplo, cantos sólidos e uma seta acima da cabeça; ataques automáticos podem usar o alvo do último evento real de ataque básico, com expiração. O hover sozinho não cria uma ordem de ataque. A prévia da habilidade reutiliza a geometria já desenhada (círculo, cone, corredor ou retângulo) e contorna inimigos vivos visíveis dentro do efeito; o círculo de alcance de lançamento não conta como dano em área. Névoa de guerra e relações entre equipes continuam respeitadas.

Ordens de movimento aceitas criam um marcador verde de 1,55 s com três setas e duas ondas. A apresentação possui três lotes e limite de 64 alvos, sem modificar materiais emprestados ou a simulação. A exclusão do Ragnarok conserva seus controles e marcadores próprios.

## Previsão com correção autoritativa

O transporte anterior já era cliente-servidor autoritativo com snapshots, não lockstep de atraso fixo. A opção negociada `movement-rollback-v1` adiciona números sequenciais aos comandos e confirmação privada por snapshot. Repetir o mesmo número não executa a ação novamente. A sequência é metadado de transporte: o cliente não escolhe tempo, dano ou posição aceita pelo servidor.

`src/movement-rollback.js` conserva uma base recebida e até 64 entradas locais por 500 ms. A cada atualização recebida restaura a base, retira entradas confirmadas e reexecuta as restantes, somente para apresentar a locomoção do próprio personagem. A extrapolação visual é limitada a 250 ms e para em conexão desatualizada, morte, oferta de melhoria, pausa ou troca de fase/mapa. Comandos de combate ou transações suspendem a previsão até confirmação. Snapshots, HP, SP, itens, inimigos, efeitos e RNG não são reexecutados nem alterados.

A primeira integração cobre **Ragnarok Survivors e os modos Custom Hero campanha, torre, Best of All e guerra de equipes**. Ragnarok usa a mesma função `stepRoMotion` do servidor, incluindo colisão, salto e inércia no gelo. Os modos RTS citados reutilizam navegação e colisão. Os demais modos conservam o transporte autoritativo anterior até terem adaptadores específicos para sua locomoção; não recebem uma aproximação que ignore seus mapas ou construção.

Reconexão limpa histórico e reinicia sequências. Clientes antigos continuam funcionando sem negociar o recurso; servidores antigos não anunciam suporte e o cliente apresenta snapshots normalmente. O servidor continua exclusivo para combate, economia, salas e persistência. Isto é previsão/reconciliação de movimento com rollback local, **não rollback completo de combate ou GGPO P2P**.

Referências de arquitetura: [previsão e reconciliação, Gabriel Gambetta](https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html), [guia original do GGPO](https://github.com/pond3r/ggpo/blob/master/doc/DeveloperGuide.md).

Verificação: testes de atraso e reexecução sobre correção, isolamento do estado autoritativo, colisões, pausa/reconexão, paridade real de locomoção Ragnarok e dois clientes WebSocket reais com confirmações, deduplicação e compatibilidade legada.
