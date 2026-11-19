# Colocar o jogo na sua VPS

Guia de produção, revisado em **19/11/2026**. O site no subdomínio ChatGPT e a instalação abaixo são ambientes separados. Publicar no Sites não atualiza sua VPS; seu CI atualiza a VPS depois que você configurar o repositório.

## Arquitetura escolhida

```text
Navegador / futuro aplicativo desktop ou Android
                  │ HTTPS e WSS :443
              seu domínio
                  │
        Cloudflare DNS/proxy opcional
                  │
              Caddy na VPS
                  │ rede interna Docker
          Node 24 autoritativo :2567
          ├── frontend dist/client
          ├── /ws: salas de todos os modos
          ├── /api/phase: salas/chat Phase Killer
          ├── /api/config: diagnóstico público sem segredos
          └── SQLite em /data: checkpoints e salas
```

**Host da sala é seu líder**, que cria e inicia a partida; o servidor calcula combate, recursos e papéis secretos. Isso está implementado como servidor autoritativo. Host P2P no computador do jogador, migração desse host e Steam Datagram Relay exigem outro transporte nativo e ainda não estão implementados. A VPS não precisa renderizar o 3D: ela executa a simulação. R2 e Workers não são pré-requisitos para essa opção.

Uma VPS pequena serve para começar testes, mas quantidade de salas não pode ser prometida a partir de RAM/vCPU anunciados. Meça tempo de tick, memória, tamanho de snapshots e latência com os modos mais pesados; aumente `ROOM_LIMIT` só depois. Um processo mantém várias salas, evitando um container por partida. Escale mais tarde por grupos de salas e região, sem distribuir a mesma sala entre dois processos.

## 1. Preparar o servidor

Este kit assume **Ubuntu ou Debian**, domínio já seu e acesso SSH. O IP informado é `216.158.236.156`; o sistema operacional ainda precisa ser confirmado. Se sua VPS usa outro sistema, mantenha o Compose e instale Docker pelo procedimento correspondente. Não execute esses comandos no PowerShell local: primeiro entre por SSH na VPS.

1. Crie no seu provedor um usuário administrativo com chave SSH ou use o usuário que já administra a VPS.
2. Como seu usuário inicial é `root`, entre com `ssh root@216.158.236.156`. Digite sua senha somente no seu terminal; ela não vai ao projeto nem a esta conversa. Confira a identidade do servidor na primeira conexão pelo console do provedor.
3. Instale Git, clone `guifigdev/best-slop` e entre nele. Se o repositório acabou de ser criado e está vazio, primeiro envie a versão do projeto para `master`. Isso é separado do repositório interno do Sites: não use credenciais do ChatGPT como credenciais GitHub.

```bash
apt-get update
apt-get install -y git
git clone https://github.com/guifigdev/best-slop.git custom-hero
cd custom-hero
bash deploy/bootstrap-docker.sh
```

