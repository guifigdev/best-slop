# Opções comerciais e distribuição

Revisão em **19/11/2026**. Este documento é uma proposta de produto e operação; instalar o servidor não cria automaticamente uma loja, autorização de compras ou publicação Steam/Play.

## Recomendação inicial

Começar com **Steam premium + demo gratuita** e um **pacote cosmético opcional**. No Android, testar **download gratuito com desbloqueio único do jogo completo**, mantendo o mesmo balanceamento. Evitar vender dano, atributos, equipamentos ou chances melhores de espólio: o projeto tem encontros PvP e saques, então poder comprado prejudicaria a confiança na competição.

Escolha um modo principal para a página comercial e a primeira experiência — a Dungeon cooperativa pode cumprir esse papel — e apresente os demais como variedade. Um catálogo grande de modos sem uma experiência inicial estável aumenta suporte e divide a fila online.

| Modelo | Benefício | Custo/tradeoff | Uso sugerido |
| --- | --- | --- | --- |
| Compra única | Receita por jogador e promessa simples | Exige boa demo, apresentação e conteúdo suficiente | Base Steam |
| Demo + desbloqueio único | Jogador testa antes de pagar | Precisa entitlement confiável e limitar a demo claramente | Mobile e possível demo Steam separada |
| Cosméticos/pacote apoiador | Receita extra sem mudar combate | Exige arte, inventário persistente, suporte e recibos | Roupas, retratos, estandartes, efeitos visuais opcionais |
| DLC de conteúdo | Financia novos mundos/campanhas | Pode separar amigos e filas | Depois da base estável; definir acesso da party pelo host |
| Free-to-play + cosméticos | Menor barreira de entrada | Precisa escala, retenção, moderação e operação contínua | Experimento posterior, não padrão inicial |
| Anúncios | Monetiza quem não paga | Pode piorar ritmo, consumo e experiência | Opcional e fora de combate; não recompensar poder PvP |
| Assinatura | Receita recorrente | Obriga valor contínuo, conteúdo e suporte constantes | Só depois de validar comunidade e operação |

Preço, conversão e receita devem ser testados. Faça primeiro uma demo/Playtest com métricas de retenção, conclusão de runs, convites e estabilidade. Não estime faturamento só pelo número de downloads nem contrate capacidade para um pico imaginado.

## Hosts e custo de servidor

**Implementado agora:** Node autoritativo na VPS; host é o líder da sala. Uma sala é um estado de simulação dentro do processo, não uma máquina/container por sala. O cliente renderiza o voxel localmente. Isso reduz trabalho de implantação e mantém o mesmo protocolo web, desktop e Android.

**Possível depois:** listen server no computador do host para cooperação não ranqueada, conectado por transporte nativo/relay. Economiza simulação central, mas demanda integração Steamworks, NAT/relay, reconexão/migração de host e um modelo de confiança diferente. Um host modificado pode conhecer papéis secretos e alterar resultados; PvP competitivo e progressão comercial precisam de autoridade/verificação adequadas.

