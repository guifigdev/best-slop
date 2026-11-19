# Revisão de desempenho — 19/11/2026

Esta revisão mede CPU e tamanho de snapshots em cenários sintéticos pelo Node. **Não mede FPS, GPU, draw calls reais nem bateria de celular.** A arte voxel, cores de vértice e animação em poses a 8 Hz foram preservadas. Não é recomendável suavizar toda a imagem ou reduzir a legibilidade para esconder gargalos de CPU.

## Reprodução e limites

```powershell
node scripts/profile-game.mjs --profile --steps=300
```

O script usa seed 112, Castle Fight com duas lanes, populações controladas de 0/60/120 tropas, 30 ticks de aquecimento e 300 ticks medidos a 1/30 s. Castelos não atiram e tropas têm vida elevada/dano zero para a população não variar. Mede também 10.000 consultas de passagem e 60 caminhantes contornando uma parede sintética. Estes cenários não representam todas as habilidades, monstros e IAs de uma partida real.

Ambiente observado: Windows, Node v24.11.1, AMD Ryzen 5 5600G. Perfis e resultados ficam em `outputs/game-performance.json`, `outputs/game-performance.cpuprofile` e logs ignorados pelo Git. O profiler adiciona custo, o JIT e outros processos geram variação; comparações absolutas entre máquinas não são válidas.

## Melhoria implementada: validação de geometria

O cache de A* já funcionava. O custo confirmado estava em verificar sua validade: `context()` criava strings de todos os campos de cada construção/castelo e recalculava hashes em cada consulta de passagem. Grupos densos consultam passagem muitas vezes, inclusive durante a separação dos corpos.

Foi substituído o fingerprint textual por comparação direta de descritores da geometria. A verificação permanece ativa na mesma frame; não depende de o chamador incrementar `navigationRevision`. Mudança de posição, tamanho, vida, castelos, limites e troca de objeto invalidam corretamente. Árvores/obstáculos continuam com o contrato de checagem por frame, referência, quantidade ou revisão. O cache e as rotas ficam fora dos snapshots, sem alterar estado autoritativo ou RNG.

Uma execução antes/depois, com o mesmo script:

| Cenário | Antes, média | Depois, média |
| --- | ---: | ---: |
| 10.000 consultas, zero construções | 20,74 ms | 8,12 ms |
| 10.000 consultas, 24 construções | 122,00 ms | 12,97 ms |
| Tick de 60 tropas | 1,49 ms | 1,01 ms |
| Tick de 120 tropas | 2,81 ms | 2,29 ms |
| 60 caminhantes com desvio, cache aquecido | 3,42 ms | 2,90 ms |

O ganho de aproximadamente 89% é do **microbenchmark de consultas com 24 construções**, não do jogo completo ou dos FPS. Picos e tempos de A* frio não melhoraram com essa mudança. Testes cobrem movimento/substituição sem revisão na mesma frame e troca de collider idêntico sem manter o objeto antigo.

## Três próximas prioridades

1. **Distribuir o trabalho de A* e compartilhar destinos.** O primeiro cálculo de 60 rotas contornando a parede levou aproximadamente 0,6–0,74 s na execução instrumentada, embora os frames seguintes tenham sido baratos. Uma nova construção invalida grids/rotas de muitos soldados ao mesmo tempo. Limitar buscas por tick e compartilhar campos de distância por destino/raio/revisão pode evitar esses picos. É preciso manter a unidade parada aguardando caminho válido, nunca movê-la por linha reta através de obstáculos. Antes de aplicar, comparar chokes, florestas, tropas grandes, voo, construção/morte e determinismo.

