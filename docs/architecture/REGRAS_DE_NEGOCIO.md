# Regras de negócio

## Autoridade e fases

Uma ação só é válida para o dono correto, no modo e fase corretos, com personagem elegível, recursos suficientes e alvo/objeto permitido. O resultado de `Game.command` é a decisão; o estado de um botão não substitui a validação.

O núcleo compartilha atributos, combate, itens e eventos, mas cada modo especial possui seu próprio estado e comandos. Não aplicar automaticamente a regra de mana, inventário ou progressão de um modo a outro.

| Família | Implementação principal | Contrato e documentação detalhada |
| --- | --- | --- |
| Custom Hero/Survival e competição | `simulation.js`, `competition.js`, `instances.js`, `stats.js`, `ability-rules.js` | Preparação, provas, recompensas e confronto; [combate](../COMBAT.md), [balanceamento](../BALANCE.md), [arquétipos](../ARCHETYPES.md) |
| Line Wars | `line-wars.js`, `line-team-rules.js`, navegação/terreno | Envio de tropas, renda, lanes, equipes e vidas; [Line Wars](../LINE_WARS.md) |
| Castle Fight | `castle-fight.js`, catálogos de construções/tropas e economia | Construtor, construção, produção, upgrades e castelo; [regras](../CASTLE_FIGHT.md), [referência](../CASTLE_FIGHT_REFERENCE.md) |
| Dungeon | `dungeon.js`, mapa e visão de exploração | Salas, ondas, portas, tesouro, grupo e descida; [Dungeon](../DUNGEON.md) |
| Bloody Tournament | `bloody-tournament.js` e catálogos `bloody-*` | Recrutamento, formação, preparação, rodadas e pontos; [Bloody](../BLOODY_TOURNAMENT.md) |
| Warlock | `warlock.js`, `warlock-catalog.js` e referências | Arena, projéteis, empurrões, lava, compras e placar por rodada; [Warlock](../WARLOCK_REFERENCE.md) |
| Tree Tag | `tree-tag.js` e catálogos | Ents, Infernais, construção, captura e resgate; [Tree Tag](../TREE_TAG_REFERENCE.md) |
| Kodo Tag | `kodo-tag.js` e catálogos | Fuga, economia, construções e Kodos; [Kodo](../KODO_TAG_REFERENCE.md) |
| Phase Killer | `phase-killer.js`, mundo e visão | Papéis, investigação, itens e mundos; [regras](../PHASE_KILLER_REFERENCE.md), [nível](../PHASE_KILLER_LEVEL.md) |
| Ragnarok/Ragnabonk | `bonk.js` e módulos `ro-*`/`ragnarok-*` | Aventura/torre, classes, hordas, MVPs e conta; seções abaixo |

Todos esses caminhos são instalados em `Game`; não são jogos com motores ou servidores independentes. Regras específicas ficam nos módulos de modo. O inventário gerado deste manual permite localizar todos os catálogos auxiliares sem tratar a tabela acima como uma lista exaustiva de arquivos.

## Combate transversal

- Relação de equipe, dono, arena/instância, vida e elegibilidade precedem alcance.
- Colisão física, alcance de ataque e geometria visual são contratos distintos que precisam concordar. O renderer não aumenta a hitbox porque o efeito ficou maior.
- Projéteis e áreas aplicam dano pela simulação. Um impacto visual não deve gerar um segundo dano, renovar buffs ou criar drops.
- Armadura, resistência, crítico, precisão, esquiva, atributos e modificadores são calculados no domínio, não na barra de vida.
- Obstáculos e raio do corpo afetam navegação. Resolver sobreposição não autoriza atravessar parede.
- O formato de corpo dos monstros Ragnarok usa hulls medidos e teste de contato mais preciso. A broad phase usa raio conservador; o teste estreito decide o contato real.
- HP, mana, estados e animações de hit/morte possuem duração e expiração. Um personagem morto não pode continuar comprando ou minerando.

Para fórmulas do Custom Hero, consultar `shared/stats.js`, `shared/ability-rules.js`, `shared/simulation.js`, `shared/equipment-effects.js` e os testes associados. Para Ragnarok, consultar `bonkStats`, `ro-contact-combat.js`, módulos de timing/cast e arquivos de fatos. As adaptações não constituem reprodução integral do servidor Ragnarok original.

## Ragnarok: progressão e habilidades

`shared/ragnarok-jobs.js` descreve linhagens, quatro estágios de classe, identidade do ataque básico e modificadores. Base e Job são progressões separadas. `ro-job-progression.js`, `ro-progression.js`, requisitos e arquivos de fatos são a fonte das curvas; a UI apresenta seus resultados.

