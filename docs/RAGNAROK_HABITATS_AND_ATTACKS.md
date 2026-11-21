# Habitats e animações de ataque

## Ecologia dos encontros

As 387 referências do bestiário têm habitat principal, habitats compatíveis, papel e faixa de progressão. A classificação usa a geografia dos scripts de spawn do rAthena e ajustes explícitos do projeto, como Poporing e Tarou nas cavernas. Não pretende reproduzir todos os spawns oficiais.

São dez habitats: campo verdejante, floresta, caverna, caverna de fogo, caverna de gelo, deserto, costa, ruínas, assombrado e arcano. As oito cenas da Aventura representam esses habitats; Prontera pode ser campo ou floresta, e Glast Heim pode ser ruínas ou assombrado. Morroc e Izlude acrescentam cenários próprios de deserto e costa, com dunas, cactos, palmeiras, corais, ruínas e destroços.

Cada etapa sorteia uma composição determinística do habitat escolhido. As três faixas de progressão permitem até oito, dez e doze espécies, respectivamente. Guardiões e chefe final também pertencem ao habitat. MVPs e minibosses não entram nas ondas comuns; campos podem terminar em um miniboss natural, sem inventar um MVP de outro ambiente. Os itens, atributos, dano e probabilidades de cartas continuam com as regras existentes.

Na Torre, a composição e as quantidades clássicas dos 100 andares permanecem intactas. O cenário acompanha o habitat principal mais frequente do elenco daquele andar; um empate tem resolução determinística. O andar 99 usa o mesmo sorteio para escolher cenário e instanciar seus monstros.

## Ataques

As 12 linhagens e as 43 habilidades possuem perfis explícitos de efeito: lâmina, adagas, socos, flechas, impacto, magia, música e frascos. Bash usa um corte cinza frontal de aproximadamente 0,48 segundo. Armas e elementos determinam silhueta e cor. Os ataques básicos dos sete heróis do Custom Hero também usam os perfis correspondentes.

O evento de ataque registra origem, alvo, direção e alcance no instante do golpe. A animação respeita esse evento e acompanha a inclinação do terreno. Os projéteis existentes continuam percorrendo sua trajetória; o novo efeito de lançamento não substitui sua simulação. A alteração é visual e preserva o cálculo de dano.

Os sprites são pré-calculados em 12 quadros de 64 × 64 por família e reutilizados com filtro de pixel. Os lotes são alocados quando necessários: até 64 efeitos ativos, oito chamadas de desenho e 1,5 MiB de texturas no total. Não se cria textura ou malha por golpe. Reinício de mapa, rewind e descarte liberam ou limpam os efeitos.

## Verificação

Testes cobrem classificação completa, exclusão de chefes das ondas, encontros reais em todas as cenas, preservação dos 100 andares, passagem livre nos novos cenários, eventos reais do Bash, direção e alcance, terrenos inclinados, repetição determinística e limites de memória/desenho. A revisão posterior conferiu no navegador o rastro do Bash, o horizonte visto da borda, iluminação de meio-dia/meia-noite, ataques amplos de Ifrit e a abertura de sua passagem. Não se trata de uma medição de FPS em todos os dispositivos.

Fontes de geografia: [spawns Classic do rAthena](https://github.com/rathena/rathena/tree/master/npc/pre-re/mobs), [Endless Tower](https://github.com/rathena/rathena/blob/master/npc/instances/EndlessTower.txt), [monster database](https://github.com/rathena/rathena/blob/master/db/re/mob_db.yml).
