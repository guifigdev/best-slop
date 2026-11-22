# Continue daqui — Cloudflare e atualizações automáticas

Estado conferido em 21/11/2026. Este roteiro começa no ponto em que sua instalação está agora.

## O que já está funcionando

- Jogo: **https://play.gfig.space**. É o endereço para você e seus jogadores.
- Salas e saves: VPS `216.158.236.156`, com dados persistentes.
- Caddy: HTTPS ativo e encaminhamento para `127.0.0.1:2567`.
- Worker Cloudflare: **https://best-slop-assets.custom-hero-voxel.workers.dev**.
- Bucket R2: `clients`, com 10 arquivos compilados em `games/assets/` (~5,26 MB).
- JavaScript, CSS, fontes e imagem foram conferidos por hash, MIME e CORS.
- VPS já está configurada para usar os arquivos da Cloudflare. O bucket continua privado; só a pasta pública do jogo é servida pelo Worker.
- Seu login Docker em `ghcr.io`, como usuário Linux `game-deploy`, já foi concluído.

Wrangler é a ferramenta oficial usada no PC para publicar o Worker e enviar os arquivos ao R2. Não é outra VPS nem uma nova conta. A raiz da URL do Worker pode mostrar 404: esse serviço responde pelos arquivos em `/games/assets/`.

**Agora falta a atualização automática.** A última execução pública do GitHub teve `validate` aprovado e `deploy` pulado. Vamos cadastrar os valores que autorizam o deploy.

## 1. Criar as credenciais R2 — navegador, Cloudflare

1. Abra https://dash.cloudflare.com e selecione a conta que tem o bucket `clients`.
2. Abra **Storage & databases → R2 → Overview**.
3. Clique **Manage in API Tokens** (em algumas telas, Manage R2 API Tokens).
4. Clique **Create User API token** ou **Create Account API token**.
5. Nome: `best-slop-ci-assets`.
6. Permissão: **Object Read & Write**.
7. Escolha **Apply to specific buckets only** e marque **clients**.
8. Clique **Create API Token**.
9. Guarde **Access Key ID** e **Secret Access Key**. São esses dois campos que o próximo passo usa. O token genérico de API, se mostrado, não substitui o Secret Access Key.

