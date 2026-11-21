# Ragnarok Survivors

O seletor Ragnarok oferece duas atividades com os mesmos personagens:

- **Aventura:** grafo de 12 regiões conectadas de Midgard. O braço verde liga Prontera, Payon, Geffen e Glast Heim ao Vulcão de Thor; dali, escolha o deserto de Morroc/Rachel ou Juno e as terras de gelo ao norte. Cada MVP abre passagens físicas; atravesse andando para carregar a região e retorne por caminhos já visitados. A promoção das primeiras três regiões leva à quarta classe. Veja [rota e referências](RAGNAROK_WORLD_ROUTE.md).
- **Torre sem Fim:** 100 andares com a composição Classic do script `F_Tower_Monster` do rAthena. Entre com um personagem criado na Aventura. A Torre mantém sua classe desenvolvida e concede experiência, pontos de atributo, equipamentos e oportunidades de cartas. Os encontros entram em lotes limitados; não há geração infinita de criaturas nessa atividade.

São 12 linhagens principais e 42 aparências de classe. O ataque característico pertence à classe: trocar uma espada por um cajado altera os atributos do equipamento, preservando a identidade do ataque. Mercenários e suas evoluções podem usar duas armas de uma mão. A promoção para Mercenário entrega a segunda adaga.

Segure o botão esquerdo e arraste pelo cenário para girar a câmera ao redor do personagem. WASD/setas e joystick seguem a orientação da câmera. No celular, arrastar pelo cenário gira a visão; dois dedos giram e ajustam o zoom, mantendo o personagem como centro. Cliques/toques curtos continuam interagindo com objetos.

**Testar como GM** inicia um personagem local de nível 150, atributos 99, quarta classe, habilidades no máximo, invencibilidade e dano de um golpe. **GM / Mapa** oferece viagem direta, controles de horário, inspeção de sol/lua e teste de fogo. **Salvar GM** e **Retomar GM** conservam linhagem, região e horário neste dispositivo, separados de personagens, cartas, conquistas e checkpoints normais.

## Atributos e habilidades

STR, AGI, VIT, INT, DEX e LUK usam os mesmos custos crescentes e contribuições do Custom Hero, dentro do orçamento de combate do survivor. VIT aumenta vida e defesa; INT aumenta poder e defesa mágica e SP; AGI aumenta cadência e esquiva; DEX favorece ataques à distância e precisão; LUK aumenta crítico e esquiva perfeita. Habilidades consomem SP e o ataque característico é gratuito. Habilidades oferecidas pertencem à linhagem e respeitam a classe atual; uma nova habilidade pode substituir a habilidade mais antiga quando os quatro espaços estão ocupados.

Os valores de dano, vida, equipamentos e cartas foram adaptados ao combate local. As identidades, posições de equipamento, encaixes e associações de drops vêm do database; efeitos complexos de scripts de cartas não são emulados integralmente.

## Conta, cartas e salvamento

A conta do jogo usa Cloudflare D1. Na hospedagem Sites, o identificador autenticado estável vincula o progresso à conta usada para acessar este site e permite recuperação automática em outro aparelho. Não depende do nome escolhido para o personagem. Contas antigas são vinculadas sem apagar cartas ou trocar sua chave. A seção **Recuperar conta em outro aparelho** também oferece uma chave privada para instalações independentes; a chave não é exibida por padrão e o servidor guarda somente seu hash. Uma instalação fora de Sites deve desabilitar cabeçalhos de identidade fornecidos por visitantes ou estabelecer uma fronteira de autenticação confiável.

Cartas são conquistas permanentes. A chance local é de 0,01% por criatura e 0,1% por MVP elegível, sorteada no servidor. Criaturas sem uma carta na fonte consultada não recebem uma carta inventada. Existem até seis presets, com uma carta por parte do equipamento; o bônus passa a valer quando houver uma peça compatível com encaixe. Dropar uma peça não consome a carta da conta.

Há 304 cartas e 126 equipamentos no catálogo desta versão. Equipamentos de MVP respeitam suas associações e probabilidades de drops na fonte consultada. A mochila comporta 48 peças. Espólios de conclusão que não couberem permanecem pendentes e podem ser recolhidos ou deixados pelo inventário; a passagem aguarda essa escolha.

