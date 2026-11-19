# Plano de lançamento — 19/11/2026

## Decisão recomendada

Começar com **web na VPS + Steam premium com demo**. Testar Android com versão gratuita limitada e desbloqueio único depois de validar controles e desempenho em aparelhos reais. Cosméticos podem financiar conteúdo sem vender poder no PvP. Não começaria com assinatura nem anúncios em combate.

Direção de nome solicitada: **slop**, sem restringir o universo ou os modos. Minha favorita agora é **SlopMash**: comunica uma mistura de jogos. Alternativas: **Sloparium** e **Slop Customs**. Nenhuma foi escolhida ou validada como marca. A busca preliminar encontrou [Slop Party](https://slopbin.org/slop-party/) e [Slopcade](https://slopcade.com/) já em uso em jogos/plataformas; eu evitaria esses dois. Não apliquei renomeação automática.

## Endereços e armazenamento

| Recurso | Configuração proposta |
| --- | --- |
| VPS | `216.158.236.156` — SSH inicial `root`; sistema ainda não confirmado |
| Jogo/API/salas | `https://play.gfig.space`, `wss://play.gfig.space/ws` |
| Código | [guifigdev/best-slop](https://github.com/guifigdev/best-slop), branch `master` |
| Bucket R2 | `clients`, objetos somente sob `games/` |
| Endpoint S3 | `https://a9cf0f539d37afe46de8c5d1aec58cdf.r2.cloudflarestorage.com` |
| CDN proposta | `https://assets.gfig.space/games/assets/...` |

O endpoint S3 **não inclui `/clients`**; bucket e prefixo são parâmetros separados. Ele não substitui uma URL pública de download.

Mantenha `clients` privado. O Worker fornecido expõe somente `games/assets/*`; conectar um domínio público diretamente a esse bucket poderia publicar arquivos de outros clientes. O Worker aplica CORS às origens exatas autorizadas. Não é preciso habilitar CORS do S3 para upload pelo CI. [Referência Cloudflare](https://developers.cloudflare.com/r2/buckets/cors/).

Os modelos voxel e ilustrações são gerados pelo código; o bundle, estilos e fontes locais vão para `games/assets/`. As licenças das fontes acompanham a distribuição. HTML, API e banco ficam na VPS. Backups exigem um **bucket privado separado**, sem publicação pelo CDN.

## O que está preparado e o que falta

| Área | Entrega no projeto | Sua configuração / limite atual |
| --- | --- | --- |
| Salas online | Simulação autoritativa, líder, chat, retomada e checkpoints SQLite | DNS, Docker, `.env` e acesso à VPS |
| Configuração visível | Botão **Configuração**, diagnóstico e tutoriais por integração | Endereço do servidor real quando usar o frontend hospedado no Sites |
| Atualizações | CI para `master`, imagem por commit, backup e tentativa de rollback | Primeiro envio ao GitHub, secrets, GHCR e `PRODUCTION_ENABLED=true` |
| Assets | Upload R2 e Worker restrito ao prefixo do jogo | Token S3, publicação do Worker e domínio CDN |
| Dungeon | Andares procedurais, grupos até 4, rivais, chefes, loot, lojas e final de 50 andares | Validar partidas com pessoas e medir capacidade real da VPS |
| Bloody Tournament | Recrutamento, formações, combate automático, sete rodadas e classificação | Validar balanceamento; adaptação própria, não reprodução certificada do mapa |
| Steam/Android | Plano de integração e tutoriais | Wrappers, SDKs, builds assinados e publicação ainda não entregues |
| Pagamentos | Estratégia documentada | Contas, recibos e entitlements ainda precisam implementação |

**Host hoje significa líder da sala; a VPS simula o jogo.** O host não executa o servidor no próprio PC. P2P/listen server com Steam Relay pode reduzir custo central mais tarde, mas exige transporte nativo, migração de host e regras de confiança; não se ativa com AppID. Para identidade secreta e competição, autoridade central evita entregar o estado secreto inteiro ao host. [Steam Networking](https://partner.steamgames.com/doc/features/multiplayer/networking).

Não há promessa de quantidade de salas por VPS. Os limites configuráveis são proteções administrativas. Antes de crescer, medir CPU/tick, memória, tráfego e latência. A VPS não renderiza o cenário 3D. Atualizações podem interromper a conexão; retomada compatível não significa zero downtime.

## Sua sequência de configuração

1. **Primeiro envio ao GitHub.** O repositório informado estava vazio na consulta. Na pasta local do projeto, adicione um remoto separado para preservar o remoto do Sites:

   ```powershell
   git remote add github https://github.com/guifigdev/best-slop.git
   git push github HEAD:master
   ```

   Execute depois que a versão estiver salva/commitada. Se `github` já existir, confira com `git remote get-url github` antes de alterá-lo. Autentique no GitHub pelo seu gerenciador de credenciais; não envie tokens no chat. Não publique `.env`, dados de jogadores ou backups.

2. **DNS:** em `gfig.space`, crie `A play → 216.158.236.156`. Comece como DNS only; quando usar proxy, SSL Full (strict). Libere TCP 80/443 e preserve a porta SSH.
3. **VPS:** acesse com `ssh root@216.158.236.156`, digitando a senha apenas no seu terminal, e confirme Ubuntu/Debian. Siga [HOSPEDAGEM.md](HOSPEDAGEM.md): clone, instale Docker, copie `.env.example`, ajuste email/origens e rode `bash scripts/deploy.sh`. O comando único pressupõe esses pré-requisitos.
4. **Teste online:** abra `https://play.gfig.space/healthz`, confira Configuração e entre na mesma sala com dois navegadores. Teste saída/reentrada, chat e salvamento. Preserve o volume `/data`.
5. **R2:** siga [CONFIGURACOES.md](CONFIGURACOES.md) para token limitado, Worker, domínio `assets.gfig.space`, origens CORS e upload. Só depois ative `VITE_ASSET_BASE_URL=https://assets.gfig.space/games/` e recompile. O jogo funciona com assets locais enquanto isso.
6. **CI:** cadastre `VPS_HOST`, `VPS_USER`, `VPS_PORT`, `VPS_SSH_PRIVATE_KEY`, `VPS_SSH_KNOWN_HOSTS`; configure `VPS_PATH` e `PRODUCTION_ENABLED`. As variáveis/chaves extras do R2 estão na matriz. Garanta leitura da imagem GHCR pela VPS. O passo a passo está em [HOSPEDAGEM.md](HOSPEDAGEM.md).
7. **Operação:** teste restauração de backup; monitore uso e erros; defina retenção. Para lançamento público, completar contas, proteção contra abuso e moderação do chat. Salas por convite são a etapa inicial de validação.
8. **Lojas:** escolha o nome, faça auditoria de direitos, prepare demo e página. Depois implemente Steamworks/Android Billing e validação de compras conforme [MONETIZACAO.md](MONETIZACAO.md).

## Nomes e direitos antes de vender

**Renomear sozinho não garante ausência de processos.** Há diferença entre uma ideia de jogo e a expressão concreta dessa ideia, e nomes também podem envolver marcas. Não venda este projeto como produto oficial Warcraft, Ragnarok, Dota, Isaac ou Megabonk. Evite seus logos, sons, arquivos extraídos, textos copiados e versões reconhecíveis de personagens proprietários. Audite também dados/scripts dos mapas e permissões dos autores. A política de custom games da Blizzard não equivale a uma licença para vender um standalone. [Copyright Office](https://www.copyright.gov/help/faq/faq-protect.html), [política Blizzard](https://www.blizzard.com/en-us/legal/2749df07-2b53-4990-b75e-a7cb3610318b/custom-game-acceptable-use-policy).

A revisão do Phase Killer usa coordenadas e terreno extraídos do mapa como referência de fidelidade do protótipo. Essa origem precisa entrar na auditoria: para uma versão comercial, obter permissão aplicável ou substituir por um layout próprio. O fato de os voxels terem sido modelados aqui não libera automaticamente o layout, scripts ou dados de terceiros.

Para a versão comercial, proponho rótulos próprios na interface:

| Nome de referência atual | Proposta original |
| --- | --- |
| Custom Hero Survival / Line Wars | Provas dos Nove / Guerra dos Portais |
| Castle Fight | Fortalezas dos Reinos |
| Tree Tag / Kodo Tag | Caçada da Floresta / Caçada dos Colossos |
| Warlock / Phase Killer | Duelo Rúnico / Assassino Entre Mundos |
| Bloody Tournament / Dungeon | Crisol das Hostes / Abismos dos Nove |

Thor, Loki, Hel e Fenrir podem partir das fontes mitológicas, com desenhos, falas, roupas e histórias próprios. Evite copiar versões de franquias modernas. Isso é uma diretriz de criação, não liberação jurídica de cada asset.

Antes de registrar a marca, pesquise nome e semelhanças no [INPI](https://www.gov.br/inpi/pt-br/servicos/marcas), nas lojas e nos países onde venderá; peça revisão profissional de marca/licenças. Mantenha inventário de origem de código, imagens, áudio, fontes e contratos. A Steam exige direitos sobre o conteúdo distribuído. [Onboarding Steam](https://partner.steamgames.com/doc/gettingstarted/onboarding).

O kit não efetuou mudanças na sua VPS, DNS, conta R2 ou GitHub. Não recebemos acesso administrativo a esses serviços. A publicação no subdomínio do ChatGPT é separada do futuro deploy na VPS.
