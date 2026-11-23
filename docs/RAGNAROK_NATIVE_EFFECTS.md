# Efeitos originais: pacote STR

O importador é `scripts/import-ro-native-effects.mjs`. Não copia código de outro renderizador. Ele consulta os IDs reais das habilidades, resolve separadamente as fases de conjuração, acerto e chão, valida os keyframes e empacota JSON e PNG locais com hashes. A execução padrão inclui todas as rotas STR das habilidades curadas que a fonte oferece:

```powershell
node scripts/import-ro-native-effects.mjs --max-mb=25
```

Para uma revisão pequena: `--skills=hammerfall,stormgust,mg_safetywall,al_pneuma,wz_quagmire`. `--refresh` atualiza o cache de importação; `--out=... --no-bridge` permite uma saída isolada para inspeção. A execução não remove arquivos anteriores.

Em 23/11/2026, o catálogo local possui 685 habilidades, sendo 682 com ID de origem. A fonte resolve 423 desses IDs; 107 possuem alguma parte STR, incluindo habilidades que o jogo não oferece. O pacote das rotas curadas contém **81 arquivos STR e 231 texturas distintas**, aproximadamente **10,4 MB** antes da compressão HTTP. Há 75 identidades com pelo menos uma parte empacotada: 56 com STR na conjuração, 22 no acerto e seis no chão. Treze possuem apenas o acerto em STR. Isso não significa 75 animações completas: partes procedurais continuam identificadas no manifesto.

`src/ro-native-effect-assets.js` exporta `RO_NATIVE_EFFECT_MANIFEST` e `RO_NATIVE_EFFECT_ASSETS`. O segundo usa o nome STR como chave e oferece `url`, `textures`, `fps`, `maxKey` e `duration`. URLs literais `new URL(..., import.meta.url)` permitem que Vite publique os arquivos com hashes no mesmo endereço de assets do restante do jogo. A aplicação não precisa consultar o servidor público durante a partida.

Os dados preservam posição, UV, quatro vértices, cor, ângulo, troca de textura e fatores de blend de cada keyframe. Arquivos numerados usam `variantGroup` e `variant`; selecione uma alternativa por grupo. Nomes antigos em CP949 são convertidos para Unicode. Transparência original dos PNGs é mantida; fundos escuros de camadas luminosas dependem do blend e não devem ser apagados globalmente.

O conjunto completo ocuparia aproximadamente 20,8 MiB de texturas decodificadas. O renderizador deve carregar antecipadamente apenas os efeitos do personagem, compartilhar texturas por URL, manter um cache limitado e descartar recursos sem usuários. O pacote não define dano, alcance ou duração de estados da simulação.

Exemplos verificados: Martelo de Thor usa habilidade 110 → efeito 102 → `crashearth` (60 fps, 80 índices, 13 camadas, incluindo `hammer.bmp`). Nevasca usa habilidade 89 → efeito 89 → `stormgust`. Ira de Thor possui `lord`. Coluna de Pedra tem o acerto `earthhit`, mas a parte principal é procedural (`QuadHorn`), portanto não fica completa com esse importador. Impacto Explosivo usa cilindros, e Bash usa faixas 2D; nenhum dos dois deve ser apresentado como um STR completo.

Fontes de dados e referências:

- [ragassets: API e formatos](https://github.com/adsonpleal/ragassets)
- [Mapeamento de habilidades](https://assets.latam-tools.com.br/effect/skill-map)
- [Partes de cada efeito](https://assets.latam-tools.com.br/effect/table)
- [Catálogo de vídeos e referências GRF](https://github.com/lukasrmattos/ragnarok_effects_list)

O software ragassets tem licença MIT. A arte do jogo pertence à Gravity e não recebe essa licença de software; a proveniência fica no pacote. O catálogo de vídeos consultado não possui arquivo de licença. A implementação deste projeto usa seu próprio código e o formato dos dados, sem copiar os renderizadores GPL do roBrowser.

## Primitivas declarativas

`scripts/import-ro-native-primitives.mjs` amplia a importação com partes 2D, 3D, cilindros e pirâmides de quatro faces. A saída separada, `src/ro-native-primitive-assets.js`, preserva a integração STR e contém 111 partes para 39 habilidades, com 30 texturas originais, aproximadamente 287 kB. Junto ao pacote STR, existem **107 identidades com alguma parte original disponível**; a contagem continua sem representar animação completa para todas elas.

`createRoNativePrimitiveArt` recebe `manifest`, `assets`, `requestsForEvent` e `requestsForState`. Sua API possui `prepare`, `preload`, `handles`, `handlesRequest`, `update`, `stats`, `reset` e `dispose`. O carregamento usa apenas URLs locais. A geometria dinâmica reutiliza até oito lotes, 32 clipes, 384 partículas e dois atlas de 1024². Há recorte por câmera/distância e decisões estáveis de fallback: uma textura que terminou de carregar não substitui um efeito pela metade. Solicitações com `preserveAttackTrail` admitem um impacto secundário sem suprimir o rastro físico aprovado.

Impacto Explosivo agora pode usar os dois cilindros e texturas descritos no efeito 17, com expansão radial ao longo de 300 ms. A receita factual do efeito 142 foi convertida em dados declarativos: uma grade de 25 pirâmides texturizadas com pedra, altura e inclinação variadas e emergência de 250 ms. A receita é identificada por `sourceRecipe`; não há execução de código `FUNC` recebido da rede. As demais funções desconhecidas e animações SPR sem sprite continuam fora deste suporte. O importador não inventa um desenho para preencher essas lacunas.

## Integração no jogo

`src/ro-native-effect-system.js` reúne os dois renderizadores dentro de `createView`. O bridge prepara recursos das habilidades equipadas e das quatro ofertas visíveis; só substitui uma apresentação anterior quando todas as partes pedidas estão carregadas e admitidas. Eventos de inimigos, avisos de MVP e ataques básicos permanecem nas rotas próprias. Golpes físicos preservam o rastro de arma aprovado e acrescentam o acerto original.

`shared/ro-native-effect-policy.js` resolve conjuração, acerto e área pelo ID real da habilidade. Acertos de projéteis surgem na colisão, e campos persistentes seguem a duração autoritativa. O renderer não cria dano ou novos ticks. Partes com geração FUNC não implementada ou sprites ausentes continuam com a apresentação anterior. Portanto, **107 identidades com alguma parte original não significa 107 habilidades inteiramente reconstruídas**, nem uma revisão concluída das 685 habilidades.

A composição em HDR preserva o alfa do destino opaco original para evitar retângulos brancos em camadas luminosas. Cilindros de Impacto Explosivo e a grade de Coluna de Pedra ajustam a escala à área real; o anel acompanha o relevo e cada pilar mantém sua forma sobre o terreno. As demais auras e projéteis não recebem essa adaptação geométrica.

A revisão visual local comparou Martelo de Thor lado a lado com o vídeo original e verificou a integração real de Martelo, Nevasca, Coluna de Pedra, Impacto Explosivo e Lanças de Fogo. A prova do martelo fica em `outputs/martelo-original-comparacao-final.jpg` (artefato local de revisão). Os testes cobrem os dados importados, a política de fases, o playback STR, os limites de recursos, o blend HDR, as primitivas e a identidade dos acertos de projéteis.
