# Auditoria dos efeitos de habilidades de Ragnarok

Data: 23/11/2026. Escopo: catálogo `RO_SKILLS`, eventos do simulador e renderizadores locais. A contagem abaixo descreve o código anterior à integração do novo bridge nativo, não uma promessa de fidelidade de todos os efeitos.

## Resultado verificável

O catálogo contém **685 habilidades**, das quais **454 são ofertáveis**. Existem **423 ativas ofertáveis**, **27 passivas de atributos sem animação de conjuração** e **4 passivas com companheiro/modelo próprio**. Somente **5 ativas** tinham uma sequência dedicada por habilidade/família: Chuva de Meteoros, três chuvas de flechas e Aegis Inferi. As outras **418** dependiam de camadas compartilhadas. Isso não significa 418 sprites idênticos: há perfis, elementos e materiais diferentes, mas não a coreografia original individual.

`yggwisps`, `payonpetals` e `lunardew` também têm cosméticos específicos em `ro-nature-art.js`; são criações deste jogo, não reconstruções de efeitos originais de RO.

O novo importador encontrou **423 identidades mapeadas no cliente de referência**, **168 com partes visuais declaradas** e **107 com alguma STR referenciada**. O pacote local contém **81 STR e 231 texturas**, cobrindo **75 habilidades** (aproximadamente 10,4 MB de arquivos, 21,8 MB de pixels decodificados antes de atlas/overhead). Esses números representam arquivos importados e decodificáveis, **não 75 habilidades já conferidas visualmente em jogo**. A cobertura remanescente inclui primitivas 2D/3D/cilindros, funções do cliente, sprites de entidade e habilidades sem referência disponível.

## Por que o resultado parecia genérico

| Rota anterior | Ofertáveis | Comportamento real observado no código |
| --- | ---: | --- |
| Ataque compartilhado | 245 | Perfis de corte, projétil ou impacto por família/elemento |
| Área compartilhada | 100 | Máscara de dano no chão e partículas elementais compartilhadas |
| Invocação compartilhada | 34 | Evento genérico de conjuração/invocação; não equivale a 34 criaturas modeladas |
| Fortalecimento compartilhado | 20 | Rune/shield/holy compartilhados |
| Cura compartilhada | 19 | Cruz, pontos ascendentes e/ou brilho compartilhado |
| Passiva sem conjuração | 27 | Correto para efeitos permanentes de atributos |
| Companheiro próprio | 4 | Falcão, montaria dracônica, Warg e Peco Peco |
| Chuva de flechas dedicada | 3 | `ac_shower`, `arrowstorm`, `severerainstorm` |
| Meteoros dedicados | 1 | `wz_meteor` |
| Terremoto dedicado | 1 | `lg_earthdrive` |

O perfil declarado em `ro-attack-catalog.js` não prova que aquele sprite aparece. `ro-attack-art.js` exclui deliberadamente `roAttack` de projétil/pulso/órbita/zona de heróis Bonk, além dos eventos de impacto `fireball`, `frostnova` e `abilityPulse`. Nesses casos o visual fica a cargo de `ro-projectile-art.js`, `ro-ground-area-art.js`, `ro-element-area-art.js` e efeitos específicos de fogo. Consequências:

- **Hammer Fall e Coluna de Pedra:** o perfil de impacto/terra não era desenhado; a camada elemental também pula físico/terra. Sobrava sobretudo a máscara plana do chão, sem o martelo ou erupção original.
- **Impacto Explosivo:** a animação usada era o impacto de fogo compartilhado, sem a explosão radial específica do cliente.
- **Nevasca e Magnus Exorcismus:** máscara e partículas de gelo/cruzes substituíam a sequência original. `kind: pulse` causa um evento de dano, embora o metadado contenha duração; o renderer não deve inventar novos ticks para imitar a animação original.
- **Relâmpagos:** projéteis compartilham modelos por elemento. `mg_lightningbolt` usa elemento `wind`, o que também afeta sua seleção de perfil; não era uma série vertical de relâmpagos original.
- **Canhões, ácido, lanças arremessadas e flechas:** projéteis físicos frequentemente terminam no mesmo conjunto haste/ponta/penas.
- **Golpes corporais, lanças, Asura e mordidas:** a regra universal `blade/overhead` homogeniza dezenas de habilidades que deveriam ter movimentos próprios.
- **Invocações:** além dos quatro companheiros persistentes e dos espíritos específicos de Yggdrasil, não foi encontrado um modelo persistente individual para as outras invocações temporárias. Uma esfera de espírito de `mo_callspirits` não deve ser representada como uma criatura genérica.

