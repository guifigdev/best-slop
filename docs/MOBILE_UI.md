# Interface para celular e tablet

Até 1024 px de largura, o painel lateral passa para baixo do cenário. Ele
começa recolhido, com acesso ao painel e ao botão original de início da
partida. Ao abrir, seu conteúdo rola dentro de uma área limitada à altura
da tela. Os mesmos controles e comandos continuam funcionando no desktop.

Mochila, minimapa e ajustes de câmera ficam disponíveis sob demanda. O menu
superior reúne a navegação em vez de comprimir todos os botões numa linha.
Custom Hero e Dungeon também oferecem o comando Mover para escolher o
destino com um toque. Frenesi conserva seu joystick e suas ações dedicadas.

A seleção de partida possui uma região própria de rolagem e uma faixa de
ações que permanece visível. A interface usa `dvh` e respeita a área segura
inferior. Abaixo de 500 px de altura, a HUD reorganiza os comandos em uma
linha, mantendo as habilidades disponíveis por rolagem horizontal.

Validação em navegador: 320 × 568, 360 × 740, 390 × 844, 768 × 1024,
844 × 390 e 1440 × 900. Foram verificados os dez jogos, início da partida,
expansão e recolhimento de painéis, mochila, navegação e ausência de
rolagem horizontal. A suíte existente passou com 1211 testes.