Não envie as credenciais ao chat. A chave secreta só é exibida na criação. [Documentação R2](https://developers.cloudflare.com/r2/get-started/s3/).

## 2. Criar os secrets — navegador, GitHub

Abra https://github.com/guifigdev/best-slop/settings/secrets/actions

Caminho pelo menu: **Settings → Secrets and variables → Actions → Secrets**.

Para cada linha abaixo, clique **New repository secret**, preencha **Name** e **Secret**, e finalize em **Add secret**. Se já existir, atualize o existente.

| Name | Secret |
| --- | --- |
| `VPS_HOST` | `216.158.236.156` |
| `VPS_USER` | `game-deploy` |
| `VPS_PORT` | `22` |
| `VPS_SSH_PRIVATE_KEY` | Conteúdo completo do arquivo `best-slop-ci`, conforme comando abaixo |
| `VPS_SSH_KNOWN_HOSTS` | Conteúdo do arquivo `best-slop-known-hosts`, conforme comando abaixo |
| `AWS_ACCESS_KEY_ID` | **Access Key ID** que a Cloudflare mostrou no passo 1 |
| `AWS_SECRET_ACCESS_KEY` | **Secret Access Key** que a Cloudflare mostrou no passo 1 |

Os nomes `AWS_` são usados porque a API do R2 é compatível com S3. Não precisa criar conta AWS.

### Copiar a chave SSH — PowerShell do PC

Abra uma janela nova do PowerShell no Windows. O começo da linha deve ser `PS C:\...`, não `root@...` ou `game-deploy@...`.

```powershell
Get-Content -Raw "$env:USERPROFILE/.ssh/best-slop-ci" | Set-Clipboard
```

No GitHub, cole no campo **Secret** de `VPS_SSH_PRIVATE_KEY`. O texto completo inclui BEGIN/END. Não use o arquivo `.pub` nesse campo.

Depois, no mesmo PowerShell:

```powershell
Get-Content -Raw "$env:USERPROFILE/.ssh/best-slop-known-hosts" | Set-Clipboard
```

Cole no secret `VPS_SSH_KNOWN_HOSTS`. Esse arquivo já foi criado e testado com SSH usando verificação estrita do servidor.

O token GitHub que você usou no `docker login` fica na VPS. Não precisa cadastrá-lo como mais um secret deste workflow. O Actions já fornece seu próprio `GITHUB_TOKEN` para publicar a imagem.

## 3. Criar as variáveis — navegador, GitHub

Abra https://github.com/guifigdev/best-slop/settings/variables/actions

Na aba **Variables**, para cada linha clique **New repository variable**, preencha **Name/Value** e salve.

| Name | Value exato |
| --- | --- |
| `VPS_PATH` | `/opt/custom-hero` |
| `R2_ENDPOINT` | `https://a9cf0f539d37afe46de8c5d1aec58cdf.r2.cloudflarestorage.com` |
| `R2_BUCKET` | `clients` |
| `R2_ASSET_PREFIX` | `games` |
| `VITE_ASSET_BASE_URL` | `https://best-slop-assets.custom-hero-voxel.workers.dev/games/` |

`VITE_SERVER_URL` e `VITE_PHASE_API_URL` podem permanecer sem cadastro: o navegador usa a mesma origem da VPS.

## 4. Criar o ambiente e habilitar o deploy — navegador, GitHub

1. Abra **Settings → Environments** no repositório.
2. Se `production` já existir, use-o. Se não, clique **New environment**, escreva `production` e clique **Configure environment**. Para começar, pode deixar as demais opções no padrão.
3. Volte à aba **Variables** do passo 3.
4. Só depois de terminar os secrets e variáveis, crie:

| Name | Value |
| --- | --- |
| `PRODUCTION_ENABLED` | `true` |

[Como cadastrar secrets no GitHub](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

## 5. Rodar e conferir a atualização automática

Abra https://github.com/guifigdev/best-slop/actions/workflows/vps-production.yml

1. Clique **Run workflow**.
2. Selecione a branch **master**.
3. Clique no botão **Run workflow** para iniciar.
4. Abra a execução recém-criada. Espere **validate** e **deploy** ficarem verdes.

O fluxo compila, publica a imagem no GHCR, envia os assets ao R2 e só depois troca a versão da VPS. O banco continua no volume persistente.

Se `deploy` ficar **skipped**, confira `PRODUCTION_ENABLED=true` e branch `master`. Se ficar vermelho, abra o job e leia a etapa que falhou. Envie o nome da etapa e as últimas linhas do erro, sem credenciais.

Depois abra https://play.gfig.space e recarregue. O endpoint https://play.gfig.space/healthz deve continuar respondendo `ready: true`.

## Valores da VPS — já aplicados

Estas linhas já estão em `/opt/custom-hero/.env` e já passaram na validação. São os endereços reais, sem textos de exemplo:

```dotenv
VITE_ASSET_BASE_URL=https://best-slop-assets.custom-hero-voxel.workers.dev/games/
R2_PUBLIC_URL=https://best-slop-assets.custom-hero-voxel.workers.dev/games
REVERSE_PROXY_MODE=host
GAME_BIND_PORT=2567
```

O endereço `play.gfig.space` é o site. O endereço `workers.dev` serve os arquivos. Não é necessário mudar os registros DNS da Vercel para essa configuração.

Agora use o GitHub Actions nas próximas publicações com CDN; ele envia os novos arquivos antes de trocar o jogo. O envio de código local continua sendo `git push github HEAD:master` depois de o código estar commitado.

## Custos e função do Worker

O Worker confere a rota pública do arquivo, lê o objeto correspondente no R2 e entrega ao navegador com os cabeçalhos de tipo, cache e CORS. Ele não executa a simulação das salas nem substitui a VPS; também não aumenta o FPS por si só.

Workers Free inclui 100 mil requisições por dia. Workers Paid começa em US$5/mês, com franquias e excedentes. R2 Standard inclui 10 GB e 10 milhões de leituras por mês gratuitos. As franquias são compartilhadas com os outros projetos da conta; por isso não é uma garantia de custo zero. Nosso serviço R2 passa pelo código do Worker, então há contagem de requisições do Worker e de leituras R2. A transferência de saída do R2 é gratuita.

Não foi solicitado upgrade de plano nesta configuração. Consulte seu consumo em Workers & Pages e R2 no painel.

[Preços Workers](https://developers.cloudflare.com/workers/platform/pricing/), [preços R2](https://developers.cloudflare.com/r2/pricing/).
