# Custom Hero — Coliseu das Mil Formas

Jogo independente para navegador, com combate RTS e animais voxel originais. Arte sem texturas, cores de vértice, corpos agrupados, terreno e plateia instanciados. Movimentos usam clipes de poses pré-calculadas a 8 Hz; não é um pipeline de Blender/VAT.

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

40 técnicas, cada uma com cinco níveis. Sete espaços; evoluir uma técnica não ocupa outro espaço. O herói começa com sua técnica de clã no nível 1. Cada nível ganho concede **1 ponto de habilidade**, que aprende uma técnica ou sobe um nível de uma existente. Não exige ouro, mercado aberto nem nível mínimo adicional. O limite é cinco; alterações são validadas pela simulação, inclusive em batalha. Valores históricos documentados de Warcraft III são a base de parte do catálogo; níveis adicionais e técnicas originais são identificados. Veja `docs/REFERENCE.md` para fontes e diferenças.

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

21 itens, equipamentos e consumíveis. Inventário de **seis espaços**, sem mochila oculta. Potes iguais acumulam até três cargas por espaço; precisam ser ativados e compartilham recarga de dez segundos. Vida: 300, mana: 200 (valores próprios). **Equipamentos têm cinco níveis.** Clique num equipamento da mochila para abrir a forja, comparar os bônus e melhorá-lo com ouro no mercado. A melhoria preserva o espaço e não consome estoque de outro exemplar. Os preços crescem por nível; poções continuam com cargas, sem upgrade. Shift + clique vende por metade do ouro efetivamente investido (item + melhorias), somente no mercado. Resistências de equipamento somadas são limitadas a 90%; multiplicadores críticos usam o maior, sem somar exemplares.

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

Na aba **Itens**, os botões Ferreiro, Encantadora e Vender abrem os serviços do mercado. Vender tem botão explícito e mostra o ouro devolvido; funciona para equipamentos e todas as cargas de um consumível. A mochila continua com seis espaços.

Armas, arcos e cajados aceitam um encantamento: fogo aplica queimadura, gelo aplica frost e veneno aplica dano gradual. Efeitos crescem com o nível da arma. A compra e a substituição custam ouro no mercado; o custo entra no investimento para a venda. Só o acerto primário aplica; ricochete e Cleave não repetem o proc, e o mesmo tipo de dano gradual renova a duração mantendo o pulso e o dano mais forte. INT, crítico e lifesteal não multiplicam esses danos. A proteção contra fogo também reduz queimadura de encantamento. Uma gema colorida identifica a arma encantada.

Vitalidade concede regeneração percentual a cada dez pontos totais, inclusive de equipamento: `hpRegen = 1.5 + VIT × 0.03 + maxHP × floor(VIT/10) × 0.001`. Heróis mortos não regeneram. A taxa total e a parcela percentual aparecem na aba Herói.

## Bestas, espólios e novas técnicas

O bestiário inclui leão (onda4), rinoceronte(7), grifo(12), quimera(18), dragão(25) e esfinge(32), mantendo a fauna anterior. Modelos, tamanhos e silhuetas são próprios. Bestas especiais usam rugido, investida, mergulho elétrico, nuvem venenosa, sopro de fogo ou carapaça. Ativos têm avisos antes da execução. Provas concorrentes usam a mesma composição, também para essas espécies.

Bestas normais especiais têm15% de chance de deixar sua técnica; minichefes50%, chefes100%. O fragmento pertence ao herói escolhido pela simulação e dura90segundos. Clique no livro dourado no chão, no botão **Espólios** ou pressione **L**. Você pode ocupar um espaço livre ou escolher explicitamente uma das sete técnicas para substituir; a nova entra no nível1. Fragmentos repetidos elevam a técnica em um nível até5. Não gasta pontos, e as melhorias seguintes também podem usar os pontos de habilidade normais. A loja não permite aprender essas seis técnicas do zero. O servidor valida dono, fragmento, fase, vida e espaço.

Orbe de Brasa e Orbe de Geada são projéteis reais inspirados no posicionamento de Warlock: percorrem o campo, colidem com obstáculos e primeiro alvo válido e respeitam provas separadas. Fúria é um buff de dano/velocidade com corpo avermelhado e aura; não altera os atributos distribuídos. Roubo de vida usa uma corrente de fragmentos do alvo até o herói; críticos usam números vermelhos e impacto ampliado.

## Equipamentos com efeitos

Lâmina do sol errante (inspiraçãoRadiance) causa dano de fogo em área; Bobina da tormenta(Maelstrom) tem proc de relâmpagos; Couraça do contragolpe(BladeMail) reflete dano recebido durante uma janela ativa; Relicário do recomeço(Mekansm) cura aliados próximos. São números e artes próprios, sem promessa de reprodução de um patch. O efeito mais forte de aura solar de uma mesma equipe prevalece, sem somar cópias; os raios não repetem encantamentos ou procs. Os ativos usam as teclas1–6 ou clique no item durante a batalha e compartilham recarga por tipo no herói. No mercado, o clique continua abrindo a forja.

Os estados persistentes usam shaders sem texturas: fogo/brasas, geada/cristais e veneno, em até3drawcalls por ator, animação em8Hz e orçamento de48atores próximos. Até12 atores recebem rótulos, e a faixa do herói mostra duração dos estados. Frost representa lentidão, não congelamento imóvel. A arte está documentada em `docs/ART_DIRECTION.md`.