O instalador usa o repositório oficial Docker para Debian/Ubuntu. Se Docker já existe, ele não remove instalações/containers. Confirme com `sudo docker compose version`. Fontes: [Docker Ubuntu](https://docs.docker.com/engine/install/ubuntu/) e [plugin Compose](https://docs.docker.com/compose/install/linux/).

Os comandos seguintes pressupõem acesso ao Docker pelo usuário atual. Você pode usar `sudo` para executar o kit ou adicionar deliberadamente seu usuário ao grupo Docker e entrar novamente na sessão. Esse grupo tem poderes administrativos sobre a máquina.

## 2. Apontar domínio e liberar rede

1. Cloudflare → `gfig.space` → DNS → crie `A` para `play` com IPv4 `216.158.236.156`. Só crie `AAAA` se IPv6 estiver funcionando na VPS.
2. Comece com **DNS only** para validar o certificado. Se ativar depois o proxy laranja, configure SSL/TLS **Full (strict)**, nunca Flexible.
3. Libere **TCP 80 e 443** no firewall do provedor e da VPS. Preserve sua porta SSH real. UDP 443 é opcional para HTTP/3; WebSocket usa TCP 443.
4. Não exponha a porta 2567: o Compose só a anuncia dentro da rede Docker.
5. Se outro servidor já ocupa 80/443, integre seu proxy existente; não inicie um segundo Caddy nas mesmas portas.

Caddy obtém e renova o certificado do hostname configurado. O armazenamento dos certificados fica em volumes separados dos dados do jogo. Veja [HTTPS automático](https://caddyserver.com/docs/automatic-https). O proxy normal da Cloudflare atende portas específicas; 2567 não está nessa lista, por isso usamos WSS em 443. Veja [portas do proxy](https://developers.cloudflare.com/fundamentals/reference/network-ports/).

O Compose fixa `TRUST_PROXY=1` porque somente Caddy alcança a porta privada do jogo e fornece `X-Forwarded-For`. Assim o limite de conexões não trata todos os jogadores como um único endereço. Se executar Node diretamente com porta pública, mantenha essa opção desligada; cabeçalhos enviados pelo navegador não são confiáveis. Com proxy laranja da Cloudflare, configure também a cadeia de proxies confiáveis no Caddy para distinguir os IPs reais; até configurar isso, prefira DNS only.

## 3. Configurar o `.env`

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

Troque estes quatro valores:

```dotenv
DOMAIN=play.gfig.space
ACME_EMAIL=SEU_EMAIL_REAL
PUBLIC_ORIGIN=https://play.gfig.space
ALLOWED_ORIGINS=https://play.gfig.space
```

O hostname não recebe `https://`; a origem recebe e não tem barra final. Mantenha as outras opções nos valores iniciais. `ROOM_LIMIT` e `MAX_CLIENTS` são limites administrativos, não certificação de capacidade.

Deixe `VITE_SERVER_URL` vazio neste cenário: frontend, socket e Phase API usam o mesmo domínio. Variáveis `VITE_` entram no JavaScript público; nunca coloque chaves R2, tokens, senhas ou chave Steam nelas. A [matriz de configuração](CONFIGURACOES.md) explica cada integração.

## 4. Subir em um comando

Após DNS, Docker e `.env`:

```bash
bash scripts/deploy.sh
```

O comando faz build, valida a configuração, cria backup quando já existe servidor em execução, sobe o Compose e verifica a saúde. Na primeira instalação pode levar alguns minutos. Se o healthcheck da nova imagem falhar em uma atualização, tenta reiniciar a imagem anterior; isso não reverte o banco.

Abra:

- `https://SEU_DOMINIO/` — jogo.
- `https://SEU_DOMINIO/healthz` — saúde do servidor.
- `https://SEU_DOMINIO/api/config` — recursos configurados e pendências, sem credenciais.

Teste com **dois navegadores ou perfis diferentes**, mesmo código de sala e mesmo modo. No Phase Killer, confira o chat antes e depois de todos ficarem prontos. Nos demais modos, confira comandos e reconexão. Um navegador não deve receber o papel secreto do outro.

Comandos úteis:

```bash
docker compose --env-file .env -f deploy/compose.yaml ps
docker compose --env-file .env -f deploy/compose.yaml logs --tail=150 game
docker compose --env-file .env -f deploy/compose.yaml logs --tail=100 caddy
```

## 5. Auto update da branch `master`

O arquivo `.github/workflows/vps-production.yml` valida cada PR/push para `master`. A publicação fica desligada até você configurar `PRODUCTION_ENABLED=true`. Não é necessário dar acesso desta conversa à sua VPS.

### Preparação da VPS

1. Escolha um diretório fixo, por exemplo `/opt/custom-hero`, pertencente ao usuário de deploy. Ele conterá `.env` e `releases/`.
2. Coloque seu `.env` de produção em `/opt/custom-hero/.env`, permissão 600. Não inclua o arquivo no Git.
3. Gere uma **chave SSH exclusiva do CI**, coloque a parte pública no `authorized_keys` desse usuário e guarde a privada somente no secret do GitHub.
4. Verifique a fingerprint SSH no console do provedor e monte `known_hosts` a partir dessa identidade verificada. Não desative `StrictHostKeyChecking`.
5. Se a imagem GHCR for privada, autentique o Docker **na VPS** com uma conta/token de leitura de packages, usando `docker login ghcr.io -u SUA_CONTA --password-stdin`. O CI usa seu próprio `GITHUB_TOKEN` para publicar; não copie esse token temporário para a VPS.

### Criar um usuário para o CI após seu primeiro acesso root

O acesso root por senha serve para preparar a máquina. Para o CI, use uma chave exclusiva e um usuário como `game-deploy`. Depois de instalar Docker, no terminal da VPS como root:

```bash
adduser --disabled-password --gecos "" game-deploy
usermod -aG docker game-deploy
install -d -m 750 -o game-deploy -g game-deploy /opt/custom-hero
install -d -m 700 -o game-deploy -g game-deploy /home/game-deploy/.ssh
```

No seu PowerShell local, gere uma chave exclusiva (não sobrescreva uma existente):

```powershell
ssh-keygen -t ed25519 -f "$env:USERPROFILE/.ssh/best-slop-ci" -C "best-slop-ci"
Get-Content "$env:USERPROFILE/.ssh/best-slop-ci.pub"
```

Coloque **somente a linha pública** em `/home/game-deploy/.ssh/authorized_keys`, propriedade `game-deploy:game-deploy`, modo 600. A chave privada vai no secret `VPS_SSH_PRIVATE_KEY` do GitHub, nunca no repositório ou no chat. Para uso automático, a chave do CI precisa funcionar sem prompt; proteja seu acesso pelo GitHub e rotacione se houver exposição. `game-deploy` ainda tem poderes administrativos através do Docker, portanto essa chave precisa do mesmo cuidado de uma chave administrativa. Use `VPS_USER=game-deploy`. Não desative o acesso atual antes de verificar a nova conexão.

### Configuração do GitHub

Settings → Environments → crie `production`. Em Settings → Secrets and variables → Actions, cadastre:

| Tipo | Nome | Valor |
| --- | --- | --- |
| Secret | `VPS_HOST` | IP ou hostname SSH |
| Secret | `VPS_USER` | Usuário que acessa Docker e o diretório |
| Secret | `VPS_PORT` | Porta SSH, normalmente `22` |
| Secret | `VPS_SSH_PRIVATE_KEY` | Chave exclusiva do CI |
| Secret | `VPS_SSH_KNOWN_HOSTS` | Linha(s) da identidade SSH verificada |
| Repository variable | `VPS_PATH` | `/opt/custom-hero` ou seu caminho absoluto |
| Repository variable | `PRODUCTION_ENABLED` | `true` depois de configurar tudo |

Mantenha `PRODUCTION_ENABLED` como **repository variable**, pois a condição do job é avaliada antes do ambiente `production` ser carregado. Se desejar revisão humana dos releases, configure proteção nesse environment.

Depois de um push aprovado em `master`, o CI testa, constrói e publica `ghcr.io/CONTA/REPO:COMMIT_SHA`, transfere apenas o kit de deploy por SSH e ativa a imagem. O `.env` continua na VPS; a imagem não contém suas credenciais. A autenticação GHCR e os secrets seguem o fluxo oficial de [packages](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images) e [secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

**Atualização não é zero downtime.** SIGTERM inicia manutenção/drenagem por até 120s; o Compose concede 135s. O servidor salva checkpoints e clientes podem retomar dentro da janela de reconexão configurada. Ainda assim, programe releases fora de partidas importantes e não restaure checkpoints de um formato incompatível sem migração. A versão atual de estado é validada pelo servidor; salas incompatíveis não devem ser carregadas cegamente.

## 6. Backup, rollback e restauração

```bash
bash scripts/deploy-backup.sh
# Opcional, depois de configurar R2 + Node24 e AWS CLI no host:
bash scripts/deploy-backup.sh --r2
# Voltar somente a imagem:
bash scripts/deploy-rollback.sh
```

O backup usa a API de backup SQLite; não copia apenas um `.sqlite` ignorando WAL. Uma cópia fica em `/data/backups/` e outra em `~/.local/state/custom-hero/backups/` no host. R2 é a cópia fora da VPS. Sem backup externo, perder a VPS também pode perder as cópias locais.

### Restaurar backup

1. Escolha um snapshot conhecido e mantenha a imagem compatível com aquele estado.
2. Execute na pasta do kit de deploy:

```bash
bash scripts/deploy-restore.sh /CAMINHO/DO/SNAPSHOT
```

O script para o jogo, move os dados atuais para `restore-previous-DATA` dentro do volume, copia o snapshot e sobe a mesma imagem. Não mistura os WAL antigos com o banco restaurado. Confira `/healthz` e uma sala de teste. Para `.env` fora da pasta, acrescente `--env /opt/custom-hero/.env` aos scripts.

Guarde pelo menos duas imagens e backups antes de uma atualização de schema. Não use `docker compose down -v` para atualizar: esse comando apaga volumes. Não há poda automática de snapshots/imagens neste kit; configure retenção depois de testar a restauração.

## Diagnóstico

| Sintoma | Confira |
| --- | --- |
| HTTPS não emite certificado | DNS/AAAA, portas 80/443, outro proxy e logs Caddy |
| Jogo abre, socket falha | `/healthz`, WSS em 443, `PUBLIC_ORIGIN`, proxy e `/ws`; não usar `ws://` numa página HTTPS |
| Phase Killer dá erro de armazenamento | Volume `/data`, permissões, migração e logs do serviço |
| Funciona no navegador, falha no app | Origem/URL do aplicativo precisa ser configurada e validada; não liberar `*` como solução |
| Release não dispara | Branch `master`, `PRODUCTION_ENABLED`, environment e secrets |
| CI não baixa imagem na VPS | Login GHCR do usuário remoto e permissão `read:packages` |
| Retorno após queda perde sala | Janela de retomada, checkpoint compatível e `DATA_DIR` persistente |

Workers/D1 do site ChatGPT e SQLite desta VPS são bancos distintos. O kit não copia automaticamente contas ou partidas entre esses ambientes.
