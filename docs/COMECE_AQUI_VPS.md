# Do projeto local ao jogo online

Roteiro para os dados informados: VPS `216.158.236.156`, acesso inicial `root`, domínio `gfig.space`, repositório `guifigdev/best-slop`. Revisado em 21/11/2026. **Execute as etapas em ordem.** Publicar no Sites e enviar ao GitHub são operações separadas.


## Antes de começar: qual janela eu uso?

Vamos colocar tudo no endereço **https://play.gfig.space**. Pense assim: o GitHub é a caixa do código; a VPS é o computador que deixa o jogo ligado; a Cloudflare dá o endereço.

Você vai alternar entre três lugares:

1. **Seu PC:** abra o PowerShell no Windows. Os comandos `git`, o envio do código e a criação da chave do CI começam aqui.
2. **Painéis no navegador:** Cloudflare para DNS; GitHub para atualizações automáticas.
3. **Terminal da VPS:** depois de `ssh root@216.158.236.156`, você passa a controlar o Linux. Os comandos `apt-get`, `nano`, `docker` e `bash scripts/deploy.sh` vão aqui.

Copie **um bloco de cada vez** e aperte Enter. Se um passo der erro, não avance para os próximos. Senhas digitadas no SSH não mostram bolinhas nem letras: isso é normal. Digite e aperte Enter. Nunca cole senha, chave privada ou `.env` na conversa.

**Para jogar online pela primeira vez, basta concluir os passos 1 a 4.** Atualização automática e R2 vêm depois. Você não precisa contratar Worker, instalar Node na VPS nem instalar banco manualmente: o Dockerfile já usa Node24, e o serviço cria seu SQLite persistente.

Os valores abaixo são os que estão registrados no projeto. Se o IP/domínio da sua VPS mudou, substitua-os em todos os passos. O roteiro de instalação assume Ubuntu ou Debian.

## 1. Enviar o código ao GitHub — PowerShell no seu PC

O código fica nesta pasta local. Confira se a atualização desejada já foi concluída e commitada com `git status` antes de enviar. O estado atual do GitHub e da VPS deve ser conferido por você. O remoto adicional preserva o remoto interno do Sites:

```powershell
Set-Location 'C:\Users\Guilherme\Downloads\games-gpt\custom hero'
git remote add github https://github.com/guifigdev/best-slop.git
git push github HEAD:master
```

Se o remoto `github` já existir, confira `git remote get-url github` e só envie se apontar para esse repositório. Não use `--force`. Caso o Git peça login, use o fluxo de autenticação do GitHub/Git Credential Manager; a senha normal da conta não substitui um token Git. Confirme na página do GitHub que existem `deploy/`, `server/`, `.env.example` e `.github/workflows/vps-production.yml`. Não envie `.env`, chaves ou backups.

## 2. Criar o endereço do jogo — painel Cloudflare

Em `gfig.space` → DNS → Records, crie ou ajuste **somente**:

| Tipo | Nome | Destino | Proxy inicial |
| --- | --- | --- | --- |
| A | `play` | `216.158.236.156` | DNS only / nuvem cinza |

Um registro específico de `play` prevalece sobre um wildcard. Não altere o registro raiz do domínio ou outros serviços. Não deixe um `AAAA` de `play` apontar para outro servidor. O hostname `assets` será configurado pelo Worker mais adiante.

No firewall do provedor, libere TCP **80 e 443**, preservando a porta SSH usada. Se houver firewall dentro da VPS, libere essas portas nele também. Confira se outro serviço já ocupa 80/443; o Caddy deste kit precisa dessas portas ou de integração com seu proxy existente.

## 3. Acessar e preparar a VPS — primeiro PowerShell, depois Linux

No PowerShell:

```powershell
ssh root@216.158.236.156
```

Digite a senha apenas nesse terminal. Confira a fingerprint do servidor com o console do provedor antes de aceitar uma identidade desconhecida. A partir daqui os comandos são **no terminal Linux da VPS**:

```bash
cat /etc/os-release
```

O instalador incluído suporta Ubuntu/Debian. Se for outro sistema, não execute os comandos `apt-get`; use o instalador Docker apropriado. Para Ubuntu/Debian:

```bash
apt-get update
apt-get install -y git
cd /opt
git clone --branch master https://github.com/guifigdev/best-slop.git custom-hero
cd /opt/custom-hero
bash deploy/bootstrap-docker.sh
docker compose version
cp .env.example .env
chmod 600 .env
nano .env
```

Se `/opt/custom-hero` já contém a instalação, entre nela e confira seu estado em vez de clonar por cima. O bootstrap usa o repositório oficial Docker e não substitui uma instalação existente silenciosamente. [Docker Ubuntu](https://docs.docker.com/engine/install/ubuntu/).

## 4. Ajustar o `.env` e iniciar — terminal Linux da VPS

No arquivo aberto, configure:

```dotenv
DOMAIN=play.gfig.space
ACME_EMAIL=SEU_EMAIL_REAL
PUBLIC_ORIGIN=https://play.gfig.space
ALLOWED_ORIGINS=https://play.gfig.space
VITE_SERVER_URL=
VITE_PHASE_API_URL=
VITE_ASSET_BASE_URL=
```

Mantenha as outras linhas do exemplo. Em `ACME_EMAIL`, informe seu email real. No nano, salve com Ctrl+O, Enter, e saia com Ctrl+X. As três variáveis `VITE_` ficam vazias inicialmente: navegador, API e socket usam a mesma VPS; os assets também funcionam localmente enquanto configuramos o R2.

```bash
bash scripts/deploy.sh
curl --fail https://play.gfig.space/healthz
curl --fail https://play.gfig.space/api/config
```

O primeiro comando faz o build, inicia Docker Compose e verifica a saúde. A emissão do certificado depende de DNS e rede corretos. Abra `https://play.gfig.space` em dois navegadores/perfis, escolha o mesmo modo e código de sala e teste movimento/chat. A simulação roda na VPS; o host da sala é o líder da partida.

Para diagnosticar:

```bash
docker compose --project-name custom-hero --env-file .env -f deploy/compose.yaml ps
docker compose --project-name custom-hero --env-file .env -f deploy/compose.yaml logs --tail=100 game caddy
```

Se mantiver uma aba com o site do ChatGPT, em **Configuração → Servidor de salas** informe `wss://play.gfig.space/ws`. Para usar esse frontend externo, acrescente sua origem exata a `ALLOWED_ORIGINS`, separada por vírgula, e atualize a VPS. A página própria em `play.gfig.space` funciona sem esse ajuste. Os dados do Sites e os da VPS são bancos separados.

## 5. Criar uma chave para atualizações — VPS e uma nova aba PowerShell

Na VPS, como root, depois de instalar Docker:

```bash
adduser --disabled-password --gecos "" game-deploy
usermod -aG docker game-deploy
install -d -m 750 -o game-deploy -g game-deploy /opt/custom-hero
install -d -m 700 -o game-deploy -g game-deploy /home/game-deploy/.ssh
chown game-deploy:game-deploy /opt/custom-hero/.env
```

Se o usuário já existe, não é necessário executar `adduser` novamente. Na **nova aba PowerShell do PC**:

```powershell
ssh-keygen -t ed25519 -f "$env:USERPROFILE/.ssh/best-slop-ci" -C "best-slop-ci"
Get-Content "$env:USERPROFILE/.ssh/best-slop-ci.pub" | ssh root@216.158.236.156 'umask 077; cat >> /home/game-deploy/.ssh/authorized_keys; chown game-deploy:game-deploy /home/game-deploy/.ssh/authorized_keys; chmod 600 /home/game-deploy/.ssh/authorized_keys'
ssh -i "$env:USERPROFILE/.ssh/best-slop-ci" game-deploy@216.158.236.156 'docker compose version'
```

Use uma chave nova; não sobrescreva outra. Para este CI, deixe a passphrase dessa chave dedicada vazia quando o comando perguntar. A chave privada será armazenada no GitHub; não a envie ao chat. O grupo Docker dá poderes administrativos, portanto restrinja e proteja o acesso aos secrets do CI.

Ainda no PowerShell, obtenha a chave pública de identidade do servidor:

```powershell
ssh-keyscan -t ed25519 216.158.236.156 2>$null | Set-Content -Encoding ascii "$env:USERPROFILE/.ssh/best-slop-known-hosts"
ssh-keygen -lf "$env:USERPROFILE/.ssh/best-slop-known-hosts"
```

Compare a fingerprint com `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` executado no **console confiável do provedor**. Só use a linha capturada se as fingerprints coincidirem; `ssh-keyscan` sozinho não autentica o servidor.

## 6. Ativar o CI — painel GitHub

No repositório → Settings → Environments, crie `production`. Em Settings → Secrets and variables → Actions, crie os **repository secrets** e **repository variables** abaixo. [Interface oficial de secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

| Tipo | Nome | Valor |
| --- | --- | --- |
| Secret | `VPS_HOST` | `216.158.236.156` |
| Secret | `VPS_USER` | `game-deploy` |
| Secret | `VPS_PORT` | `22`, ou sua porta SSH real |
| Secret | `VPS_SSH_PRIVATE_KEY` | Conteúdo completo de `best-slop-ci`, incluindo BEGIN/END, sem `.pub` |
| Secret | `VPS_SSH_KNOWN_HOSTS` | Conteúdo verificado de `best-slop-known-hosts` |
| Variable | `VPS_PATH` | `/opt/custom-hero` |
| Variable | `PRODUCTION_ENABLED` | `true`, após preparar tudo |

O workflow publica uma imagem em GHCR. Se o package for privado, crie um token GitHub com permissão de leitura de packages e, na VPS, autentique o **mesmo usuário do CI** pelo prompt:

```bash
su - game-deploy
docker login ghcr.io -u guifigdev
```

Na pergunta de senha do Docker, use o token de leitura de packages. Não é a senha SSH nem a senha normal do GitHub. Como alternativa, um package GHCR público pode ser baixado sem login. [Autenticação GHCR](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).

Em GitHub → Actions → **Validate and deploy VPS**, execute **Run workflow** selecionando `master`. Confira os jobs `validate` e `deploy`. Cada push futuro para `master` executará o fluxo. O deploy gera imagem por commit, faz backup quando aplicável e verifica a saúde; pode haver interrupção breve e retomada de salas compatíveis.

Na pasta local do PC, o envio de futuras versões já commitadas é `git push github HEAD:master`. Publicar no Sites não envia automaticamente esse push ao GitHub.

## 7. Publicar os assets em `clients/games/` — Cloudflare e PC

Primeiro deixe o jogo online pela VPS, então habilite o CDN. **Mantenha o bucket `clients` privado.** O Worker fornecido expõe somente `games/assets/*`; os demais arquivos de clientes não ficam públicos.

No PC com Node 24, na pasta do projeto:

```powershell
Copy-Item deploy/wrangler.assets.toml.example deploy/wrangler.assets.toml
npx wrangler login
npx wrangler deploy --config deploy/wrangler.assets.toml
```

Confirme no arquivo a conta `a9cf0f539d37afe46de8c5d1aec58cdf`, binding `CLIENTS_BUCKET`, bucket `clients` e domínio `assets.gfig.space`. Wrangler pode pedir autorização para criar o custom domain. Se já existir um registro conflitante desse hostname, resolva-o no painel sem alterar o domínio raiz. Workers gerencia o DNS/certificado do seu custom domain. [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

O CORS já é aplicado pelo Worker para `https://play.gfig.space` e `https://gfig.space`. Não é necessário liberar o CORS do endpoint S3 para uploads do CI. Para mais origens, edite `PUBLIC_ASSET_ORIGINS` no TOML e publique o Worker novamente.

No painel R2 → Manage R2 API Tokens, crie uma credencial **Object Read & Write**, restrita ao bucket `clients`. Guarde Access Key ID e Secret Access Key no GitHub como secrets. [Tokens R2](https://developers.cloudflare.com/r2/get-started/s3/).

No GitHub, acrescente:

| Tipo | Nome | Valor |
| --- | --- | --- |
| Secret | `AWS_ACCESS_KEY_ID` | Access Key ID do R2 |
| Secret | `AWS_SECRET_ACCESS_KEY` | Secret Access Key do R2 |
| Variable | `R2_ENDPOINT` | `https://a9cf0f539d37afe46de8c5d1aec58cdf.r2.cloudflarestorage.com` |
| Variable | `R2_BUCKET` | `clients` |
| Variable | `R2_ASSET_PREFIX` | `games` |
| Variable | `VITE_ASSET_BASE_URL` | `https://assets.gfig.space/games/` |

O endpoint não leva `/clients`; bucket e pasta são separados. Antes de executar o novo release, na `.env` da VPS ajuste:

```dotenv
VITE_ASSET_BASE_URL=https://assets.gfig.space/games/
R2_PUBLIC_URL=https://assets.gfig.space/games
```

Execute **Run workflow** em `master` novamente. O CI compila com a URL do CDN, envia JS/CSS/fontes/imagens para `games/assets/` e só depois ativa a imagem na VPS. Nesse caminho, as chaves S3 ficam no GitHub; Node/AWS CLI de upload são executados pelo runner, sem instalação adicional no host da VPS. O modo de upload manual continua explicado em [CONFIGURACOES.md](CONFIGURACOES.md).

## 8. Conferir funcionamento e preservar dados

Recarregue `https://play.gfig.space`, confira Network do navegador para os assets em `assets.gfig.space/games/assets/`, e teste a mesma sala com duas pessoas. Teste desconexão/reentrada e chat. A API de diagnóstico deve marcar online como disponível; R2 configurado não significa que todos os objetos já foram verificados pelo diagnóstico.

Execute um backup na VPS pelo kit de deploy em uso:

```bash
bash scripts/deploy-backup.sh --env /opt/custom-hero/.env
```

Backups fora da VPS usam outro bucket **privado** e `BACKUP_R2_BUCKET`, conforme [CONFIGURACOES.md](CONFIGURACOES.md). O CI não agenda backups periódicos sozinho. Não use `docker compose down -v` para atualizar: isso apaga os volumes.

Steam, Android e pagamentos não são pré-requisitos deste online web. Seus wrappers/SDKs e validação de compras ainda são trabalho de implementação; preencher AppIDs não conclui essas integrações. Consulte [MONETIZACAO.md](MONETIZACAO.md).


## Contas de Ragnarok na VPS

A VPS também serve `/api/ragnarok/*`, com contas, cartas, presets e personagens no SQLite persistente `/data/game.sqlite`. O acesso é por uma chave de recuperação gerada pelo jogo: guarde essa chave para recuperar a conta em outro navegador. No domínio próprio não existe login automático do ChatGPT. Cabeçalhos de identidade enviados pelo visitante são descartados.

Para conferir que a rota existe sem expor uma chave, execute `curl -i https://play.gfig.space/api/ragnarok/account`. O resultado esperado sem autenticação é **401** e JSON de autenticação; HTML do jogo nessa URL significa versão antiga do servidor. Crie uma conta no jogo, salve um personagem e teste a recuperação em outro perfil. O modo Ragnarok Survivors continua solo; as salas multiplayer são dos modos que oferecem o botão online. Hospedar não adiciona co-op a um modo solo.

O D1 do site ChatGPT e o SQLite da VPS são bancos separados: esta instalação não transfere automaticamente as cartas/personagens que já existem no Sites. Para copiar dados existentes, é necessário um fluxo explícito de migração; não copie credenciais administrativas para o cliente.
