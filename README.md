# Custom Hero — Pátio dos Nove Reinos

Jogo independente para navegador, com combate RTS e animais voxel originais. Arte sem texturas, cores de vértice, corpos agrupados, terreno e plateia instanciados. Movimentos usam clipes de poses pré-calculadas a 8 Hz; não é um pipeline de Blender/VAT.

## Jogos e novas regras

O menu separa **Custom Hero Survival** e **Custom Hero Line Wars**. Survival conserva campanha, Best of All, torre cooperativa e guerra de equipes; Line Wars começa com um modo de linhas e casinhas. A direção de arte é nórdica, mantendo os animais e misturando bestas de outras mitologias. Nomes e ilustrações são originais; isso é uma adaptação, não a reprodução verificada de um patch histórico.

Campanha e Best of All dão a cada competidor um cenário físico separado, inclusive no mercado. Equipes compartilham sua arena; cooperação compartilha o campo. O cliente mostra a instância local e converte os comandos de volta para as coordenadas do servidor. Os rivais se reúnem somente nos confrontos PvP. Ao passar o mouse, o nome aparece acima da vida com a cor da equipe: vermelho, azul, amarelo, ciano e magenta.

Cada técnica pode pertencer a **um único herói por partida**. Melhorar a própria técnica continua permitido; substituí-la libera a antiga. A primeira técnica também respeita a reserva global, então escolher o mesmo animal pode dar uma técnica inicial disponível diferente. Técnicas de monstros e invocações não consomem reservas de jogadores.

Espólios têm cinco raridades: Comum, Raro, Épico, Lendário e Heroico. A potência cresce em 0/5/10/15/20%, incluindo dano, cura, invocações, passivas, barreiras e alcance de deslocamentos; técnicas ativas também recarregam proporcionalmente mais rápido. A raridade não aumenta a duração de atordoamentos nem muda as fórmulas de atributos. Um fragmento superior pode melhorar a raridade de uma técnica que já está N5. Reciclar rende 1/2/3/5/8 essências. Se já conhece a técnica, pode convertê-la em um tomo físico de 40/70/110/180/280 XP: ele ocupa a mochila e é consumido no mercado. Herança de nível por essências não herda a raridade anterior.

Skuld é a sexta comerciante e grava **22 runas permanentes** no equipamento. Chances por serviço: 60% Comum, 25% Raro, 10% Épico, 4% Lendário e 1% Heroico. Elas coexistem com as imbuições de Freya e continuam após melhorias. Há raios encadeados, frost, veneno, roubo de vida, rastros de fogo em botas e pactos de grande dano com custos reais de vida, mana, mobilidade ou vulnerabilidade. Regravar paga novamente e substitui a runa anterior. Consulte `docs/PERMANENT_ENCHANTS.md`.

Chefes alternam círculos, anéis com centro seguro, cones e faixas de arena. A área é preenchida em vermelho e o impacto só ocorre após 2,2s; sair da forma evita o golpe, e atordoar o chefe interrompe o ritual. As oito técnicas nórdicas novas incluem quatro famílias de invocações independentes: corvos, bodes, lince e cão espectral, além dos lobos existentes.

Line Wars usa 16 receitas inspiradas em papéis das quatro raças de Warcraft III. Cada defensor tem sua linha, 30 vidas e renda a cada 10s. Clicar na própria casinha adiciona uma tropa à fila FIFO, mesmo sem ouro ou durante a recarga. O envio automático cobra ouro e aumenta renda quando houver recursos e espaço na próxima linha inimiga viva. A fila permite cancelar entradas. Cada casinha mostra retrato, nome, preço e prévia de atributos antes do clique. Invasores que atravessam o portal removem vidas; o último portal vivo vence. Há fonte de recuperação, colisões por tamanho, observação da linha rival pelos avatares, limite de tropas, renascimento e IA, com os mesmos heróis, habilidades e equipamentos. Consulte `docs/LINE_WARS.md` para regras, fontes e diferenças da referência.

## Executar

Requer Node 22.12+ ou 24:

```sh
npm install
npm run dev
```

Abra a URL local exibida pelo Vite. Para multiplayer na rede local, em outro terminal:

