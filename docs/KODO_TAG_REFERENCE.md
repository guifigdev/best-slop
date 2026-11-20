# Kodo Tag: referência e cobertura

Esta implementação usa **Kodo Tag V1.6, de TinyTauren**, edição clássica de Reign of Chaos. Não mistura o catálogo das versões X-Treme posteriores. A identificação vem dos textos `war3map.wts` e do script do próprio mapa, consultados em 19/11/2026.

- [Mapa arquivado no EpicWar](https://www.epicwar.com/maps/346546/)
- [Registro da mesma edição no WC3Maps](https://wc3maps.com/map/347521/Kodo_Tag_V1.6)
- Arquivo analisado: `outputs/kodo-tag-reference/KodoTagv1.6.w3m`, 56.595 bytes.
- SHA-256: `8b3ed66313ae54d46002b8c059340f80248097f916196d37082892c9d3020635`.

Os arquivos do mapa foram lidos como dados; o JASS não foi executado. Nenhuma malha, textura ou áudio de Warcraft foi incorporado ao jogo. Os modelos voxel são próprios. O catálogo registra também os hashes individuais dos arquivos extraídos.

## O que foi confirmado no mapa

O Runner usa o modelo Mountain King, tem **1 HP**, movimento 300 unidades Warcraft/s e dano básico de 1.000. Ele constrói e coleta; o camponês é uma unidade separada, treinada na **Big Wall por 300 ouro, em 20 segundos**, com 10 HP. O camponês não possui lista de construções. Uma unidade corresponde a 1/128 da distância original no cenário novo.

### Velocidade auditada em 20/11/2026

A auditoria releu o binário `war3map.w3u` (SHA-256 `e139e0c5e2bdd927694677e0e13a999e2c9b1debdbb9fdf459160bad8929a896`), em vez de inferir a velocidade pelo vídeo. O mapa é **Kodo Tag V1.6/TinyTauren**, arquivo de 56.595 bytes com o hash acima; versões X-Treme/Reforged podem ter outros números.

| Unidade | Rawcode | Campo explícito `umvs` | Velocidade nesta engine (`/128`) | Relação com Runner |
| --- | --- | ---: | ---: | ---: |
| Runner | `uC13` | 300 | 2,34375 m/s | 100% |
| CraZy Kodo | `oC06` | 305 | 2,3828125 m/s | 101,67% |
| Genetically-Enhanced Kodo | `oC22` | 280 | 2,1875 m/s | 93,33% |

Esses valores já estavam corretos e foram mantidos. O comum fecha apenas **0,0390625 m/s** de distância em uma perseguição reta: partindo de 10 m, fechar a diferença até aproximadamente 1 m exigiria cerca de 230 s sem obstáculos ou mudanças de direção. O maior raio físico do Kodo impede atalhos nos cantos e torna corredores estreitos e curvas úteis para o Runner. Isso descreve esta navegação reimplementada; não afirma que o pathing ou as animações são idênticos ao motor Warcraft. O mapa expandido não multiplica velocidade ou tamanho das unidades.

Peasant (`hC19`, 190/128) e Baby Kodo (`nspd`, 270/128) herdam os valores das tabelas locais, pois não têm `umvs` explícito no W3U. Não são apresentados como valores comprovados do patch original. O Enhanced ainda não executa Berserk; o valor base acima não promete reproduzir sua velocidade sob essa habilidade.

O objetivo é sobreviver **25 minutos**. Os Kodos são liberados depois de **15 segundos**. A dificuldade determina 2, 3, 4 ou 5 Kodos iniciais; a interface inicia na dificuldade fácil. As escaladas do script acrescentam um Kodo comum aos 5 minutos, um melhorado aos 10, outro aos 15 e três melhorados aos 20. O Kodo comum possui 10.000 HP, dano 6 e intervalo de ataque 1,3 s; o melhorado tem 20.000 HP, dano 10 e intervalo 0,97 s. A morte do melhorado cria dois filhotes pela habilidade nativa `Assp`.

Kodos comuns mortos voltam após 45 s; depois de 20 minutos, após 30 s. O melhorado volta após 45 s. O Runner fornece 10 de população. Unidades treinadas e construções com custo de alimento reservam essa população, incluindo as filas; paredes gratuitas não têm limite artificial de quantidade.

| ID original | Construção | Ouro | HP | Construção | Função |
| --- | --- | ---: | ---: | ---: | --- |
| hC07 | Wall | 0 | 5 | 1 s | Parede |
| hC08 | Big Wall | 0 | 15 | 1 s | Entrega de recursos; treina camponês |
| hC09 | Hard Wall | 2 | 10 | 3 s | Parede |
| hC18 | Rock Wall | 20 | 30 | 5 s | Parede |
| hC11 | Barracks | 40 | 25 | 60 s* | Treina Cross Bow, Archer e Swordsman |
| oC16 | Tower | 50 | 15 | 10 s | 300 de dano, intervalo 1,8 s |
| oC20 | Mystical Slow Tower | 200 | 30 | 5 s | Veneno e lentidão; 1 alimento |
| oC21 | Stun Tower | 100 | 25 | 2 s | Atordoamento; 2 alimentos |

Todos esses prédios custam zero madeira. O arquivo não define uma cadeia de upgrades entre eles: são construções separadas. Archer custa 200 ouro/10 s, Swordsman 150 ouro/1 s e Cross Bow 100 ouro/2 s. O ataque primário da Cross Bow é 36; o override de 500 pertence à arma secundária, não ao ataque primário.

O Runner e o camponês possuem `Ahar`, a coleta nativa. Esta edição não contém o catálogo de itens, magias de herói, reparo e upgrades de outras versões. Por isso o inventário permanece vazio, e comandos de reparo, upgrade e uso de item não são disponibilizados.

## Captura e resgate

Quando o Runner morre, o script original remove suas unidades e construções e deixa uma bandeira na prisão central; os recursos acumulados permanecem. A implementação mantém essa regra. Outro Runner chegando à prisão resgata os capturados, que reaparecem no ponto inicial. Não foi adicionado prêmio de 50 ouro por resgate: esse bônus não está no script desta versão.

Há uma correção deliberada: o script original remove as bandeiras antes de consultar seus donos no gatilho de resgate. A ordem torna a restauração defeituosa. Aqui o resgate executa a intenção descrita pelo mapa e restaura os jogadores corretamente.

## Terreno e navegação

O retângulo jogável é extraído dos limites de câmera do JASS: X −26 a 26, Z −28 a 24; o início fica em (0; −5,5) e a prisão em (0; 1,75). As **16 minas** usam as posições do mapa.

A malha de passagem vem de `war3map.wpm`, 256 × 256 células. O bit de bloqueio terrestre foi reduzido por maioria de blocos 4 × 4 para células de 1 m e agrupado em **18 retângulos**. São os mesmos obstáculos utilizados na simulação e desenhados no cenário. Essa redução preserva a organização geral, mas não reproduz cada curva da colisão nativa.

O arquivo de doodads contém 461 instâncias, incluindo 370 `LOsm`, sem árvores de recurso `LT*` confirmadas. Não foi inventada uma floresta coletável por cima das colisões. O catálogo de árvores coletáveis fica vazio nesta referência. O custo em madeira dos oito prédios também é zero.

O Runner precisa caminhar até o prédio para construí-lo. Unidades nascem junto ao produtor, respeitando os obstáculos. Kodos procuram alvos vivos e quebram construções que bloqueiam o acesso. O ponto de aproximação considera o perímetro do prédio e o raio do Kodo; a etapa final do trajeto usa o mesmo teste de segmento para evitar que a tolerância de chegada deixe o Kodo fora do alcance, parado diante de uma Big Wall.

## Adaptações e limites de fidelidade

Valores explicitamente sobrescritos em `war3map.w3u` e temporizações do JASS têm origem direta. Campos herdados foram resolvidos pelas tabelas locais de unidades, armas e habilidades já usadas nas outras referências do projeto. **Essas tabelas-base não foram certificadas como sendo exatamente do patch 1.04**; o tempo de 60 s da Barracks, alguns alcances, intervalos, alimento e parâmetros das habilidades herdadas possuem essa ressalva.

Também são adaptações explícitas:

- Ouro e madeira iniciais iguais a zero: o script não contém um ajuste inicial explícito desses recursos; é uma escolha conservadora, não um valor confirmado pelo override.
- Coleta em cargas de 10 e ciclo de 1,6 s, com crédito apenas ao entregar numa Big Wall concluída. A simulação não replica a fila interna de entrada dos trabalhadores na mina do motor Warcraft.
- Reservas das minas de 12.500, por valor-base, sem override específico confirmado no mapa.
- Footprints, raios, aproximação, seleção, interface e IA reimplementados para navegador. A IA procura, coleta, foge e resgata; não executa o mecanismo original de ordens do motor.
- Dano médio de dados e redução física simplificada. Não há reprodução completa da matriz de armas/armaduras, arma secundária, alcance mínimo, voo de projétil ou colisão dinâmica entre todas as unidades em movimento.
- Slow do Archer, veneno da torre, Bash e divisão do Kodo melhorado estão ativos. Berserk (`Absk`) do Kodo melhorado está identificado no catálogo, mas seu comportamento ainda não é executado. Os parâmetros de habilidades herdadas seguem a ressalva das tabelas-base.
- Não há névoa de guerra nativa nem os efeitos, animações e áudio do motor original.

Essas diferenças impedem afirmar equivalência exata com uma partida executada no Warcraft original. O catálogo e a estrutura do modo permitem ajustar cada divergência sem misturar referências de outra edição.

## Contrato da simulação

`KodoTagMethods` fornece `setupKodoTagPlayer`, `initKodoTag`, `kodoTagCommand`, `tickKodoTag` e `snapshotKodoTag`. `kodoBuildCheck(game, unit, key, point)` expõe `allowed`, `reason`, `point` e `definition` para a prévia de construção. O snapshot é serializável e omite os caches de navegação.

Comandos: `ktReady`, `ktMove`, `ktStop`, `ktAttack`, `ktGather`, `ktCast` (coleta), `ktBuild`, `ktResume`, `ktTrain` e `ktDemolish`. `workerId` ou `unitId` seleciona uma unidade própria; omitir usa o Runner. Propriedade, capacidade nativa, população, recursos e localização são validados na simulação. `ktStop` interrompe efetivamente a coleta automática.

## Verificação

`node --test tests/kodo-tag.test.js` executa dez testes, incluindo construção após caminhar, treinamento temporizado, entrega real do ouro, Stop persistente, propriedade, população, torre, filhotes/respawn, captura/resgate e vitória. A regressão da diagonal verifica que o Kodo ignora uma Big Wall junto de uma rota aberta e chega ao Runner. `tests/kodo-hunt-route.test.js` cobre o labirinto S sem dano a paredes, o Runner cercado com ataque apenas ao bloqueador e uma rota enorme que excede o orçamento normal de busca.

O teste integrado simula 60 segundos reais do relógio do jogo com quatro Runners, três controlados por IA, sem alterar HP, mapa ou obstáculos. Os dois Kodos deixam a prisão e perseguem Runners; nenhum teste exige mais destruir um depósito apenas por estar próximo. Posições permanecem finitas.

## Feedback autoritativo de recursos e destruição

`kodoGold` só é emitido quando uma entrega credita ouro de fato. O evento contém `source`, `target` (Runner ou Peasant que entregou), `owner`, `amount`, `reason: delivery` e `depot`. Retirar uma carga da mina ainda não gera moedas; uma última carga parcial continua sendo entregue mesmo que a mina se esgote nesse ciclo. Esta edição não ganhou uma renda passiva inventada.

`kodoRubble` ocorre uma única vez na transição de uma construção viva para destruída: combate, demolição ou remoção após captura. O payload contém `building`/`buildingId`, `key`, `w`, `d`, `owner`, `team`, `reason` e `attacker`. O renderer usa esses dados para fragmentos limitados e reutilizáveis, sem precisar inferir destruição em cada frame. `tests/kodo-speed-feedback.test.js` verifica velocidades em movimento real, crédito exato e ausência de eventos duplicados.
