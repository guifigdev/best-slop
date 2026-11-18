# Técnicas definitivas

Sete técnicas têm requisito de nível do herói para aquisição e para cada melhoria. Continuam ocupando um dos sete espaços e custando um ponto por melhoria, com máximo de cinco níveis. Nenhuma fórmula de atributo foi alterada.

| Técnica | Níveis do herói para os níveis 1–5 |
| --- | --- |
| Inverno de Niflheim (`blizzard`) | 10 / 15 / 20 / 25 / 30 |
| Rastro de Gungnir (`gungnir`) | 10 / 15 / 20 / 25 / 30 |
| Selo de Hel (`helsfrost`) | 10 / 15 / 20 / 25 / 30 |
| Juramento de Tyr (`avatar`) | 12 / 17 / 22 / 27 / 32 |
| Poço de Ginnungagap (`gravity`) | 12 / 17 / 22 / 27 / 32 |
| Guardião de Hel (`helguard`) | 12 / 17 / 22 / 27 / 32 |
| Julgamento de Thor (`thorsjudgment`) | 15 / 20 / 25 / 30 / 35 |

O catálogo expõe `ultimate`, `minHeroLevel` e `rankHeroLevels`. O helper puro `skillRequirement(key,rank)` retorna o nível mínimo numérico; chave ou nível inválido retorna `Infinity`. `canLearnSkill(hero,key,rank)` centraliza a verificação. Técnicas comuns continuam disponíveis no nível 1, sem novos intervalos entre melhorias.

O servidor verifica compras, melhorias e espólios. Um espólio duplicado que melhoraria uma definitiva também exige o nível da melhoria, inclusive quando sua raridade é superior. A falha mantém o espólio disponível: ele pode ser guardado até expirar ou convertido pelos sistemas existentes. Monstros podem usar definitivas de seu próprio conjunto; essa regra é para a aquisição por heróis.

Descobertas não sorteiam definitivas ainda bloqueadas no nível 1. A escolha é revalidada no servidor. Ao substituir uma técnica de nível alto, o requisito corresponde ao nível que seria herdado, impedindo que uma técnica comum de nível 5 entregue uma definitiva de nível 5 antes da hora. Uma escolha recusada conserva as ofertas, a técnica e os recursos. Bots ignoram melhorias bloqueadas e procuram alternativas permitidas. A técnica inicial de cada herói também respeita o nível 1.

Gungnir ganhou identidade de impacto em faixa: dano base de 150/225/300/375/450, largura lógica de raio 1,6, custo de 110 mana e recarga de 16s. Selo de Hel tem dano base de 90/140/190/240/290, raio de 3,5 a 4,5, frost por 3,5 a 5,5s, custo de 110 mana e recarga de 20s. Ambos mantêm a escala MATK existente. Os demais valores foram preservados. São escolhas iniciais revisáveis; os testes validam regras e integridade, sem afirmar equilíbrio competitivo completo.
