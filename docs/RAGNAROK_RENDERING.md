# Renderização do mundo de Midgard

O limite físico continua em 115 unidades de cada lado; o terreno e as silhuetas se estendem até 518,4. O horizonte mistura a paisagem com a atmosfera, e a região seguinte aparece na paleta do terreno junto à passagem. Não há um plano azul representando o fim do mapa.

Os lotes de instâncias guardam seus dados de origem. A cada quadro, depois de posicionar a câmera, o recorte espacial rejeita células e compacta as instâncias e os índices de terreno que intersectam o enquadramento. Girar a câmera restaura corretamente os dados originais. Só as linhas necessárias são atualizadas na GPU. Personagens, rastros de armas e avisos também têm recorte por câmera.

O recorte é conservador: objetos parcialmente visíveis, copas e uma margem para sombras podem continuar no lote. O céu é desenhado como ambiente ao redor da câmera. Portanto, isto reduz trabalho fora do enquadramento sem afirmar que absolutamente todo cálculo fora da tela foi eliminado. A simulação dos monstros permanece ativa independentemente da câmera.

Na prévia de Prontera olhando da borda, a rotação mudou o lote de aproximadamente 8,2 mil para 1,6 mil instâncias visíveis, de um total aproximado de 14,6 mil. São contagens de geometria dessa cena, não promessa de FPS. O cenário de teste do recorte também valida rejeição, restauração ao girar, instâncias dinâmicas e limites de memória.

O ciclo de 720 segundos usa o tempo acumulado de jogo, fica parado durante a pausa e é salvo com o progresso. Sol, lua, estrelas, preenchimento e névoa mudam gradualmente. A iluminação conserva um mínimo legível à noite. A atmosfera ocupa até duas chamadas de desenho, usa até seis feixes suaves e não cria render targets. Os feixes reduzem a intensidade durante avisos de área e desligam sob lentidão sustentada.

O shader dos personagens amostra uma iluminação de ambiente analítica por reflexão e refração de direção, com brilho discreto nas bordas e superfícies claras. É um efeito estilizado; não captura espelhos nem transmite a imagem do cenário através do corpo. Não há distorção da tela, pós-processamento de refração ou alteração do combate. Outros modos desativam esse cálculo.

Os chefes da rota têm padrões próprios que podem atravessar grande parte da visão: terremoto anular de Freeoni, corredores de gelo de Hatii, erupção e meteoros de Ifrit, julgamento da Valquíria, entre outros. Todos conservam saídas seguras, aviso de pelo menos 2,1 segundos e dano limitado por multiplicador. Marcações acompanham o terreno e deixam vazios os espaços seguros. Esquiva, equipamentos e atributos continuam relevantes.

Referências técnicas: [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html), [Frustum](https://threejs.org/docs/pages/Frustum.html), [atualização de volumes](https://threejs.org/manual/pages/how-to-update-things.html), [custo dos materiais físicos](https://threejs.org/docs/pages/MeshPhysicalMaterial.html). A opção analítica evita os passes adicionais de transmissão e de godrays por pós-processamento.


A geografia atual prevê uma, duas ou três passagens orientadas por região, com paredes laterais, grades e antecipações de terreno na direção de cada vizinho. Abrir uma grade atualiza as instâncias dela sem reconstruir o terreno. As vias e a arena central permanecem livres de obstáculos.

O céu usa um azul superior mais definido e discos de sol/lua maiores. A órbita permite baixar mais o olhar para expor o horizonte; a névoa permanece entre 85 e 245 unidades sobre o terreno, enquanto o céu analítico não recebe a neblina de superfície. O comando de inspeção do GM aponta para o astro acima do horizonte, sem alterar a câmera durante uma partida normal.

Fogueiras e queimaduras usam `createVoxelFire`. Projéteis de fogo empregam núcleo volumétrico e três línguas afuniladas na mesma paleta, animados a 8 Hz. Mantêm quatro instâncias por projétil e o limite compartilhado de mil instâncias para 250 projéteis; não criam luzes individuais ou novas chamadas de desenho.

## Revisão dos rastros de espada e adaga

O ataque básico do Espadachim/Cavaleiro e Bash usam um rastro vertical discreto, de cima para baixo, em aproximadamente 0,54–0,60 s. O braço direito e a espada são separados da geometria estática e reutilizam um rig de ombro, sem girar o ator horizontalmente nem criar objetos por golpe. O rastro vertical permanece legível durante a órbita da câmera. Gatunos usam duas faixas pequenas de luz cinza, com brilho suave e duração aproximada de 0,48–0,50 s. Os demais efeitos preservam suas variantes anteriores.

As duas variantes adicionais ocupam linhas dos mesmos oito atlas/lotes: até 1,875 MiB de texturas, oito chamadas de desenho e 64 eventos ativos. O alcance e o dano da simulação permanecem iguais.
