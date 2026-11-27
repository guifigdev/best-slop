# Monitor, pré-aquecimento e LOD

Implementação de 27/11/2026. Esta é uma primeira etapa de preparação gráfica e observabilidade, não uma solução completa para o custo de hordas descrito em [Performance e Godot](PERFORMANCE_E_GODOT.md).

## Configuração e leitura

Abrir **Menu → Configurações → Desempenho**. O monitor começa desligado; pré-aquecimento e LOD de animação começam ligados. As três preferências são salvas localmente em `custom-hero.performance.v1`. Arrastar o título do monitor reposiciona a janela; o sistema de janelas também permite movê-la pelo teclado e salva sua posição.

| Campo | O que mede |
| --- | --- |
| FPS / P95 | Intervalos reais de `requestAnimationFrame`; histórico de até 180 amostras, sem lacunas de um segundo ou mais |
| CPU · principal | Tempo decorrido dentro do callback principal do jogo, em ms; inclui trabalho/esperas síncronas dessa thread, não uso total da CPU |
| Simulação | Tempo dentro da etapa local de ticks/snapshot; em jogo online não representa o tick do servidor |
| Cena / UI | Preparação/submissão da cena e trabalho de interface instrumentado no callback; não são tempos de GPU |
| GPU | Tempo gráfico de uma amostra a cada seis frames, por query assíncrona WebGL2, quando o driver permite |
| Chamadas / triângulos | Soma dos passes renderizados naquele frame, incluindo scattering e arma em primeira pessoa |
| Memória JS | Heap usado, apenas quando `performance.memory` é exposto; não inclui toda RAM, VRAM ou memória do Worker |
| Pré-aquecimento | Corpos já disponíveis no cache / solicitados para o encontro; não significa que todos os shaders/VFX do jogo estejam preparados |
| LOD distante | Quantidade de atualizações de pose poupadas no último frame |

O DOM do monitor é atualizado quatro vezes por segundo. Desligá-lo interrompe a coleta das fases e queries de GPU. Trocar a visibilidade da página reinicia as amostras, evitando misturar pausa em segundo plano com jogo ativo. O monitor tem custo próprio e deve ser desligado em comparações finais para avaliar esse custo.

O navegador não fornece percentuais confiáveis de utilização total do processador e da placa. O timer nunca usa `gl.finish`, `readPixels` ou espera ocupada. Só lê um resultado após `QUERY_RESULT_AVAILABLE`; mantém no máximo quatro queries pendentes, descarta leituras disjoint e invalida amostras antigas. Extensão ausente, contexto perdido ou ausência de resposta por cinco segundos aparecem como indisponíveis. Uma resposta posterior permite retomar a leitura. Na validação pelo navegador embutido não houve uma amostra GPU válida; isso não foi tratado como zero ms.

## Preparação de modelos e materiais

`view.js` identifica até doze espécies únicas do encontro Ragnarok atual, incluindo guardiões e MVP. `render-prewarm.js` admite no máximo dezesseis modelos por mundo e um trabalho de geometria por vez. Não percorre todo o catálogo nem lança Workers por criatura.

`ro-model-prewarm-worker.js` usa o mesmo `voxelShellGeometry` do caminho normal. Transfere arrays de posição, normal e cor, metadados e bounding sphere ao cliente. O cache usa a mesma identidade `body-` + `actorModelKey`; a geometria preserva a escultura. A criação de atributos WebGL e o upload continuam na thread gráfica. Geração de `spec.parts` e articulação também continuam no cliente.

O Worker é empacotado pelo [suporte oficial de Workers do Vite](https://vite.dev/guide/features#web-workers), com `?worker&url`. Quando o bundle vem do CDN, seu início é resolvido para o espelho **na mesma origem**, `/assets/ro-model-prewarm-worker-HASH.js`, presente no `dist/client` da VPS. A URL transformada do servidor Vite é preservada em desenvolvimento. Uma implantação nova precisa publicar tanto o Worker quanto o bundle correspondente.

Resultados de uma região anterior ainda podem alimentar o cache compartilhado, mas não aumentam o progresso da região nova. Desligar o recurso cancela fila e Worker; geometria válida já compartilhada permanece no cache. Falha/ausência do Worker mantém a construção normal disponível. Esta etapa não introduz uma política nova de expulsão do cache: testar memória em muitas trocas de mapa continua necessário.

O cliente solicita `renderer.compileAsync(scene,camera)` quando há preparação pendente e a cena está sem efeitos ativos ou em preparação. Uma raiz invisível conserva até dezesseis geometrias emprestadas para preparar materiais, sem desenhá-las. A compilação continua dependendo do driver e da extensão de compilação paralela; não garante ausência de pico em todas as máquinas. Não há cobertura completa de variantes de sombra, pós-processamento, primeira pessoa, todas as armas e todas as habilidades. Esses caminhos são próximas etapas a medir.

## LOD por distância e importância

O LOD implementado reduz **frequência de atualização de pose**, não a resolução da geometria:

| Distância ao personagem observado | Pose de monstro comum distante e ocioso |
| --- | --- |
| Menos de 32 unidades | Atualização normal |
| De 32 até menos de 65 | Até 15 Hz |
| 65 ou mais | Até 8 Hz |

Heróis, MVPs/bosses, ator selecionado/apontado, conjuração, morte, ataque recente e hit recente conservam atualização normal. Os buckets são deslocados por identidade para distribuir trabalho. Posição e orientação da raiz, HP, seleção e regras continuam atualizados normalmente. Não há redução de monstros, alteração de raio, colisão, dano ou frequência de ticks. LOD geométrico de silhueta e orçamento global de VFX ainda não estão implementados por esta entrega.

## Arquivos e validação

- Integração: `src/main.js`, `src/view.js`, `src/setup-ui.js`, `src/setup.css`.
- Monitor: `src/performance-hud.js`, `src/performance-hud.css`, `src/performance-samples.js`, `src/gpu-frame-timer.js`.
- Preparação e LOD: `src/render-prewarm.js`, `src/ro-model-prewarm-worker.js`, `src/actor-lod.js`.
- Regressões: `tests/performance-monitor.test.js`, `tests/render-prewarm-lod.test.js`.

Os testes cobrem coleta desligada, queries indisponíveis/disjoint/atrasadas, ausência de leitura bloqueante, preferência persistida, fila limitada, cancelamento, resultados de mundo antigo, URLs de produção/desenvolvimento, geometria/bounds equivalentes e exceções de importância do LOD. A revisão no navegador confirmou configuração, janela movível, progresso real do Worker e diferença no contador de poses ao alternar LOD. Não há benchmark de ganho de FPS desta etapa; o ambiente de navegador embutido não fornece uma comparação de hardware representativa.
