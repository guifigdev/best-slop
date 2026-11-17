# Custom Hero — Voxel Survival

## Coliseu das Mil Formas · atualização de polimento

Heróis animais originais: Bento (capivara), Lua (coelha) e Faísca (raposa). Galinhas de barro, javalis de musgo e o Urso de Bronze representam os Ecos do coliseu. Arquibancadas, espectadores e um pedestal compõem a arena.

Câmera livre: roda para zoom; botão do meio e arraste para girar; Shift + meio e setas para deslocar; espaço/F1 centraliza. Há botões para zoom, giro, seguir o herói, restaurar vista e ativar movimento pelas bordas.

Controle RTS: direito move/ataca, A + clique ataca ao mover, M + clique move, S interrompe, H mantém posição. O movimento foi corrigido para funcionar também durante a preparação. A seleção é do herói principal; não há seleção de grupos, filas por Shift ou microcontrole individual das invocações.

Animações: clipes de transformações pré-calculadas a 8 poses/s para caminhar, atacar e conjurar; reação a dano e queda na morte. Personagens voxel com vertex colors e corpos agrupados em malhas. Ainda são modelos procedurais; não há importação de Blender/VAT.

Feedback: números de dano, crítico identificado e explosão dourada, cura/vampirismo, auras simultâneas de passivas, brilho dos ícones ao ativar, projéteis, arcos de golpe, relâmpagos e chuva de cristais para Nevasca. SVGs próprios ilustram as 12 habilidades e quatro itens, sem fontes de ícones.

Orfeu, a coruja arauto, apresenta a história em diálogos com retrato, páginas, fechar e continuar. Treino solo pausa durante a leitura; online continua. A Crônica registra marcos e críticos. O Hall da Fama salva as dez melhores tentativas e suas builds em localStorage **deste navegador**, incluindo derrotas; não é um ranking global ou verificado no servidor.

Protótipo independente para navegador. Three.js renderiza; `shared/simulation.js` executa combate sem DOM ou dependência gráfica. O servidor Node usa a mesma simulação a 30 Hz e valida comandos. Não usa arquivos, modelos, áudio ou texturas da Blizzard.

## Executar

Node 22.12+ (ou 24) e npm:

```sh
npm install
npm run dev
```

Abra http://localhost:5173. Para multiplayer, em outro terminal:

```sh
npm run server
```

Entre com o mesmo código em duas abas. Até quatro jogadores na mesma arena cooperativa. Entre antes da primeira onda (35 segundos de preparação). Para testar na rede local, use o IP do computador no endereço do Vite. A porta 2567 também precisa estar acessível; o projeto não altera o firewall.

## Controles

- Botão direito: mover ou atacar inimigo.
- Q W E R D F C: habilidade no espaço correspondente. Passivas não exigem ativação.
- Habilidade com alvo: pressione a tecla e clique no inimigo ou chão.
- S: parar. H: manter posição. A + clique: avançar atacando. M + clique: mover. Esc: cancelar alvo/fechar diálogo.
- Compras somente na preparação. Passe o mouse sobre cada habilidade para consultar os efeitos.

## Estado desta versão

3 heróis base, 12 habilidades (8 ativas / 4 passivas), 4 itens, 10 ondas, 2 duelos contra bot, níveis, ouro, mana, atordoamento, invocações e combinação de passivas. As sete habilidades disponíveis incluem a habilidade inicial. O campeão do duelo é um bot simples. Não há duelo PvP, arenas individuais ou progressão permanente ainda.

O visual usa blocos 3D sem texturas e cores de vértice; terreno instanciado e poses discretas a 8 Hz. Os personagens atuais são procedurais. Não há ainda pipeline de exportação de animações de Blender nem VAT. Não confundir animação em poucos quadros com redução automática de todo o custo gráfico: medir draw calls e GPU continua necessário.

## Referência e fidelidade

Ver `docs/REFERENCE.md`. A 1.21 de hoihoi8 é referência histórica provisória, não foi identificada como a versão mais recente. Não há `.w3x` no projeto. Os valores implementados e as fórmulas são de protótipo; o combate ainda não equivale ao Warcraft III.

## Verificação

```sh
npm test
npm run build
```

Testes de compras, validação de comandos, magia, determinismo, progressão de ondas e sincronização real entre dois clientes WebSocket.

## Publicação

`dist` é o cliente estático. O servidor multiplayer é um processo Node separado; configure `VITE_SERVER_URL=wss://seu-servidor` antes de compilar para hospedagem HTTPS. Sem essa configuração, a conexão usa a porta 2567 do hostname atual (localhost no desenvolvimento). Publicar só o cliente não publica o multiplayer. A infraestrutura de produção ainda precisa de TLS, autenticação/reconexão, limites por IP, monitoramento e testes de carga.
