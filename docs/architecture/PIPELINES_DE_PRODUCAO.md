# Pipelines de produção e manutenção

## Código fonte e arquivos derivados

O projeto combina arquivos escritos manualmente com catálogos gerados e assets empacotados. Antes de editar um arquivo, verificar cabeçalho, importador e manifesto. Uma mudança manual na saída gerada pode desaparecer na próxima importação.

As dependências npm são fixadas pelo lockfile. Geradores Python têm dependências próprias; o gerador de armas usa Pillow e NumPy. Importadores que leem GRF, mapas ou referências externas não são reproduzidos apenas com `npm ci`: também precisam dessas entradas. `outputs/` não deve se tornar uma entrada invisível de produção.

## Dados de Ragnarok

| Família | Scripts principais | Resultado e revisão necessária |
| --- | --- | --- |
| Ataque, status e ASPD | `import-ro-native-combat.py`, `import-ro-latam-combat.py`, `import-ro-aspd.py` | Fatos consumidos pelas fórmulas locais; revisar versão, unidades e arredondamentos |
| Monstros e movimento | `import-ro-latam-monsters.py`, `import-ro-monster-walk.py` | Estatísticas, identidades e atrasos por célula; revisar correspondência de `sourceId` |
| Equipamentos | `import-ro-equipment-targets.py`, `import-ro-native-equipment.py` | Dados e condicionais dos itens; revisar requisitos, classe, bônus e contexto de skill |
| Cartas | `import-ro-card-effects.py` | Efeitos suportados e mapeados; catálogo não valida estoque/encaixe |
| Refino | `import-ro-refinement.py` | Fatos/categorias do plano local; taxas e proteção continuam em regra explícita |
| Torre/drops | `build-ragnarok-tower-drops.py` | Pools e referências por andar; validar progressão e limites do modo |

Preservar proveniência e revisão em tabelas/manifestos. Importar um dado do jogo de referência não implica importar toda sua semântica: condições não suportadas devem ser identificadas, sem conversão silenciosa em bônus genérico.

Fluxo: guardar fonte/revisão → executar o importador específico → revisar diff → validar chaves/contagens → testar fórmulas afetadas → conferir UI e persistência quando houver mudança de schema.

## Ícones, terreno e referências de NPC

- `import-ro-equipment-icons.mjs` e `import-ro-skill-icons.mjs` produzem ícones locais.
- `import-ro-town-npc-references.py` registra referências/identidades; não cria automaticamente vila nivelada ou colisão.
- `build-ro-ground-atlas.py` produz atlas de chão; revisar UV, repetição, paleta e filtragem no mundo.
- `build-ro-footprints.mjs` deriva/organiza footprints; comparar forma visual e corpo físico.
- `build-ro-weapon-models.py` gera caixas de armas a partir dos ícones; cache/rig e fallbacks ficam no runtime.

Ícone é uma unidade visual de UI. Não usar o recurso ampliado como substituto do modelo 3D ou da animação de golpe, salvo escolha artística explícita e revisada.

## Arquivos do cliente e efeitos nativos

`ro-client-archive.mjs` e `ro-client-bmp.mjs` leem/decodificam dados. `import-ro-client-media.mjs`, `import-ro-native-effects.mjs` e `import-ro-native-primitives.mjs` produzem recursos e descritores que os bridges locais entendem. Não executar código do cliente de referência para importar dados.

O fluxo de efeito é:

1. Resolver identidade local da skill para referência e fases disponíveis.
2. Extrair dados/texturas necessários com manifesto e rastreabilidade.
3. Empacotar recursos locais para Vite emitir nomes versionados.
4. Prefetch das habilidades equipadas e ofertas visíveis, sem carregar todos os efeitos na entrada.
5. Interpretar keyframes STR ou primitiva admitida.
6. Rotear por fase: cast, viagem, impacto, área e buff podem ter donos diferentes.
7. Reservar o substituto completo antes de filtrar o fallback; preservar dano/avisos.
8. Conferir de perto e em horda. Ser decodificável não comprova equivalência ao visual original.

A ponte STR voxelizada fornece cobertura. Para uma skill importante, modelar trajetória, ramificação, volume e dissipação diretamente pode produzir resultado melhor e mais barato que amostrar uma imagem inteira em cubos por update.

