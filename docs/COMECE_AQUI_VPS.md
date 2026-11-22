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

## Retomar sua instalação atual — VPS já tem Caddy e outros sites

Conferência de 21/11/2026: o registro `play` aponta para a VPS, o código foi clonado e o build terminou. Sua chave `best-slop-ci` entra como `game-deploy` e esse usuário usa Docker. **Não gere a chave outra vez.** A instalação parou ao ler o `.env`; a correção já está no código. O Caddy do sistema já ocupa 80/443, portanto use `REVERSE_PROXY_MODE=host` e mantenha esse serviço.

O DNS mostrado nas suas capturas está na Vercel. Não é necessário transferi-lo: o registro A existente está certo. R2 e token GitHub podem esperar até o jogo abrir pelo domínio.

**A. No PowerShell do PC**, entre como administrador da VPS:

```powershell
ssh root@216.158.236.156
```

Depois do login, confira que o início da linha é `root@...`. **Na VPS**, ajuste a propriedade somente da pasta do jogo e entre como o usuário que você já criou:

```bash
chown -R game-deploy:game-deploy /opt/custom-hero
su - game-deploy
```

Agora a linha começa com `game-deploy@...`. Execute:

```bash
cd /opt/custom-hero
git pull --ff-only origin master
nano .env
```

No nano, mantenha os dados já preenchidos e configure estas duas linhas; se não existirem, acrescente no final:

```dotenv
REVERSE_PROXY_MODE=host
GAME_BIND_PORT=2567
```

Salve com **Ctrl+O**, **Enter**, saia com **Ctrl+X**. Ainda como `game-deploy`:

```bash
bash scripts/deploy.sh
```

Só depois que ele terminar sem erro, teste:

```bash
curl --fail http://127.0.0.1:2567/healthz
```

Deve aparecer uma resposta JSON saudável. O jogo está ligado localmente; o próximo item dá a ele o endereço HTTPS.

**B. Volte ao administrador**, digitando uma vez:

```bash
exit
```

Confira `root@...`. Faça uma cópia do Caddyfile atual e abra-o:

```bash
cp -a /etc/caddy/Caddyfile /etc/caddy/Caddyfile.before-custom-hero
nano /etc/caddy/Caddyfile
```

Vá até o final do arquivo. **Mantenha todos os blocos dos outros sites**. Se ainda não existir um bloco `play.gfig.space`, acrescente:

```caddyfile
play.gfig.space {
    encode zstd gzip
    reverse_proxy 127.0.0.1:2567
}
```

Salve com Ctrl+O, Enter, Ctrl+X. Valide e recarregue; o segundo comando só executa se a validação passar:

```bash
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile && systemctl reload caddy
```

Espere alguns segundos para o certificado e teste:

```bash
curl --fail https://play.gfig.space/healthz
```

Abra **https://play.gfig.space**. Se o teste falhar, veja os registros do Caddy com `journalctl -u caddy -n 60 --no-pager`; não reinstale nem desligue os proxies dos outros sites. O modo `host` inicia somente o container `game`, publicado no loopback; o Caddy existente cuida do HTTPS.