```sh
npm run server
```

Entre com o mesmo código antes da primeira onda. A primeira pessoa define modo e arena inicial. Campanha, torre e Best of All têm até quatro heróis. Na guerra, forme parties completas de 2 ou 5, selecione de 2 a 5 equipes e um confronto a cada 5 ou 10 ondas. O treino preenche as vagas com IA, identificada na interface. A fila online só reúne parties reais do mesmo formato. O projeto não modifica firewall.

## Campanha

1. Mercado inicial: 1.100 ouro e seis pontos de atributo. Os bots começam compras após 12 segundos; os diálogos pausam o treino.
2. 50 ondas, com intervalo de sete segundos e recuperação parcial entre ondas. Vida/mana completas ao começar cada bloco de cinco.
3. Após as ondas 5, 10, …, 45: três alvos privados por competidor, limite de 45s. Tempos reais determinam a ordem. Prêmios: 500, 380, 260 e 140 ouro; quem não termina não ganha prêmio.
4. Mercado reabre depois do bônus; estoque compartilhado é reposto uma vez por visita. Quem compra primeiro esgota o item. Online, o servidor valida todas as compras.
5. Após a onda 50: vida/mana restauradas e todos contra todos. Último sobrevivente vence. Aos 60s começa dano de morte súbita; aos 120s, se necessário, decide a maior proporção de vida restante.

## Outros modos de competição

- **Torre sem fim:** equipe cooperativa; minichefe nos andares 5, 15, 25… e chefe em 10, 20, 30… Mercado a cada cinco. Caídos retornam se os aliados vencerem o andar; todos caírem encerra a tentativa. Padrão infinito, com metas opcionais de 50 ou 100 andares.
- **Best of All:** cada herói disputa sua área e seus inimigos. As provas têm limite de 180s. Cada conclusão rende `round(1000 × max(0, 1 − tempo/180) + 500 × fração_de_vida)`; falha vale zero. PvP todos contra todos a cada dez ondas. Após 50 ondas, vence a pontuação acumulada.
- **Guerra de equipes:** provas separadas por equipe; de 2 a 5 equipes de 2 ou 5 heróis. PvP a cada 5 ou 10 ondas num campo de 54 × 54, com pilares procedurais e terreno de lava, gelo, frio, água e armadilhas. Água reduz movimento; armadilhas avisam por 1,5s e disparam em ciclos de 6s. Movimento, Blink e puxões respeitam limites; A* encontra caminhos ao redor de obstáculos. Equipes ficam aliadas no PvP. Pontos somam por equipe e decidem após 50 ondas.

Nos confrontos dos modos Best/war, vencedores recebem 1.000 pontos e 350 ouro por herói. Os demais recebem entre 100 e 800 pontos conforme a ordem de eliminação individual (Best) ou da equipe (guerra), igualmente para os membros. Aos 60s começa morte súbita; aos 120s há desempate pela proporção de vida (somada por equipe). O botão **Competição** explica as regras e mostra placar e resultados.

### Parties e busca real

Escolha Guerra → tamanho da equipe, quantidade de equipes e intervalo → Criar party. Amigos escolhem Guerra → informam o código → Entrar na party. O líder só pode buscar com a equipe completa. A fila agrupa parties com o mesmo formato e inicia a partida quando reúne todas; ninguém é substituído silenciosamente por bot. Sair cancela a busca, e a liderança passa ao próximo integrante. Desconectar de uma partida ativa deixa seu herói com IA até o fim. A fila é em memória no processo Node; reiniciar o processo a limpa. Ainda não existe serviço público nem persistência de conta.

## Técnicas, atributos e equipamentos

52 técnicas, cada uma com cinco níveis. Sete espaços; evoluir uma técnica não ocupa outro espaço. O herói começa com sua técnica de clã no nível 1. Cada nível ganho concede **1 ponto de habilidade**, que aprende uma técnica ou sobe um nível de uma existente. Não exige ouro nem mercado aberto. Ultimates exigem nível mínimo para aprender e evoluir; veja os requisitos no catálogo. O limite é cinco; alterações são validadas pela simulação, inclusive em batalha. Valores históricos documentados de Warcraft III são a base de parte do catálogo; níveis adicionais e técnicas originais são identificados. Veja `docs/REFERENCE.md` para fontes e diferenças.

