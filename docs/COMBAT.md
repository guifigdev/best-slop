# Dano físico, dano mágico e defesas

As fórmulas de defesa seguem o pedido do projeto, sem reproduzir integralmente uma versão de Warcraft III ou Ragnarok Online.

- Cada ponto de **VIT total** concede um ponto de defesa física, além da armadura base, equipamentos e passivas. Vida e regeneração mantêm suas fórmulas anteriores.
- Cada ponto de **INT total** concede um ponto de defesa mágica. Cada cinco pontos de VIT acrescentam mais um; equipamentos podem acrescentar `magicDefense`.
- `magicDefense = INT total + floor(VIT total / 5) + MDEF dos equipamentos`.
- Dano físico recebido: `dano / (1 + 0,06 × max(0,DEF))`.
- Dano mágico recebido: `dano / (1 + 0,03 × max(0,MDEF))`.

Armadura nunca reduz magia; MDEF nunca reduz dano físico. Dez pontos de MDEF reduzem o dano mágico em aproximadamente 23%, e trinta pontos em aproximadamente 47%. Resistências elementais e fraquezas da criatura continuam aplicadas uma vez, separadamente da defesa. Dano ambiental mantém o caminho anterior, sem ganhar redução por MDEF ou armadura; suas resistências elementais continuam funcionando. A imunidade mágica de Avatar continua bloqueando magia inimiga e permitindo dano ambiental.

## Ataques e habilidades

Capivara, tartaruga, guaxinim e raposa usam ATK físico em seus ataques básicos. Coelha e coruja usam **90% do MATK atual** por ataque básico, como dano mágico. Esse fator modera o ritmo de combate e não multiplica INT novamente. O status expõe `attackType`, `basicDamage`, `magicAttack` e `magicDefense` para a ficha e inspeção.

Ataques básicos mágicos não rolam acerto, esquiva comum, esquiva perfeita ou crítico físico. Ataques básicos físicos mantêm esses testes. Áreas e projéteis de habilidades continuam acertando pela posição/colisão; sair da região ou desviar do projétil evita o impacto. Pisada e Onda de Choque são habilidades físicas: usam ATK e defesa física, sem benefício de INT no dano.

O servidor consulta a compatibilidade de arquétipo ao comprar, lançar, descobrir e receber técnicas. Passivas incompatíveis inseridas manualmente no conjunto de habilidades não produzem seus bônus. O conjunto nativo dos monstros é isento dessa restrição: um monstro pode conservar suas habilidades autorais. Seus ataques elementais são mágicos, mantêm o dano base configurado e usam a MDEF do alvo; ataques sem elemento são físicos. Monstros têm MDEF zero por padrão, ou o valor explícito informado na criação.

## Roubo de vida

Vampirismo funciona em todos os arquétipos, sem limitar o alcance da arma. Ataques básicos físicos/mágicos e impactos diretos de técnicas físicas/mágicas restauram a fração indicada do **dano realmente removido da vida do alvo**, depois de defesa, resistência e escudo. Uma explosão ou corrente pode restaurar vida pelos inimigos realmente atingidos. O limite de roubo de vida continua em 80%.

Veneno, queimadura, campos e canais periódicos, ambiente, reflexão, auras e procs de equipamento não geram roubo de vida. Assim, um ataque que ativa uma corrente elétrica cura apenas pelo impacto primário, sem multiplicar os efeitos secundários. Projéteis conservam o identificador da fonte e resolvem o herói vivo no impacto; ele deve continuar vivo para receber a cura. Invocações não transferem automaticamente a cura ao invocador.

`Game.hit` recebe um nono argumento opcional, `damageKind`: `direct` por padrão, `dot` para efeitos periódicos e `proc` para efeitos secundários. Só `direct`, sem reflexão/ambiente, é elegível. Essa marcação não substitui a categoria física/mágica do dano.

Os testes cobrem as duas defesas, progressão de INT/VIT, ataques por arquétipo, imunidade à esquiva mágica, habilidades físicas, cura pelo dano efetivo e exclusão de procs/DoT. Uma regressão específica de Line Wars verifica que projéteis e nuvens conservam sua linha e só atingem os invasores correspondentes. O fator de 90% de MATK e as curvas de mitigação são calibração inicial; a suíte não representa validação estatística de equilíbrio competitivo.
