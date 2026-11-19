# Referência de terreno do Blood Tournament

O vídeo indicado pelo jogador é [Warcraft 3 Star Wars Blood Tournament #233, de Sarkosiis](https://www.youtube.com/watch?v=QdDI60ckoxo). O título foi confirmado pelos metadados públicos do próprio YouTube; os quadros de storyboard mostram uma plataforma privada com três manchas verdes e um campo de batalha irregular. A descrição consultada não informa a versão do mapa.

Foi baixado [Star Wars Blood Tournament 6.4d, de Billy-Jack](https://www.epicwar.com/maps/331579/), publicado em 13/09/2023. A página do arquivo referencia Baal e informa oito jogadores, 96 × 96 células e área jogável de 84 × 84. Esta é uma referência verificável da família mostrada no vídeo; não está comprovado que seja exatamente a mesma revisão. O terreno extraído contém as mesmas plataformas privadas com três manchas verdes vistas na referência. A adaptação usa personagens e arte voxel próprios, sem importar os modelos, texturas ou áudios de Star Wars/Warcraft.

## O que existe no arquivo

- Oito áreas privadas nos cantos, duas por canto, identificadas pelas regiões Red, Blue, Teal, Purple, Yellow, Orange, Green e Pink.
- Oito regiões Frontrank e oito Reinforcements nas quatro direções cardeais, em torno do campo central.
- Uma área central com quatro setores: areia ao norte, lava a oeste, vegetação a leste e gelo ao sul. O contorno tem água, desníveis e extensões próprias de cada setor.
- 97 × 97 vértices de terreno, 13 tipos de textura numérica, 437 objetos decorativos e uma grade de caminhamento de 384 × 384.
- O mapa original aceita oito participantes. Qualquer opção de dez jogadores ou equipes de cinco é uma adaptação deste projeto.

Isso substitui a suposição anterior de que uma arena quadrada genérica representava o cenário original. Grand Blood Tournament e Blood Tournament Reloaded são outras versões da família e não comprovam o terreno do vídeo indicado.

## Extração reproduzível

O download de referência e seus arquivos descompactados ficam em `outputs/bloody-tournament-reference/`, que não é distribuído. SHA-256 do arquivo `.w3x`: `f7d3ce48b89b8dc6249cfd37bd7dfabba2b17cd957d077d625b736b7fb009a71`.

`scripts/extract-bloody-terrain.py` valida hashes de W3E, WPM, DOO e JASS antes de gerar `shared/bloody-terrain-data.js`. A leitura do JASS extrai apenas constantes de regiões e pontos iniciais; não executa o código do mapa. A leitura DOO considera o campo de skin adicional presente neste arquivo de Warcraft 1.36. O conjunto publicado contém somente números, códigos de terreno e identificadores, com a procedência registrada no próprio módulo.

`BLOODY_TERRAIN_DATA` fornece:

| Campo | Interpretação |
| --- | --- |
| `origin`, `step`, `width`, `height` | Origem `[-48,48]`, passo de 1 metro, grade de vértices 97 × 97 |
| `tiles`, `textures` | Um dígito hexadecimal por vértice e sua tabela de códigos nativos |
| `relief`, `heights` | Camada de penhasco nativa e altura original em metros do projeto |
| `water` | Máscara `0`/`1` obtida do bit `0x40` dos vértices W3E |
| `placements` | Objetos com posição, escala, orientação, tipo e identificador nativos |
| `regions`, `starts` | Retângulos nomeados e oito pontos iniciais extraídos do JASS |
| `pathing` | Bytes WPM em hexadecimal, passo de 0,25 metro; bit `2` significa terreno não caminhável |

Conversão: `x = nativeX / 128`, `z = -nativeY / 128`. As linhas das grades avançam no sentido de `nativeY`, portanto diminuem `z`. O índice do vértice é `floor((48-z)/step)*width + floor((x+48)/step)`. As alturas nativas não devem ser usadas como altura física sem adaptar também os atores e a navegação. Renderizar uma superfície nivelada preservando as cores e contornos é uma adaptação explícita, não equivalência de relevo.