Cada nível dá `5 + floor(nível/5)` pontos de atributo. O custo depende do próximo valor **base**: até 10 custa 1, de 11 a 20 custa 2, de 21 a 30 custa 3 etc. Fórmula: `1 + floor(valor_base_atual/10)`. O limite base é 99. Equipamentos contam nos bônus/marcos, mas não encarecem a distribuição. As fórmulas abaixo são as regras próprias pedidas para este jogo, inspiradas em Ragnarok, não uma reprodução de um patch de RO.

| Atributo | Regra |
|---|---|
| STR | +1,2 ATQ físico por ponto; +5% dano físico por dez pontos |
| INT | +2,5% poder mágico por ponto; +8 mana por ponto; +0,8 mana/s por seis pontos |
| DEX | +1,5 ATQ físico à distância por ponto; +0,5% precisão por ponto e +2% por cinco pontos |
| LUK | +1% crítico por três pontos; +1% esquiva perfeita por dez pontos (DEX não reduz) |
| VIT | +20 vida por ponto; +1 armadura por cinco pontos; +0,1% da vida máxima/s por dez pontos (somado à regeneração base) |
| AGI | +1% velocidade de ataque e +0,3% esquiva comum por ponto; +5% velocidade de ataque extras por dez pontos |

Ataques comuns testam precisão menos esquiva e clima. Esquiva perfeita tem teste independente antes do crítico e pode evitá-lo; aparece como Lucky em verde. Precisão não reduz essa chance. Críticos ignoram apenas o teste comum. Esquiva comum é limitada a 45% (perfeita: 35%), crítico a 80% e velocidade de ataque a 3×. Crítico usa o maior multiplicador disponível, com chance somada. Armadura física positiva: `dano / (1 + 0.06 * armadura)`. Dano mágico é ampliado por INT e pelo elemento/clima.

23 itens, equipamentos e consumíveis. Inventário de **seis espaços**, sem mochila oculta. Potes iguais acumulam até três cargas por espaço; precisam ser ativados e compartilham recarga de dez segundos. Vida: 300, mana: 200 (valores próprios). **Equipamentos têm cinco níveis.** Clique num equipamento da mochila para inspecionar seus bônus e caminhar até o ferreiro. A melhoria com ouro exige conversar com Nico perto da forja. A melhoria preserva o espaço e não consome estoque de outro exemplar. Os preços crescem por nível; poções continuam com cargas, sem upgrade. Shift + clique vende por metade do ouro efetivamente investido (item + melhorias), somente no mercado. Resistências de equipamento somadas são limitadas a 90%; multiplicadores críticos usam o maior, sem somar exemplares.

## Arenas e clima

Pode-se escolher a arena inicial; a sequência muda a cada dez ondas, passando pelas cinco:

- Jardins de Aurélia: chuva leve e +10% mana/s.
- Caldeira de Obsidiana: lava queima por 3s mesmo após sair; fogo +20%, gelo −15%.
- Coroa da Geada: gelo com inércia; zonas frias causam frost, −45% movimento e dano gradual. Gelo +20%, fogo −15%.
- Terraço dos Trovões: movimento −10%, eletricidade +20%; raios têm aviso no chão de 2s.
- Anfiteatro Lunar: precisão comum −5%, esquiva +2%, cristais de frost.

Perigos afetam heróis e inimigos, e ficam inativos nos intervalos/mercado. Obsidiana protege de queimadura; cachecol polar protege do frio. Clique no indicador de clima para consultar as regras. A plateia usa animações pré-calculadas para pular e levantar braços em críticos, explosões e marcos.

## Controles e diálogos

- Direito: mover/atacar. A + clique: atacar ao mover. M + clique: mover. S: parar/interromper canalização. H: manter posição.
- Q W E R D F C: técnicas. 1–6: consumíveis. I: atributos.
- Roda: zoom. Meio + arraste: girar. Shift + meio: deslocar. Setas: deslocar. Espaço/F1: centralizar.
- Guia, F2 ou `?`: modal completo de atalhos.
- Diálogo: texto gradual; **Mostrar tudo** completa a fala; **Continuar** avança. Enter/Espaço revela primeiro e avança quando completo. Esc fecha/cancela. Preferência de movimento reduzido mostra o texto imediatamente.