O botão **Salvar** registra o personagem e a entrada da etapa. Há salvamento automático a cada 15 segundos, ao abrir uma passagem, ao mudar de região e ao retornar à seleção. Aventura e Torre conservam checkpoints separados, compartilhando o desenvolvimento mais recente do personagem. Ao retomar, o encontro começa novamente pela entrada; um MVP já derrotado na região mantém sua passagem aberta e não concede recompensas novamente; níveis, escolhas de habilidade pendentes, atributos, SP e equipamentos são preservados. Sem conexão, há uma cópia neste dispositivo e sincronização posterior; novas conquistas de cartas dependem do servidor.

O combate continua local. O servidor valida a conta, os presets, o formato dos saves e os sorteios, limita frequência e impede a repetição da mesma recompensa. Isso não equivale a uma simulação de combate autoritativa nem a um sistema completo contra adulteração do cliente.

## Fidelidade da Torre

O catálogo possui 327 IDs/formas da fonte, incluindo a segunda forma de Beelzebub. O andar 99 sorteia sete grupos com reposição; não instancia todo o conjunto de alternativas. O andar 100 usa Entweihen e seus espinhos; os espinhos são removidos quando o chefe morre. A variante é a Classic de 100 andares, anterior ao encontro final adicional de Naght Sieger.

O bestiário integrado contém 387 referências visuais: os 101 modelos anteriores, 100 novas criaturas e 186 formas adicionais necessárias à Torre. Quatorze variantes elementais documentadas compartilham a anatomia da sua família, conforme os sprites de origem. Os personagens e os sete heróis originais do Custom Hero usam esculturas voxel detalhadas próprias.

## Performance e Cloudflare

O índice espacial preserva os resultados de alcance e a ordem dos alvos. No benchmark reproduzível de 280 criaturas e 220 projéteis, as consultas passaram de aproximadamente 783 ms para 54 ms. O cache de corpos evita reconstruir centenas de cubos por criatura repetida: no teste de 280 spawns/12 espécies, aproximadamente 911 ms passaram para 80 ms. São medições de CPU desses cenários, não uma promessa de FPS em qualquer aparelho.

As esculturas são geradas somente quando utilizadas e seus corpos consolidados ficam em cache. O terreno usa lotes de instâncias; as regiões e suas passagens orientadas foram verificadas sem exceder a capacidade desses lotes. A coleção de cartas só cria seus artigos quando o jogador abre a seção.

Os arquivos publicados têm nomes versionados e cache imutável. Cloudflare Static Assets/CDN ou R2 com domínio e cache podem reduzir download e latência; streaming não elimina o custo de simulação e desenho durante a batalha. O projeto conserva `VITE_ASSET_BASE_URL` e os exemplos em `deploy/` para distribuição externa de arquivos. A publicação atual usa a hospedagem Sites e sua vinculação D1; não configura uma conta pessoal Cloudflare adicional.

## Referências e reprodução

- [Composição da Endless Tower no rAthena](https://github.com/rathena/rathena/blob/master/npc/instances/EndlessTower.txt)
- [Monster database](https://github.com/rathena/rathena/blob/master/db/re/mob_db.yml)
- [Equipment database](https://github.com/rathena/rathena/blob/master/db/re/item_db_equip.yml)
- [Item/card database](https://github.com/rathena/rathena/blob/master/db/re/item_db_etc.yml)
- [Divine Pride](https://www.divine-pride.net/database/item/)
- [Classes oficiais](https://ragnarokonline.gungho.jp/gameguide/character/)
- [Cloudflare Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/how-r2-works/)

`scripts/build-ragnarok-tower-drops.py` registra URLs e hashes SHA-256 das fontes e gera as associações. `scripts/benchmark-bonk-spatial.mjs` e `scripts/benchmark-ragnarok-spawns.mjs` reproduzem as medições de desempenho. Os testes cobrem progressão, checkpoints, preservação dos personagens entre atividades, filas da Torre, geometria, limites de renderização, cartas, conta D1 e segurança das recompensas.
