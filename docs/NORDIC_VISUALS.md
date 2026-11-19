# Identidade visual dos jogos

Custom Hero Survival e Line Wars mantêm as seis chaves históricas de personagem: knight/Thor, mage/Hel, ranger/Skadi, turtle/Tyr, owl/Odin e raccoon/Loki. A aparência vem de `src/nordic-hero-art.js`; retratos são projeções das mesmas caixas dos modelos. As duas pernas usam os clipes existentes de oito quadros por segundo. Não há texturas ou animações esqueléticas novas.

`shared/hero-identities.js` contém somente nome, título e descrição. Vida, mana, dano, armadura, alcance, velocidade, intervalo, atributos, habilidade inicial, arquétipo e papel de combate continuam com seus valores anteriores. Chaves estáveis preservam builds e registros. NPCs animais, construtores de Castle Fight, Ents/Infernals e os quatro magos de Warlock mantêm seus sistemas visuais próprios. A projeção cosmética dos ataques mostra golpes físicos em Tyr/Loki e projéteis arcanos em Hel/Odin, sem alterar os eventos da simulação.

`src/game-illustrations.js` registra 170 ilustrações vetoriais: 56 técnicas e23 itens compartilhados pelos dois Custom Hero;30 feitiços,14 itens e4 Masteries em Warlock;16 técnicas e9 itens em Tree Tag;14 itens históricos e4 comandos em Castle Fight. Cada entrada tem desenho central explícito, paleta, chave e cache próprios. HUD, lojas, detalhes e inventários usam o mesmo registro. Itens históricos indisponíveis continuam indisponíveis; possuir ilustração não implica implementar seu efeito.

A lava de Warlock e das arenas usa a mesma superfície procedural opaca, com crostas irregulares, veios quentes, deriva lenta e brilho localizado. O relógio visual continua em8Hz e nenhuma geometria ou textura é alocada por quadro. As áreas e efeitos de dano não mudaram.

Verificação: testes de cobertura integral dos catálogos, SVGs sem conteúdo ativo, modelos/avatares correspondentes, preservação dos atributos e isolamento entre jogos; renderização local de folhas de ilustrações e heróis. A automação de navegador foi interrompida pela ferramenta por não conseguir confirmar a URL da janela; a última composição no canvas WebGL não foi verificada automaticamente nesta atualização.