Há **um ataque básico separado e doze espaços de habilidades**. O limite de aprendizado é 128 incluindo o básico. Passivas aprendidas não precisam consumir um atalho ativo. Aprender, melhorar, equipar e reordenar são operações diferentes.

Disponibilidade depende de classe/estágio, nível e requisitos da habilidade. No modo misto há regras de aquisição diferentes do modo de classe. Ser conhecido no catálogo não significa estar disponível para o herói atual. O nível máximo geral de habilidade em Bonk é oito, sujeito a limites específicos de cada habilidade.

Conjuração variável, fixa, pós-conjuração, recarga individual e bloqueio de ação são tempos distintos. Usar uma habilidade não deve inventar uma recarga igual para todas as demais. A UI precisa distinguir indisponibilidade por ação, mana, alvo, recarga e casting.

O ataque básico de arqueiro é uma flecha; contagem visual de uma chuva de flechas pertence à habilidade específica, não a uma multiplicação arbitrária do ataque básico.

### Fila automática e entrada manual

`ro-auto-skill-queue.js` mantém a fila e os intervalos. O gap padrão é 0,15 s, configurável de 0,05 a 10 s; intervalos individuais têm teto de 120 s. Recarga e intervalo de macro não são a mesma coisa. Habilidades elegíveis entram na fila e o domínio decide quando conseguem executar.

Ragnarok usa WASD relativo à câmera e mira central com mouse capturado em primeira e terceira pessoa; Escape libera o cursor. O botão direito cancela a ação elegível. Menus suspendem entrada de mundo. Durante conjuração aplica-se a regra atual de movimento reduzido compartilhada com o replay, em vez de travar e corrigir posição de forma divergente.

A velocidade de referência do jogador é cinco unidades/s; atrasos por célula de espécies são convertidos preservando a razão de movimento da referência. Não aplicar o mesmo multiplicador a todas as espécies esperando uma relação fiel. `ro-movement-scale.js` e `ro-monster-walk-data.js` possuem a conversão e a fonte fixada.

## Ragnarok: mundo, hordas e MVPs

`bonk-level.js`, `ro-world-route.js`, habitats, encontros e torre definem regiões, biomas, obstáculos, ligações, monstros e objetivos. Estados de porta dependem da progressão real. O mapa visual deve usar as mesmas posições/limites de colisão, inclusive plataformas das vilas.

O orçamento geral declara até 280 inimigos vivos, 220 projéteis e 420 pickups. Isso é limite técnico; a quantidade de monstros de cada região depende também de encontro, tempo, progressão e dificuldade. Aumentar o teto não garante densidade constante e pode expor picos de CPU.

MVPs possuem perfis próprios, avisos, ataques, fases e invocações. Suas escalas devem vir das regras de dificuldade/progressão; arte maior sozinha não aumenta força. A região inicial conserva um tratamento de introdução, enquanto monstros e MVPs posteriores pressionam mais.

Áreas de dano, contato corpo a corpo, posição de origem e alcance de skill devem compartilhar helpers de geometria. O raio usado pelo preview deve corresponder ao dano. O tamanho de uma animação importada nunca deve ser usado diretamente como raio de armadilha.

## Itens, mochila e coleta

`shared/ragnarok-equipment.js` separa definição de item e cópia física. Peças equipadas não ocupam a mochila de 30 espaços. Os dez espaços de equipamento incluem mão direita/esquerda, três posições de cabeça, armadura, capa, calçados e dois acessórios. Duas mãos bloqueiam a mão esquerda; dual wield depende da classe/regra.

Nível necessário, posição compatível, classe e vínculo de conta precisam ser respeitados ao equipar. Requisitos estruturais do save e permissão de equipar em runtime são checagens diferentes: o save não deve desequipar uma carta legítima por não carregar uma identidade transitória de sessão.

A tecla **E** compara distância real entre equipamentos, consumíveis, cartas, NPCs, baús e outros objetos elegíveis. Não existe prioridade global de categoria que faça abrir algo mais distante. O prompt e a ação devem escolher a mesma identidade. Equipamento no chão pode ser examinado antes da decisão de guardar ou equipar.

As durações gerais no chão usam tempo de simulação:

| Tipo | Duração |
| --- | ---: |
| Equipamento | 180 s |
| Receita | 180 s |
| Consumível | 90 s |
| Ouro | 60 s |
| XP | 60 s |

Cartas pendentes usam recibos e expiração própria na conta. Não aplicar a elas implicitamente a duração de XP. Drop direto de MVP, recompensa de grupo e coleta normal têm rotas distintas; conferir o código de loot antes de generalizar a política de uma recompensa.

## Cartas e conta

