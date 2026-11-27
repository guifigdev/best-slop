# Arquitetura do Custom Hero e Ragnabonk

Estado consolidado em 27/11/2026, a partir do código publicado em `1c0b149` e da correção de colisão descrita no diagnóstico de performance. Este manual cobre o cliente, a simulação, os modos, a persistência, a produção de arte e o caminho de renderização. As tabelas de milhares de habilidades, itens e monstros continuam nos catálogos executáveis; copiar cada registro para prosa criaria duas fontes divergentes de regras.

## Leitura por assunto

| Documento | Conteúdo |
| --- | --- |
| [Runtime e rede](RUNTIME_E_REDE.md) | Stack, camadas, execução local/online, snapshots, contas e implantação |
| [Padrões e contratos](PADROES_E_CONTRATOS.md) | Organização do código, comandos, tempo, RNG, caches, segurança, testes e convenções de contribuição |
| [Regras de negócio](REGRAS_DE_NEGOCIO.md) | Regras transversais, contratos dos modos, progressão, combate, inventário, cartas, refino, fabricação e mineração |
| [Voxel art e animação](VOXEL_ART_E_ANIMACAO.md) | Esculturas, extração de referências, armas, consolidação, articulação, terreno, retratos e QA |
| [Shaders e efeitos](SHADERS_E_EFEITOS.md) | Materiais, pós-processamento, iluminação, água, fogo, roteamento e orçamento visual |
| [Pipelines de produção](PIPELINES_DE_PRODUCAO.md) | Importação, ícones, áudio, mapas, skill completa e manutenção/publicação |
| [Performance e Godot](PERFORMANCE_E_GODOT.md) | Medições reproduzíveis, gargalos, plano de melhoria visual e comparação de engines |
| [Inventário de módulos](MODULE_INVENTORY.md) | Índice gerado de todos os módulos de código nas pastas principais e suas dependências locais |

## O que usamos para fazer o jogo

| Camada | Implementação atual |
| --- | --- |
| Linguagem do jogo | JavaScript com módulos ES; sem TypeScript e sem framework ECS |
| Renderização | Three.js 0.180.0, `WebGLRenderer`, geometria 3D, materiais e shaders GLSL locais |
| Interface | HTML/CSS e manipulação do DOM; não React e não UI desenhada dentro do canvas |
| Regras | JavaScript em `shared/`, executado tanto no navegador quanto no Node |
| Servidor | Node.js 24, HTTP nativo e WebSocket com `ws` |
| Persistência da VPS | SQLite via `node:sqlite`, WAL, migrações SQL e checkpoints de salas |
| Build | Vite 7, esbuild, npm e `scripts/build-game-site.mjs` |
| Arte e importação | Geradores JavaScript e Python; alguns exigem Pillow e NumPy, além de dados de referência externos |
| Áudio | Web Audio API, amostras locais originais e alternativa MIDI sintetizada |
| Hospedagem | Docker em VPS, proxy HTTPS; assets versionados enviados a Cloudflare R2/CDN |
| Verificação | `node:test`, asserts, scripts de benchmark e revisão visual no navegador |

As versões de dependências declaradas têm intervalos em `package.json`; `package-lock.json` fixa o conjunto realmente instalado. Godot, Unity, Unreal, Babylon, Rapier e um motor de física externo não fazem parte desta implementação.

## Mapa do repositório

- `src/`: apresentação, entrada, câmera, interface, som e renderização. `main.js` integra a aplicação e `view.js` integra o mundo 3D.
- `shared/`: simulação e dados compartilháveis, incluindo validação, regras, navegação e catálogos.
- `server/`: HTTP, WebSocket, salas, matchmaking, contas e persistência.
- `scripts/`: importação, geração de assets, build, benchmarks e operação.
- `tests/`: contratos executáveis e regressões. Parte da arte é verificada como geometria/dados, sem renderizador GPU.
- `src/assets/`: imagens, fontes, sons, MIDI, referências empacotadas e animações importadas.
- `drizzle/`: migrações SQL reaproveitadas pelo armazenamento local.
- `deploy/` e `.github/workflows/`: imagem Docker e publicação.
- `docs/`: documentação; os arquivos anteriores a este manual preservam decisões e auditorias de etapas passadas.
- `outputs/`: diagnósticos e estudos locais ignorados pelo Git; não é dependência de produção.
- `dist/`: saída de build, não fonte para editar manualmente.

## Como consultar a verdade atual

1. Contrato implementado: código de `shared/` e validadores do servidor.
2. Comportamento protegido: testes correspondentes.
3. Aparência efetiva: roteamento em `view.js` e renderizador responsável; ter uma imagem ou um perfil no catálogo não prova que a habilidade o desenha.
4. Dados importados: arquivos de fatos, manifestos, importador e origem fixada.
5. Documentação antiga: contexto histórico, salvo confirmação no código atual.

O jogo contém uma mistura de arte procedural original, reconstruções geométricas orientadas por referências e recursos importados. A afirmação antiga de que todo o projeto é sem texturas já não descreve o conjunto atual. Ícones, atlas, itens no chão, áudio e algumas rotas nativas usam assets. O padrão desejado para efeitos de combate novos é volume 3D e partículas; isso não elimina esses usos legítimos de imagens.

## Comandos essenciais

```powershell
npm ci
npm run dev
npm run server
npm run build
node --test --test-concurrency=2 tests/*.test.js
node scripts/profile-ragnabonk.mjs --steps=180 --profile
node scripts/generate-architecture-inventory.mjs
node scripts/check-architecture-docs.mjs
```

O servidor de desenvolvimento usa o plugin de API local de `vite.config.js`. O servidor Node separado é o caminho para validar salas e implantação. Não execute importadores de novo esperando que todos encontrem as fontes: vários leem um cliente Ragnarok instalado, arquivos de mapas ou URLs específicas.
