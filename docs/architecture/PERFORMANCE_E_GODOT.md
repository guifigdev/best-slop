# Performance, evolução visual e Godot

## Decisão recomendada

Manter a implementação atual enquanto removemos os gargalos medidos. Não migrar todo o jogo para Godot como primeira tentativa de corrigir lag. Já foi encontrado um custo grande na simulação sem renderer: colisão/separação de hordas. Trocar o renderer não remove esse algoritmo.

Godot é uma alternativa real para uma versão nativa e para melhorar ferramentas de criação, mas seu ganho neste jogo precisa ser demonstrado com uma cena equivalente. A decisão deve considerar destino web versus aplicativo instalado, não apenas o nome da engine.

## O que foi medido nesta revisão

Comando:

```powershell
node scripts/profile-ragnabonk.mjs --steps=180 --profile
node scripts/compare-collision-optimization.mjs
```

Ambiente: Windows, Node 24.11.1, AMD Ryzen 5 5600G. Seed 271127, passo fixo de 1/30 s, trinta ticks de aquecimento e 180 medidos por caso. O profiler V8 esteve ativo em ambos os lados da comparação. A fixture usa simulação real, mapa e corpos reais, inimigos com vida alta para estabilizar a população, herói invulnerável e spawn adicional desativado. Os dois cenários avançados ativam seis skills de mago existentes; não simulam todas as combinações possíveis de doze habilidades.

São medições **de CPU em Node**, não FPS do navegador, tempo de GPU, latência online ou benchmark de Godot. Os monstros acabam congestionando em torno do personagem; isso é uma condição de estresse intencional e relevante à proposta de hordas, mas não representa toda frame de uma partida.

Resultados completos, contagens e metadados: [medição versionada](measurements/ragnabonk-2026-11-27.json). O script gera relatório e `.cpuprofile` em `outputs/` para inspeção local. Um novo teste pode variar com JIT, carga da máquina e GC; a tabela registra uma comparação, não um SLA.

## Gargalo confirmado e primeira correção

Antes, os maiores hotspots amostrados estavam em `unit-collision.js` e `unitBodyContact` de `unit-body-shape.js`. A recuperação de unidades sobrepostas procurava muitos pontos livres e, para cada ponto, varria o array completo de unidades. Também copiava o objeto inteiro do ator para cada candidato de colisão. O SAT criava arrays intermediários em cada vértice projetado.

Correção aplicada nesta revisão:

1. Construir o probe de posição uma vez por consulta, em vez de uma cópia por unidade vizinha.
2. Rejeitar corpos distantes pelo mesmo limite conservador da narrow phase.
3. Reutilizar o hash espacial já existente da recuperação e consultar buckets ao redor do **ponto candidato**, incluindo corpos grandes; reconstruir o hash quando uma unidade é reposicionada.
4. Projetar os vértices do SAT em um laço com mínimo/máximo, sem um array novo por vértice.

Não foram reduzidos monstros, efeitos, hulls, precisão, número de passes ou regras de parede. Quarenta cenas densas adicionais foram comparadas com o resolvedor anterior: posições, estado dos atores e contadores de colisão coincidiram exatamente. Os cenários completos também conservaram contagem de unidades, picos de eventos/projéteis e tamanho do snapshot.

| Cenário | Tick médio antes | Tick médio depois | P95 antes | P95 depois |
| --- | ---: | ---: | ---: | ---: |
| Sem monstros | 0,309 ms | 0,290 ms | 0,479 ms | 0,429 ms |
| 60 monstros, sem autoataques | 9,620 ms | 6,645 ms | 24,076 ms | 16,004 ms |
| 140 monstros, magias automáticas | 44,698 ms | 28,384 ms | 162,196 ms | 62,088 ms |
| 280 monstros, magias automáticas | 215,170 ms | 90,139 ms | 907,356 ms | 167,195 ms |

No caso mais pesado, o custo médio caiu cerca de 58% e o P95 cerca de 82%. Isso é um ganho da **simulação sintética medida**, não um aumento equivalente de FPS. Noventa milissegundos médios ainda ultrapassam o orçamento de um tick a 30 Hz. O problema de hordas densas não está encerrado.

O próximo alvo confirmado continua sendo o resolvedor de corpos: contatos SAT repetidos, até doze passes, reconstruções de buckets e a busca de recuperação. Precisamos evoluir o solver sem fazer monstros atravessarem personagens, sem teleporte de recuperação e sem diminuir a horda desejada.

O desenho proposto é separar contato normal da recuperação de spawn inválido. Contato normal deve usar vizinhança local, shapes/eixos reutilizados e correções pequenas. A busca ampla de um ponto livre deve ter uma fila e trabalho limitado por tick; enquanto aguarda, a unidade precisa permanecer em estado seguro, sem atravessar paredes. Essa mudança altera o solver e exige validar trajetórias e sensação de contato, além de medir tempo; não foi aplicada só para melhorar a tabela.

## Outros custos observados ou identificados no código

### CPU e montagem de estado

