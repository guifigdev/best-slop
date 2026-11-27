# Padrões de código e contratos

## Padrões que o código já utiliza

| Padrão | Aplicação | Cuidado |
| --- | --- | --- |
| Módulos ES e exports nomeados | Cliente, shared e servidor | Manter dependências de apresentação fora das regras |
| Dados em objetos/arrays simples | Unidades, eventos, inventário e snapshots | Não guardar `Mesh`, DOM ou funções no estado persistente |
| Catálogos por chave e `Object.freeze` | Habilidades, monstros, itens, regras e budgets | Freeze raso não congela arrays/objetos internos |
| Funções de fábrica | `createView`, `createRo…Art`, `create…UI` | Dono dos recursos deve ser identificável |
| Conjuntos de métodos em `Game.prototype` | Modos e sistemas | Não perder `this` nem sobrescrever métodos sem perceber |
| Comando de intenção e validação | `Game.command`, `bonkCommand`, compras | UI habilitada é conveniência, não autorização |
| Evento visual derivado | `game.fx(type,x,z,extra)` | A animação não pode aplicar dano por conta própria |
| Cache por identidade/revisão | Modelos, navegação, catálogo e mundo | Invalidar quando uma dependência muda |
| Buffers e lotes limitados | InstancedMesh, fluidos e efeitos | Capacidade alocada não é custo zero quando inativa |
| Assinatura de UI e patch do DOM | `patchHTML`, UIs com markup | Incluir estados transitórios, foco e contadores relevantes |
| Validador de checkpoint | Saves e API de conta | Estrutura válida não prova direito econômico |
| Teste de contrato e regressão | `node:test` e `assert` | Geometria válida não prova aparência bonita ou FPS |

O repositório não contém um conjunto central de regras ESLint/Prettier ou um sistema de tipos TypeScript que imponha todos esses padrões. Muitos arquivos usam linhas extremamente longas. Isso é uma característica atual, não uma convenção desejável para todo código novo. Prefira funções curtas, nomes claros e formatação legível ao expandir um sistema.

## Separação de responsabilidade

`shared/` pode conhecer posições, regras, fontes de dados e relógio de simulação. Não deve depender de `src/view.js`, WebGL ou DOM. `src/` lê snapshots, exibe e emite comandos. `server/` autentica, limita, organiza conexões e persiste, além de executar a mesma simulação.

Uma habilidade nova costuma atravessar catálogo, execução, alcance/colisão, eventos, desenho, tooltip, disponibilidade e save. Alterar apenas o ícone ou apenas o evento não implementa a habilidade inteira.

## Identidades e dados

- `owner` identifica o controlador; `id` identifica uma entidade. Não presumir que o primeiro herói do array é sempre o jogador local. O adaptador online do Ragnarok põe o herói local primeiro para fluxos antigos que dependem disso.
- `team`, arena/instância e visibilidade determinam elegibilidade de alvo. Distância sozinha não basta.
- `key` é a identidade estável de catálogo. Nome traduzido é apresentação e pode mudar.
- `sourceId`, manifestos e arquivos de fatos preservam a relação com referências importadas. Não confundir ID de habilidade, efeito, item e monstro.
- Instâncias físicas de equipamento/cartas têm IDs próprios. Duas cópias de uma carta de mesma chave não são a mesma instância.
- Valores recebidos de rede precisam de `Number.isFinite`, limites e validação de chave própria, normalmente `Object.hasOwn`.

## Tempo e aleatoriedade

Há três relógios distintos:

1. `Game.time`: linha de tempo geral dos eventos de simulação.
2. `bonk.elapsed`: tempo da atividade Ragnarok, usado por recargas, coleta e mineração.
3. `performance.now()`/tempo real: câmera, suspense do refino, UI e métricas locais. `Date.now()` serve a expiração/concorrência de conta e operação do servidor.

Conversões precisam ser explícitas. A pausa não deve gastar o tempo do loot, mas a apresentação do refino precisa terminar com a partida pausada. O renderer precisa limpar seus eventos ao retroceder tempo, trocar mapa ou reiniciar a sessão.

`Game.random()` é um LCG com estado em `this.seed`. Passar `game.random` como callback sem vincular o receptor causa a falha de leitura de `seed` observada anteriormente. Use `()=>game.random()` ou `game.random.bind(game)` quando uma API recebe uma função.

