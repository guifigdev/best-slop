# Custom Hero Line Wars — Portais dos Nove Fiordes

Segundo jogo independente, com dois a quatro jogadores em linhas isoladas. Cada herói protege seu portal e usa casinhas de recrutamento para enviar tropas à linha adversária escolhida ao visitar o campo rival. O visual nórdico usa os animais voxel originais do projeto. As fórmulas e a distribuição de atributos dos heróis continuam no sistema compartilhado.

## Referência e limites de fidelidade

Referência histórica do mapa: [arquivo da wiki Custom Hero Line Wars](http://customherolinewars.pbworks.com/). O terreno e a passagem do arquivo v1.6a foram consultados; o recorte voxel do corredor superior é preservado como referência histórica. O campo padrão atual, Portais dos Fiordes, é uma adaptação própria maior, com duas entradas e distrito lateral. A matriz e a proveniência estão em [MAP_IMPORT.md](MAP_IMPORT.md). Os valores de unidades e habilidades permanecem próprios. A mecânica de enviar tropas, desenvolver renda e defender linhas é a base desta adaptação; preços, unidades, escalas e regras abaixo são próprios e precisam de partidas humanas para balanceamento.

As quatro famílias de papéis militares são inspiradas nas unidades do guia clássico da Blizzard, consultado em 18/11/2026. Foram verificadas fontes primárias para [Footman](https://classic.battle.net/war3/human/units/footman.shtml), [Grunt](https://classic.battle.net/war3/orc/units/grunt.shtml), [Huntress](https://classic.battle.net/war3/nightelf/units/huntress.shtml) e [Crypt Fiend](https://classic.battle.net/war3/undead/units/cryptfiend.shtml). Seus índices também relacionam as demais unidades das respectivas raças. Cada receita guarda seu próprio link de referência no catálogo. Nenhum modelo, textura, sprite ou texto descritivo da Blizzard foi copiado.

## Partida e economia

- A preparação inicial permite escolher o herói e usar o mercado existente. A guerra começa quando o motor chama `initLineWars()` com pelo menos dois jogadores.
- Cada portal começa com 30 vidas. A renda começa em 20 moedas a cada 10 segundos, além do ouro inicial do herói.
- Um envio cobra seu preço imediatamente e aumenta a renda permanente do remetente. A renda não diminui quando a tropa morre.
- A interface usa o rival escolhido como alvo explícito. O destino é guardado em cada pedido e não muda quando a câmera muda. Pedidos de um alvo eliminado são cancelados sem custo. Os bots e comandos legados usam o próximo rival vivo no anel.
- Cada receita tem recarga própria por comprador, compartilhada entre todos os destinos. Cada casinha tem recarga de aproximadamente 1,8–5,7 segundos, conforme o preço. Há também um intervalo geral de 0,35 segundo entre envios do mesmo jogador.
- Cada linha admite até 32 invasores vivos. Um envio recusado por limite, preço, recarga ou proprietário não cobra ouro nem aumenta renda.
- As tropas nascem em `z=-12` e procuram o portal em `z=12`. Adquirem defensores próximos, sem perseguir indefinidamente um herói que abandone a estrada.
- Um invasor que atravessa o portal tira de uma a cinco vidas, conforme a receita. Não concede XP ou recompensa de morte ao defensor.
- Um herói derrotado retorna depois de cinco segundos se seu portal ainda existir. Sua base continua recebendo renda; o jogador pode enviar tropas durante a espera.
- Cada pagamento de renda também concede seis XP ao herói vivo, seguindo as regras compartilhadas de nível, atributos e pontos de habilidade. As recompensas por matar invasores são integradas no motor compartilhado.
- O último portal vivo vence. Quedas simultâneas de todos os portais terminam em empate.

As tropas sobem de nível conforme o tempo: `1 + floor(segundos / 30)`. Seus níveis de habilidade usam o mesmo marco dos monstros, até cinco. A vida cresce por um fator `1 + segundos / 300`; o ataque cresce por `1 + segundos / 600`. São parâmetros próprios de pressão progressiva, sem alterar atributos dos heróis.

## Casinhas e tropas

Todas as dezesseis receitas estão disponíveis desde o início; o preço limita os primeiros envios. Cada receita possui seu próprio perfil de alcance, movimento, ataque, proteção, tamanho e possíveis habilidades. Voo permanece atingível por todos os heróis, como no primeiro jogo.

| Clã | Animal original | Papel de referência | Custo | Renda adicional | Dano ao portal |
|---|---|---|---:|---:|---:|
| Sol | Pintinho escudeiro | Footman | 50 | 3 | 1 |
| Sol | Ouriço do fiorde | Rifleman | 80 | 4 | 1 |
| Sol | Rinoceronte juramentado | Knight | 250 | 11 | 2 |
| Sol | Grifo de Skadi | Gryphon Rider | 500 | 20 | 3 |
| Brasa | Javali da muralha | Grunt | 80 | 5 | 1 |
| Brasa | Sapo arpoador | Troll Headhunter | 80 | 4 | 1 |
| Brasa | Carneiro saqueador | Raider | 170 | 8 | 1 |
| Brasa | Leão dos monólitos | Tauren | 360 | 15 | 3 |
| Lua | Lebre das auroras | Archer | 45 | 3 | 1 |
| Lua | Lince da lua crescente | Huntress | 150 | 7 | 1 |
| Lua | Basilisco dos bosques | Dryad | 200 | 9 | 1 |
| Lua | Quimera da aurora | Chimaera | 600 | 25 | 4 |
| Névoa | Lobo da névoa | Ghoul | 40 | 3 | 1 |
| Névoa | Basilisco das runas | Crypt Fiend | 120 | 6 | 1 |
| Névoa | Tartaruga dos túmulos | Abomination | 320 | 14 | 2 |
| Névoa | Serpente da longa noite | Frost Wyrm | 750 | 30 | 5 |

O catálogo `shared/line-units.js` é a autoridade desses valores. As receitas usam modelos animais existentes e habilidades reais do catálogo compartilhado; o motor de combate resolve dano, esquiva, críticos, mana, recargas, efeitos e voo.

## Contrato de integração do motor

`shared/line-wars.js` exporta `LineWarsMethods`, para adicionar ao protótipo de `Game`. O modo deve usar `options.game='linewars'` ou `options.mode='linewars'` na aplicação, sem misturar regras de campanha.

1. Na transição da preparação, chamar `initLineWars()` em vez de criar uma onda. O método é idempotente e recusa menos de dois ou mais de quatro heróis.
2. O comando `{type:'sendLineUnit',building:id}` chama `sendLineUnit(player,command)` antes do bloqueio de comandos de heróis mortos. O proprietário da casinha é verificado pelo servidor; o cliente nunca informa preço ou renda.
3. Para alvos de Line Wars, delegar a `lineCanTarget(u,t)`: equipes diferentes, mesma `lineLane`, alvo vivo. Os heróis e suas invocações devem compartilhar a `lineLane`; os invasores têm a linha do defensor e `lineAttacker` identifica quem pagou por eles.
4. A aquisição automática de alvos não heróis deve usar `u.acquireRange ?? Infinity`. Invasores recebem alcance de aquisição seis, embora suas habilidades conservem as regras de alcance próprias.
5. Após movimento, colisões e combate, chamar `tickLineWars(dt)`. Ignorar as verificações de onda, bônus e final dos outros modos. O método cuida de renda, vazamentos, eliminação, renascimento e envios dos bots.
6. Ao matar um invasor, usar `t.lineBounty` como recompensa de ouro e conceder XP somente aos heróis da `lineLane` do alvo. Uma fuga não passa por `hit`, portanto não recebe recompensa de morte.
7. Adicionar `lineWars: snapshotLineWars()` ao snapshot. Este contém linhas, portais, renda, população, alvo atual, casinhas e recargas. Os campos do herói incluem `lineLane`, `lineRespawnAt` e `lineEliminated`.

As linhas usam células retangulares do tamanho da matriz; o preset de 63 × 112 tem centros separados por 79 unidades em X. O servidor guarda coordenadas globais; a apresentação pode converter a célula própria para uma origem local e mostrar as demais linhas por um seletor. Os edifícios são pontos de recrutamento, não unidades atacáveis.

## Validação

`node --test tests/line-wars.test.js` verifica catálogo, renda, propriedade, recarga, limite de população, estatísticas reais das receitas, vazamentos, vitória, eliminação do anel, renascimento, deslocamento de invasores, defesa pelo combate existente e determinismo com bots. A fixture inclui os adaptadores de integração para permitir testar o módulo antes de a interface e o seletor de modos serem conectados.

Isso valida comportamento e consistência. Não demonstra equilíbrio competitivo, capacidade de hospedagem pública ou fidelidade a uma versão específica do mapa original.

## Fila, fonte e observação

`queueLineUnit` aceita até 50 entradas, inclusive sem ouro ou em recarga. `cancelLineQueue` remove uma entrada sem custo; `processLineQueue` só paga quando realiza o envio da primeira entrada. A fonte recupera6%HPmáximo/s e4%mana máxima/s em raio de 5m para herói e invocações da mesma linha.

A barra de avatares mostraHPdo herói e vidas do portal de todos. Clicar seleciona apenas a instância apresentada pela câmera; Espaço/F1 retorna ao próprio jogador. Ao visitar um rival, suas casinhas permitem preparar envios contra ele. Compras nos NPCs de itens do rival e ordens sobre os personagens dele continuam bloqueadas. O servidor continua validando proprietário. As prévias de tropas mostram retratos originais antes da compra.

## Navegação e interface por contexto

Meio + arraste desloca o mapa; Ctrl + meio gira. Os controles usam os limites retangulares reais, inclusive os trechos distantes. Avatares escolhem o campo rival e os botões levam à defesa, recrutamento, fonte ou vista completa. A fila abre detalhes sob demanda. Placas de casinhas e lojas aparecem por contexto; o campo próprio não desenha os recrutadores. As habilidades iniciais dos seis heróis são compartilhadas entre jogadores, com uma cópia por herói; as demais permanecem exclusivas.

A fonte é um ponto físico de compra universal; a sessão `fountain` atende todas as categorias e serviços, apenas na própria instância de Line Wars e dentro de 5m. O estoque e os seis espaços continuam autoritativos.
