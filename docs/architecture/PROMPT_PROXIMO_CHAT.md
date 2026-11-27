# Prompt para continuar o projeto

Copie o bloco abaixo no próximo chat, com o mesmo repositório aberto. Ele contextualiza o projeto sem depender do histórico desta conversa. Verifique o estado atual do Git; números abaixo são referências de 27/11/2026, não promessas de desempenho.

```text
Você vai continuar um jogo existente, não recriá-lo do zero.
Repositório: C:\Users\Guilherme\Downloads\games-gpt\custom hero
Produção: https://play.gfig.space

Objetivo: melhorar bastante a performance e o acabamento/identidade da voxel art dos assets existentes, com custo de execução igual ou menor. Ainda não estou satisfeito com a qualidade visual. Quero mais qualidade por recurso gasto; não quero uma redução geral de qualidade para disfarçar gargalos.

Antes de editar, leia a documentação consolidada em docs/architecture/README.md e, nesta ordem:
1. RUNTIME_E_REDE.md e PADROES_E_CONTRATOS.md.
2. REGRAS_DE_NEGOCIO.md.
3. VOXEL_ART_E_ANIMACAO.md e SHADERS_E_EFEITOS.md.
4. PIPELINES_DE_PRODUCAO.md.
5. PERFORMANCE_E_GODOT.md e MONITOR_E_PRE_AQUECIMENTO.md.
Consulte MODULE_INVENTORY.md e module-inventory.json para localizar os módulos relevantes. Use a documentação antiga em docs/ como contexto histórico; confirme decisões no código/testes atuais. Leia instruções locais aplicáveis e examine git status antes de mudar arquivos. Preserve trabalho de outras pessoas.

Stack: JavaScript ES modules, Three.js r180/WebGLRenderer/GLSL, DOM/CSS sem React, simulação compartilhada em shared/, Node 24 + WebSocket/ws + SQLite, Vite/esbuild. src/main.js integra a aplicação; src/view.js integra o mundo. Temos vários modos: Custom Hero, Ragnabonk/Ragnarok Survivors, Warlock, Castle Fight, Line Wars, Dungeon, Bloody e outros. O foco desta etapa é Ragnabonk, preservando os demais. Não migre para Godot/WebGPU ou reescreva a arquitetura inteira sem demonstrar ganho numa cena equivalente.

Já existe diagnóstico real: colisão/separação SAT e recuperação de corpos congestionados custam muito. A primeira otimização manteve regras, posições, população e efeitos, com equivalência em 40 cenas densas. No benchmark Node com profiler, 280 monstros passaram de 215,170 para 90,139 ms/tick médio, P95 de 907,356 para 167,195 ms. Ainda está pesado. Isso é CPU de simulação sintética, não FPS/GPU do navegador. Leia measurements/ragnabonk-2026-11-27.json e os scripts profile-ragnabonk.mjs e compare-collision-optimization.mjs; o comparador requer o histórico Git da baseline.

Também já implementamos monitor opcional e arrastável em Menu → Configurações → Desempenho, com FPS/P95, CPU principal por etapa, GPU assíncrona se disponível, heap JS e contadores gráficos. Não é porcentagem de utilização do hardware. Há pré-aquecimento de corpos do encontro em Worker, cache compartilhado e solicitação de compileAsync. O Worker de produção usa o espelho /assets/ na mesma origem porque o bundle vem do CDN. Há LOD de pose para monstros comuns distantes: 15 Hz a partir de 32 unidades, 8 Hz a partir de 65; ameaças, hits, ataques, MVPs e heróis ficam normais. Isso ainda não cobre todas as armas, shaders, VFX e variantes, nem implementa LOD geométrico. Não refaça o que já existe; audite e evolua.

Primeiro meça um frame real e priorize o maior custo confirmado: simulação/solver, preparação da cena, DOM, GC, uploads, draw calls, transparência/overdraw, sombras, contornos e scattering. Compare primeira e terceira pessoa, mesma seed, resolução, câmera, população e ataques. Registre frame frio/quente e P50/P95/P99; CPU, GPU, rede e memória separadamente. GPU indisponível deve continuar indisponível, sem estimativas inventadas. Investigue caches/buffers/pools, vizinhança espacial, compartilhamento de geometria/material, templates, batches/chunks com culling e pré-aquecimento antes de aumentar complexidade. Não reduza hordas nem altere hitboxes/dano para ganhar desempenho.

Depois melhore uma amostra representativa dos assets com evidência visual antes/depois: monstro, personagem/arma vista de perto, elemento de cenário e efeito frequente. Quero silhuetas e anatomia melhores, paletas com contraste e materiais reconhecíveis, detalhes voxel bem colocados, pivôs/empunhadura corretos e animação com antecipação/contato/recuperação. Evite aparência de cubos genéricos empilhados. Use formas e cores consolidadas, faces internas removidas, geometria compartilhada, bake offline e shaders baratos quando ajudarem. Mais detalhe autoral não pode significar mais objetos/draw calls ou milhares de partículas atualizadas em JavaScript. Explique o orçamento por asset e mantenha custo igual ou menor; se houver troca de custo, meça e compense antes de expandir.

Direção artística: modelos/efeitos 3D em voxel e partículas são o padrão. Ícones e itens no chão podem usar imagens; ícones inspirados em Ragnarok, sem exigir cópia exata. Evite flashes gigantes, sprites de impacto/X e círculos brancos automáticos em hits/mortes. Preserve rastros de lâmina ligados à arma, flechas físicas, raios volumétricos, fogo legível, água coesa e cavernas com pedra irregular e scattering. Mantenha referências/sourceId/proveniência; não descreva reconstrução de referência como criação independente.

Não mude balanceamento, progressão, cartas, drops, NPCs ou controles nesta tarefa sem necessidade demonstrada. Preserve saves, multiplayer e fonte autoritativa das regras. Corrija causas, não esconda exceções nem retire conteúdo.

Implemente, valide e atualize a documentação. Use node --test --test-concurrency=2 tests/*.test.js, npm run build e scripts/check-architecture-docs.mjs; regenere o inventário com scripts/generate-architecture-inventory.mjs quando adicionar módulos. Faça QA visual nas duas câmeras e teste trocas de mapa/repetição para vazamentos. Não altere personagens reais da conta para testar. Publique somente conforme a autorização disponível neste novo chat e confirme a versão realmente servida. Entregue mudanças concretas, comparativo visual, métricas reproduzíveis, limitações e próximos gargalos. Continue até concluir a melhoria medida; não pare apenas num plano.
```