Orfeu narra os marcos. Solo pausa durante diálogos/modais; online não pausa a sala. Hall da Fama guarda as dez melhores tentativas e builds neste navegador, sem ranking global ou comprovação no servidor.

## Consistência de estado

- `shared/simulation.js`: única autoridade das regras, tanto no solo quanto no servidor.
- `shared/catalog.js`, `shared/stats.js`, `shared/arenas.js`: dados e cálculos compartilhados.
- `src/game-store.js`: estado central da sessão cliente; snapshot, jogador, conexão, simulação local, diálogo, pausa e mira.
- `src/shortcuts.js`: hook `useShortcuts` independente de framework, com contexto, bloqueio de campos editáveis, teclas de câmera e cleanup. O projeto não usa React.
- `src/typewriter.js`: apresentação do texto, sem modificar a simulação.
- `shared/competition.js`, `shared/modes.js`, `shared/field.js`: modos, pontuação, limites e navegação procedural.
- `shared/progression.js`: custos por faixa e pontos concedidos por nível.
- `server/matchmaking.js`: parties, fila por formato e formação de equipes reais.
- `src/view.js`, `src/battlefield.js` e `src/coliseum.js`: somente renderização e coleta de comandos.

Online, o cliente manda comandos e renderiza snapshots a 10 Hz (simulação a 30 Hz). Não decide estoque, XP, pontos, dano ou vencedores. O store cliente não é um segundo motor de regras.

## Validação e publicação

```sh
npm test
npm run build
```

Os testes incluem rede WebSocket real com disputa pelo último item e formação de uma partida por duas parties, modos, pontuação, isolamento, 25 heróis, obstáculos, navegação, Blink/troca/barreira/repulsão/ricochete, pontos/custos, clima, consumíveis, determinismo, diálogo e atalhos. Uma campanha completa com bots verifica o fluxo até a final; testes de fluxo não comprovam equilíbrio competitivo.

`dist/` é o cliente estático. O servidor Node continua separado. Defina `VITE_SERVER_URL=wss://seu-servidor` antes de compilar para jogar pela internet. Hospedar só o cliente não hospeda o multiplayer. Ainda faltam autenticação, reconexão, observação de partidas, ranking global e testes de carga/latência. Os controles ainda não incluem grupos, filas por Shift ou microcontrole individual de invocações.

## Feedback e revisão visual

As mudanças confirmadas pela simulação exibem cards de aprendizado, upgrade (antes→depois), equipamento, nível e atributos. Ganhos de ouro são agregados e pulsam na carteira; o cliente online só confirma após o snapshot do servidor. Ilustrações SVG originais usam facetas e luz/sombra, sem texturas externas. Efeitos distinguem cura, explosão, nevasca, repulsão, gravidade, Cleave e ricochete. Estrelas indicam atordoamento, anel azul indica frio e anel lilás indica escudo. Partículas e cards têm limites; movimento reduzido desliga animações de interface.

A revisão dos agentes de game design, UI/UX e jogabilidade está consolidada em `docs/BALANCE.md`. As regras dos atributos foram preservadas.

## Ferreiro, venda e encantamentos

As compras acontecem nas cinco lojas físicas do mercado. Clique no NPC (botão esquerdo ou direito), ou pressione G para o mais próximo: o herói caminha até ele e a conversa só abre ao chegar. A lateral contém ficha, evolução de técnicas e crônica; não há loja remota. Vender tem botão explícito e mostra o ouro devolvido; funciona para equipamentos e todas as cargas de um consumível. A mochila continua com seis espaços, agora sempre visíveis no HUD junto do herói e das técnicas. Clique ou use 1–6 para ativar itens; os ícones mostram nível, cargas, encantamento e recarga.