## Áudio

`import-ro-client-media.mjs` fornece o conjunto geral, e `import-ro-refine-audio.mjs` acrescenta bigorna, sucesso e falha. `transcribe-ro-midi.py` produz uma alternativa aproximada em MIDI; não é reconstrução perfeita da gravação.

`src/assets/ro-audio/manifest.json` associa chave lógica, arquivo, hashes e metadados. `src/ro-audio-assets.js` contém referências de URL para o bundler. `ro-audio.js` trata preferência, desbloqueio do AudioContext, cache, buses, limite de vozes e descarte. O navegador pode exigir gesto para iniciar som.

No build, `ro-audio-release.mjs` verifica recursos pelo digest, resolve URLs e escreve catálogo versionado. Como ele inclui URLs, um build local com base `/` pode ter hash diferente do build CDN. Para conferir sons publicados, comparar digest dos bytes e arquivo emitido, em vez de adivinhar o nome do catálogo de outra base.

## Mapas e referências Warcraft

`extract-warcraft-terrain.py`, `extract-bloody-terrain.py` e `extract-phase-killer-world.py` convertem referências para dados do projeto. Os motores/scripts originais dos mapas não são executados pelo runtime atual.

Revisar escala, eixos, spawns, caminhos, obstáculos, água e limites. Arte importada/reconstruída não define sozinha vitória ou comportamento de unidade. Consulte [MAP_IMPORT](../MAP_IMPORT.md), as referências do modo e seu módulo em `shared/`.

## Adicionar uma habilidade de ponta a ponta

1. **Definição:** chave estável, fonte, classe, nível, tipo, custo, cast, recarga e descrição.
2. **Disponibilidade:** requisito, oferta, aprendizado, upgrade e barra/passiva.
3. **Execução:** alvo, alcance, trajetória/área, dano, controle, resistência e invocação.
4. **Contrato visual:** eventos com origem, alvo, direção, tempo e duração; nenhum dano duplicado no renderer.
5. **Arte:** modelo/partícula/volume, fases e fallback substituído.
6. **Interface:** ícone identificável, tooltip real, preview e cooldown/nível legíveis.
7. **Persistência/rede:** ranks/keys, restauração, ownership e comportamento online.
8. **QA:** manual/automático, sem mana, alvo morto, parede, boss, interrupt, FP/terceira e spam.
9. **Métrica:** primeiro uso e repetição, instâncias, uploads, término e memória.

Acrescentar o nome no catálogo é cobertura de dados; tocar um efeito é cobertura visual. Nenhum dos dois, isoladamente, implementa o comportamento completo.

## Atualizar documentação e inventário

```powershell
node scripts/generate-architecture-inventory.mjs
node scripts/check-architecture-docs.mjs
```

O gerador lista fontes/configurações, imports/exports encontrados, budgets e resumo de assets. É análise textual, não grafo de chamadas de runtime. O checker verifica links locais e caminhos do inventário e roda no CI. Não valida sozinho fórmulas, aparência ou links externos.

Ao mudar regra, atualizar manual e testes. Ao mudar importador, registrar entradas/dependências. Ao medir desempenho, anexar cenário e resultados, separando CPU, GPU, rede e carregamento.

## Da alteração à produção

1. Definir escopo e autoridade; conferir diff antes de alterar código gerado.
2. Implementar/verificar o comportamento. Para arte, executar o renderer; para regras, cobrir invariantes relevantes.
3. Rodar testes necessários e build; conferir regressões e diffs de assets.
4. Atualizar inventário/manual quando o desenho mudou.
5. Publicar pelo workflow com imagem e assets imutáveis.
6. Conferir SHA da imagem, HTML/bundle, healthcheck, origem dos assets e hashes quando necessário.
7. Conservar backups/rollback. Reverter bundle não equivale necessariamente a reverter migração de dados.

Operação: [HOSPEDAGEM](../HOSPEDAGEM.md), [CONFIGURACOES](../CONFIGURACOES.md), [SALAS_ONLINE](../SALAS_ONLINE.md) e [inventário](MODULE_INVENTORY.md). Segredos ficam em ambiente/secret store; documentação e exemplos não devem conter tokens reais.
