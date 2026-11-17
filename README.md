# Custom Hero — Coliseu das Mil Formas

Jogo independente para navegador, com combate RTS e animais voxel originais. Arte sem texturas, cores de vértice, corpos agrupados, terreno e plateia instanciados. Movimentos usam clipes de poses pré-calculadas a 8 Hz; não é um pipeline de Blender/VAT.

## Executar

Requer Node 22.12+ ou 24:

```sh
npm install
npm run dev
```

Abra a URL local exibida pelo Vite. Para multiplayer na rede local, em outro terminal:

```sh
npm run server
```

Entre com o mesmo código em até quatro clientes antes da primeira onda. A primeira pessoa escolhe a arena inicial. O solo adiciona três rivais IA de espécies diferentes. O projeto não modifica firewall.

## Campanha

1. Mercado inicial: 1.100 ouro e seis pontos de atributo. Os bots começam compras após 12 segundos; os diálogos pausam o treino.
2. 50 ondas, com intervalo de sete segundos e recuperação parcial entre ondas. Vida/mana completas ao começar cada bloco de cinco.
3. Após as ondas 5, 10, …, 45: três alvos privados por competidor, limite de 45s. Tempos reais determinam a ordem. Prêmios: 500, 380, 260 e 140 ouro; quem não termina não ganha prêmio.
4. Mercado reabre depois do bônus; estoque compartilhado é reposto uma vez por visita. Quem compra primeiro esgota o item. Online, o servidor valida todas as compras.
5. Após a onda 50: vida/mana restauradas e todos contra todos. Último sobrevivente vence. Aos 60s começa dano de morte súbita; aos 120s, se necessário, decide a maior proporção de vida restante.

## Técnicas, atributos e equipamentos

24 técnicas, cada uma com cinco níveis. Sete espaços; evoluir uma técnica não ocupa outro espaço. Melhorias exigem ouro e nível de herói 1/3/5/7/9. Valores históricos documentados de Warcraft III são a base de parte do catálogo; níveis adicionais e técnicas originais são identificados. Veja `docs/REFERENCE.md` para fontes e diferenças.

Cada nível dá `5 + floor(nível/5)` pontos de atributo. Cada incremento custa um ponto e o limite base é 99. Equipamentos contam nos marcos. As fórmulas abaixo são as regras próprias pedidas para este jogo, inspiradas em Ragnarok, não uma reprodução de um patch de RO.

| Atributo | Regra |
|---|---|
| STR | +1,2 ATQ físico por ponto; +5% dano físico por dez pontos |
| INT | +2,5% poder mágico por ponto; +8 mana por ponto; +0,8 mana/s por seis pontos |
| DEX | +1,5 ATQ físico à distância por ponto; +0,5% precisão por ponto e +2% por cinco pontos |
| LUK | +1% crítico por três pontos; +0,1% esquiva por ponto |
| VIT | +20 vida por ponto; +1 armadura por cinco pontos |
| AGI | +1% velocidade de ataque por ponto; +5% extras por dez pontos |

Ataques comuns testam precisão menos esquiva e clima. Críticos não erram. Esquiva é limitada a 45%, crítico a 80% e velocidade de ataque a 3×. Crítico usa o maior multiplicador disponível, com chance somada. Armadura física positiva: `dano / (1 + 0.06 * armadura)`. Dano mágico é ampliado por INT e pelo elemento/clima.

17 itens, equipamentos e consumíveis. Inventário de **seis espaços**, sem mochila oculta. Potes iguais acumulam até três cargas por espaço; precisam ser ativados e compartilham recarga de dez segundos. Vida: 300, mana: 200 (valores próprios). Shift + clique vende todas as cargas do espaço por metade do valor, somente no mercado.

## Arenas e clima

Pode-se escolher a arena inicial; a sequência muda a cada dez ondas, passando pelas cinco:

- Jardins de Aurélia: chuva leve e +10% mana/s.
- Caldeira de Obsidiana: lava queima por 3s mesmo após sair; fogo +20%, gelo −15%.
- Coroa da Geada: gelo com inércia; zonas frias causam frost, −45% movimento e dano gradual. Gelo +20%, fogo −15%.
- Terraço dos Trovões: movimento −10%, eletricidade +20%; raios têm aviso no chão de 2s.
- Anfiteatro Lunar: precisão comum −5%, esquiva +2%, cristais de frost.

Perigos afetam heróis e inimigos, e ficam inativos nos intervalos/mercado. Obsidiana protege de queimadura; cachecol polar protege do frio. Clique no indicador de clima para consultar as regras. A plateia usa animações pré-calculadas para pular e levantar braços em críticos, explosões e marcos.

## Controles e diálogos

- Direito: mover/atacar. A + clique: atacar ao mover. M + clique: mover. S: parar/interromper canalização. H: manter posição.
- Q W E R D F C: técnicas. 1–6: consumíveis. I: atributos.
- Roda: zoom. Meio + arraste: girar. Shift + meio: deslocar. Setas: deslocar. Espaço/F1: centralizar.
- Guia, F2 ou `?`: modal completo de atalhos.
- Diálogo: texto gradual; **Mostrar tudo** completa a fala; **Continuar** avança. Enter/Espaço revela primeiro e avança quando completo. Esc fecha/cancela. Preferência de movimento reduzido mostra o texto imediatamente.

Orfeu narra os marcos. Solo pausa durante diálogos/modais; online não pausa a sala. Hall da Fama guarda as dez melhores tentativas e builds neste navegador, sem ranking global ou comprovação no servidor.

## Consistência de estado

- `shared/simulation.js`: única autoridade das regras, tanto no solo quanto no servidor.
- `shared/catalog.js`, `shared/stats.js`, `shared/arenas.js`: dados e cálculos compartilhados.
- `src/game-store.js`: estado central da sessão cliente; snapshot, jogador, conexão, simulação local, diálogo, pausa e mira.
- `src/shortcuts.js`: hook `useShortcuts` independente de framework, com contexto, bloqueio de campos editáveis, teclas de câmera e cleanup. O projeto não usa React.
- `src/typewriter.js`: apresentação do texto, sem modificar a simulação.
- `src/view.js` e `src/coliseum.js`: somente renderização e coleta de comandos.

Online, o cliente manda comandos e renderiza snapshots a 30 Hz. Não decide estoque, XP, pontos, dano ou vencedores. O store cliente não é um segundo motor de regras.

## Validação e publicação

```sh
npm test
npm run build
```

Os testes incluem rede real com disputa pelo último item, progressão, clima, atributos, consumíveis, determinismo, diálogo, atalhos e uma campanha completa com bots até a final.

`dist/` é o cliente estático. O servidor Node continua separado. Defina `VITE_SERVER_URL=wss://seu-servidor` antes de compilar para jogar pela internet. Hospedar só o cliente não hospeda o multiplayer. Ainda faltam autenticação, reconexão, observação de partidas, ranking global e testes de carga/latência. Os controles ainda não incluem grupos, filas por Shift ou microcontrole individual de invocações.
