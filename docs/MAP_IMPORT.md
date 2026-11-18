# Mapas voxel: imagem, relevo e terreno original

Há duas fontes distintas de mapa. Uma imagem pode fornecer **cores e uma sugestão de biomas**. Um arquivo de terreno pode fornecer **alturas e passagem registradas no mapa original**. O importador mantém essa diferença nos metadados; não apresenta a cor de um minimapa como relevo exato.

## Importação de imagem

`shared/voxel-map.js` não usa DOM, canvas ou Three.js. Recebe pixels RGBA já decodificados pelo chamador:

```js
const map = convertMapPixels({ width, height, data }, {
  width: 32,
  height: 32,
  tileSize: 1,
  palette: DEFAULT_MAP_PALETTE,
  heightMap: optionalGrayscalePixels,
  heightMin: 0,
  heightMax: 4,
  markers: optionalMarkers
});
```

`data` pode ser array comum, `Uint8Array` ou `Uint8ClampedArray`, com exatamente `width × height × 4` valores entre 0 e 255. A fonte pode ter até 8.192 pixels por lado, limitada a 16.777.216 pixels totais. A matriz resultante tem no máximo **64 × 64 tiles**. Sem resolução explícita, a maior dimensão é reduzida a 64, preservando a proporção. Se somente largura ou altura for informada, a outra segue a proporção original. O tamanho de tile aceito é de 0,125 a 4 unidades.

Cada tile considera a média dos pixels da região correspondente, ponderada pelo alfa. Pixels transparentes não contaminam a média com sua cor oculta; uma região totalmente transparente usa `transparentBiome`, por padrão o índice zero. A classificação escolhe a entrada mais próxima da paleta em HSV, com distância circular de matiz e peso reduzido do matiz em cores pouco saturadas. Isso permite ajustar uma paleta manualmente para um minimapa roxo/cinza, sem supor que todos os mapas sejam verdes.

`DEFAULT_MAP_PALETTE` e `DEFAULT_VOXEL_PALETTE` são aliases da mesma paleta padrão: água, relva, bosque, caminho, pedra, penhasco, lava e neve. Os índices da matriz apontam para a posição na paleta, não para o nome. Cada entrada tem `id`, `name`, `color`, `height`, `walkable` e, opcionalmente, `obstacleHeight`. Cores normalizadas usam `#rrggbb`.

Sem `heightMap`, a altura vem do valor padrão do bioma e `heightSource` é `biome-estimate`. Um minimapa pode conter sombras, iluminação, cores de jogador, ícones ou água desenhada; esses pixels não revelam diretamente a altura do terreno. Ajustes de paleta, altura, passagem e marcadores precisam de revisão antes de aplicar o mapa.

Com `heightMap`, seus pixels precisam ser cinza real: R, G e B iguais. A transformação é linear:

```text
altura = heightMin + (cinza / 255) × (heightMax − heightMin)
```

Nesse caso `heightSource` é `grayscale-heightmap` e `source.exactHeights` indica que os **valores relativos do cinza fornecido** foram respeitados. Não significa que a imagem tenha sido comprovada como um heightmap real de Warcraft. A faixa de altura continua sendo a calibração escolhida pelo usuário. O importador não adiciona ruído nem deduz montanhas pelo brilho da imagem colorida.

## Esquema JSON e coordenadas

O esquema atual tem versão 1:

```js
{
  version: 1,
  width, height, tileSize,
  origin: { x, z },
  biomes: [],
  heights: [],
  walkable: [],
  palette: [],
  markers: {
    spawn, portal, fountain, heroSpawn,
    shops: [], buildings: [], path: [],
    routes: [{ id: 'west', name: 'Passagem do Poente', spawn, path: [] }]
  },
  id, name, seed, heightSource, source
}
```

As três matrizes são planas, em ordem de linhas: `index = row × width + col`. A coluna cresce em X; a linha cresce em Z, para baixo na imagem. `origin` é o **canto inicial** da matriz; por padrão, `(-width × tileSize / 2, -height × tileSize / 2)`, centralizando a extensão total em `(0, 0)`. O centro do tile é:

```text
x = origin.x + (col + 0,5) × tileSize
z = origin.z + (row + 0,5) × tileSize
```

