# Referências diretas de arte de Ragnarok

Esta revisão reconstrói em geometria voxel os desenhos de monstros de Ragnarok
Online, da Gravity, conforme solicitado pelo responsável pelo projeto. Não são
apresentados como desenhos inéditos. Os sprites serviram como referências de
silhueta, proporção, cor e detalhes. O cliente recebe modelos geométricos; as
imagens de estudo ficam apenas em `outputs/`, fora da publicação.

| Modelo | ID da referência | Características preservadas |
| --- | --- | --- |
| Familiar | 1005 | Corpo lilás, orelhas longas, membranas triangulares claras |
| Besouro-Ladrão | 1051 | Élitros castanhos, reflexos rosados, seis pernas e antenas |
| Tarou | 1175 | Corpo branco arredondado e eriçado, focinho e cauda rosados |
| Esqueleto Arqueiro | 1016 | Ossos expostos, gorro, arco, aljava e botas castanhas |
| Ice Titan | 1788 | Silhueta curvada, ombros cristalinos, braços longos, mandíbula branca |
| Kasa | 1833 | Corpo vermelho escuro, asas de fogo, presas amarelas |
| Salamander | 1831 | Réptil baixo, couraça vermelha, cauda longa e chamas |
| Poring / Marin | 1002 / 1242 | Corpo arredondado, rosto pequeno, brilho em crescente |

As páginas e endereços de sprites ficam em `shared/monster-visual-references.js`.
Exemplos: [Familiar](https://www.divine-pride.net/database/monster/1005/familiar),
[Ice Titan](https://www.divine-pride.net/database/monster/1788/ice-titan),
[Kasa](https://www.divine-pride.net/database/monster/1833/kasa) e
[Salamander](https://www.divine-pride.net/database/monster/1831/salamander).

Dungeon e Frenesi compartilham os modelos. Ice Titan e Marin aparecem no gelo;
Salamander aparece na fornalha. As tropas Salamandras e Dracos da Fornalha de
Bloody usam respectivamente Salamander e Kasa, incluindo os retratos e prévias.
Os atributos, colisões, dano e habilidades continuam definidos pelos nossos
modos; esta revisão de arte não importa o balanceamento de Ragnarok.

## Expansão do bestiário compartilhado

O registro passa a ter **21 modelos**: os nove anteriores, contando Marin,
e mais doze reconstruções estudadas diretamente nos sprites. O campo
`sourceName` preserva o nome da referência; `name` contém o nome adaptado
exibido no jogo. Os IDs e links continuam identificando a origem de cada
desenho, independentemente dos nomes usados no produto.

| Referência | ID | Nome no jogo | Silhueta e detalhes preservados |
| --- | --- | --- | --- |
| Spore | 1014 | Esporo Saltitante | Chapéu vermelho largo, lamelas e corpo claro com rosto |
| Mandragora | 1020 | Mandrágora Selvagem | Bulbos, folhas e raízes avermelhadas |
| Willow | 1010 | Salgueiro Andante | Tronco oco com rosto, braços de madeira e pés de raízes |
| Elder Willow | 1033 | Salgueiro das Brasas | Madeira avermelhada, rosto escuro e pontas chamuscadas |
| Scorpion | 1001 | Escorpião de Cobre | Pinças alaranjadas, oito pernas e cauda articulada com ferrão lilás |
| Andre | 1095 | Formiga Escavadora | Abdome creme segmentado, seis pernas e antenas compridas |
| Hode | 1127 | Verme das Dunas | Corpo tubular lilás com boca redonda emergindo da areia |
| Golem | 1040 | Golem de Basalto | Pedras sobrepostas, corpo robusto, punhos grandes e sorriso |
| Mummy | 1041 | Múmia Errante | Corpo curvado, faixas sobrepostas e tiras soltas |
| Whisper | 1179 | Sussurro do Véu | Capuz arredondado, olhos inclinados e lençol de borda irregular |
| Siroma | 1776 | Siro Glacial | Corpo redondo de pelo gelado, testa clara, olhos grandes e sorriso |
| Gazeti | 1778 | Olho Glacial | Máscara cristalina flutuante, nariz comprido e fragmentos laterais |

Os modelos anteriores também usam nomes adaptados: Morcego do Véu,
Escaravelho Saqueador, Taruk, Arqueiro Ossífero, Colosso da Geada,
Asa de Brasa, Salamandra Incandescente, Porim e Marim Boreal.

Custom Hero inclui os 21 visuais como criaturas com liberação gradual e
habilidades temáticas no seu próprio catálogo de ondas. As primeiras ondas
também compartilham os modelos por meio de metadados de aparência; os
atributos e a quantidade dos papéis comuns permanecem definidos pela curva
de ondas existente. Dungeon e Frenesi distribuem as criaturas pelos seus
ambientes. Bloody Tournament, Line Wars e famílias compatíveis de Castle
Fight reutilizam as esculturas nas unidades, prévias e retratos apropriados,
com os dados de combate definidos por cada modo.

As reconstruções ficam em módulos de arte de caverna, elementos, floresta,
cavernas e cripta/gelo. Elas descrevem geometria e animação; nomes, atributos,
habilidades e regras de aparição permanecem separados dessa geometria.