Não consumir RNG de gameplay para escolher brilho ou cor. Cosméticos usam hashes/seed própria. O loot de fabricação possui fluxo derivado de mundo e entidade, sem deslocar o RNG principal do combate. Determinismo significa reprodutibilidade para a mesma sequência de entradas e passos; não implica que snapshots de versões diferentes sejam compatíveis.

## Contrato de um renderizador

Forma usual, com variações por módulo:

```javascript
const art = createFeatureArt({scene});
art.update(snapshot, time, heightAt);
art.stats();
art.reset();
art.dispose();
```

O renderizador deve:

- Declarar capacidade de eventos/instâncias/luzes/passes e política de overflow.
- Reutilizar geometria, material, buffers e objetos temporários quando possível.
- Ancorar no terreno e usar unidades do mundo coerentes com a colisão.
- Distinguir recurso próprio de recurso emprestado/compartilhado; não descartar material alheio.
- Fazer `dispose()` idempotente e liberar somente quando o último dono termina.
- Tratar modo inativo sem percorrer e reconstruir efeitos desnecessários.
- Preservar profundidade, color space, alfa e estado do renderer ao usar passes próprios.
- Expor contadores que correspondam ao trabalho realmente submetido, não só ao tamanho do catálogo.

Buffers reutilizados não garantem ausência de alocações: vários renderizadores ainda criam arrays, objetos e `filter/map` a cada update. Esse custo é relevante para o plano de desempenho.

## Geometria, cache e invalidação

A identidade do ator inclui modelo, classe e arma equipada quando a geometria depende da arma. Geometrias bakeadas podem ser compartilhadas; pose, cor de hit e animação não podem corromper todas as instâncias da mesma espécie.

Chaves devem incluir tudo que afeta a saída, sem incluir câmera ou tempo quando não afetam geometria estática. Não recriar o cenário inteiro porque a câmera girou. Um cache somente válido pelo tamanho de um array falha quando um objeto é substituído ou movido mantendo a quantidade.

Quando o cache armazena regra derivada, verificar nível, classe, equipamento, carta, encantamento, buffs, carga e mudanças de saldo conforme aplicável. Uma assinatura textual gigante recalculada em cada consulta pode custar mais que o cálculo economizado; medir antes de espalhar esse padrão.

## UI e assincronia

Menus de personagem são janelas acessíveis; lojas são serviços de NPC com proximidade validada. Janelas arrastáveis pertencem à camada de UI. O mundo não deve continuar mirando ou disparando quando o usuário interage com uma janela.

Operações de conta usam fila serial, versão de sessão e IDs de operação para evitar resposta antiga aplicada em outra partida. Botões de ação ficam pendentes durante a operação. O resultado visual do refino aguarda simultaneamente o prazo da animação e o resultado real; não sorteia de novo para combinar com a animação.

Detalhes/scroll/foco precisam sobreviver ao patch. Um campo ausente da assinatura da UI pode deixar a tela congelada embora a regra já tenha sido aplicada. O estado do teatro de refino é exemplo de um campo que deve invalidar a apresentação.

## Convenções recomendadas para novas mudanças

Estas são orientações de manutenção, não ferramentas já impostas pelo build:

1. Novo renderer de família com rota e budget próprios em vez de mais um caso implícito em `view.js`.
2. Validação antes da mutação, e mutação atômica para gastos e recompensas.
3. Eventos de gameplay separados de eventos puramente visuais, com IDs e expiração.
4. Funções puras para geometria/pose/regras; integração fina para Three e DOM.
5. Nenhuma busca de rede ou importação de fonte externa dentro de um tick de combate.
6. Comentários que expliquem invariantes e decisões, não que repitam cada instrução.
7. Não colocar chaves, tokens, sessão ou dados privados em logs/artefatos públicos.

## Verificação apropriada

Testes de regra cobrem valores, limites, elegibilidade, idempotência e persistência. Testes de arte cobrem posições finitas, bounds, orçamento, identidade, reutilização, término e descarte. Testes de UI cobrem estados e ações visíveis. Mudanças de visual exigem também inspeção renderizada, em primeira e terceira pessoa quando relevante.

Para desempenho, registrar cenário, seed, hardware, aquecimento, amostras e percentis. Resultados Node não são FPS. `renderer.info` não é tempo de GPU. Um microbenchmark de uma função não é speedup do jogo inteiro.