O modelo atual usa `cardVersion: 2`, histórico de descobertas, `cardStock` com quantidades e ledger privado de encaixes. Descobertas antigas migram para uma cópia por chave. Presets antigos deixam de conceder bônus gratuitos.

Fluxo:

1. Obter e recolher uma carta válida; a conta registra uma cópia. Duplicata aumenta estoque, sem duplicar o desbloqueio histórico.
2. Dentro da partida, selecionar uma peça e uma carta compatível com encaixe livre.
3. Sincronizar o personagem; servidor valida e consome exatamente uma cópia.
4. Aplicar recibo à cópia física da peça; salvar o vínculo.
5. A carta fica na peça e acompanha transferências legítimas pela Kafra. Outra conta não pode equipar/receber aquela peça vinculada.

O ID da operação torna repetição de pedido idempotente. Duas requisições simultâneas não podem gastar a última cópia duas vezes. Checkpoints enviados pelo cliente não podem forjar ledger, estoque ou um segundo encaixe. O histórico da coleção não concede por si só o efeito de uma carta.

O limite da conta é 30 personagens. O armazém Kafra tem 300 posições segundo `roWarehouseUsage`, incluindo a regra de espaço das bênçãos. Conta, personagem e sala não são a mesma identidade. O limite de progresso de conta é 1 MiB, com margem de envelope de requisição.

## Refino

`ro-refinement.js` define plano, preço, chance, proteção e resultado. Usa taxas normais documentadas para a referência adotada, sem assumir evento temporário. O teto atual é +10. A chance depende da categoria de arma/armadura e do rank; não existe uma única porcentagem para todo item.

Preço: `60 × (rank atual + 1)`. Proteção por Bênção do Ferreiro exige uma cópia para +7→+8, duas para +8→+9 e quatro para +9→+10, onde o plano admite proteção. A bênção é consumida tanto no sucesso quanto na falha. Algumas categorias quebram; outras podem regredir; uma falha protegida conserva a peça conforme o plano.

Uma pilha é dividida antes de tentar, de modo que a falha afete uma cópia. O serviço exige NPC apropriado e condição segura. O domínio decide e cobra uma vez. A UI toca três batidas e revela o resultado após 1.650 ms, esperando confirmação real se ela demorar mais. Fechar o modal não desfaz uma tentativa já aplicada.

## Receitas e fabricação

`ro-crafting.js` fornece uma receita para cada uma das 138 armas atuais. Receita aprendida é reutilizável pelo personagem; cada fabricação consome materiais e ouro novamente. Não se trata de desbloqueio compartilhado de receita na conta.

Sete materiais: ferro, carvão, madeira, resina, tendão, essência e cristal. As espécies e veios que os fornecem estão no catálogo e na UI. O material comum tem chance base de 18% em espécies mapeadas; receita tem chance base de 0,85% quando há receita elegível por espécie/nível. MVPs concedem cristal e podem fornecer receita elegível ainda não aprendida. Condições de pool e limite de pickups continuam valendo.

Material comum entra diretamente na bolsa de materiais; receita é um pickup físico. Há no máximo doze receitas no chão e respeito ao teto global de pickups. Isso evita uma grande quantidade adicional de objetos espalhados.

O custo depende do tier de arma: ferro `4 + 4×tier`, auxiliar `2 + 2×tier`, carvão em tiers superiores e cristal a partir do terceiro; ouro `40 + 60×tier`. O nível exigido vem do requisito da arma. O ferreiro exige receita, nível, saldo, todos os materiais, espaço e serviço válido antes de fabricar uma cópia nova.

## Mineração

Veios aparecem em mapas fechados/torre/caverna/forja elegíveis, com limite de cinco por mapa ou dois na torre e colocação determinística em ponto livre. Têm três cargas e voltam após 120 s de simulação quando esgotados.

Para iniciar, o jogador vivo deve estar em jogo, a até 1,9 m do veio e sem outra mineração. O canal dura 1,8 s. Movimento, dano, morte, perda do veio ou afastamento cancelam. A extração concluída consome uma carga e concede três unidades de ferro/carvão ou um cristal. A picareta e os fragmentos são apresentação; não concedem o material.

## Como manter esta documentação correta

Quando uma constante ou fórmula mudar, atualizar a seção correspondente e os testes. Não copiar um número de uma auditoria antiga de 21 modelos, sete atalhos ou uma skill anterior para a versão atual. Para milhares de registros individuais, consultar os exports e fatos pelo [inventário de módulos](MODULE_INVENTORY.md). Para comportamentos do Ragnarok que ainda são adaptações ou cobertura parcial, manter a limitação perto da funcionalidade, sem afirmar fidelidade integral.
