# Escala das técnicas e conjuração automática

As técnicas usam uma adaptação própria da ideia de ATK/MATK de Ragnarok Online. Os atributos, seus custos e seus bônus continuam com as regras definidas para este projeto; estes coeficientes ajustam somente as habilidades.

Referências primárias: a [tabela oficial de Espadachim](https://renewal.playragnarok.com/gameguide/classes_skill.aspx?c=2) apresenta Bash e Magnum Break como percentuais de ATK; a [revisão oficial de magias da Gravity, de janeiro de 2024](https://ro.gnjoy.asia/news/detail.php?id=663), descreve Fire Bolt como MATK por projétil e Fire Ball com percentuais diferentes no centro e nas bordas. A [tabela oficial mais antiga de Mago](https://renewal.playragnarok.com/gameguide/classes_skill.aspx?c=3) tem outros valores. Não estamos reproduzindo um patch ou as fórmulas completas de RO.

## Fórmulas

- Habilidade física de herói: `dano base + ATK atual × atkCoefficient`. A defesa física continua sendo aplicada pelo combate normal.
- Magia de herói: `dano base × magicPower + MATK atual × matkCoefficient`. MATK já incorpora seu próprio bônus de INT; não multiplicamos o termo MATK por INT novamente.
- Habilidades de monstros: mantêm o dano base e o multiplicador mágico já configurado para sua categoria, sem adicionar os coeficientes reservados aos heróis.
- MATK calculado pelo sistema de status: `(18 + nível × 1,5 + INT × 2 + MATK de equipamento) × magicPower`.

Os valores por nível estão em `SKILLS`: `damageType`, `atkCoefficient` e `matkCoefficient`. As cinco graduações físicas principais adicionam de 50% a 100% de ATK; as mágicas de um impacto adicionam de 40% a 90% de MATK. Áreas amplas têm coeficientes menores. Blizzard divide seu orçamento pelo número de pulsos e Gravity pela duração, evitando adicionar o coeficiente completo a cada impacto. Passivas periódicas e pegadas usam coeficientes pequenos por segundo. Essa é uma calibração inicial, não uma validação estatística de equilíbrio.

## Novas técnicas

- **Pegadas de Muspelheim:** durante um período, caminhar deixa áreas de fogo que duram três segundos.
- **Passos de Niflheim:** deixa áreas de gelo com dano gradual e redução de velocidade de 25%.
- **Coração de Surtr:** passiva que causa dano de fogo periódico em inimigos próximos.
- **Pulso de Skadi:** passiva de gelo com dano periódico e lentidão de 15%.

Áreas repetidas da mesma técnica e equipe usam apenas o maior dano sobre cada alvo. Áreas de equipes inimigas continuam independentes. A validação de alvos mantém o isolamento de arenas; mudança de fase ou rodada remove as pegadas antigas. A imunidade de Avatar bloqueia a lentidão. Resistências elementais e a defesa do equipamento continuam no caminho normal de dano.

## Autocast

`toggleAutocast` aceita uma técnica ativa aprendida, por `slot` ou `skill`, e armazena o estado em `u.autoSkills`. Alternar não gasta mana. `tickAutocast` usa `Game.cast`, com seus custos, recargas, alcance e validações reais. Ele respeita o alvo selecionado, espera 0,3 segundo entre decisões e não cancela movimento manual, ataque em movimento, canalização ou seleção manual de magia. Cura exige ferimento relevante; buffs ativos e invocações suficientes evitam repetições inúteis. A configuração permanece ligada durante uma ordem manual e volta a agir quando a ordem permitir.

## Integração

Adicionar `AbilityMethods` ao protótipo de `Game`; encaminhar o comando `toggleAutocast`; chamar `tickAutocast(u)` para heróis em combate e `tickAbilityEffects(dt)` uma vez por atualização. `Game.cast` chama `castAbility(u,key,s)` depois das validações e dos custos comuns. `Game.spellDamage(u,base,element,key)` consulta `abilityScaling(key,levelOf(u,key))` e `magicSkillDamage`; ataques físicos usam `physicalSkillDamage` no respectivo caminho de dano. O movimento deve combinar `abilitySlowAmount` enquanto `abilitySlowUntil > time` com as demais lentidões pelo maior valor, sem alterar os atributos. Os efeitos `abilityTrail`, `abilityField`, `abilityPulse` e `autoCast` fornecem dados para a representação visual.

Os testes focados cobrem fórmulas, orçamento de pulsos, ordens manuais, cura, custos e recargas reais, pegadas, lentidão, sobreposição de auras e isolamento. A regressão de campanha e testes de Game real cobrem a integração; ainda é necessário observar partidas humanas para validar o ritmo e o equilíbrio.