Marcadores usam coordenadas do mundo local do mapa. `spawn`, `portal`, `fountain` e `heroSpawn` são pontos ou `null`. `shops`, `buildings` e `path` são listas de pontos. Pontos também podem guardar `id`, `name` e `unitKey`. Um corredor por jogador é transladado pela instância do jogo; os números do JSON não precisam ser duplicados para cada jogador.

`normalizeVoxelMap(input)` valida e devolve cópias independentes das matrizes, paleta, marcadores e origem. Rejeita versão desconhecida, dimensões acima de 64, tamanhos inconsistentes, números não finitos, índices de bioma inválidos, alturas fora de −32 a 64 e valores de passagem diferentes de 0/1. Também rejeita marcadores fora da área, paletas vazias/duplicadas, mais de 32 biomas, mais de 64 lojas, 128 prédios ou 4.096 pontos de caminho. Os metadados `source` são JSON, limitados a 12.000 caracteres. Campos externos ao esquema não se tornam comandos do jogo.

### Consultas e colisão

- `mapTileAt(map, x, z)` recebe coordenadas do mundo e retorna `{ index, col, row, x, z, biome, palette, height, walkable }`. X/Z no retorno são o centro do tile; fora da área retorna `null`.
- `mapObstacles(map, { x, z })` agrupa tiles não caminháveis em retângulos compatíveis com o campo da simulação. O deslocamento é somado às coordenadas locais. Cada retângulo informa `id`, `type` do bioma, `map: true`, `x`, `z`, `w`, `d`, `h`, `height` e índice do bioma. Grupos não misturam biomas ou faixas de relevo diferentes.
- Água não caminhável continua identificada como `type: 'water'`; a integração pode distingui-la de uma muralha para unidades voadoras. A matriz de passagem representa o solo, não uma regra universal de colisão aérea.
- A classificação de lava ou neve é um dado de terreno. Queimadura, frost, custo de movimento e outros efeitos continuam pertencendo às regras da simulação, e não ao parser de pixels.

## Validação do caminho

`validateMapPath(map)` retorna `{ valid, errors, path }`. Exige entrada e portal, confere conectividade por quatro vizinhos entre os pontos de `markers.path` e verifica se fonte, início do herói e lojas são alcançáveis. O caminho reconstruído usa centros de tiles e no máximo 4.096 passos. Um mapa inválido retorna erros; o validador **não abre passagem automaticamente** nem move marcadores silenciosamente.

Prédios podem representar estruturas não atravessáveis, por isso sua posição central não é tratada como destino obrigatório de navegação. A passagem até sua área de interação precisa ser definida pela integração. A validação de uma matriz não substitui testes do raio real de colisão, obstáculos dinâmicos, voo e formação de tropas.

## Referência original de Custom Hero Line Wars

