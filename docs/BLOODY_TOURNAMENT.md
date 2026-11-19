# Bloody Tournament — Campo dos Juramentos

Este jogo é a recriação de um mapa de exércitos. Dungeon é outro jogo: seu modo original de exploração procedural. Os cards Individual e Equipes 5×5 são dois formatos do próprio Bloody Tournament; ambos usam tropas e formações. A variante individual foi incluída como opção desta adaptação, sem certificar fidelidade à revisão do vídeo de referência.

O modo implementa uma competição de composição de exércitos. Cada jogador contrata grupos, escolhe suas posições e envia a formação para um combate automático. Os grupos contratados voltam completos na rodada seguinte; a derrota não apaga o exército construído.

## Referência e limites da reprodução

O vídeo indicado é [Warcraft 3 Star Wars Blood Tournament #233, de Sarkosiis](https://www.youtube.com/watch?v=QdDI60ckoxo). Seus metadados e quadros de storyboard foram consultados no próprio YouTube. A referência de terreno fixada é [Star Wars Blood Tournament 6.4d, de Billy-Jack/Baal](https://www.epicwar.com/maps/331579/), com a mesma organização de jardins privados com três manchas verdes vista no vídeo. A revisão exata exibida no vídeo não foi identificada.

O mapa usa o terreno e as regiões numéricas extraídas: oito jardins privados sobre a água, entradas cardeais e campo central com areia, lava, vegetação e gelo. Modelos, texturas, personagens, áudio e scripts de Star Wars/Warcraft não são importados como assets executáveis. A arte voxel permanece própria. Fontes, hashes e limites estão em [BLOODY_NATIVE_REFERENCE.md](BLOODY_NATIVE_REFERENCE.md).

A preparação permanece nos jardins privados; ao iniciar a rodada, a formação é projetada nas entradas do campo central. Os comandantes ficam protegidos nas bases. A navegação usa o caminhamento nativo, incluindo água e penhascos bloqueados. As superfícies caminháveis são niveladas para o renderer atual; o relevo visual não representa reprodução física exata das alturas nativas.

O individual comporta oito participantes como a referência. A opção cinco contra cinco é uma adaptação, com dois jardins extras e compartilhamento das entradas nativas. Preços, catálogo, graduações, suprimentos, renda de recuperação, duração das rodadas e pontuação ainda são regras deste projeto; não são anunciados como valores extraídos do vídeo. Perfis e máscaras de ataque usam o catálogo já existente, sem comprovar igualdade estatística com Blood Tournament.

## Regras jogáveis

- Dezesseis contratos com linha de frente, arqueiras, rifles, magia, cura, lobos, golem, artilharia, hidra e voadores. Cada contrato tem retrato do mesmo modelo voxel usado em campo.
- Ouro inicial: 420. Até 30 suprimentos e doze contratos por comandante. Uma compra recruta todo o grupo novamente a cada rodada.
- Preparação de 45 segundos. Todos os humanos podem enviar seus exércitos antes do fim. Durante a batalha, compra, venda, melhoria e reposicionamento são bloqueados no servidor.
- Sete rodadas. Uma vitória vale três pontos; um empate no primeiro lugar vale um ponto para os empatados. A classificação exibe equipes, membros, pontos, vitórias e abates reais.
- Cada abate concede até seis de sangue, com teto de 120 por jogador por rodada. Melhorias usam ouro e sangue, até graduação três, aumentando vida, dano e armadura.
- Entre rodadas, todos recebem 180 de ouro. Quem não venceu recebe mais 60 para reorganizar sua composição.
- Venda devolve 70% do ouro efetivamente investido. O sangue gasto em graduação não é devolvido.
- Combate máximo de cem segundos. Se ninguém eliminar todos os adversários, a força sobrevivente considera fração de vida e suprimentos dos grupos. Esse desempate é registrado como limite de tempo, não como eliminação fictícia.
- Ataques respeitam alvos terrestres/aéreos e tipos de armadura. Unidades sem antiaéreo não atingem voadores. Sacerdotes curam aliados feridos; bombardas causam dano secundário de área. Corpos têm separação e navegação pelo campo e seus acessos.
- O comandante fica protegido fora do combate. Ele não recebe controle indevido do exército de outro jogador.

## Integração online

O estado é autoritativo no mesmo `Game` usado pelo servidor de salas. Comandos aceitos são `btBuy`, `btSell`, `btUpgrade`, `btPlace`, `btFormation` e `btReady`. Compras, melhorias e posições são validadas pelo servidor; o navegador não informa preços ou estatísticas finais.

`bloodyTeams` ativa duas equipes, respeitando o `squad` atribuído pela sala/party. `teamSize:5` comporta cinco jogadores por equipe. No treino dessa variante, é preciso completar os dez lugares com IA ou formar ao menos um oponente real de outro time. Sem `bloodyTeams`, cada comandante é uma equipe independente.

O modo não exige R2, compras de loja ou credenciais Steam para um treino local. O uso real em rede depende do servidor e das configurações de produção documentadas pelo projeto. A integração de pagamentos deve ser feita fora da simulação de combate e nunca pode aceitar um saldo enviado livremente pelo cliente.

## Arquivos e contrato

- `shared/bloody-tournament-catalog.js`: contratos, regras e perfis graduados.
- `shared/bloody-tournament.js`: economia, formações, IA, progressão e classificação.
- `src/bloody-tournament-world.js`: arena, áreas e marcadores instanciados.
- `src/bloody-tournament-ui.js`: contratos, exército, melhorias, posicionamento e placar.
- `tests/bloody-tournament.test.js`: validações transacionais, combate real, equipes, reconstituição de grupos, empate, retratos e geometria.

O mixin expõe `setupBloodyPlayer`, `initBloodyTournament`, `bloodyTournamentCommand`, `tickBloodyTournament` e `snapshotBloodyTournament`. A UI segue o contrato dos demais modos nativos. O mundo expõe `update`, `pick`, `setSelection` e `dispose`.
