# Referência de gameplay e decisões

## Confirmado na descrição histórica, não por inspeção do mapa

Referência provisória: [hoihoi8's Custom Hero Survival v1.21](https://www.hiveworkshop.com/threads/hoihoi8s-custom-hero-survival-v1-21.105943/), atualizada em 2009. Descrição do autor: sete espaços de habilidades, comuns até nível 20, ultimates até nível 3, 300 ouro e 200 madeira entre ondas. São dados dessa versão, não de toda a família CHS.

[Wiki comunitária](https://tallnasgames.itch.io/custom-hero-survival-wiki): fonte candidata para um catálogo mais recente; ainda não conciliada com a 1.21. O usuário deseja uma versão recente, mas ainda não identificada. Não misturar números entre versões sem registrar sua origem.

## Implementado provisoriamente

- Sete espaços e recompensa de 300 ouro entre ondas usam a descrição histórica como ponto de partida.
- Mana, recargas, dano, armadura, atributos, economia inicial e todos os valores em `shared/catalog.js` são experimentais.
- Fórmula de redução física simplificada para armadura positiva; dano mágico sem resistência neste protótipo.
- Três arquétipos originais, sem correspondência numérica com os heróis do mapa.
- Dez ondas, preparação de 25 segundos e campeão nos marcos 5 e 10 são uma estrutura de teste.
- Arena cooperativa compartilhada. A estrutura de CHS com arenas individuais e PvP ainda não foi recriada.
- Ainda sem madeira, upgrades de habilidades, reembolso, tabela de tipos de ataque/armadura, imunidade mágica, dispel, orb effects, cancelamento de animações, cast point, backswing e regras completas de projéteis.
- Dano de ataque atualmente resolve no instante do ataque; o projétil é visual. É uma diferença de gameplay a corrigir após escolher o mapa.

## Critério para alegar fidelidade

Obter mapa/patch e registrar origem de cada regra. Para cada skill: níveis, custo, alvo, alcance, mana, recarga, cast point, canalização, duração, pulsos, dano, imunidades, dispel e interações. Conferir situações controladas no jogo original e no protótipo. Marcar como confirmado apenas o que foi observado ou lido em fonte correspondente à versão.

## Arquitetura

Three.js é [uma biblioteca 3D, não uma engine de jogos](https://threejs.org/manual/pages/game.html). Foi escolhido por priorizar navegador, assets leves e compartilhamento da simulação JS com Node. [Godot exporta para web](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html), mas suas características de exportação e rede precisariam ser consideradas; ele não está descartado por incapacidade.

Arte voxel original inspirada no aspecto de diorama de Crossy Road, sem copiar personagens. Câmera inclinada, cores chapadas, iluminação quente e animação limitada. Próxima etapa artística: modelos com paleta em vertex colors, clipes baked em poses discretas, malhas agrupadas/instanciadas e comparação de draw calls antes de introduzir pós-processamento.