## Prioridade e referência por habilidade

Legenda de validação: **V** = sequência visual realmente inspecionada nesta auditoria; **M** = descrição/metadados do preview inspecionados, vídeo não conferido quadro a quadro; **S** = STR/textura local importada, ainda depende de QA da cena; **F** = falta referência suficiente, não adivinhar desenho. IDs de habilidade e de efeito pertencem a tabelas diferentes.

| Prioridade | Habilidade local / ID RO | Efeito original / fase | Falha anterior e reconstrução proposta | Evidência |
| --- | --- | --- | --- | --- |
| P0 | `hammerfall` / 110 | 102, cast STR `crashearth` | Martelo translúcido enorme surge acima, desce, clarão dourado/impacto e desaparece. Não um disco de terra | **V/S**, [preview 102](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_102.webm), sequência local `outputs/hammerfall-reference/original-sequence.png` |
| P0 | `sm_magnum` / 7 | 17, cast, dois cilindros/texturas | Explosão radial curta e expansão no personagem; importar primitivas originais, não aplicar fumaça de machado | **M**, [preview 17](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_17.webm) |
| P0 | `stormgust` / 89 | 89, cast STR `stormgust` | Nevasca multicamada de 4,25 s; respeitar frames/layers/blends e o centro real do pulso | **M/S**, [preview 89](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_89.webm) |
| P0 | `wz_vermilion` / 85 | 90, cast STR `lord` | Campo de descargas, não círculo luminoso genérico; ancorar no campo persistente | **M/S**, [preview 90](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_90.webm) |
| P0 | `heavensdrive` / 91; `wz_earthspike` / 90 | 79 e tabela do cliente | Erupção mineral sequencial em vez de brilho no chão. A STR `earthhit` importada cobre só contato; os pilares são `QuadHorn`/função, ainda sem renderer nativo dedicado | **M/S parcial**, [preview 79](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_79.webm) |
| P0 | `firebolt` / 19; `mg_lightningbolt` / 20 | tabela cast/hit; 49 é impacto de fogo e 29 é relâmpago | Separar descida dos projéteis/colunas e impacto. O preview 49 sozinho não prova uma cascata completa de Lanças de Fogo | **M/S**, [relâmpago 29](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_29.webm), [impacto 49](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_49.webm) |
| P0 | `magnusexorcismus` / 79 | cast 113 STR `magnus`, hit 152 `holyhit`, ground 318 primitivas | Invocação sagrada e campo próprios, sem trocar toda a sequência por cruzes repetidas | **M/S**, [preview 113](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_113.webm) |
| P1 | `mg_safetywall` / 12; `al_pneuma` / 25 | 315 `safetywall` + cilindros; 141 `pneuma%d` | Parede/barreira e campo de vento reconhecíveis. Escolher UMA variante de Pneuma | **M/S**, [parede 315](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_315.webm) |
| P1 | `pr_sanctuary` / 70 | cast 83 `sanctuary`, ground 319 | Anjo/campo específico. Hoje a mecânica é buff de regeneração próprio e a habilidade não é ofertada; não fingir que existe a célula de cura original | **M/S**, [preview 83](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_83.webm) |
| P1 | `al_angelus` / 33 | 41 | Asas/partículas próprias em vez de escudo genérico | **M/S**, [preview 41](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_41.webm) |
| P1 | `bash` / 5; `bowlingbash` / 62 | hit 1; cast/hit 149 | Preservar o rastro de arma aprovado pelo usuário; somar impacto original no alvo, sem substituir tudo por um novo corte genérico | **M/S** (Bowling), [Bash 1](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_1.webm), [Bowling 149](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_149.webm) |
| P1 | `sonicblow` / 136; `cartrevolution` / 153 | 121/143; 170 | Rajadas de contato e carrinho próprios; não usar somente animação vertical de espada | **M/S**, [Sonic 121](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_121.webm), [Carrinho 170](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_170.webm) |
| P1 | `wz_quagmire` / 92; `mg_firewall` / 18 | ground 95 `quagmire`; ground STR `firewall1/2` | Campo persistente original, nascimento único, loop limitado ao `until` do host. Não reiniciar uma STR por tick | **M/S**, [Pântano 95](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_95.webm), [Parede 25](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_25.webm) |
| P1 | `wz_meteor` / 83; `arrowstorm` / 2233 | cast 92 `meteor%d`, hit 49; cast 746 | Disparar no evento de queda/impacto real; uma variante por queda. Não repetir toda a área por inimigo atingido | **M/S**, [Meteoro 92](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_92.webm), [Flechas 746](https://github.com/lukasrmattos/ragnarok_effects_list/blob/main/videos/effect_746.webm) |
| P2 | `lg_earthdrive` / 2323 | sem partes no mapa de cliente consultado | Manter o terremoto dedicado atual até conseguir referência original adequada; não declarar fidelidade por haver um nome parecido | **F** |
| P2 | `mo_callspirits` e invocações restantes | precisa distinguir sprite de entidade, órbita, aura e impacto | Modelar representações próprias após inspecionar os sprites/ACT; STR de conjuração sozinha não resolve a criatura | **F** |

## Contrato seguro da reconstrução

1. `shared/ro-native-effect-policy.js` resolve chave local, Aegis ou ID RO pelo manifest. Apenas partes disponíveis localmente são solicitadas; `FUNC`, quake de câmera e partes sem asset não são considerados cobertura visual.
2. `roNativeEventRequests(event, unit, manifest, {state})` separa lançamento, contato e campo. Um projétil não mostra o impacto antes de chegar. Status aplicados a cada monstro não reconstroem toda a área em cada vítima.
3. `roNativeRequestsForState(state, manifest)` usa `bonk.roSkillZones`, nascimento estável e `until` autoritativo. Um grupo de zona deve ser reservado inteiro pelo renderer, ou continua o fallback. `attachedEntity` significa seguir a entidade; não significa transformar a STR em plano horizontal.
4. `variantGroup` `%d` seleciona uma alternativa determinística sem consumir RNG do jogo. O parser preserva keyframes, FPS, pivot, camadas, incrementos e blend factors originais. Nenhum dano, mana, recarga ou autoridade é alterado pela arte.
5. O renderer só declara `handles` quando as partes necessárias estiverem carregadas e couberem no orçamento. O filtro só então remove o efeito procedural correspondente. MVPs/telegraphs continuam independentes. `preserveAttackTrail` mantém os rastros físicos já aprovados; o hit nativo é uma camada adicional de contato.
6. Fluxos sem evento de impacto identificável ainda precisam de um hook explícito: projéteis perfurantes diretos precisam de um hit visual com skillKey em cada contato. A policy já aceita `roSkillImpact`; o hook no simulador deve ser integrado antes de declarar essa cobertura. Não fabricar esse contato na origem. O início de carregamento também tem `roCasting`/`bonk.casting`, mas não um evento dedicado; a fase cast do bridge atual começa no lançamento/efeito autoritativo.

QA necessária: quatro frames da coreografia por habilidade prioritária (início, ápice, contato/campo e desaparecimento), um teste em movimento para attachments, pausa de level-up, dois jogadores emitindo o mesmo efeito, troca de mapa, asset indisponível e saturação do orçamento. Importação sem essa comparação não deve ser chamada de efeito aprovado.

## Fontes e limites

- [Tabela visual de habilidades do cliente](https://assets.latam-tools.com.br/effect/skill-map) e [tabela de partes dos efeitos](https://assets.latam-tools.com.br/effect/table): identidade/associação de partes e fases usada pelo importador. Não inferir efeito pelo número da habilidade.
- [ragassets](https://github.com/adsonpleal/ragassets): origem catalogada pelo bridge para os dados/texturas do cliente. A licença do código não concede licença adicional sobre a arte do jogo.
- [ragnarok_effects_list](https://github.com/lukasrmattos/ragnarok_effects_list): catálogo de previews e referências GRF. O JSON tem 2.441 entradas; referência a vídeo não significa vídeo assistido. Não contém uma biblioteca de STR completas por si só.
- Fontes locais: `shared/ragnarok-jobs.js`, `shared/bonk.js`, `shared/ro-skill-mechanics.js`, `shared/ro-attack-catalog.js`, `src/ro-attack-art.js`, `src/ro-projectile-art.js`, `src/ro-ground-area-art.js`, `src/ro-element-area-art.js`, `src/ro-nature-art.js`, `src/ro-native-effect-assets.js`.
- Registro de auditoria gerado a partir do catálogo: `outputs/ro-visual-audit/catalog.json`. A antiga documentação de cobertura de mecânicas não é uma auditoria de fidelidade visual.

## Apêndice: habilidades com STR local

Esta tabela é gerada do manifest real: ID RO → fase → effectId/arquivo. Estado **S** significa arquivo importado, não aprovação visual.

| Habilidade | ID RO | Fases e partes originais disponíveis |
| --- | ---: | --- |
| `mg_safetywall` | 12 | cast: 315 / `safetywall` |
| `mg_frostdiver` | 15 | hit: 28 / `freeze` |
| `mg_stonecurse` | 16 | cast: 23 / `stonecurse` |
| `fireball` | 17 | hit: 49 / `firehit1`; hit: 49 / `firehit2`; hit: 49 / `firehit3` |
| `mg_firewall` | 18 | hit: 49 / `firehit1`; hit: 49 / `firehit2`; hit: 49 / `firehit3`; ground: 25 / `firewall1`; ground: 25 / `firewall2` |
| `firebolt` | 19 | hit: 49 / `firehit1`; hit: 49 / `firehit2`; hit: 49 / `firehit3` |
| `mg_lightningbolt` | 20 | cast: 29 / `lightning`; cast: 29 / `windhit1`; cast: 29 / `windhit2`; cast: 29 / `windhit3`; hit: 52 / `windhit1`; hit: 52 / `windhit2`; hit: 52 / `windhit3` |
| `mg_thunderstorm` | 21 | cast: 30 / `thunderstorm`; hit: 52 / `windhit1`; hit: 52 / `windhit2`; hit: 52 / `windhit3` |
| `al_pneuma` | 25 | ground: 141 / `pneuma1`; ground: 141 / `pneuma2`; ground: 141 / `pneuma3` |
| `al_crucis` | 32 | cast: 40 / `cross` |
| `al_angelus` | 33 | cast: 41 / `angelus` |
| `al_cure` | 35 | cast: 66 / `cure` |
| `mc_mammonite` | 42 | cast: 10 / `maemor` |
| `kn_pierce` | 56 | cast: 148 / `pierce`; hit: 147 / `earthhit` |
| `kn_brandishspear` | 57 | cast: 70 / `brandish` |
| `kn_spearstab` | 58 | cast: 150 / `spearstab` |
| `kn_spearboomerang` | 59 | cast: 151 / `spearboomerang` |
| `bowlingbash` | 62 | cast: 149 / `bowling` |
| `pr_aspersio` | 68 | cast: 86 / `aspersio` |
| `pr_strecovery` | 72 | cast: 78 / `recovery` |
| `pr_kyrie` | 73 | cast: 112 / `kyrie` |
| `pr_magnificat` | 74 | cast: 76 / `magnificat` |
| `pr_lexdivina` | 76 | cast: 87 / `lexdivina` |
| `pr_turnundead` | 77 | hit: 152 / `holyhit` |
| `pr_lexaeterna` | 78 | cast: 85 / `lexaeterna` |
| `magnusexorcismus` | 79 | cast: 113 / `magnus`; hit: 152 / `holyhit` |
| `wz_firepillar` | 80 | cast: 96 / `firepillar`; hit: 97 / `firepillarbomb` |
| `wz_sightrasher` | 81 | hit: 49 / `firehit1`; hit: 49 / `firehit2`; hit: 49 / `firehit3` |
| `wz_meteor` | 83 | cast: 92 / `meteor1`; cast: 92 / `meteor2`; cast: 92 / `meteor3`; cast: 92 / `meteor4`; hit: 49 / `firehit1`; hit: 49 / `firehit2`; hit: 49 / `firehit3` |
| `wz_vermilion` | 85 | cast: 90 / `lord`; hit: 52 / `windhit1`; hit: 52 / `windhit2`; hit: 52 / `windhit3` |
| `wz_frostnova` | 88 | cast: 28 / `freeze` |
| `stormgust` | 89 | cast: 89 / `stormgust` |
| `wz_earthspike` | 90 | hit: 147 / `earthhit` |
| `heavensdrive` | 91 | hit: 147 / `earthhit` |
| `wz_quagmire` | 92 | ground: 95 / `quagmire` |
| `hammerfall` | 110 | cast: 102 / `crashearth` |
| `ht_skidtrap` | 115 | cast: 69 / `skidtrap` |
| `ht_shockwave` | 118 | cast: 145 / `shockwave`; hit: 146 / `shockwavehit` |
| `ht_sandman` | 119 | hit: 139 / `sandman` |
| `ht_freezingtrap` | 121 | hit: 108 / `freezing` |
| `ht_blastmine` | 122 | hit: 106 / `blastmine` |
| `ht_claymoretrap` | 123 | hit: 107 / `claymore` |
| `sonicblow` | 136 | cast: 143 / `sonicblow` |
| `as_venomdust` | 140 | cast: 124 / `venomdust` |
| `as_splasher` | 141 | cast: 129 / `venomsplasher` |
| `cartrevolution` | 153 | hit: 170 / `cartrevolution` |
| `holylight` | 156 | cast: 152 / `holyhit` |
| `cr_shieldcharge` | 250 | cast: 246 / `shield_charge` |
| `cr_holycross` | 253 | cast: 245 / `holy_cross` |
| `sa_spellbreaker` | 277 | cast: 234 / `spell` |
| `sa_flamelauncher` | 280 | cast: 255 / `enc_fire` |
| `sa_frostweapon` | 281 | cast: 256 / `enc_ice` |
| `sa_lightningloader` | 282 | cast: 257 / `enc_wind` |
| `sa_seismicweapon` | 283 | cast: 258 / `enc_earth` |
| `sa_dispell` | 289 | cast: 235 / `디스펠` |
| `pf_soulburn` | 375 | cast: 406 / `소울번` |
| `ws_meltdown` | 384 | cast: 390 / `melt` |
| `am_berserkpitcher` | 446 | cast: 220 / `버서크` |
| `rk_enchantblade` | 2001 | cast: 756 / `버서크` |
| `rk_ignitionbreak` | 2006 | cast: 722 / `이그니션브레이크` |
| `rk_dragonhowling` | 2009 | cast: 731 / `dragon_h` |
| `judex` | 2038 | hit: 152 / `holyhit` |
| `adoramus` | 2040 | cast: 721 / `ado` |
| `wl_crimsonrock` | 2211 | cast: 727 / `crimson_r` |
| `wl_hellinferno` | 2212 | ground: 728 / `hell_in` |
| `arrowstorm` | 2233 | cast: 746 / `arrowstorm` |
| `ra_aimedbolt` | 2236 | cast: 745 / `aimed` |
| `nc_powerswing` | 2279 | cast: 795 / `powerswing` |
| `so_firewalk` | 2443 | ground: 920 / `firewall_per` |
| `so_electricwalk` | 2444 | ground: 926 / `hunter_shockwave_blue` |
| `gc_darkcrow` | 5001 | cast: 1040 / `gc_darkcrow` |
| `gn_illusiondoping` | 5003 | cast: 1049 / `gn_illusiondoping` |
| `nc_magma_eruption` | 5006 | cast: 1050 / `nc_magma_eruption` |
| `sr_flashcombo` | 5009 | cast: 1043 / `sr_flashcombo` |
| `ab_offertorium` | 5011 | cast: 1047 / `ab_offertorium` |