Steam Networking oferece P2P e conexões cliente-servidor; o SDR pode atender tráfego P2P e servidores dedicados, mas exige integrar as APIs e cumprir os requisitos da Valve. Não se ativa apenas preenchendo uma URL ou AppID. Fontes: [Steam Networking](https://partner.steamgames.com/doc/features/multiplayer/networking), [SDR](https://partner.steamgames.com/doc/features/multiplayer/steamdatagramrelay) e [ISteamNetworkingSockets](https://partner.steamgames.com/doc/api/ISteamNetworkingSockets).

Conta operacional inicial:

```text
custo mensal = VPS + armazenamento/backups + operações CDN/Worker + observabilidade
custo por hora jogada = custo mensal / horas de jogador realmente atendidas
contribuição por venda = receita líquida reportada pela loja − aquisição − suporte/operação atribuídos
```

Meça salas simultâneas reais, número de unidades, uso de RAM e percentil de tempo de tick. `ROOM_LIMIT=32` é limite de configuração, não promessa de que sua VPS aguenta 32 salas pesadas. Evite gravar snapshots em R2 a cada tick: simulação permanece em memória e checkpoints no disco, com backups periódicos externos. O bucket não é banco de combate em tempo real.

## Stack para reaproveitar o projeto

| Alvo | Stack proposta | Situação |
| --- | --- | --- |
| Web | Vite + Three.js + Node24/WebSocket + SQLite + Caddy | Código e kit de implantação preparados |
| CDN | Assets compilados R2 + gateway Worker limitado a `games/assets/` | Kit pronto; conta/domínio/chaves pendentes do operador |
| Steam Windows/Linux | Wrapper Electron, renderer isolado e integração Steamworks nativa | Próxima etapa; não entregue como instalador neste ciclo |
| Android | Capacitor + Android Studio + AAB assinado | Próxima etapa; medir WebGL em aparelhos reais |
| Compras/inventário comercial | Backend de contas, entitlements e validação de recibos | Ainda precisa implementação e testes de plataforma |

Electron empacota a interface web, mas o SDK Steam exige uma ponte nativa e processo de build próprio. Não habilite Node no renderer remoto; mantenha isolamento e uma API IPC pequena. Capacitor reaproveita o frontend, mas exige entrada por toque, ciclo de vida do aplicativo, reconexão ao voltar do fundo, testes de GPU e integração nativa de Billing. Fontes: [distribuição Electron](https://www.electronjs.org/docs/latest/tutorial/application-distribution) e [Capacitor Android](https://capacitorjs.com/docs/android).

Nenhuma recompilação para Godot/Unity é necessária para a primeira validação comercial. Considere uma troca de engine só se medições mostrarem que o renderer web não atende os dispositivos/recursos que o produto exige.

## Steam: o que você configura

1. Criar conta de parceiro Steamworks e completar identificação, dados bancários/fiscais e termos.
2. Criar o produto/AppID e pagar a taxa Steam Direct. A documentação informa **US$100 por app**, recuperável no pagamento após **US$1.000 de Adjusted Gross Revenue**; impostos e condições constam no painel. [Steam Direct](https://partner.steamgames.com/doc/gettingstarted/appfee).
3. Definir modelo de venda, regiões/preços, idiomas, requisitos e classificação/conteúdo. Revisar também direitos de marca e conteúdo antes de anunciar a adaptação comercial.
4. Preparar build desktop, controles, screenshots, trailer e página. A página e o build passam por revisão. A página Coming Soon deve ficar pública por pelo menos duas semanas antes do lançamento. [Processo de lançamento](https://partner.steamgames.com/doc/store/releasing).
5. Implementar/validar login Steam e ownership no backend se o online for restrito a compradores. Um AppID no `.env` não substitui validação de licença.
6. Para cosméticos/DLC, implementar compras, concessão idempotente, estorno/revogação e suporte. Não confiar numa mensagem do cliente dizendo “paguei”.

A participação da plataforma e as condições aplicáveis devem ser confirmadas no seu contrato/Steamworks. Não há uma garantia de receita ou capacidade de aprovação embutida no projeto.

## Google Play: o que você configura

1. Criar a conta Play Console adequada à sua atividade e concluir verificações. A taxa de cadastro informada é **US$25, uma vez**. [Cadastro oficial](https://support.google.com/googleplay/android-developer/answer/6112435).
2. Criar o aplicativo com application ID definitivo, chave de upload/Play App Signing e build AAB. Guardar chaves fora do Git e manter uma cópia protegida.
3. Implementar Google Play Billing para bens digitais conforme a política e os programas/exceções aplicáveis. Verificar compras no backend e tratar notificações, reembolso e reconciliação. [Billing](https://developer.android.com/google/play/billing) e [política de pagamentos](https://support.google.com/googleplay/android-developer/answer/9858738).
4. Preencher ficha, classificação, privacidade, Data Safety, dados coletados pelo chat/conta e credenciais de revisão, quando necessárias.
5. Rodar testes internos/fechados. Para novas contas pessoais abrangidas pela regra atual, o Google informa ao menos **12 testadores continuamente inscritos por 14 dias** antes de solicitar produção; confirme o fluxo mostrado na sua conta. [Requisitos de testes](https://support.google.com/googleplay/android-developer/answer/14151465).
6. Se adicionar anúncios, integrar SDK/consentimento e declarar seus dados de forma compatível com a audiência e regiões. Anúncios e compras ainda não foram implementados só por existir uma configuração no projeto.

**Não use “taxa universal de 15%” no plano financeiro.** A tabela oficial já diferencia mercados, novas/existentes instalações e programas em 2026. Para mercados ainda fora do rollout, existe o tier de 15% no primeiro US$1 milhão anual para inscritos e 30% acima; outros cenários usam a nova estrutura regional. Faça a conta com sua região/programa reais. [Taxas atuais do Google Play](https://support.google.com/googleplay/android-developer/answer/112622).

## Antes de vender esta adaptação

Revisar nomes, personagens, mapas, referências visuais, áudio, textos, fontes e materiais de divulgação. O repositório não concede direitos sobre Warcraft, Dota, Ragnarok, Isaac, Megabonk ou outros jogos citados como referência. Mecânicas pesquisadas e arte própria não comprovam por si autorização para usar marcas ou conteúdo de terceiros na loja. A página deve descrever o produto original entregue, sem sugerir afiliação oficial. Consulte as [regras Steamworks](https://partner.steamgames.com/doc/gettingstarted/onboarding) e a [política de propriedade intelectual do Google Play](https://support.google.com/googleplay/android-developer/answer/9888072).

Também faltam decisões comerciais concretas: identidade visual/nome final, política de conta e moderação do chat, licenças de compradores, verificação de pagamentos e quais cosméticos serão vendidos. Os tutoriais deixam essas integrações como pendentes; não simulam uma compra aprovada nem inventam um serviço de loja ativo.