2. **Separar configuração de mapa/catálogo do snapshot de rede.** Com 120 tropas, o snapshot observado foi aproximadamente 426 KB de JSON e levou cerca de 2,7 ms para serializar. O servidor atual envia a 10 Hz: aproximadamente 4,3 MB/s por cliente, antes do overhead de protocolo. Terreno aparece em `voxelMap` e `castleFight.map.terrain`; tropas aparecem em `units` e `castleFight.units`; metadados de catálogo/proveniência também se repetem. Enviar a configuração uma vez e somente estado dinâmico por tick é prioritário antes de escalar salas. Serializar a mesma mensagem uma vez por sala evita repetir `JSON.stringify` para cada cliente. Compressão pode ajudar, mas traz custo de CPU/memória; os ~22 KB obtidos com gzip no probe são apenas uma estimativa offline, não o protocolo instalado. Não foi alterado o contrato de rede nesta rodada.

3. **Agrupar VFX, reutilizar objetos e medir renderização real.** `view.js` cria vetores/quaternions e arrays em loops por ator/projétil a cada frame. Os alvos visuais de projéteis fazem filter/map/filter/sort; a limpeza de atores usa `units.some` por ator. Reutilizar scratch vectors/quaternions, preparar um mapa de unidades por frame e atualizar etiquetas apenas quando o conteúdo mudar reduz alocações sem reduzir a qualidade. Projéteis com geometria/material compartilhados e instancing mantêm a identidade voxel e permitem efeitos melhores com menos draw calls. A prioridade de crítico, MISS, dano do jogador e telegraphs deve permanecer acima de partículas secundárias. Validar depois no navegador com `renderer.info`, perfil de CPU/GPU e um celular real; sem essas medições não se afirma ganho de FPS.

## O que já está bem encaminhado

- Caches de malha e geometria, terreno instanciado, limites de projéteis/efeitos e orçamento de status visíveis já reduzem custo.
- As poses a 8 Hz combinam com a direção de arte e independem de um pesado sistema de esqueletos.
- Dois construtores e até 24 construções não tornam a busca de reparo o maior gargalo medido; seu custo é pequeno diante de navegação em massa e envio de estado.
- Atributos, velocidades e tamanhos da referência não precisam ser alterados para corrigir custos de infraestrutura.


## Aplicado na integração visual

Além da validação de navegação, a integração reaproveita vetores/quaternions no movimento dos atores, orientação das barras e números flutuantes. A escolha de altura visual dos projéteis de Warlock usa uma varredura única dos alvos, sem `filter/map/filter/sort` por projétil por frame. Sete geometrias de projétil com cores de vértice são compartilhadas; fogo, gelo e Blast Staff usam instancing. Esses ajustes não alteram dano ou colisão autoritativa. Não foi medido FPS para atribuir um ganho numérico a essa etapa.

## Revisão do mundo, novembro de 2026

- Arquitetura do coliseu em um batch, 288 espectadores em oito grupos instanciados com oito poses calculadas previamente. Atualização das poses limitada a 8 Hz.
- Paisagem externa em até três batches, com cache por mapa/bioma. Mover a câmera e avançar o tempo não recriam o relevo.
- Lava procedural sem textura e detalhes instanciados a 8 Hz; áreas visíveis preservam o tamanho da simulação.
- Novos projéteis de animais compartilham geometrias, materiais e cores de vértice. Efeitos continuam sob o limite existente de 96 entradas.
- `releaseEffect` resolve um vazamento confirmado: remover `InstancedMesh` da cena não liberava os buffers de instância. Agora expiração, descarte por orçamento, troca de arena e reinício liberam esses buffers, sem descartar a geometria/material compartilhados.
- Materiais do ambiente e da paisagem são isolados, evitando que trocar o bioma altere a cor de outros consumidores. As cópias são únicas por componente, não por frame.
- Rotas retas reutilizam seu cache. O clearance usa o corpo real e os segmentos do trajeto; a recuperação de estagnação evita insistir na mesma quina.

Testes novos verificam cache, orçamento de batches, propriedade e descarte dos recursos, travessias e colisões. Contadores de render foram inspecionados no navegador em cenários controlados. Não há uma medição comparável de FPS nem validação em celular físico nesta revisão.