No caso de 280 monstros antes da correção, criar o snapshot levou em média cerca de 0,37 ms, e serializar o snapshot cheio cerca de 3,7 ms. O JSON cheio tinha 715.284 bytes; retirando mapa, obstáculos e biblioteca já cacheados, 251.091 bytes. Essa segunda quantidade é uma aproximação do conteúdo dinâmico, não a captura exata de um pacote do protocolo.

O servidor já suprime mundo estático e biblioteca por capacidade/chave. Continuar reduzindo dados repetidos, duplicações e eventos antigos, mas não usar o tamanho cheio como se ele fosse enviado em todo pacote de uma conexão atual. Fazer captura real de bytes por jogador antes de escolher um protocolo binário.

`snapshotBonk` calcula `bonkStats` mais de uma vez e constrói descritores derivados de habilidade. O catálogo possui cache; ele não é reconstruído do zero a cada frame. Essas redundâncias são candidatas menores que o gargalo de colisão medido.

A UI usa throttle e patches. `JSON.stringify` de assinaturas grandes, retratos, tooltips e biblioteca devem ser medidos com seus painéis abertos e fechados. Tempo de gerar uma string HTML no Node não mede custo de layout/paint do navegador.

### Carregamento inicial

O build local desta revisão gerou um chunk principal de aproximadamente 9,54 MB, ou 2,13 MB comprimidos com gzip no relatório do Vite. Isso é tamanho de artefato, não medição de tempo de carregamento nem de uso de memória. O núcleo importa muitos modos/catálogos e modelos; dividir por modo e carregar famílias visuais sob demanda é uma frente própria. Essa divisão deve antecipar assets em transições para não trocar download inicial por engasgo no primeiro cast. Não confundir esse problema com a simulação cara depois que o jogo já carregou.

### Renderização e GPU

Estes são riscos concretos do desenho atual, ainda sem classificação por tempo de GPU nesta revisão:

- Vários sistemas percorrem os mesmos eventos/unidades a cada update e montam arrays de partículas na CPU.
- Voxelizar quadros de textura em caixas durante a animação mistura custo de amostragem, transforms e upload.
- Cada sistema tem budget próprio; não há um árbitro global de VFX por área de tela, distância e prioridade.
- Buffers marcados `needsUpdate` sem ranges podem reenviar a capacidade completa.
- Bake de superfícies e compilação de materiais podem causar pico na primeira aparição de espécie/arma/efeito.
- Sombras, contornos, captura de cor, scattering e transparência acumulam trabalho de pixel. Primeira pessoa pode aumentar a ocupação de tela/overdraw mesmo mostrando menos atores.
- Culling de instâncias e limite por distância já existem em algumas famílias, mas não de maneira uniforme em todos os renderizadores.

`view.stats()` já expõe chamadas, triângulos e contadores por subsistema. Contador não é duração; a contagem de um frame com múltiplos passes precisa respeitar a política de `renderer.info.autoReset`. Não estimar GPU em milissegundos a partir de draw calls.

## Plano para ganhar desempenho e melhorar o visual

| Prioridade | Entrega | Ganho buscado | Critério de validação |
| --- | --- | --- | --- |
| P0, iniciada | Broad phase e recuperação de corpos; remover alocações redundantes | Cortar picos que congelam simulação | Mesmos corpos/regras; stress e replay; percentis de tick |
| P0 | Perfil do frame real por etapa e GPU timer assíncrono quando suportado | Separar simulação, view, DOM, GC e GPU | Cena gravada/reproduzível em FP e terceira; nenhuma leitura GPU bloqueante |
| P1 | Solver com vizinhança persistente, reaproveitamento de shape/axes e recuperação limitada ao necessário | Fazer 140–280 corpos caberem no orçamento | Densidade preservada; chokes, MVPs, paredes, invocações e determinismo |
| P1 | Dispatcher único de eventos e scheduler de VFX | Evitar percorrer/recriar o mesmo efeito em várias rotas | Uma rota dona por fase; avisos de gameplay nunca desaparecem |
| P1 | Templates geométricos e parâmetros animados na GPU | Efeitos mais ricos com menos trabalho JS | Mesma coreografia com uploads/GC menores |
| P1 | Bake/pré-aquecimento de espécies, armas e shaders em transições | Reduzir stutter de primeiro encontro/cast | Comparar frame frio e quente; sem pausa longa ao entrar |
| P2 | Chunks espaciais, LOD e atualização por distância | Gastar detalhe perto do jogador | Ator/ameaça continuam legíveis; não alterar dano/culling de gameplay |
| P2 | Upload só de ranges ativos e pools de dados contíguos | Menor banda e coleta de lixo | Memória estável após repetição; contagem/forma preservadas |
| P2 | Sombras e scattering adaptativos por custo | Preservar luz sem repetir trabalho caro | Tamanho de pixel/luz medido; arma e HUD nítidos |
| P2 | Snapshots dinâmicos compactos e revisão de escrita síncrona | Menor custo por sala/cliente | Bytes, serialização, tick e latência sob múltiplas salas |
| P3 | Worker/Wasm apenas para hotspots restantes | Isolar CPU de UI/render quando fizer sentido | Medir cópia/transferência, replay e latência antes/depois |