Foi localizado o [arquivo v1.6a no EpicWar](https://www.epicwar.com/maps/116369/). O [registro do W3Reforged](https://maps.w3reforged.com/maps/categories/hero-defense-and-survival/custom-hero-line-wars) identifica Baka-Ranger e fornece um minimapa. A imagem de referência está em `assets/maps/reference/chlw-v1.6a-minimap.jpg`; o JSON ao lado registra URL, data e finalidade. Ela não é usada como textura de terreno nem como fonte exata de altura.

O arquivo original foi extraído em `outputs/line-wars-original`, sem executar JASS. Essa pasta é ignorada pelo Git e o `.w3x` não faz parte do conteúdo distribuído. A matriz derivada usa estes dados:

| Dado | Resultado observado |
|---|---|
| Terreno `war3map.w3e` | Versão 11, tileset X/Dalaran, 129 × 129 vértices: 128 × 128 tiles |
| Origem nativa | X/Y = −8.192 / −8.192 |
| Passagem `war3map.wpm` | 512 × 512 células, quatro células de passagem por tile |
| Texturas presentes | Identificadores de Dalaran; o preset usa cores próprias e não copia texturas |
| Região de entrada escolhida | `OI`, centro (−5.904, 5.632) |
| Segunda entrada do mesmo corredor | `XI` |
| Região final | `BI`, centro (4.384, 4.384) |

A leitura textual dos gatilhos `O_V` e `O2V` mostra uma ordem de movimento/ataque de entrantes de OI/XI até BI. A região BI remove a unidade e reduz vidas. Esse vínculo entre entrada e destino é verificado no script como **dado**, sem rodá-lo. O JASS não fornece a lista exata de todos os pontos que o navegador nativo escolhe; a rota exportada é um caminho caminhável calculado sobre o WPM original.

O formato de alturas segue a [documentação dos autores do HiveWE](https://github.com/stijnherfst/HiveWE/wiki/war3map.w3e-Terrain): altura base e nível de penhasco são combinados, e a grade contém vértices, não tiles. O extrator converte o resultado em unidades relativas de penhasco e usa a média dos quatro vértices de cada amostra. A passagem do solo vem do bit de bloqueio do WPM, não da cor do minimapa.

### Preset derivado e adaptações declaradas

`shared/maps/line-wars-map.json` preserva o preset histórico de 64 × 64, tile de 0,5 e extensão de 32 × 32 unidades. `historicalLineWarsMap()` em `shared/maps/line-wars-map.js` retorna sua cópia normalizada. O corredor superior original foi recortado entre X −7.424…7.168 e Y 2.048…6.912, incluindo sua forma em U e a faixa de town halls. É projetado nas primeiras 44 linhas; as 20 linhas inferiores são um **anexo novo de mercado**. Esse arquivo já não é o campo padrão.

O preset não é uma reconstrução métrica 1:1. A projeção de X/Z tem escalas distintas, a matriz tem resolução reduzida, a rota selecionada é alargada para os corpos voxel e há um conector novo para o mercado. O anexo e esse conector são nivelados; alturas relativas do terreno amostrado são preservadas no restante. As casas de envio adicionais e os seis NPCs são uma adaptação da nossa jogabilidade, não uma alegação de que o original possuía essas mesmas construções. `source.exactHeights` é deliberadamente `false`, e `source.adaptations` enumera as alterações.

Coordenadas locais importantes para a simulação:

```text
entrada:     (−12,666667, −10,210526)
portal:      (  9,894737,  −4,565789)
herói:       (  8,894737,  −3,565789)
fonte nova:  (  0,        13,8)
NPCs novos:  X = −12,5 / −7,5 / −2,5 / 2,5 / 7,5 / 12,5; Z = 10
```

A rota passa pelo braço superior e vira em direção ao portal à direita. A condição de vazamento precisa usar proximidade do portal e avanço pelos waypoints, não apenas um limite vertical `z >= portalZ`. A outra metade do U continua presente no terreno. Instâncias podem espelhar/transladar o conjunto, desde que transformem também marcadores e obstáculos.

### Reprodução e proveniência

Execute, a partir da raiz do projeto:

```sh
python scripts/extract-warcraft-terrain.py --input outputs/line-wars-original
```

O extrator usa `struct`, `hashlib`, JSON e busca textual. Pillow é opcional, apenas para o preview; neste ambiente está em `outputs/map-tools`. O leitor genérico aceita W3E v11 e WPM com dimensões verificadas; o gerador deste recorte exige os hashes específicos já conferidos para não atribuir outro mapa a Baka-Ranger por engano. Os módulos do navegador não dependem de Python ou do arquivo `.w3x`.

SHA-256 das entradas:

```text
war3map.w3e cd539b3d171dfd8e5a35c5e53823c2d021b49cc19cb2a4d51c26efaf3385e639
war3map.wpm f46bcf680298e1c802399a713829e7cd1b2e4c6bb042210f61168d4e4f7e8cc5
war3map.j   63b7f8746739e15e3848c90ae39f358bc4cc92258e127b79c3cca6e280c56bd2
```

A seed do preset é 160; o processo não usa sorteio nem timestamps na matriz. Gerar novamente com as mesmas entradas produz o mesmo JSON. Nenhum modelo, sprite, textura, áudio ou script executável de Warcraft foi adicionado ao jogo por este processo.

## Testes

`tests/voxel-map.test.js` cobre round-trip JSON, cópias independentes, rejeição de matrizes grandes/malformadas, HSV/paleta, alfa, redução de resolução, altura cinza, coordenadas, união de obstáculos, marcadores inválidos e rotas desconectadas. O preset derivado passa pela verificação de fonte, portal e seis serviços alcançáveis. A rota selecionada e os marcadores essenciais permitem raio de colisão de 0,8 unidade.

Os testes de integração criam `Game` diretamente no modo Line Wars, sem trocar o modo depois da construção: um herói de raio 0,8 sai do marcador de nascimento e caminha até cada um dos seis NPCs, tanto na preparação quanto durante a partida. Todas as 16 receitas compradas percorrem a rota usando os ticks reais e descontam exatamente seu custo de vidas no portal; as unidades terrestres também são verificadas com raio 0,8. Os defensores ficam fora do caminho neste teste para medir trânsito, sem interferência de combate.

O botão **Mapas** abre o editor. O cenário aplicado é normalizado e salvo localmente; vale para a próxima partida de Line Wars, incluindo a configuração enviada ao criar uma sala online. Outros modos continuam usando seu cenário próprio. Um arquivo salvo inválido é ignorado na inicialização.

## Campo padrão: Portais dos Fiordes

`defaultLineWarsMap()` agora cria o campo autoral em `shared/maps/fjord-portals-map.js`: **36 × 64 tiles de 1,75**, ou **63 × 112 unidades**. Sua seed é 1602. O campo mantém a inspiração nórdica/Dalaran e registra `source.kind: authored-adaptation`; não apresenta a geometria nova como reconstrução do mapa de Baka-Ranger.

Há duas entradas: Poente em (−18, −49) e Aurora em (−3, −49). Cada corredor avança 75 unidades antes de virar em direção ao portal (−10, 35), produzindo percursos de aproximadamente 87 unidades. Uma elevação divide as rotas e outra separa o distrito de recrutamento, a leste. As 16 casinhas ficam em X 13…28, Z −12…12. Cada casinha tem `routeId`; grupos alternam a entrada e incluem tropas baratas nas duas rotas. A tropa enviada conserva `lineRoute` e `lineEntryName`.

A fonte fica em (0, 46), com raio de recuperação de 5 unidades. Os seis serviços ficam ao redor dela; a própria fonte também oferece o comércio universal de Line Wars. O herói nasce em (−10, 31), perto da confluência defensiva.

`markers.routes` aceita até oito rotas com ids únicos, entrada e 2…4.096 pontos. Todas as rotas e serviços precisam alcançar o portal por tiles transitáveis. `markers.path` continua representando a rota principal para consumidores antigos. Mapas históricos sem `routes` recebem uma rota `main`, preservando importações antigas.

As células de Line Wars usam limites retangulares locais `minX/maxX/minZ/maxZ`, além de `halfWidth`, `halfDepth` e `r` para compatibilidade visual. O campo padrão usa X ±31,5 e Z ±56. A distância entre instâncias é a largura do mapa mais 16 unidades, tanto na preparação quanto durante a partida. Movimento, colisão e navegação respeitam esses limites. Outros modos mantêm seus limites anteriores. O runtime aceita extensões contidas em X/Z ±128 e continua limitado a matrizes de 64 × 64.

A regressão física percorre **as 16 receitas nas duas entradas**, incluindo raio terrestre de 0,8, quatro instâncias sem sobreposição, visitas a todos os serviços antes/durante a batalha e bots usando as duas entradas até os primeiros 20 segundos. O preset histórico também conserva um teste completo de trânsito.

### Alvo escolhido ao visitar o rival

O comando de compra é `{type:'queueLineUnit', unitKey, target: rivalOwner}`. O servidor valida que o alvo existe, está vivo e pertence a outro jogador. Ele encontra a casinha interna da receita **do comprador**, preservando seu ouro, renda e cooldown; clicar no campo de outro jogador não concede controle das construções daquele jogador. Dois compradores podem atacar a mesma base. O limite de população considera a soma dos invasores naquela base.

O pedido conserva `target`; o snapshot inclui `targetName` e `explicitTarget` para exibição. Se o rival for eliminado antes do envio, o pedido é removido sem cobrar ouro, com evento `lineQueueCancelled` e `reason:'targetEliminated'`; a próxima entrada pode executar no mesmo tick. O servidor nunca troca automaticamente o alvo de um pedido explícito. O formato legado `{building}` continua usando o próximo rival vivo, para a IA e integrações anteriores. `sendLineUnit` também aceita `{unitKey,target}` e aplica as mesmas regras para envio imediato.