**ACME_EMAIL** é o email de contato para configuração dos certificados HTTPS. Não é senha, token nem precisa ser um endereço `@gfig.space`. A configuração que você mostrou passou na validação. No modo `host`, as opções de certificado são as do Caddy já instalado. [Documentação do Caddy](https://caddyserver.com/docs/caddyfile/options).

**C. Atualizações automáticas são a próxima etapa.** Só depois que o jogo abrir, continue no passo 6. Sua chave SSH já existe; abaixo está explicado como criar o token, copiar os secrets e executar o workflow.

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

### 6.1. O que cada nome significa

| Nome | Onde é usado |
| --- | --- |
| `game-deploy` | Usuário Linux da VPS; é ele que baixa e inicia a imagem. |
| `guifigdev` | Sua conta do GitHub; dona do código e da imagem. |
| `best-slop-ci` | Chave SSH já criada no seu PC; permite ao workflow entrar na VPS. |
| Token `read:packages` | Credencial do GitHub que a VPS usa para baixar uma imagem privada. |
| `GITHUB_TOKEN` | Gerado automaticamente pelo Actions para publicar a imagem; não crie esse secret manualmente. |

### 6.2. Criar o token — somente no navegador, conta `guifigdev`

1. Entre no GitHub e confira que a conta é **guifigdev**.
2. Abra [Tokens clássicos da sua conta](https://github.com/settings/tokens). Pelo menu: foto no canto superior direito → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
3. Clique **Generate new token** → **Generate new token (classic)**. Confirme senha/2FA se o GitHub pedir.
4. Em **Note**, escreva `VPS best-slop leitura`.
5. Em **Expiration**, escolha **90 days** ou uma data menor. Quando expirar, será preciso repetir o login na VPS com um token novo.
6. Em **Select scopes**, marque **somente `read:packages`**. Não selecione `write:packages`, `delete:packages` ou `repo` para esta tarefa.
7. Desça e clique **Generate token**.
8. Copie o valor exibido e guarde-o no seu gerenciador de senhas. O GitHub mostra esse valor uma única vez. Não envie o token ao chat nem o coloque no `.env`.

Esse tipo **classic** é o usado pelo Container Registry para essa autenticação; o escopo `read:packages` permite baixar imagens privadas às quais sua conta tem acesso. [GHCR](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry), [criação do token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic).

### 6.3. Usar o token — no terminal da VPS, como `game-deploy`

No PowerShell do seu PC, abra uma conexão nova usando a chave existente:

```powershell
ssh -i "$env:USERPROFILE/.ssh/best-slop-ci" game-deploy@216.158.236.156
```

Já na VPS, confirme o usuário:

```bash
whoami
```

O resultado deve ser `game-deploy`. Agora execute:

```bash
docker login ghcr.io --username guifigdev
```

Quando aparecer **Password:**, cole o token que acabou de gerar e aperte Enter. Nada aparecer enquanto cola é normal. Deve retornar **Login Succeeded**. Aqui o login GitHub é `guifigdev`; a sessão Linux continua sendo `game-deploy`. Não use senha do SSH nesse campo. Não execute o login como `root`, porque o workflow vai usar as credenciais do usuário `game-deploy`.

Esse token fica no login Docker da VPS. Ele **não** é o valor de `VPS_SSH_PRIVATE_KEY`, e não precisa virar um secret adicional no GitHub neste workflow. O Actions publica com seu próprio `GITHUB_TOKEN`.

### 6.4. Copiar os valores para os secrets — no PC e no navegador

No **PowerShell do PC**, copie a chave privada para sua própria área de transferência:

```powershell
Get-Content -Raw "$env:USERPROFILE/.ssh/best-slop-ci" | Set-Clipboard
```

No repositório → **Settings → Secrets and variables → Actions → Secrets → New repository secret**, use o nome `VPS_SSH_PRIVATE_KEY`, cole no campo **Secret** e salve em **Add secret**. A chave vai completa, com as linhas BEGIN/END; não é o arquivo `.pub`. Não cole esse conteúdo em mensagens.

Para `VPS_SSH_KNOWN_HOSTS`, execute os dois comandos abaixo **separadamente no PowerShell**, só depois que o primeiro terminar. Na tentativa anterior o `ssh-keyscan` foi colado no final de outro comando; por isso o arquivo não apareceu:

```powershell
ssh-keyscan -t ed25519 216.158.236.156 2>$null | Set-Content -Encoding ascii "$env:USERPROFILE/.ssh/best-slop-known-hosts"
```

```powershell
ssh-keygen -lf "$env:USERPROFILE/.ssh/best-slop-known-hosts"
```

Compare a fingerprint com `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` no console confiável do provedor. Após confirmar a igualdade:

```powershell
Get-Content -Raw "$env:USERPROFILE/.ssh/best-slop-known-hosts" | Set-Clipboard
```

Crie o secret `VPS_SSH_KNOWN_HOSTS` e cole o conteúdo. Os outros secrets da tabela são texto simples; crie um por vez. Para as variáveis, mude para a aba **Variables**, clique **New repository variable**, informe nome/valor e salve. Só defina `PRODUCTION_ENABLED=true` depois do login Docker e de todos os secrets estarem prontos.

### 6.5. Rodar a atualização e conferir

Em GitHub → Actions → **Validate and deploy VPS**, execute **Run workflow** selecionando `master`. Confira os jobs `validate` e `deploy`. Cada push futuro para `master` executará o fluxo. O deploy gera imagem por commit, faz backup quando aplicável e verifica a saúde; pode haver interrupção breve e retomada de salas compatíveis.

Na pasta local do PC, o envio de futuras versões já commitadas é `git push github HEAD:master`. Publicar no Sites não envia automaticamente esse push ao GitHub.

## 7. Cloudflare R2/CDN — opcional, depois de o site e o CI funcionarem

O jogo em `https://play.gfig.space` já pode servir todos os arquivos pela VPS. Esta etapa passa JS, CSS, fontes e imagens compilados para o R2, através de um Worker. O servidor das salas, WebSocket e banco continuam na VPS.

Seu DNS está na Vercel. Para começar, use a URL **workers.dev** fornecida pela Cloudflare; ela não exige mover o domínio. O exemplo do projeto já vem com `workers_dev = true`. O domínio `assets.gfig.space` fica para uma configuração futura, se a zona estiver ativa na Cloudflare. [workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/).

### 7.1. Confirmar o bucket no navegador

1. Entre no painel da sua conta Cloudflare.
2. Abra **Storage & databases → R2 → Overview**.
3. Confira se o bucket **clients** existe. Se já existe, use-o; se não, crie-o com esse nome.
4. Mantenha o bucket privado. O Worker do projeto só libera `games/assets/*`; documentos de clientes e backups ficam fora dessa rota.

### 7.2. Publicar o Worker no PowerShell do PC

Na pasta local do jogo:

```powershell
Set-Location 'C:\Users\Guilherme\Downloads\games-gpt\custom hero'
Copy-Item deploy/wrangler.assets.toml.example deploy/wrangler.assets.toml
npx wrangler login
```

Se pedir para instalar Wrangler, confirme a instalação do pacote `wrangler`. O navegador abre a autorização da Cloudflare; entre na conta que tem o bucket `clients` e conclua o fluxo.

Depois execute:

```powershell
npx wrangler deploy --config deploy/wrangler.assets.toml
```

Se pedir para escolher um subdomínio workers.dev, defina um disponível. Confira no arquivo a conta `a9cf0f539d37afe46de8c5d1aec58cdf`, binding `CLIENTS_BUCKET` e bucket `clients`.

O Worker desta conta já foi publicado em **https://best-slop-assets.custom-hero-voxel.workers.dev**. Esse é o endereço real usado nos próximos passos. A raiz pode responder 404: o Worker serve somente `/games/assets/`, e os arquivos serão enviados pelo CI.

### 7.3. Criar as credenciais R2 no navegador

No painel, abra **Storage & databases → R2 → Overview → Manage in API Tokens**. Clique **Create Account API token** ou **Create User API token**. Dê o nome `best-slop-assets`, escolha **Object Read & Write** e **Apply to specific buckets only → clients**. Clique em **Create API Token**.

Guarde **Access Key ID**, **Secret Access Key** e **S3 endpoint**. A chave secreta só é mostrada nessa criação. Não envie esses valores ao chat. [Instruções oficiais R2](https://developers.cloudflare.com/r2/get-started/s3/).

### 7.4. Acrescentar secrets e variáveis no GitHub

No repositório → Settings → Secrets and variables → Actions, adicione:

| Aba | Nome | Valor |
| --- | --- | --- |
| Secrets | `AWS_ACCESS_KEY_ID` | Access Key ID que o R2 acabou de mostrar |
| Secrets | `AWS_SECRET_ACCESS_KEY` | Secret Access Key que o R2 acabou de mostrar |
| Variables | `R2_ENDPOINT` | S3 endpoint retornado, neste projeto normalmente `https://a9cf0f539d37afe46de8c5d1aec58cdf.r2.cloudflarestorage.com` |
| Variables | `R2_BUCKET` | `clients` |
| Variables | `R2_ASSET_PREFIX` | `games` |
| Variables | `VITE_ASSET_BASE_URL` | URL real do Worker seguida de `/games/` |

O endpoint não leva `/clients`; bucket e pasta são separados. Valor do último campo nesta conta: `https://best-slop-assets.custom-hero-voxel.workers.dev/games/`. Use o endereço real indicado acima.

### 7.5. Ajustar o `.env` da VPS como game-deploy

No PowerShell do PC:

```powershell
ssh -i "$env:USERPROFILE/.ssh/best-slop-ci" game-deploy@216.158.236.156
```

Na VPS:

```bash
cd /opt/custom-hero
nano .env
```

Nesta instalação os dois valores reais são:

```dotenv
VITE_ASSET_BASE_URL=https://best-slop-assets.custom-hero-voxel.workers.dev/games/
R2_PUBLIC_URL=https://best-slop-assets.custom-hero-voxel.workers.dev/games
```

O primeiro termina com `/`; o segundo não. Salve com Ctrl+O, Enter, Ctrl+X. Mantenha `REVERSE_PROXY_MODE=host` e `GAME_BIND_PORT=2567`.

As credenciais de upload R2 ficam nos secrets do GitHub neste fluxo. Elas não precisam ser copiadas para a VPS. Depois de habilitar o CDN, use o CI para publicar, pois ele envia os assets antes de ativar a imagem.

### 7.6. Publicar pelo CI e testar

Abra Actions → **Validate and deploy VPS → Run workflow → master → Run workflow**. O CI compila com a URL do Worker, envia os assets para `clients/games/assets/` e só depois ativa o jogo.

Espere `validate` e `deploy` ficarem verdes. Recarregue o jogo em `play.gfig.space`; no Network do navegador, JS/CSS devem carregar pela URL do Worker com HTTP200. O CORS do Worker já aceita `https://play.gfig.space` e `https://gfig.space`. Raiz 404 não indica falha; o teste é um arquivo real de `/games/assets/`.

## 8. Conferir funcionamento e preservar dados

Recarregue `https://play.gfig.space`, se habilitou o CDN, confira no Network os assets em sua URL do Worker seguida de `/games/assets/`, e teste a mesma sala com duas pessoas. Teste desconexão/reentrada e chat. A API de diagnóstico deve marcar online como disponível; R2 configurado não significa que todos os objetos já foram verificados pelo diagnóstico.

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