Mover simulação para Worker pode melhorar responsividade, mas não torna um tick de 90 ms barato. Primeiro reduzir o trabalho. Da mesma forma, trocar para WebGPU não corrige buscas de colisão e não deve ser pré-requisito de funcionamento.

### Direção visual que preservamos

Manter o efeito principal em 3D: lâmina conectada à mão, martelo com massa, raio ramificado, flechas físicas, água coesa e explosão com volume. Reduzir primeiro duplicações, objetos invisíveis, poeira secundária redundante e atualização fora de tela.

Usar LOD por importância: habilidade do jogador, perigo próximo e ação do MVP têm prioridade; faíscas secundárias distantes recebem menos amostras. Não reduzir raio real de perigo para economizar pixels. Cada perfil deve conservar antecipação, liberação, contato e dissipação.

Para os efeitos mais usados, substituir a ponte de sprite voxelizado por coreografia geométrica própria. Não converter mais pixels em milhares de cubos achando que isso garante beleza. Trajetória, coesão, contraste, tamanho e timing são a base; shader e partículas acrescentam acabamento.

## Orçamento e protocolo de medição

Meta inicial sugerida, ainda não garantida: 60 FPS no desktop de referência a 1080p e perfil de 30 FPS em hardware mais fraco. A 60 FPS há 16,67 ms entre frames; simulação, preparação e GPU precisam ter folga, considerando sobreposição CPU/GPU. Para o servidor, um tick de 30 Hz dispõe de 33,33 ms para o trabalho do intervalo, compartilhado pelas salas no processo.

Capturar pelo menos:

- Prontera inicial, 140/280 monstros, MVP com invocações, chuva de flechas, raios, meteoros, água e caverna com fogo.
- Primeira e terceira pessoa com a mesma população e atividade, incluindo giro de câmera e primeira aparição de assets.
- FPS/frametime P50/P95/P99, CPU por etapa, GC/long tasks, GPU quando disponível, chamadas/triângulos por passe, partículas e uploads ativos, heap/recursos e bytes de rede.
- Sessões longas, troca repetida de mapas, morte/recomeço e multiplayer; observar tendência de memória, não apenas um instante.

Comparar resolução de renderização menor, sombras desligadas e pós-processamento isolado **como experimentos de diagnóstico**, não como solução visual definitiva. Se reduzir pixels melhora muito, investigar fill rate/passes. Se não melhora e a main thread está ocupada, investigar CPU. Fazer essas experiências sem alterar população ou frequência de ataques simultaneamente.

## Godot comparado ao que temos

| Tema | Three.js atual | Godot |
| --- | --- | --- |
| Navegador | JavaScript e WebGL | Exportação web usa Wasm/WebGL 2; não garante ganho automático |
| Aplicativo instalado | Exigiria empacotamento/arquitetura próprios | Exportação nativa e ferramentas de engine prontas |
| Arte/animação/VFX | Ferramentas procedurais do projeto | Editor e fluxos de cena/animação mais integrados |
| Instâncias | `InstancedMesh`, lotes e shaders próprios | `MultiMesh` e shaders por instância; batching continua necessário |
| Gameplay existente | Mesma regra JS no cliente e servidor | Pode conservar servidor Node, mas cliente/predição exigem adaptação |
| UI e conta | DOM, janelas, atalhos e integração já construídos | Refazer/adaptar interface e bridge de conta/rede |
| Gargalos de algoritmo | Colisões/SAT/recuperação já medidos | Recriar o mesmo trabalho mantém o problema, mesmo com outra implementação |

Segundo a [documentação oficial de exportação web](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html), a versão web usa o renderer Compatibility; Forward+/Mobile e WebGPU não estão disponíveis nesse destino na documentação consultada. Threads web têm requisitos de isolamento. Isso limita a comparação com uma build nativa.

A [documentação de MultiMesh](https://docs.godotengine.org/en/stable/tutorials/performance/using_multimesh.html) descreve instanciamento eficiente, com culling por lote em vez de por instância. A [documentação de otimização de GPU](https://docs.godotengine.org/en/stable/tutorials/performance/gpu_optimization.html) também recomenda agrupar geometria/material e observar localização/culling. São preocupações que continuaríamos tendo.

**Inferência para este projeto:** Godot nativo pode oferecer mais margem e melhorar produtividade artística; não há medição equivalente que demonstre quanto. Para continuar no navegador, otimizar o caminho atual tem custo e risco menores que reescrever todos os modos.

### Prova antes de migrar

Se a versão instalada virar prioridade, fazer um protótipo de uma única cena: mesmo mapa, 280 monstros, mesmas armas, ataques/água, câmera e resolução. Medir Godot web versus Three web; medir Godot nativo separadamente, explicitando que o destino mudou. Incluir cold load, memória, P95/P99 e qualidade visual equivalente. Só então estimar a migração de UI, regras, rede, persistência, assets e ferramentas.

Não migrar apenas uma cena vazia e concluir que o jogo inteiro ficou mais rápido. O objetivo é sustentar os efeitos desejados e a horda, não vencer um teste retirando conteúdo.
