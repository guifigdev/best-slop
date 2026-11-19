# Castle Fight: emergência e produção em lote

## Rescue Strike confirmado na versão 1.14b

Fontes extraídas de `outputs/castle-original/castle-fight-v1.14b.w3x`:

- `war3map.w3a.json`, habilidade `A005`: descrição diz **uma vez por rodada**; alcance `aran=1000`, área `aare=700`, custo de mana `amcs=0` e alvos `air,enemies,ground,sapper`.
- `war3map.w3u.json`, unidade `h04X`: `RescueDummy`, habilidade `A02C`.
- `war3map.w3a.json`, `A02C`: dano `Efk1=100000`, área `aare=700`, limite agregado `Efk2=100000000`, alvos `air,enemies,ground`.
- `jass-readable.txt`, função `FD`, por volta das linhas 5038–5088: remove `A005` e `A06E` do construtor após conjurar, espera `0.35` s e ordena o ataque da unidade auxiliar. O texto de dica, perto da linha 6631, também anuncia uma carga por construtor.

O motor usa `CASTLE_RESCUE_STRIKE`: **1 carga por jogador por partida**, alcance **1000/256 = 3,90625 m a partir do construtor**, raio **700/256 = 2,734375 m**, atraso **0,35 s** e **100000 de dano**. Uma partida atual de Castle Fight corresponde à única rodada; iniciar outro jogo restaura a carga. Não há compra ou regeneração de cargas.

O círculo pode ser colocado em qualquer região válida do mapa que esteja no alcance do construtor. Não acrescentamos uma restrição de metade do campo ou proximidade do castelo. Só tropas inimigas terrestres ou aéreas são atingidas; estruturas, castelos, construtores e aliados ficam protegidos. A explosão usa a quantidade de dano confirmada, sem alterar stats das tropas. Não simulamos furtividade ou a revelação auxiliar, porque esses sistemas não existem neste modo.

A carga é gasta quando o comando válido é aceito. Tropas podem sair do círculo durante o aviso; um ataque vazio também gasta a carga. Valores não finitos, pontos fora do mapa, alcance excessivo, jogo encerrado ou ausência de cargas são rejeitados sem gastar recursos. Bônus de eliminação seguem a regra existente do motor.

API: `cfRescueStrike { x, z }`. Estado: `castleFight.players[owner].rescueCharges`, `rescueDamage`, `rescueKills`; o construtor também contém `rescueCharges`. Eventos: `castleRescueWarning` e `castleRescueStrike`, ambos com `source`, `radius` e posição do círculo.

## Produção em lote: sincronização deliberada

API: `cfProduction { buildingIds: [...], paused: boolean }`. Somente produtores vivos pertencentes ao remetente são válidos. O lote é validado inteiro antes de qualquer modificação; IDs repetidos são deduplicados. Não há limite fixo de construções ou de produtores selecionados no lote. Uma entrada inimiga, desconhecida ou não produtora rejeita o lote completo.

Pausar guarda o tempo restante para exibição e impede produção, inclusive uma tentativa direta pelo motor. Construção, evolução, reparos, renda e madeira por conclusão continuam normalmente. Não há restituição ou prêmio por pausar.

**Retomar sempre inicia um ciclo inteiro**, descartando a fração pronta antes da pausa. Todos os produtores do lote misto — pausados ou ativos — usam o mesmo instante de retomada. Prédios do mesmo tipo têm o mesmo intervalo e voltam a produzir juntos. Tipos diferentes conservam seus intervalos nativos. Repetir retomada quando todos já estão ativos não muda seus relógios; portanto não há uma explosão instantânea de unidades perto de concluir o ciclo.

Um produtor ainda em construção ou evolução só inicia seu novo ciclo após o trabalho terminar. Se continuar pausado, permanece sem produção depois da conclusão. Sincronizá-lo com outros produtores requer retomar o grupo quando estiver pronto.

Estado por prédio: `productionPaused`, `productionRemaining`; `nextSpawn=null` enquanto pausado. No snapshot, o restante fica congelado para pausados e diminui para ativos. Evento de feedback: `castleProduction { source, buildingIds, paused }`.

Esta política de retomada em lote é uma regra do nosso motor para sincronização sem exploração de relógios; não a apresentamos como reprodução comprovada do script original.
