# Runas permanentes e raridade dos espólios

## Escopo

Skuld, a mestre das runas (`runemaster`), grava uma runa permanente em um equipamento do inventário. Esse modificador é independente do encantamento elemental antigo de fogo, gelo ou veneno; ambos permanecem no mesmo espaço. Melhorar o equipamento conserva a runa existente. Consumíveis não aceitam runas.

O serviço custa **350 + 150 × nível do equipamento**: 500 / 650 / 800 / 950 / 1.100 ouro. Reforjar substitui a runa anterior e paga o preço integral, inclusive se o sorteio repetir o mesmo resultado. O serviço não cria outro item nem consome o estoque básico do equipamento. Não há estoque adicional de forja neste módulo. A venda e o valor de investimento do equipamento ficam a cargo das regras de inventário existentes.

A validação usa `atShop(hero, 'runemaster')`, que é a autoridade para proximidade e fase. O módulo não cria uma segunda regra de fase: permite a preparação normal e também a loja durante a onda contínua de Line Wars, quando autorizada pelo servidor. Requisições inválidas não gastam ouro nem sorteiam um resultado.

## Tabela de raridade

| Raridade | Peso básico da forja | Essências do drop | XP do drop | Maestria da habilidade |
|---|---|---|---|---|
| Comum | 60 | 1 | 40 | 1× |
| Raro | 25 | 2 | 70 | 1,05× |
| Épico | 10 | 3 | 110 | 1,10× |
| Lendário | 4 | 5 | 180 | 1,15× |
| Heroico | 1 | 8 | 280 | 1,20× |

Essência, XP e maestria são metadados para a integração de espólios. O módulo não concede pontos de atributo ou de habilidade diretamente. A maestria deve modificar apenas dano/cura da habilidade, sem aumentar duração de controle, chance, atributos ou custos. `quality` é igual a `mastery`, não outra multiplicação cumulativa.

`rarityRoll(random, { wave, boss })` usa uma função aleatória fornecida pelo servidor e retorna o id da raridade. Sem contexto, usa os pesos básicos da forja. A chance e qualidade dos espólios de monstros crescem com a onda, com limite na onda 50:

| Origem | Chance de gerar drop | Pesos comum / raro / épico / lendário / heroico na onda 1 | Pesos na onda 50 |
|---|---|---|---|
| Normal | `0,12 + 0,001 × onda` | 60 / 25 / 10 / 4 / 1 | 50 / 29 / 14 / 5 / 2 |
| Minichefe | `0,45 + 0,003 × onda` | 30 / 35 / 22 / 10 / 3 | 20 / 36 / 26 / 13 / 5 |
| Chefe | 100% | 15 / 30 / 30 / 18 / 7 | 8 / 25 / 32 / 24 / 11 |

As distribuições intermediárias são interpoladas linearmente. Todos os níveis mantêm chance positiva, inclusive chefes poderem gerar um espólio comum. A geração do drop continua sujeita à posse, ao alvo válido e ao isolamento da prova definidos pela simulação.

## Catálogo de 22 runas

