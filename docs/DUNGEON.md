# Dungeon dos Nove Reinos

Dungeon e Bloody Tournament são jogos separados. O confronto de heróis ao final dos 50 andares é uma regra própria da Dungeon; o torneio de compra e formação de exércitos pertence ao Bloody Tournament.

Modo original que usa os heróis e o combate do Custom Hero, com andares procedurais conectados em vez de provas isoladas no coliseu. Salas fechadas, corredores largos e pátios abertos formam cada andar. A geometria usa uma semente separada do RNG de combate: a mesma semente e andar produzem o mesmo mapa em todas as réplicas.

## Entrada e configuração da sala

O menu oferece somente Solo (sem bots) e Sala cooperativa (até quatro jogadores). O host escolhe a capacidade de 1–4 e a meta sem fim/50 antes de iniciar; convidados apenas leem essas opções. `roomSettings` exige host e não permite reduzir capacidade abaixo do grupo conectado. A preparação não avança o relógio. As opções de múltiplas equipes abaixo são compatibilidade da API antiga, sem cards adicionais no menu.

### Contrato da simulação

- `mode: "dungeon"` / `game: "dungeon"`.
- `dungeonPartySize`: 1–4, padrão 4.
- `dungeonTeams`: 1–4, padrão 1; a capacidade da sala é o produto dos dois valores.
- `dungeonPvp`: padrão `false`. Ativa confronto e saque entre equipes durante a exploração.
- `dungeonLimit`: `0` para expedição sem fim ou `50` para conquista de cinquenta andares. Se várias equipes sobrevivem ao andar cinquenta, disputam um confronto final; uma única equipe conquista diretamente a expedição.

Os membros de uma equipe cooperam no mesmo cenário. Inimigos crescem em vida, dano, quantidade e armadura com o andar. Cada andar possui um chefe, cofres, santuário, uma passagem inicialmente fechada e um mercador oculto encontrado ao explorar sua sala. Equipamentos e técnicas usam as ilustrações, efeitos e regras de aquisição do catálogo compartilhado. Todo equipamento não consumível pode aparecer nos espólios. Chefes sempre geram equipamento e fragmento de técnica. Os espólios mantêm os efeitos e atributos do catálogo. Raridades maiores podem chegar em níveis mais altos; equipamentos épicos e lendários também podem trazer encantamentos válidos para a arma ou armadura. A loja rara vende equipamento já melhorado.

## Comandos de interação

O servidor valida distância, equipe, estoque, capacidade da mochila e fase. IDs são obtidos do snapshot, e nunca representam um pedido do cliente para criar itens.

| Comando | Campos | Efeito |
| --- | --- | --- |
| `dgReady` | — | No solo, inicia a expedição. Online, o início depende do host; convidados não iniciam pelo HUD. |
| `dgInteract` | `object` | Aproxima e abre um cofre, recebe uma bênção ou examina uma estrutura. |
| `dgPickup` | `object`, `slot?` | Aproxima e recolhe equipamento, ouro ou técnica. `slot` indica a técnica substituída quando os sete espaços estão ocupados. |
| `dgBuy` | `object`, `offer` | Compra uma oferta real de um mercador próximo. |
| `dgDrop` | `slot` | Deixa o equipamento da mochila no cenário. |
| `dgRevive` | `owner` | Resgata aliado caído próximo em três segundos sem sair do lugar. |
| `dgExit` | `object` | Reúne a equipe e vota para atravessar a passagem aberta. |

Comandos de movimento, ataque, habilidades, atributos e consumíveis permanecem os mesmos do Custom Hero. Habilidades ativas iniciais e recém-encontradas começam em automático, com o mesmo controle manual e alternância já existentes. Paredes bloqueiam ataques e habilidades ofensivas; teletransportes deliberados e buffs pessoais preservam seu comportamento. Ordens manuais interrompem aproximações automáticas e o resgate. Espólios de inimigos pertencem à equipe que os derrotou; objetos explicitamente soltos e saques de PvP podem ser recolhidos por rivais. Uma equipe inteira caída é eliminada da expedição, enquanto companheiros ainda vivos podem resgatar seus aliados. O resgate cobra ouro apenas ao terminar.

## Integração

`DungeonMethods` é anexado ao protótipo de `Game`. A inicialização do jogador ocorre após o fluxo normal de Custom Hero e remove arenas privadas. O despacho de nova onda chama `spawnDungeonFloor`; o fim do tick de combate chama `tickDungeon` em vez da liquidação de provas do coliseu. `dungeonCanTarget` decide combate entre equipes. `dungeonLoot` substitui o fluxo de recompensa genérico, incluindo as mortes de heróis em PvP; o fluxo genérico não deve pagar ouro/XP novamente. `snapshotDungeon` acrescenta mapa, objetos, objetivos, equipes e histórico ao snapshot público.

`createDungeonWorld` desenha a geometria procedural e os objetos em poucos lotes de instâncias. `createDungeonUI` complementa o HUD existente, preservando atributos, técnicas e inventário. O clique do mapa pode entregar `dungeonObject` ao método `point` da interface antes do comando genérico de ataque/movimento. A barra principal de preparação chama `ready()` da interface. O botão “Expedição” abre os objetivos, as equipes e as ações de soltar itens.

O modo não altera as estatísticas iniciais dos heróis nem depende de imagens ou texturas externas. O online usa o servidor autoritativo comum do projeto; o mapa, os espólios e os resultados pertencem ao estado da sala.

## Validação

Os testes verificam conexão de todas as salas, geração determinística, spawns livres, escala de inimigos, combate entre equipes, tabelas de equipamento, autoridade e repetição de coleta, estoque de mercador, fragmentos, encantamentos, resgate interrompível, saque PvP, votação de saída, transição de andares, final de cinquenta andares, derrota, linha de visão, IA e integração com os comandos e snapshots reais de `Game`. O renderizador é testado sem GPU com limites dos buffers de instâncias e liberação de recursos.

## Escala, salas e exploração

O andar tem 85×85 células de 1,5m:127,5m de lado. As nove salas medem25,5–31,5m e os corredores têm7,5m. Heróis conservam seus modelos; paredes3,5–3,94m ultrapassam a altura humana, baús têm1,05×0,76m e bancas1,8×1,2m. A preparação e o combate usam o mesmo mapa/obstáculos desde a entrada.

A entrada em sala hostil reúne os aliados dentro dela e sela todas as portas com colisão real. Reforços pendentes contam como combate; cofres e portas só liberam após limpar todas as ondas. Até24 inimigos por sala e128 ativos por andar têm criação gradual; quantidade e vida consideram integrantes reais, não lugares vazios da sala. O plano por sala cresce até96 inimigos com a profundidade. Equipamento comum de monstro passa a8% e fragmento a5%, preservando a distribuição de raridade e as garantias dos chefes.

`snapshotFor(owner)` entrega apenas unidades e objetos vistos pela equipe. Salas desconhecidas são pretas; salas visitadas permanecem escurecidas. Uma textura de exploração em coordenadas mundiais afeta terreno, cenário e atores, com lanternas locais e uma sombra local de orçamento fixo. A descida tem aparência explícita de escadaria ou caverna. O minimapa marca a região efetivamente coberta pela câmera; clicar nele só move a câmera.
