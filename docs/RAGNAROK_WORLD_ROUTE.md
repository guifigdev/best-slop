# Rota conectada de Midgard

Esta rota foi desenhada para o modo survivor. Usa a ideia de um continente com paisagens conectadas e as identidades de lugares e MVPs de Ragnarok. Não é uma reprodução verificada da malha completa de mapas do RO3, nem uma afirmação de que estes guardiões aparecem exatamente nestes locais nos jogos oficiais.

## Pesquisa e limites da referência

O [site oficial de Ragnarok Online 3](https://ro3global.com/home) e o [diário oficial dos desenvolvedores](https://www.youtube.com/watch?v=Ewy1ge0a57M) fornecem a referência visual e de identidade. O material primário consultado não disponibilizou uma malha completa auditável de conexões entre todas as regiões.

A [apresentação institucional da Gravity de fevereiro de 2026](https://img.gravity.co.kr/GravityUpload/0000/2026/02/13/Gravity%20IR%20Presentation_2025_4Q_EN.pdf) distingue Ragnarok Online 3, Ragnarok: The New World e Ragnarok Abyss. Mapas de guias de The New World não foram tratados como se fossem mapas oficiais de RO3. A ordem de visita abaixo é uma adaptação do pedido do projeto e da geografia temática de Midgard. As identidades de criaturas continuam rastreáveis aos [spawns Classic do rAthena](https://github.com/rathena/rathena/tree/master/npc/pre-re/mobs).

## Geografia atual: grafo em Y

As imagens do diorama Dominion Grounds fornecidas na conversa mostram o vulcão na junção entre uma grande paisagem árida e uma paisagem verde. Essa relação visual orienta a nova composição. O lado árido fica a noroeste e o verde a sudeste no nosso desenho; não se atribui uma bússola oficial à perspectiva da imagem. A caverna de gelo foi colocada ao norte, como solicitado, com Juno entre ela e o vulcão.

O Vulcão de Thor é a única região com três passagens. As demais têm no máximo duas. A viagem começa na extremidade verde de Prontera, percorre Payon, suas cavernas, Geffen e Glast Heim, e chega a Thor. A derrota de Ifrit abre duas opções: as terras áridas de Morroc ou os planaltos ao norte. Assim, o vulcão é um cruzamento percorrido pelo jogador, além de um marco visual no horizonte.

```text
                         Santuário da Valquíria
                                   |
                            Caverna de Gelo
                                   |
                                  Juno
                                   |
Rachel — Pirâmides — Morroc — VULCÃO DE THOR
                                   |
                              Glast Heim
                                   |
                                 Geffen
                                   |
                            Cavernas de Payon
                                   |
                            Floresta de Payon
                                   |
                                Prontera
```

O desenho acima representa conexões, sem escala. `RO_WORLD_GEOGRAPHY` conserva a posição relativa de cada região e `RO_WORLD_LINKS` define as onze conexões bidirecionais. O terreno local continua sendo carregado por região; o grafo não exige doze mapas simultâneos na memória.

Uma região já visitada permite retorno sem exigir novamente a derrota de um chefe. Para atravessar rumo a uma região nova, o MVP local precisa estar derrotado. A passagem final para Valhalla exige os onze outros selos, mesmo que um save antigo marque aquele destino como visitado. Isso mantém a Valquíria como conclusão sem impedir a escolha da ordem dos dois braços de Thor.

## Regiões e guardiões

| Região | Leitura do cenário | MVP da passagem |
| --- | --- | --- |
| Arredores de Prontera | Campos cultivados, muralhas distantes, ponte, entrada da mata | Mistress |
| Floresta de Payon | Trilhas orientais, bosques densos e santuários | Eddga |
| Cavernas de Payon | Galerias funerárias, raízes e lanternas | Moonlight Flower |
| Deserto de Morroc | Dunas, oásis, caravanas e arcos de Sograt | Phreeoni |
| Pirâmides de Morroc | Arenito, obeliscos, pátios e túmulos | Osiris |
| Terras de Rachel | Desfiladeiros secos, jardins resistentes e templos | Atroce |
| Campos e Observatório de Juno | Altitude, academia e ruínas de pesquisa | Egnigem Cenia |
| Caverna de Gelo | Galerias largas, lagos e neve acumulada | Hatii |
| Vulcão de Thor | Pontes de basalto, lava e grandes abrigos rochosos | Ifrit |
| Ruínas Arcanas de Geffen | Biblioteca, cristais e torre partida | Doppelganger |
| Glast Heim | Castelo, cemitério, cavalaria e catedral | Dark Lord |
| Santuário da Valquíria | Terraços, colunas e runas elevadas | Valkyrie Randgris |

Egnigem Cenia é um encontro adaptado para a defesa descontrolada do observatório; não representa um spawn oficial dos campos de Juno. O santuário final combina motivos de Odin e Valhalla em uma posição original da rota. Todos os guardiões acima são MVPs reais presentes no catálogo, sem substituir um miniboss por um MVP fictício.

## Regras de level design

No grafo atual, o chefe ocupa a arena central `(0, 0)`, com raio 28, e vias radiais de 18 unidades de largura levam a uma, duas ou três passagens nas bordas locais. As passagens ficam a 101 unidades do centro em direções cardinais distintas. A orientação é derivada do maior deslocamento relativo entre as regiões, produzindo rotas legíveis e portas recíprocas; curvas no corredor acomodam a composição macro diagonal. Não é necessário visitar uma lista de destinos para continuar a viagem.

Os helpers da primeira versão linear mantêm a entrada `(0, 96)`, a saída `(0, -101)` e os índices originais. São referências de compatibilidade para os saves antigos, não a nova geografia. O índice estável de cada região também permanece; a ordem numérica do catálogo não define a ordem de exploração do grafo.

A estrada de entrada deve conduzir aos marcos laterais sem fazer o jogador vagar por um plano vazio. Rochas, ruínas e vegetação formam bolsões e curvas, deixando a via central e os espaços de esquiva livres. Uma área protegida antes da arena permite reconhecer o chefe e organizar a build. Colunas ou taludes delimitam a arena visualmente sem cobrir avisos no chão.

Transições usam faixas reconhecíveis: campo para mata; raízes e lanternas para caverna; caverna seca para dunas; dunas para arenito; desfiladeiro para pastagem de altitude; névoa e cristais antes do gelo. Entre gelo e vulcão, pedra úmida, vapor e basalto fazem uma zona intermediária, evitando gelo encostado em lava sem contexto. Geffen esfria a rocha vulcânica e introduz selos arcanos; Glast Heim transforma esses arcos em ruínas góticas. O santuário final troca pedra escura por mármore e céu aberto.

`shared/ro-world-route.js` contém os dados de região, referências de marcos e descrições dessas transições. O terreno e as peças visuais concretas são responsabilidade do gerador e do renderer; a presença de um nome no catálogo não garante que um modelo visual específico já exista.

## Ecologia e segurança da progressão

`roRouteEncounter` escolhe apenas criaturas normais do habitat da região. Os dois primeiros trechos usam a faixa inicial; os quatro seguintes usam a faixa intermediária; os últimos liberam o conjunto completo do habitat. Guardiões menores também são nativos. O MVP é prescrito por região, e o catálogo testa a compatibilidade do seu habitat.

O grafo permite retornar e escolher a ordem dos braços norte e árido. Regiões continuam distintas mesmo quando compartilham um tipo de cena. O último santuário não retorna automaticamente à primeira região. Andares e composições da Torre sem Fim continuam sendo outro modo e não são substituídos por este continente.

Para renderização, a passagem deve permitir antecipar a paisagem vizinha sem revelar criaturas ou loot dela antes da transição. Um terreno decorativo além das barreiras físicas deve eliminar a aparência de uma ilha quadrada, conservando os limites de colisão e o orçamento de desenho. A troca de região pode carregar a área seguinte ao atravessar o corredor; não pressupõe manter doze mapas completos em memória simultaneamente.


## Save do grafo e teste como GM

Partidas novas usam `routeVersion: 2`. O checkpoint registra a região atual por índice estável, os selos obtidos e as regiões visitadas. Não exige um prefixo da lista linear. A restauração converte checkpoints anteriores preservando personagem, equipamentos e selos. Voltar a uma região concluída não gera novamente o MVP ou um cofre grátis de entrada.

Na seleção de Ragnarok, **Testar como GM** inicia uma expedição local com nível 150, seis atributos em 99, quarta classe, habilidades selecionadas no máximo, invencibilidade e dano de um golpe. **GM / Mapa** permite viajar diretamente para qualquer região, repetir o MVP, escolher dia/entardecer/noite/amanhecer, inspecionar o sol ou a lua e testar o fogo compartilhado no personagem. As passagens ficam abertas apenas nessa sessão de teste.

**Salvar GM** guarda somente uma receita local (linhagem, região e horário) em `customhero.ro.debug.v1`. **Retomar GM** recria o personagem de teste. Não salva equipamentos ou cartas na conta e não altera personagens, conquistas, recompensas ou checkpoints normais. Não é um personagem de conta sincronizado entre dispositivos.