| Runa | Raridade | Bônus e efeito | Maldição |
|---|---|---|---|
| Gume de Týr | Comum | +8 ATQ físico | — |
| Selo de Algiz | Comum | +2 armadura | — |
| Fio de Ullr | Comum | +6% velocidade de ataque | — |
| Passo de Sleipnir | Comum | +5% movimento | — |
| Fonte de Mímir | Comum | +0,6 mana/s | — |
| Seiva de Yggdrasil | Comum | +2 vida/s | — |
| Fagulha de Thor | Raro | 15% de corrente elétrica de 30 dano, até 3 alvos, −20% por salto | — |
| Marca de Skaði | Raro | 20% de gelo mágico: 28 dano e frost por 1,1s | — |
| Peçonha de Jörmungandr | Raro | 25% de aplicar 6 dano de veneno/s por 4s | — |
| Laço de Fenrir | Raro | +6% roubo de vida físico | — |
| Bênção de Eir | Raro | +4 vida/s | — |
| Brasas de Múspell | Épico | Somente botas: +8% movimento; rastros de fogo de 8 dano/s por 3s | — |
| Escrita de Mjölnir | Épico | +5% velocidade de ataque; 15% de corrente elétrica de 45 dano, até 3 alvos | — |
| Pulso de Iðunn | Épico | 15% de restaurar 45 vida ao acertar o ataque primário | — |
| Juramento dos Jötnar | Épico | +6 armadura | −6% movimento |
| Fio de Níðhöggr | Lendário | +120% dano de ataques físicos | +40% dano recebido de inimigos; −12% movimento |
| Vazio de Ginnungagap | Lendário | +80% poder mágico | Perde 10 mana/s em batalha |
| Pacto de Garmr | Lendário | +25% velocidade de ataque; +20 ATQ físico | +15% dano recebido; perde 1,5% da vida máxima/s em batalha |
| Véu de Niflheim | Lendário | +5 armadura, +10% esquiva; 30% de gelo mágico de 50 dano/frost por 1,5s | −15% movimento |
| Fome do Ragnarök | Heroico | +400% dano de ataques físicos | Dano recebido de inimigos dobrado; −30% movimento; perde 3% da vida máxima e 10 mana/s em batalha |
| Passos de Surtr | Heroico | Somente botas: +15% movimento; rastros de fogo de 20 dano/s por 3s | +30% dano recebido; perde 1,5% da vida máxima/s em batalha |
| Mandato de Gungnir | Heroico | +30% poder mágico; 15% de corrente elétrica de 90 dano, até 3 alvos | +25% dano recebido; perde 12 mana/s em batalha |

Nomes e regras são uma criação do jogo com tema nórdico; não reproduzem números de outro jogo. Os efeitos são definidos pelo id da runa, sem uma segunda rolagem oculta de atributos. A raridade é sorteada primeiro e depois uma runa elegível dessa raridade. Equipamentos que não são botas nunca recebem uma das duas runas de rastros.

## Contrato de integração

`shared/permanent-enchants.js` exporta:

- `PERMANENT_ENCHANTS`: catálogo imutável com `id`, `name`, `rarity`, `description` e, quando usados, `stats`, `effect`, `curse`, `items`.
- `permanentEnchantPrice(itemLevel)`: preço do serviço.
- `rollPermanentEnchant(itemKey, random)`: definição sorteada; `null` para item inválido ou consumível.
- `permanentEnchantAt(record, itemKey?)`: definição autorizada para um registro; `null` para desconhecido ou restrição de item violada.
- `permanentEntries(hero)`: runas válidas do inventário, sem repetir o mesmo id.
- `permanentStats(hero)`: soma pura dos bônus, sem alterar o herói ou as fórmulas de atributo.
- `permanentMethods`: métodos para incorporar à simulação.

O registro persistido no próprio espaço é `{ id, rarity, seed, roll, rolledAt }` em `slot.permanentEnchant`. O servidor gera a seed e o resultado; o cliente não escolhe a runa. `seed` e `roll` permitem identificar e reproduzir a escolha, enquanto os números de efeito vêm do catálogo. A reforja substitui esse registro; upgrades do equipamento não devem apagá-lo.

`permanentStats` retorna bônus nos campos `damageFlat`, `damageMultiplier`, `armor`, `attackSpeed`, `moveSpeed`, `manaRegen`, `hpRegen`, `evasion`, `critChance`, `magicPower`, `damageTaken` e `lifesteal`. Multiplicadores são **bônus**: `damageMultiplier: 4` significa multiplicar o dano por 5, e `magicPower: 0.8` significa multiplicar o poder mágico por 1,8. Os outros valores somam bônus aos campos correspondentes. A integração deve aplicar os limites existentes de velocidade de ataque, esquiva, crítico e roubo de vida, e limitar o fator de movimento a pelo menos 0,25. Recalcular deve partir sempre da base normal: não reaplicar esses bônus sobre o resultado de um cálculo anterior.