Armas, arcos e cajados aceitam um encantamento: fogo aplica queimadura, gelo aplica frost e veneno aplica dano gradual. Efeitos crescem com o nível da arma. A compra e a substituição custam ouro no mercado; o custo entra no investimento para a venda. Só o acerto primário aplica; ricochete e Cleave não repetem o proc, e o mesmo tipo de dano gradual renova a duração mantendo o pulso e o dano mais forte. INT, crítico e lifesteal não multiplicam esses danos. A proteção contra fogo também reduz queimadura de encantamento. Uma gema colorida identifica a arma encantada.

Vitalidade concede regeneração percentual a cada dez pontos totais, inclusive de equipamento: `hpRegen = 1.5 + VIT × 0.03 + maxHP × floor(VIT/10) × 0.001`. Heróis mortos não regeneram. A taxa total e a parcela percentual aparecem na aba Herói.

## Bestas, espólios e novas técnicas

O bestiário inclui leão (onda4), rinoceronte(7), grifo(12), quimera(18), dragão(25) e esfinge(32), mantendo a fauna anterior. Modelos, tamanhos e silhuetas são próprios. Os 23 perfis variam movimento, intervalo de ataque, dano, precisão, esquiva e crítico. Cada espécie tem porte próprio; chefes são maiores. Provas concorrentes recebem os mesmos perfis e técnicas, sem variar a dificuldade por jogador.

Animais normais não têm habilidades; especiais têm uma; minichefes e chefes recebem até cinco, conforme o nível. Todas as 52 técnicas podem aparecer, inclusive passivas, auras e invocações. As técnicas usam nível 1 nos níveis de monstro 1–10, nível 2 em 11–20, até nível 5 em 41+. Cada chefe recebe no máximo uma técnica de controle forte e uma de sustentação. Os ativos usam mana, recarga e aviso de 0,7–0,95s antes da execução, permitindo interromper com atordoamento. Empurrões, puxões, lentidão e stun afetam o combate e respeitam os limites do campo.

Clique esquerdo em qualquer personagem para consultar sua ficha, ou pressione **T** para alternar os inimigos: a aba **Alvo** mostra vida, nível, tamanho, estatísticas atuais, habilidades, recargas e tipos de controle. A seleção não altera as ordens do herói. A arena comum cresceu de 28 para 32m entre os limites laterais, com cantos arredondados; o campo de guerra passou de 54 para 60m. Cenário, plateia e câmera acompanham a ampliação.

Bestas especiais têm 15% de chance de deixar uma das técnicas que realmente possuíam; minichefes 50%, chefes 100%. O fragmento pertence ao herói escolhido pela simulação e dura 90 segundos. Clique no livro dourado no chão, no botão **Espólios** ou pressione **L**. Você pode ocupar um espaço livre ou escolher explicitamente uma das sete técnicas para substituir; a nova entra no nível 1. Fragmentos repetidos elevam a técnica em um nível até 5. Não gasta pontos, e as melhorias seguintes também podem usar os pontos de habilidade normais. Seis técnicas de monstros só podem ser aprendidas inicialmente por fragmentos. O servidor valida dono, fragmento, fase, vida e espaço.

Orbe de Brasa e Orbe de Geada são projéteis reais inspirados no posicionamento de Warlock: percorrem o campo, colidem com obstáculos e primeiro alvo válido e respeitam provas separadas. Fúria é um buff de dano/velocidade com corpo avermelhado e aura; não altera os atributos distribuídos. Roubo de vida usa uma corrente de fragmentos do alvo até o herói; críticos usam números vermelhos e impacto ampliado.

## Essências e renovação de técnicas

Abra **Espólios** para reciclar um fragmento indesejado em uma **Essência de técnica**, sem ouro. Depois que os sete espaços estiverem no nível 5, cada ponto de habilidade excedente também pode ser convertido em uma essência. Com três essências, revele três técnicas que ainda não conhece, incluindo as exclusivas de bestas. Escolha uma para um espaço livre (nível 1) ou para substituir uma técnica conservando o nível daquele espaço. As outras ofertas são descartadas. Revelar novamente custa mais três essências e substitui as ofertas anteriores. O limite continua sendo sete técnicas de cinco níveis, e a escolha não altera atributos.

