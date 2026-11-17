# Direção de arte — Coliseu das Mil Formas

Animais voxel originais, silhuetas compactas e legíveis e poses em passos de oito quadros por segundo. A câmera de combate precisa mostrar o animal, seu estado e o terreno sem depender de abrir uma ficha. A inspiração de jogos de animais voxel orienta proporções e ritmo; personagens, ícones e efeitos são próprios.

## Linguagem visual

- **Materiais do mundo:** cores de vértice, grandes planos claros, sombra curta e faces com contraste. Preservar as cores de pelagem, equipamentos e equipe. Evitar um filtro global que uniformize todos os animais.
- **Fogo:** laranja vivo, centro amarelo claro, contorno irregular e poucas brasas quadradas que sobem. O fogo aparece sobre o corpo e persiste enquanto houver queimadura, inclusive depois de sair da lava.
- **Frio / frost:** azul ciano, cristais curtos junto dos pés, aro de geada e brilho de borda discreto. Frost reduz movimento; não usar um bloco de gelo envolvendo todo o animal, porque isso sugeriria uma imobilização inexistente.
- **Veneno:** fragmentos verde-limão que flutuam perto do corpo. Diferenciar do verde quente e restaurador da cura; o movimento de fragmentos e o rótulo textual reforçam o significado.
- **Atordoamento:** estrelas acima da cabeça, separado dos cristais de frio. **Barreira:** aro violeta e indicação de absorção. Um personagem pode ter vários efeitos ao mesmo tempo.
- **Ilustrações:** composições de 64 × 64, silhueta central contrastada, planos facetados com luz e sombra próprias, fundo escuro e moldura fina. O significado precisa funcionar também a 35–48 pixels. Microdetalhes são secundários.

O estado de combate deve ter texto e forma, além da cor: fogo / frost / veneno no HUD; estrelas para atordoamento, cristais para frio e brasas para queimadura. Isso reduz a dependência da percepção de cores.

## Implementação dos efeitos persistentes

`src/status-effects.js` exporta `createStatusEffects(root, baseGeometry?)`, com `update(unit, time, enabled)` e `dispose()`. A simulação continua sendo a autoridade: o módulo apenas lê `dots.burn`, `dots.lava`, `dots.frost`, `dots.poison`, `frostUntil` e `solarUntil`, sempre comparando os tempos de término. A aura solar renova um intervalo curto em `solarUntil` quando causa dano; o fogo do alvo desaparece quando esse intervalo acaba.

Cada ator usa no máximo três meshes e três draw calls: fogo com suas brasas, geada com seus cristais e veneno com seus fragmentos. Geometrias e materiais são compartilhados entre atores. Não há texturas, luzes adicionais, pós-processamento em tela inteira nem centenas de partículas. Os shaders usam tempo quantizado a 8 Hz para acompanhar o movimento das poses.

O shader de fogo recorta planos cruzados e varia o contorno em células. O shader de geada usa as normais das faces para um Fresnel suave; isso não altera o material do personagem. O shader de veneno move os fragmentos em passos curtos. A composição usa transparência normal para manter laranja, ciano e verde distinguíveis também nas arenas claras. Atores ao longe podem desativar esses efeitos pelo argumento `enabled`; o orçamento de visibilidade pertence à view.

Ao remover um ator, chamar `statusEffects.dispose()` **antes** da limpeza genérica de suas meshes. O grupo é desanexado primeiro e os recursos compartilhados só são liberados quando o último ator que os usa é descartado. Chamadas repetidas de `dispose()` são seguras.

## Critérios para revisão

1. Um herói queimando deve continuar identificável sobre areia, lava e gelo, sem perder a leitura da pelagem.
2. Frost deve comunicar lentidão e frio, sem parecer um stun ou bloqueio de comandos.
3. A câmera afastada deve mostrar a silhueta principal de cada estado. O HUD mantém os rótulos quando o efeito visual estiver fora do orçamento de distância.
4. Eventos explosivos podem ter um pico breve de brilho; efeitos persistentes ficam menores para preservar a leitura de ataques e áreas perigosas.
5. Mais detalhe não deve exigir mais texturas, sombras dinâmicas por partícula ou materiais exclusivos por personagem.

Os efeitos são apresentações procedurais em passos de 8 Hz, não animações exportadas de Blender/VAT. Não alteram dano, duração, resistência ou qualquer regra de atributos.

## Bestiário de silhuetas

`src/monster-art.js` fornece corpos originais que a view reúne em meshes voxel e anima com as poses existentes. O leão se identifica pela juba larga dourada e ponta de cauda escura; o rinoceronte, pelo corpo cinza robusto e chifre em degraus. O grifo combina corpo leonino, cabeça clara, bico dourado e asas de penas. A quimera tem três cabeças diferentes — leão, cabra com chifres e serpente —, cauda serpentina e asas escuras. O dragão usa focinho alongado, chifres claros, crista dorsal, cauda longa e membranas de asas avermelhadas. A esfinge tem corpo leonino e máscara/listras azuis e douradas.

Os seis preservam uma leitura quadrúpede e o contraste de planos grandes. Diferenças de tamanho são aplicadas pela view, mantendo essas proporções e os mesmos clipes de poses a 8 Hz. As ilustrações de sopro de fogo, nuvem venenosa, mergulho elétrico, pele rochosa, brado, investida de chifre, projéteis de fogo/gelo e fúria seguem a mesma linguagem facetada do catálogo.