### Hooks

1. `enchantPermanent(hero, { slot })` entra como comando de forja. Usa a verificação de NPC autoritativa, ouro e equipamento elegível; atualiza investimento e chama `refresh(hero)`.
2. `permanentAttack(source, target, actualDamage)` é chamado **uma vez após um ataque primário acertar e causar dano efetivo**. Não chamar a partir de `hit`, Cleave, ricochetes, DoT, reflexões ou procs de itens. Miss, esquiva perfeita ou absorção total não ativam a runa. Uma morte no ataque primário ainda pode servir de origem para os saltos da corrente.
3. `permanentTick(dt)` é chamado pela simulação. Atua somente em `wave`, `bonus` e `final`, respeitando heróis que já terminaram sua prova. Em Line Wars, `wave` é uma fase contínua; abrir um NPC não pausa o mundo ou a maldição automaticamente.
4. `permanentModifyDamage(target, amount, source)` é aplicado uma vez ao dano recebido, antes da mitigação normal. Só amplia dano de um inimigo; não amplifica a própria drenagem, ambiente, aliados ou dano próprio.

## Acúmulo, instâncias e apresentação

O mesmo id de runa não acumula no herói: duas cópias de Gume de Týr dão +8, não +16. Runas diferentes podem combinar seus bônus e maldições. Entre procs da mesma categoria — corrente, frost, veneno, cura ou rastro — apenas o mais forte participa; não há uma segunda chance adicional por usar duas runas de corrente. A escolha compara dano/cura esperado por acerto. Correntes atingem no máximo três alvos únicos, usam o clima elemental e não escalam com INT ou crítico. A cura de proc é fixa. Avatar impede o dano mágico/frost compatível; equipamentos de frio e fogo continuam protegendo conforme suas regras.

Rastros só nascem ao mover. Duram 3s, não atingem voadores e usam o dano mais forte de uma mesma equipe em uma região sobreposta. Há no máximo seis manchas por portador e sessenta no mundo. Mudança de fase/onda limpa os rastros; mudança de equipe, prova, célula ou instância invalida a mancha antiga para aquele portador. Todo alvo passa por `canTarget`, preservando isolamento e amizade. O dano de rastro não é outra aplicação do ataque primário.

A drenagem pulsa uma vez por segundo em batalha, sem atravessar a preparação normal. Drenagem de vida é custo de maldição, não fogo ou veneno: pode matar, ignora Avatar e não gera reflexão. Mana nunca fica negativa. Cura e regeneração podem compensar parte do custo, mas não removem a maldição do equipamento.

Eventos de apresentação: `permanentEnchant`, `permanentCurse`, `permanentTrail`, além de `bolt`, `frost` e `poison` para os procs. Os eventos contêm o portador e, quando necessário, id da runa, raridade, raio e duração. `permanentTrails` contém o estado de simulação das manchas; a integração pode incluí-lo no snapshot se precisar de uma representação contínua além dos eventos visuais.

## Validação e limites

Dezoito testes cobrem pesos e recompensas, progressão por onda/chefe, elegibilidade dos 22 resultados, compra/reforja, rejeições sem gasto, NPC em Line Wars, agregação sem drift, maldições, correntes de três alvos, morte do alvo primário, clima, Avatar, veneno, cura, limites e isolamento dos rastros.

São escolhas iniciais de balanceamento. O bônus heroico de dano é deliberadamente extremo e acompanhado de desvantagens fortes; não há promessa de paridade entre todas as combinações. As chances, preço da reforja e impacto sobre cada modo precisam de partidas humanas. Nenhum atributo, custo de distribuição, ganho por nível ou marco de STR/INT/DEX/LUK/VIT/AGI foi alterado por estes módulos.