O servidor valida saldo, dono e expiração do fragmento e cada escolha; uma mesma recompensa só pode ser consumida uma vez. Trocar uma técnica preserva as recargas pendentes e encerra os buffs próprios da técnica removida. A janela de escolhas permanece aberta enquanto os contadores de expiração atualizam.

## Equipamentos com efeitos

Lâmina do sol errante (inspiraçãoRadiance) causa dano de fogo em área; Bobina da tormenta(Maelstrom) tem proc de relâmpagos; Couraça do contragolpe(BladeMail) reflete dano recebido durante uma janela ativa; Relicário do recomeço(Mekansm) cura aliados próximos. São números e artes próprios, sem promessa de reprodução de um patch. O efeito mais forte de aura solar de uma mesma equipe prevalece, sem somar cópias; os raios não repetem encantamentos ou procs. Os ativos usam as teclas1–6 ou clique no item durante a batalha e compartilham recarga por tipo no herói. No mercado, o clique continua abrindo a forja.

Os estados persistentes usam shaders sem texturas: fogo/brasas, geada/cristais e veneno, em até3drawcalls por ator, animação em8Hz e orçamento de48atores próximos. Até12 atores recebem rótulos, e a faixa do herói mostra duração dos estados. Frost representa lentidão, não congelamento imóvel. A arte está documentada em `docs/ART_DIRECTION.md`.

## Serviços físicos do coliseu

| NPC | Local | Serviço |
|---|---|---|
| Brás | Arsenal dos seis clãs | Equipamentos e relíquias |
| Cora | Botica | Poções e consumíveis |
| Orfeu | Biblioteca | Livros de 80 ou 200 XP |
| Nico | Forja | Melhorias de equipamento até nível 5 |
| Faísca | Ateliê | Encantamentos de armas |

Todos podem comprar seus itens de volta, por metade do investimento. A interação começa a 2,7m; a conversa aceita uma margem de 35cm para pequenos empurrões de outros heróis e fecha ao sair dela. Mover manualmente ou começar uma prova encerra o atendimento. O servidor valida posição, NPC correto, fase, ouro e estoque, inclusive para bots. Livros ocupam espaços/cargas da mochila e só podem ser usados na preparação; concedem XP, níveis e pontos normais e não usam a recarga das poções.

## Voo e afinidades

O catálogo especial tem 11 espécies. Valquíria-coruja, harpia, fênix, serpente alada de gelo e basilisco completam o bestiário. Grifos e dragões agora voam. As asas são grupos 3D separados do corpo e usam oito poses pré-calculadas; altura e oscilação acompanham a espécie, com sombra e seleção no chão. Voadores evitam lava, gelo, água e armadilhas de chão, mas continuam sujeitos a raios, efeitos aplicados e ataques/habilidades de todos os heróis. Pilares e limites continuam bloqueando a movimentação.

Criaturas elementais têm resistências leves e fraquezas próprias. Isso não modifica as fórmulas dos atributos do herói. O dano básico elemental foi calibrado para compensar o fato de não usar armadura física; a campanha completa é verificada por um teste de fluxo assistido; os testes autônomos verificam ações e determinismo, sem garantir vitória dos bots.

## Terreno e técnicas automáticas

O botão **Mapas** abre o editor de imagem/altura para matriz voxel, com correção manual, prévia 3D, importação/exportação JSON e validação de rotas. O cenário padrão adapta o corredor superior do terreno W3E e passagem WPM de CHLW v1.6a; o anexo de mercado é próprio. Não é a reconstrução integral do mapa. Consulte `docs/MAP_IMPORT.md`.

Botão direito numa técnica ativa alterna **AUTO**. A conjuração automática usa mana, recarga e alvos válidos, e respeita movimento e mira manual. Magias escalam com MATK, golpes físicos com ATK; há novas pegadas de fogo/gelo e auras mágicas. Consulte `docs/SCALING.md`.

O catálogo distingue técnicas disponíveis, em evolução, exclusivas de outro herói, sem pontos, sem espaço, apenas de espólio e no nível máximo. Sete **ultimates** exigem nível mínimo de herói (10,12ou15) e requisitos crescentes para cada melhoria; os bloqueios são validados também em espólios e descobertas. Consulte `docs/ULTIMATES.md`.
