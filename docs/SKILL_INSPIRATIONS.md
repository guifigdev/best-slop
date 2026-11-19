# Técnicas inspiradas em Ragnarok e Dota

Os nomes familiares são atalhos para reconhecer a inspiração. Arte, nomes nórdicos, cinco níveis e números são próprios deste jogo; não reproduzem um patch de Ragnarok, Dota ou dos mapas originais de Warcraft III.

## Referências

- [Banco de habilidades Renewal do rAthena](https://raw.githubusercontent.com/rathena/rathena/master/db/re/skill_db.yml): `TF_DOUBLE` descreve dois golpes; `BS_OVERTHRUST`, um fortalecimento de ataques; `NC_AXETORNADO`, um golpe giratório; `MG_FIREBALL`, dano mágico em área. É uma implementação comunitária, não uma tabela oficial. Não copiamos seu código de combate.
- [Anti-Mage, página da Valve](https://www.dota2.com/hero/Anti-mage): Mana Break queima mana e causa dano relacionado à quantidade queimada. Nossa conversão é mágica e bem menor; não promete a mesma regra do Dota.

## Regras locais

| Técnica | Cinco níveis | Limites e contrapartidas |
| --- | --- | --- |
| Ecos de Sif · Ataque duplo | Chance de 15/20/25/30/35%; eco de 60/65/70/75/80% do ATQ físico | Um único eco após um básico causar dano; inclusive em builds híbridas. O eco passa por armadura, não recebe crítico, não rouba vida e não repete efeitos de ataque. Não faz outra rolagem de acerto depois do básico. Sem custo de mana. |
| Força de Magni · Força violentíssima | +15/20/25/30/35% de dano físico por 6 s | Recebe +10% de dano de combate durante o efeito. Não altera atributos, ATQ da ficha, velocidade ou equipamentos; não amplifica dano mágico. 70 mana, 24 s de recarga. É uma adaptação sem quebra de arma. |
| Fúria de Njord · Fúria do furacão | Quatro pulsos de 12/16/20/24/28 + 10/12,5/15/17,5/20% ATQ cada; raio 2,3/2,5/2,7/2,9/3,1 m | Pulsos em 0/0,5/1/1,5 s, acompanhando o movimento durante 2 s. Não é canalização; atordoamento faz perder os pulsos correspondentes e não os armazena para uma explosão posterior. Armadura reduz o dano. Sem roubo de vida periódico, procs de ataque ou imunidade mágica. 90 mana, 16 s de recarga. |
| Fenda de Mimir · Quebra de mana | Queima até 8/12/16/20/24 mana por ativação | Exige básico que cause dano; no máximo uma ativação a cada 0,7 s. Dano mágico adicional = 40% da mana efetivamente removida, mitigado por MDEF. Sem mana, não há dano adicional. Avatar bloqueia o efeito. Sem crítico, roubo de vida ou outros procs. |

O resultado esperado de Ataque duplo no nível 5 é +28% de ATQ bruto por ataque, antes de mitigações e combinações. Hurricane distribui somente 40–80% do ATQ total pelos quatro pulsos. Esses limites mantêm uma escala moderada; são pontos iniciais de balanceamento, não validação de equilíbrio competitivo.

Força violentíssima também amplifica dano físico periódico, mas a contrapartida não aumenta dano ambiental. As durações expiram pela simulação do servidor. Morrer, remover a técnica ou encerrar o combate cancela os efeitos contínuos. Cura natural, esquiva e fórmulas de atributos permanecem iguais.

## Técnicas reutilizadas

`fireball` já era uma explosão mágica com queimadura. Continua sendo **Brasa de Muspelheim · Bola de fogo**, com os mesmos cinco níveis e coeficiente MATK; ganhou nome familiar e referência de inspiração. Criar uma segunda Fire Ball duplicaria o efeito existente.

`rage` continua sendo a fúria de dano físico e velocidade de ataque. Força de Magni tem outra contrapartida: fortalece dano físico sem velocidade e torna seu usuário vulnerável. São efeitos distintos, que podem ser combinados com o risco e os custos descritos.

## Modos e integração

As quatro técnicas estão no catálogo compartilhado, disponíveis por pontos e como espólios, com reserva na aquisição pelo catálogo e exceção para fragmentos reais, respeitando sete espaços, cinco níveis e uma cópia por herói. Todos os seis heróis podem usá-las. Monstros usam o mesmo caminho de conjuração e passivas; Line Wars mantém os limites de alvo de sua arena. Construtores de Castle Fight continuam sem técnicas de herói.

Autoconjuração respeita mana, recarga, atordoamento e ordens manuais. Não reaplica um buff já ativo. Hurricane só é ativado automaticamente com inimigo no raio atual. Sua prévia usa esse mesmo raio; Força de Magni é um efeito próprio.

Eventos visuais: `doubleattack`, `violentforce`, `hurricane`, `hurricanePulse`, `manabreak`. As ilustrações vetoriais são originais e seguem a linguagem nórdica existente. Elas não dependem de texturas, downloads ou animações de esqueleto.

## Verificação

`tests/ragnarok-techniques.test.js` cobre dano real, mitigações distintas, ausência de recursão e cura duplicada, mana efetivamente queimada, duração e remoção de efeitos, pulsos móveis, atordoamento, autoconjuração, prévia, aquisição por espólio independente, monstros e isolamento no Line Wars. A suíte genérica de monstros inclui ambas as novas técnicas ativas.
