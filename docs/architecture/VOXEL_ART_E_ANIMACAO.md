# Voxel art e animação

## Linguagem e representação

A maioria das esculturas é código/dados de caixas coloridas, no formato `[x,y,z,w,h,d,color]`. Algumas rotas acrescentam orientação ou outros campos. Posição costuma ser o centro da caixa. `color` é uma cor numérica; a geometria bakeada passa cores por vértice. O eixo vertical é Y; movimento no mapa usa X/Z.

Isso é uma apresentação voxel/facetada sobre malhas poligonais do Three.js. Não há um mundo volumétrico destrutível universal nem uma grade voxel de física para cada parte. Um cubo visual pode virar triângulos numa malha consolidada; colisão usa descritores separados.

O projeto não usa Blender, VAT ou arquivos glTF como pipeline principal de personagens. Há esculturas manuais, geradores a partir de referências e animação procedural/articulada. A escultura não deve ser descrita como modelo original quando sua silhueta foi reconstruída diretamente de referência Ragnarok.

## Fluxo completo de um personagem ou monstro

1. Identificar espécie/classe, referência e `sourceId`; registrar origem em manifesto/tabela quando existir.
2. Definir silhueta, proporção, paleta, porte, contato com o chão e detalhes que sobrevivem à distância da câmera.
3. Produzir `parts`, membros, asas e pivôs no módulo de arte. O corpo de um monstro deve continuar reconhecível sem efeito ou tooltip.
4. Separar membros que precisam animar. Peças do braço/asa não podem continuar duplicadas no corpo estático.
5. Consolidar a parte estática em malha e compartilhar geometria por identidade.
6. Instanciar pose/transformação por ator; aplicar tamanho, orientação e altura do terreno.
7. Adicionar feedback de hit, estados e morte em camadas que não mutem o material compartilhado de todos os atores.
8. Conferir retrato, modelo no mundo, frente/costas/lateral, vários tamanhos e ambos os modos de câmera.
9. Conferir bounds, pivôs, golpe, arma, colisão e desaparecimento. Depois medir cold spawn e custo de repetição.

Arquivos centrais: `src/monster-art.js`, `src/ragnarok-monster-art.js`, `src/ragnarok-job-art.js`, famílias de bestiário, `src/actor-identity.js`, `shared/monster-visual-references.js` e hulls/footprints do domínio.

## Consolidação e superfícies

`view.js` fornece helpers de construção e bake. Na primeira construção, caixas podem ser `Mesh` temporárias. O bake produz uma geometria consolidada e remove/descarta as caixas temporárias. Instâncias posteriores da mesma identidade devem reaproveitar o resultado.

`src/voxel-shell.js` calcula faces expostas da união de caixas, inclusive cobrimentos parciais. Essa etapa tem comparações entre caixas e é cara em modelos detalhados. A opção de clipping parcial pode multiplicar triângulos; por padrão algumas faces parcialmente cobertas conservam o quad para limitar essa expansão.

`ro-faceted-geometry.js` e `ro-faceted-surface.js` controlam chanfro/facetamento e apresentação geométrica. Isso não é o mesmo controle que pixelização de tela. Arte deve escolher forma e acabamento de borda antes de depender de pós-processamento para ocultar problemas.

Não consolidar todo um mapa numa malha enorme só para reduzir draw calls: isso prejudica culling e aumenta trabalho invisível. A unidade de consolidação precisa combinar material, imobilidade e região espacial.

## Animação

Locomoção legada usa oito poses e amostragem base de 8 Hz, com cadência e peso por espécie. Ataques novos podem ter transformação contínua de ombro, punho, arma e corpo; não é correto dizer que absolutamente toda animação do projeto roda a oito poses.

`animation-profiles.js` fornece locomoção/construção. Modelos com asas retornam grupos e pivôs; grupos articulados conservam posições locais ao pivô. Armas e braços têm rig específico em `ro-weapon-rig.js`; katars e habilidades giratórias usam suas poses especializadas.

A pose visual lê eventos e tempo. Não decide a taxa de ataque. A rapidez vem de ASPD/casting e eventos autoritativos. Para um golpe legível, incluir antecipação, passagem pela região atingida e recuperação, com proporção coerente ao período real do ataque.

## Modelos de armas equipadas

O fluxo atual cobre 138 armas:

- `shared/ragnarok-equipment.js`: identidade, tipo, mãos, requisitos e gameplay.
- `src/assets/ro-equipment-icons/`: ícones de referência existentes.
- `scripts/build-ro-weapon-models.py`: produz 132 esculturas de caixas a partir das silhuetas disponíveis.
- `src/ro-weapon-model-data.js`: saída gerada, sem planes de textura.
- `src/ro-voxel-weapons.js`: cache, limite de 960 peças e seis fallbacks sólidos para itens sem imagem local.
- `ragnarok-job-art.js` e `ro-thief-job-art.js`: integram a escultura ao personagem.
- `ro-weapon-rig.js`, `ro-melee-motion.js`: ombro, punho, estocada e ponto da lâmina.
- `ro-first-person-weapon.js`: arma e mãos próximas da câmera, com orçamento próprio.

