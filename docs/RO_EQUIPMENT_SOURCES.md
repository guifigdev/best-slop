# Equipamentos de builds de Ragnarok

Catálogo pesquisado em 23/11/2026 para `shared/ro-build-equipment.js`: **119 peças distintas**, sendo **54 armas e 65 outras peças**. Cada uma das 12 linhagens tem pelo menos cinco armas recomendadas. As recomendações orientam o sorteio de equipamentos e não afirmam qual é a build mais usada hoje no LATAM.

## Critério e fontes

As páginas de [Cavaleiros Rúnicos](https://browiki.org/wiki/Cavaleiros_R%C3%BAnicos), [Sentinelas](https://browiki.org/wiki/Sentinelas), [Feiticeiros](https://browiki.org/wiki/Feiticeiros) e [Trovadores](https://browiki.org/wiki/Trovadores) da bROWiki indicam famílias acessíveis de progressão. A seleção usa Éden, armas clássicas de nível intermediário, Mora, Botas Temporais e Ilusión/OS. Essas são referências comunitárias brasileiras, não uma pesquisa estatística do mercado ou das builds do LATAM.

IDs, número de encaixes para cartas, posição, tipo, mãos e permissão original de classe foram confrontados com a fonte primária do projeto rAthena: [item_db_equip.yml, commit d4b8e7b8f16061cc2496d377ac8f777ce72a4f39](https://github.com/rathena/rathena/blob/d4b8e7b8f16061cc2496d377ac8f777ce72a4f39/db/re/item_db_equip.yml), cuja última alteração desse arquivo é de 06/10/2026. Isso fixa a versão consultada; servidores oficiais podem ter diferenças regionais. Os números de combate abaixo são adaptações locais, não uma transcrição das fórmulas oficiais.

Nomes em português foram conferidos nestas listas, que associam nome ao ID:

- [Éden](https://browiki.org/wiki/Equipamentos_do_%C3%89den): peças iniciais e Violino Trovador.
- [Mora](https://browiki.org/wiki/Encantamentos_de_Mora): Cajado Vermelho.
- [Ilusión e OS](https://browiki.org/wiki/Equipamentos_Ilusi%C3%B3n): armas OS, coletes e motores.
- [Malangdo](https://browiki.org/wiki/Encantamentos_de_Malangdo): Cajado Mental, Lança Imperial, Harpa de Nepenthes e Krishna. [Lista arquivada](https://arquivo.browiki.org/wiki/Encantamentos_de_Malangdo): Perna de Verme com Rosto.
- [Paramercado](https://browiki.org/wiki/Paramercado): Tae Goo Lyeon e Maça Carga.
- [Glastheim](https://browiki.org/wiki/Glastheim): família Temporal; os IDs específicos com encaixe vêm do rAthena, e não dos IDs sem encaixe ilustrados nessa página.
- [Tumba da Honra](https://browiki.org/wiki/Tumba_da_Honra): Punho Violento. [Curatio](https://browiki.org/wiki/Curatio): Luz da Recuperação. [Túmulo do Monarca](https://browiki.org/wiki/T%C3%BAmulo_do_Monarca): Anel do Especialista.
- [Registro brasileiro do Arco Élfico](https://ragnaplace.com/en/ro/br/item/1746): nome e ID dessa arma.

Quando não foi possível conferir uma tradução brasileira, foi conservado o nome em inglês do rAthena e marcado `nameLanguage: 'en'`. Cada peça indica sua própria `nameSource`; nenhuma tradução foi inventada. Na expansão, mais 31 nomes foram associados aos IDs pelos links de itens de Mora, Malangdo e Tumba da Honra.

O [site oficial LATAM](https://ro.gnjoylatam.com) e o link de Database foram consultados. Eles redirecionaram para o portal GNJoy Americas; a página acessível era uma listagem de monstros. Por isso esse portal não foi usado para afirmar disponibilidade, preços, taxas ou popularidade atual dessas armas no servidor LATAM.

## Opções por linhagem

As linhagens de quarta classe recebem armas de suas famílias anteriores para oferecer evolução durante a partida.

| Linhagem | Intermediária | Avançada |
| --- | --- | --- |
| Cavaleiro Dracônico | Tae Goo Lyeon, 1181 | Claymore-OS, 21047 |
| Guarda Imperial | Lança Imperial, 1433 | Propulsora-OS, 32019 |
| Arquimago | Cajado Vermelho, 2009 | Rutilus-OS, 26151 |
| Mestre Elemental | Cajado Mental, 1654 | Placa-Mãe-OS, 28629; Rutilus-OS |
| Falcão do Vento | Arco Élfico, 1746 | Virtual-OS, 18178 |
| Trovador Celestial | Harpa de Nepenthes, 1926; Arco Élfico | Violino Trovador, 570022 |
| Cardeal | Luz da Recuperação, 1659 | Ultio-OS, 16089 |
| Inquisidor | Maça Carga, 16003 | Punho Violento, 1830 |
| Mestre Ferreiro | Tornado Axe, 28101 | Blasti-OS, 28136 |
| Biólogo | Maça Carga | Safira-OS, 16088 |
| Sicário das Sombras | Krishna, 1284; Ivory Knife, 13039 | Meuchler-OS, 28038 |
| Perseguidor do Abismo | Ivory Knife | Perna de Verme com Rosto, 13089; Fatalist, 510006 |

As peças do primeiro catálogo cobrem equipamentos físicos e mágicos do Éden, quatro Botas Temporais com encaixe, dois coletes e dois motores Ilusión, Anel do Especialista e dois escudos. `lineages` é uma recomendação para o sorteio local; não é uma afirmação de exclusividade original. Em particular, as peças do Éden são amplamente equipáveis no original. Os acessórios limitados a um lado no original registram `sourceAccessorySide`; a adaptação local usa os dois espaços genéricos de acessórios já existentes.

Foram evitadas duas atribuições incorretas: Kuroiro-OS é de Ninja/Kagerou, portanto não entrou como arma de Renegado; Safira-OS é de Alquimista e evoluções, portanto pertence à rota de Biólogo, não à de Inquisidor. As lanças de Guarda Imperial ocupam uma mão, enquanto arcos, katares, as duas espadas e os machados listados ocupam duas. A Placa-Mãe-OS é um livro de uma mão, e o Punho Violento é uma soqueira de uma mão.

## Adaptação e integração

`RO_BUILD_EQUIPMENT` é um mapa congelado por chave `build_ID`. Cada definição contém `key`, `name`, `sourceId`, `source`, `identitySource`, `nameSource`, `nameLanguage`, `slot`, `sockets`, `stats`, `lineages`, `minStage` e `grade`; armas incluem `weaponType` e `hands`. `headPosition` explicita topo nas duas boinas. Escudos têm `shield: true`.

`minStage` e `grade` são ambos 1, 2 ou 3: início, intermediário ou avançado. São a progressão deste jogo, não o nível-base exigido em Ragnarok nem o grau de encantamento oficial. O catálogo não altera baús, drops, personagens ou interface sozinho; a integração deve acrescentá-lo a `RO_EQUIPMENT` e consultar esses metadados para ofertas apropriadas.

O balanceamento usa a escala de abertura de aproximadamente 200 PV do jogo: armas intermediárias têm cerca de 17–23 ATQ ou 16–19 ATQM; avançadas chegam a 32 ATQ ou 28 ATQM. Bônus de atributo não passam de 4, o crítico de uma peça não passa de 6%, a aceleração não passa de 7% e a vida adicional por peça não passa de 55. As peças do Éden ajudam cedo sem eliminar o valor dos encaixes de cartas das versões posteriores.

Os efeitos originais de refino, conjuntos, drenagem, procs e aumento de uma habilidade específica não foram apresentados como implementados. Os atributos são uma adaptação do papel de cada arma à economia local. Destreza adicional influencia as fórmulas de conjuração já existentes; `haste` usa a aceleração que o jogo já entende. O catálogo mantém a animação básica da linhagem: equipar uma maça em Cardeal não o transforma em Espadachim nem troca automaticamente sua skill.

Nenhum ID novo duplica os equipamentos já existentes da Torre na revisão consultada. A Vara Sagrada e o Chakram já existem como `towergear_1631` e `towergear_1285`, por isso foram preservados sem criar cópias concorrentes neste catálogo. Os dados foram verificados programaticamente contra o YAML fixado, incluindo os encaixes das Botas Temporais 22006/22008/22009/22010 e a compatibilidade original de classe de todas as armas.


## Expansão para builds variadas

A expansão acrescenta 74 identidades reais, sem repetir IDs do catálogo de 45 ou da Torre: 30 armas e 44 peças de proteção/acessórios. Todas entram nos graus locais 2 ou 3. A antiga seleção do Éden foi conservada no catálogo de identidades; a política de ofertas fortes pode deixar as peças iniciais fora dos sorteios.

| Linhagem | Quantidade de armas compatíveis recomendadas | Exemplos adicionais |
| --- | --- | --- |
| Cavaleiro Dracônico | 7 | Muramasa, Guia da Morte, Alca Bringer, Gungnir |
| Guarda Imperial | 5 | Lança-Canhão, Gungnir, Broca |
| Arquimago | 5 | Bastão de Lágrimas, Survivor's Rod (Int), Illusion Survivor's Staff |
| Mestre Elemental | 7 | Livro de Feitiços do Frio e opções de cajado |
| Falcão do Vento | 5 | Besta Grande, Giant Bow, Illusion Hunter Bow |
| Trovador Celestial | 6 | Guitarra Elétrica, Oriental Lute, Cello |
| Cardeal | 6 | Cajado da Afeição, Nemesis e cajados de sobrevivência |
| Inquisidor | 5 | Spartacus, Iron Nail e Nemesis |
| Mestre Ferreiro | 5 | Fúria do Furacão, Veteran Axe e Machado Vecer |
| Biólogo | 7 | Bolsa Vermelha de Éter, Scalpel e machados |
| Sicário das Sombras | 7 | Infiltrator, Durga, Katar do Sicário e Scalpel |
| Perseguidor do Abismo | 6 | Adaga Negra, Faceworm Queen Leg e Scalpel |

As famílias de armadura incluem Mora/Peuz, Sapha, Nab, Asas da Luz e Asas da Sombra, além de Diabolus, Sprint, Morrigane e Orleans. São peças com bônus locais individuais. `collection` identifica a família; não inventa um bônus automático por completar o conjunto. `buildTags` distingue crítico, velocidade de ataque, precisão, conjuração, mágico, físico, vitalidade, proteção com escudo e suporte.

Há boinas e elmos de topo, três peças de meio e duas de baixo, além de acessórios independentes para ocupar os dois espaços. Foram evitados visuais e equipamentos que ocupariam várias posições de cabeça simultaneamente, pois o inventário atual representa posições separadas. Os quatro escudos novos preservam a compatibilidade original: o Livro Antigo de Geffenia é de Bruxo/Arcano, a Bíblia da Promessa de Sacerdote/Arcebispo e o Escudo Gigante de Cavaleiro/Templário.

**Todos os bônus em `stats` são intrínsecos no jogo, ativos ao equipar, mesmo sem refino.** Uma identidade original pode ter inspirado bônus que no MMORPG dependem de refino, atributos ou conjunto; aqui esses bônus adaptados não carregam tais exigências. O rótulo não afirma que o efeito local é uma cópia do script original. A expansão registra separadamente `sourceBase.attack`, `sourceBase.matk` e `sourceBase.defense` como fatos da ficha original. Esses números de origem não são os bônus usados no combate local.

A validação checou 119 IDs únicos, posições, encaixes, mãos e as permissões originais de classe de todas as 54 armas, além da compatibilidade das peças novas. O teste de integração equipa peças críticas e mágicas sem qualquer refino e compara os bônus completos. Os 45 equipamentos anteriores não perderam seus atributos adaptados.
