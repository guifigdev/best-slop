# Phase Killer: cidade e encosta da adaptação

O terreno jogável continua com 212 × 90 metros por dimensão, em escala espacial 2×. As posições de floresta e marcos extraídos do mapa original permanecem identificadas por `native-*`. O arquivo numérico de referência e os valores das habilidades não foram modificados.

A cidade expandida, a praça, a igreja e o relevo são **design original desta adaptação de navegador**, não uma reprodução comprovada do terreno Warcraft. São 34 casas de pedra e madeira distribuídas pela cidade, uma fonte na praça `(82, -19)` e uma igreja no canto nordeste `(128, 8)`. Cada construção tem uma identidade estável e uma fundação visual igual à sua área de colisão. As portas e rotas até a chegada, os portais e a praça são verificadas com a navegação real.

O caminho oeste sobe continuamente até aproximadamente 12 metros. `phaseKillerHeightAt(x, z)` fornece a mesma superfície usada na malha triangulada do chão e no apoio de árvores, rochas, construções e luzes. A integração de câmera, personagens, efeitos e cliques deve consultar essa função. As distâncias de combate continuam usando o plano horizontal, sem multiplicar alcance, dano ou velocidade.

O chão usa vértices compartilhados, contornos levemente irregulares e cores interpoladas, evitando uma superfície feita de caixas quadradas repetidas. Somente copas e pequenos galhos recebem vento visual; os troncos e suas colisões permanecem estáticos. Três clareiras de fogueira são exportadas em `PHASE_CAMPFIRES`; seu fogo visual usa o mesmo componente volumétrico reutilizável dos efeitos de queimadura.

Saves que já estavam em escala 2× recebem apenas a revisão de construções, conservando posições, objetos destruídos e progresso. Não passam novamente pela multiplicação das coordenadas. A revisão do cenário e o cache de navegação são invalidados quando necessário.

Os testes cobrem acessos às 34 portas, circulação na praça, aproximação da igreja e fogueiras, inclinação do relevo, apoio dos troncos, vento sem movimento de colisões, atualização de saves e orçamento/descarte das partículas. A aparência final de luz, vento e transparência ainda depende de inspeção no navegador com GPU.