O gerador lê alfa/paleta, encontra o eixo principal da silhueta, alinha o comprimento e cria camadas de profundidade/chanfro. Bordas pretas pintadas do ícone são substituídas por material sombreado. Portanto a saída é 3D real, mas ainda herda simplificações da imagem pequena. Isso não equivale a uma escultura manual detalhada para close-up; armas importantes podem receber modelos dedicados sobre esse fallback.

Pré-requisitos do gerador: Node acessível ao Python, Pillow, NumPy e os ícones de referência. Editar a saída gerada manualmente sem atualizar o processo perde a alteração na próxima geração.

O personagem e a primeira pessoa devem usar a mesma identidade de arma. A chave de cache inclui a peça equipada. A animação de espada usa ombro/punho; a lança aponta para frente e estoca. O rastro usa o mesmo helper do ponto extremo da arma, evitando um arco decorativo solto. Primeiro revisar arma/pose; depois ajustar cor, largura e tempo do afterimage.

## Cenários e terreno

Terreno é malha/instanciamento com altura e materiais; colisões continuam nos módulos compartilhados. `bonk-world.js`, `voxel-terrain.js`, `world-landscape.js`, rochas de caverna e pacotes de ambiente têm responsabilidades distintas.

Casas, vilas, fonte e balcões precisam de uma base nivelada na mesma altura usada pelos atores. Não basta elevar a arte se o personagem continua andando em um relevo incompatível. Cavernas usam volumes que se estendem além da vista e formações rochosas, acompanhadas de luz/fog; não uma parede plana preta usada como substituto de formação geológica.

Vegetação e plateia usam lotes e dados compartilhados, com vento/pose derivados de raiz e tempo. A câmera não deve mudar a fase global de folhas, chuva ou névoa. Elementos que ocultam o herói podem usar dithering/transição sem mudar a colisão do tronco.

## Referências e importações

Existem três caminhos que devem continuar identificados:

1. **Escultura procedural autoral**: caixas e paleta criadas no projeto.
2. **Reconstrução por referência**: forma baseada em sprite/ilustração/dado externo, reconstruída em malha.
3. **Asset importado**: ícone, áudio, textura, STR, primitivas ou informação do cliente/mapa.

Importadores `scripts/import-ro-*` e extratores de mapas mantêm fatos e manifestos. O leitor GRF acessa dados do cliente de referência sem executar o cliente. Arquivos STR conservam keyframes; primitivas importadas podem produzir cilindros/volumes. Não confundir empacotar uma referência com conferir a fidelidade de sua animação em todas as situações.

Referências e estudos temporários ficam em `outputs/`; recursos utilizados pelo cliente precisam estar em `src/assets/` ou saídas rastreadas. O jogo publicado não pode depender de um caminho absoluto da máquina do desenvolvedor.

## Ícones, retratos e itens no chão

Ícones e itens no chão podem usar imagens pixeladas/atlas deliberadamente. Esses usos não justificam reaproveitar o ícone como billboard de impacto. Retratos são outra escala de leitura e podem ser renderizados/cacheados sem reconstruir o modelo completo a cada atualização do HUD.

As últimas armas usam escultura geométrica no mundo; os ícones existentes continuam sendo recursos separados. Mudar o modelo não redesenha automaticamente o ícone. Um item caído precisa de escala, transparência e label coerentes com o mesmo ID usado pela coleta.

## QA da arte

| Verificação | Falha que evita |
| --- | --- |
| Frontal, lateral, costas e primeira pessoa | Arco invertido, lança cruzando a câmera, mão enorme |
| Piso plano e inclinado | Base submersa, arma atravessando chão, fonte flutuante |
| Noite, gelo, lava e floresta | Corpo invisível ou clarão que apaga o personagem |
| Uma cópia e horda | Geometria compartilhada corrompida, explosão de draw calls |
| Tamanho/hitbox e golpe | Dano sem contato visual ou alcance decorativo gigante |
| Limpeza, troca de mapa e equipe | Efeito órfão, recurso descartado ainda em uso |
| Caminho frio e quente | Pausa na primeira aparição disfarçada por média baixa |

Testes de arrays finitos, budgets, cache e dispose são necessários. O julgamento de silhueta, peso, textura e sensação de golpe exige imagem ou execução do renderer. Consulte também [a auditoria visual histórica](../RO_SKILL_VISUAL_AUDIT.md) sem tratar suas contagens antigas como cobertura atual.
