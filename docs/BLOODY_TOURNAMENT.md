# Bloody Tournament — Campo dos Juramentos

O modo implementa uma competição de composição de exércitos. Cada jogador contrata grupos, escolhe suas posições e envia a formação para um combate automático. Os grupos contratados voltam completos na rodada seguinte; a derrota não apaga o exército construído.

## Referência e limites da reprodução

O vídeo informado foi consultado em `https://www.youtube.com/watch?v=QdDI60ckoxo`, mas o provedor recusou a leitura durante a pesquisa. Não foi possível afirmar o conteúdo visual ou a revisão exata daquele vídeo.

Como referência primária verificável, foi consultado o [repositório do autor de Blood Tournament Reloaded](https://github.com/Jaccouille/wc3-blood-tournament). Sua apresentação confirma torneio de sete rodadas, grupos produzidos por construções, composição de tropas, moeda de sangue obtida em abates e melhorias. O modo deste projeto é uma adaptação nórdica desse ciclo, com código e arte voxel próprios já presentes no jogo. Nenhum script Wurst, modelo, textura ou áudio do mapa foi importado.

Preços, grupos disponíveis, graduações, formações, limite de suprimentos, renda de recuperação, duração de batalha e variante em equipes são regras desta adaptação. Não são apresentados como valores extraídos da versão do vídeo. Perfis e máscaras de ataque usam o catálogo existente do projeto, derivado da pesquisa do Castle Fight; isso não prova igualdade com Blood Tournament.

## Regras jogáveis

- Dezesseis contratos com linha de frente, arqueiras, rifles, magia, cura, lobos, golem, artilharia, hidra e voadores. Cada contrato tem retrato do mesmo modelo voxel usado em campo.
- Ouro inicial: 420. Até 30 suprimentos e doze contratos por comandante. Uma compra recruta todo o grupo novamente a cada rodada.
- Preparação de 45 segundos. Todos os humanos podem enviar seus exércitos antes do fim. Durante a batalha, compra, venda, melhoria e reposicionamento são bloqueados no servidor.
- Sete rodadas. Uma vitória vale três pontos; um empate no primeiro lugar vale um ponto para os empatados. A classificação exibe equipes, membros, pontos, vitórias e abates reais.
- Cada abate concede até seis de sangue, com teto de 120 por jogador por rodada. Melhorias usam ouro e sangue, até graduação três, aumentando vida, dano e armadura.
- Entre rodadas, todos recebem 180 de ouro. Quem não venceu recebe mais 60 para reorganizar sua composição.
- Venda devolve 70% do ouro efetivamente investido. O sangue gasto em graduação não é devolvido.
- Combate máximo de cem segundos. Se ninguém eliminar todos os adversários, a força sobrevivente considera fração de vida e suprimentos dos grupos. Esse desempate é registrado como limite de tempo, não como eliminação fictícia.
- Ataques respeitam alvos terrestres/aéreos e tipos de armadura. Unidades sem antiaéreo não atingem voadores. Sacerdotes curam aliados feridos; bombardas causam dano secundário de área. Corpos têm separação e navegação em torno dos pilares.
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
