# Configurações externas e recursos dependentes

Dados públicos informados: **VPS `216.158.236.156`**, domínio **`gfig.space`**, repositório **`https://github.com/guifigdev/best-slop`**, bucket R2 **`clients`**, prefixo **`games/`**. O acesso inicial é `root`; ainda é preciso confirmar o sistema operacional da VPS. Este kit assume Debian/Ubuntu; nenhuma credencial privada é incluída.

## O que depende de você

| Recurso | Situação do código | Configuração externa necessária |
| --- | --- | --- |
| Treino local e IA | Funciona sem serviços | Nenhuma |
| Salas online na VPS | Servidor autoritativo e persistência preparados | VPS + Docker + domínio/HTTPS + origens |
| Líder/host da sala | Regras de sala no servidor | Não precisa P2P nem abrir porta no PC do jogador |
| Chat Phase Killer | API autenticada por credencial da sala | SQLite persistente na VPS; no Sites usa D1 separado |
| Atualizar por `master` | Workflow preparado, desativado até habilitar | Repositório GitHub, GHCR, SSH e secrets |
| Assets no seu R2 | Publicador de JS/CSS/imagens compiladas preparado | Chave S3, domínio `assets.gfig.space`, CORS e variável de build |
| Backup R2 | Publicador opcional preparado | Chave S3 e AWS CLI no host/CI |
| Workers na sua conta | Build Worker já existe | Conta/CLI/binding D1; não substitui automaticamente a VPS WebSocket |
| Steam: instalador, login, lobby/relay e vendas | Integração de loja/SDK ainda não implementada | Steamworks, AppID, SDK e backend de compras |
| Android/Play: AAB, compras e anúncios | Integração nativa ainda não implementada | Android Studio, assinatura, Play Console, Billing/SDK de anúncios |
| Conta e inventário comercial entre plataformas | Ainda precisa serviço próprio | Identidade, banco/entitlements, verificação de recibos e recuperação de conta |

Preencher um AppID ou uma chave não implementa compras, autenticação Steam nem publicação nas lojas. Os avisos da Central de configuração devem refletir essa distinção.

## VPS, DNS e HTTPS

1. Cloudflare DNS: `A play → 216.158.236.156`. Não use esse IP como destino de `assets`; o R2 configura o domínio dele separadamente.
2. Libere TCP 80/443 e preserve sua porta SSH.
3. Confirme Debian/Ubuntu, instale Docker e copie `.env.example` para `.env`.
4. Configure `ACME_EMAIL` real; domínio/origens já vêm exemplificados com `play.gfig.space`.
5. Execute `bash scripts/deploy.sh`, depois teste `/healthz`, `/api/config` e duas sessões de jogo.

O tutorial completo, CI, rollback e restauração estão em [HOSPEDAGEM.md](HOSPEDAGEM.md).

## Assets no bucket R2 `clients/games/`

### 1. Entender os dois endereços

O endereço S3 é **privado e administrativo**:

```text
Endpoint: https://a9cf0f539d37afe46de8c5d1aec58cdf.r2.cloudflarestorage.com
Bucket: clients
Prefixo: games
```

Não acrescente `/clients` ao `R2_ENDPOINT`. O nome do bucket já vai na operação S3. Esse endpoint não é a URL pública que o navegador deve carregar. A região S3 do R2 é `auto`. [Compatibilidade S3 oficial](https://developers.cloudflare.com/r2/api/s3/api/).

### 2. Criar chave limitada ao bucket

1. Cloudflare → R2 → **Manage R2 API tokens**.
2. Crie credenciais S3 com leitura/escrita de objetos, limitadas ao bucket `clients`.
3. Guarde Access Key ID e Secret Access Key no `.env` da VPS ou secrets do CI. Nunca no Git, no código do navegador ou em `VITE_`.
4. Se o bucket também guarda dados de clientes, mantenha arquivos privados fora da área pública usada pelo jogo. Um domínio público do bucket expõe objetos alcançáveis por suas URLs; um prefixo não é uma barreira de autenticação. Um bucket dedicado a assets públicos é uma separação mais clara, se necessário.

O código de publicação só envia arquivos compilados para `games/assets/`; não altera objetos de outros prefixos e não usa `--delete`.

### 3. Publicar apenas a pasta do jogo por um Worker

Como `clients` pode guardar outros objetos, o caminho recomendado é manter esse bucket privado e colocar um **Worker de assets** à frente. O código pronto em `deploy/assets-worker.js` só aceita `games/assets/*`; objetos de clientes e backups não são servidos por ele.

1. Instale Wrangler no ambiente de deploy e autentique sua conta com `wrangler login`.
2. Copie `deploy/wrangler.assets.toml.example` para `deploy/wrangler.assets.toml`. O account ID e bucket já refletem os dados públicos informados; confirme que pertencem à conta autenticada.
3. Execute `wrangler deploy --config deploy/wrangler.assets.toml`.
4. Confirme o custom domain `assets.gfig.space` no painel Workers. A configuração da rota solicita esse domínio; não crie um registro `A` apontando `assets` para a VPS.
5. Mantenha o acesso público direto do bucket R2 desligado. Um domínio público conectado diretamente a `clients` permitiria contornar a restrição de prefixo do Worker.

Use `https://assets.gfig.space/games` como URL pública base. A ativação externa ainda precisa ser executada por você. O Worker cobra conforme seu plano/uso; a opção de VPS sem CDN continua funcionando sem ele. Veja [custom domains de Workers](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

Alternativa: crie um bucket separado contendo somente assets públicos e conecte seu custom domain diretamente nele. Nesse caso o publicador precisa apontar para o novo bucket, e você configura CORS nele.

### 4. Configurar CORS

No caminho recomendado, CORS já é aplicado pelo Worker a partir de `PUBLIC_ASSET_ORIGINS` no arquivo Wrangler. Não é necessário abrir CORS do S3 para o upload servidor a servidor. Os valores iniciais são `https://play.gfig.space` e `https://gfig.space`.

Se testar o CDN no Vite local, acrescente temporariamente a origem exata exibida pelo Vite, por exemplo `http://localhost:5173`, e publique novamente o Worker. Aplicativos Android/desktop podem usar outra origem; só acrescente a origem realmente usada depois de implementar o wrapper. Não amplie o backend para `*` para corrigir CORS de assets.

Para a alternativa de um bucket público dedicado, cole [deploy/r2-cors.json](../deploy/r2-cors.json) em Settings → CORS policy. Confirme numa requisição com `Origin: https://play.gfig.space` que o objeto JS retorna `Access-Control-Allow-Origin` correspondente. Veja a [configuração oficial de CORS](https://developers.cloudflare.com/r2/buckets/cors/).

### 5. Habilitar o build CDN

Somente depois dos passos anteriores:

```dotenv
R2_ENDPOINT=https://a9cf0f539d37afe46de8c5d1aec58cdf.r2.cloudflarestorage.com
R2_BUCKET=clients
R2_ASSET_PREFIX=games
R2_PUBLIC_URL=https://assets.gfig.space/games
AWS_ACCESS_KEY_ID=CONFIGURE_FORA_DO_GIT
AWS_SECRET_ACCESS_KEY=CONFIGURE_FORA_DO_GIT
AWS_DEFAULT_REGION=auto
VITE_ASSET_BASE_URL=https://assets.gfig.space/games/
```

O `/` final de `VITE_ASSET_BASE_URL` é necessário. O build passa a referenciar `games/assets/`. Personagens e ilustrações voxel/SVG são gerados por código e estão no bundle JS; esse bundle, o CSS e as imagens emitidas pelo Vite são os assets necessários. A API/socket e o HTML principal continuam na VPS. Arquivos de mapas originais de referência não são publicados.

Publicação manual, com **Node24 e AWS CLI instalados no host**:

```bash
npm ci
VITE_ASSET_BASE_URL=https://assets.gfig.space/games/ npm run build
node scripts/deploy-r2-assets.mjs --env .env --directory dist/client
bash scripts/deploy.sh
```

O deploy local também publica os arquivos da imagem antes de ativá-la quando o CDN está habilitado. Não remova assets antigos imediatamente: jogadores com uma versão anterior ainda podem precisar deles. Os nomes com hash permitem cache longo sem sobrescrever o conteúdo antigo.

No CI, adicione as **repository variables** `VITE_ASSET_BASE_URL`, `R2_ENDPOINT`, `R2_BUCKET`, `R2_ASSET_PREFIX` e os **secrets** `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`. O workflow extrai o build da própria imagem, envia para R2 e só então atualiza a VPS. Se o upload falhar, a versão antiga continua servindo; a imagem nova não é ativada.

R2 tem cobrança por armazenamento e operações; o tráfego de saída direto do R2 não é cobrado. Isso não torna VPS, operações ou outros serviços gratuitos. Confira a [tabela atual](https://developers.cloudflare.com/r2/pricing/) antes de dimensionar retenção e distribuição.

### Backup externo

Crie um bucket **privado separado**, por exemplo `best-slop-backups`, sem domínio público. Configure `BACKUP_R2_BUCKET=best-slop-backups` e dê à chave usada pelo publicador acesso aos dois buckets específicos. O script recusa usar o mesmo bucket dos assets: snapshots podem conter estados e credenciais de retomada.

```bash
bash scripts/deploy-backup.sh --r2
```

Esse comando envia snapshots para `custom-hero/backups/DATA/` no bucket de backup. Um prefixo diferente no mesmo bucket público não o torna privado. Para AWS CLI use a [instalação oficial](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html). Credenciais entram por ambiente do processo; não são passadas em argumentos de shell.

## Workers e D1 na sua conta Cloudflare

Você não precisa ativar Workers para subir a VPS. São duas escolhas:

- **Agora:** VPS serve frontend e todas as salas. R2 opcional distribui assets. Menos serviços e uma simulação autoritativa por sala.
- **Separado/opcional:** o Worker deste repositório serve a versão web e a API de Phase Killer com D1. Os outros modos usam o servidor WebSocket na VPS. Não há migração automática para Durable Objects.

Para portar o Worker do Sites para sua conta:

1. Instale Wrangler no ambiente de deploy e faça `wrangler login` na sua conta.
2. Crie um D1, por exemplo `wrangler d1 create custom-hero-phase`.
3. Crie um arquivo Wrangler **seu**, com `main = "dist/server/index.js"`, data de compatibilidade e binding D1 `DB` apontando para o ID retornado. Não use o `project_id` do Sites como ID Cloudflare.
4. Configure o diretório de migrations para `drizzle` e aplique o SQL de schema antes de subir o Worker. O histórico Drizzle do Sites e o controle de migrations Wrangler não devem ser misturados cegamente: na primeira instalação vazia, `wrangler d1 execute NOME --remote --file drizzle/0000_phase_rooms.sql` executa o schema inicial; depois registre o procedimento e mantenha migrações aplicadas imutáveis.
5. Execute `npm run build` e `wrangler deploy`. Configure rota/domínio customizado e controles de acesso na sua conta.
6. Se frontend e salas gerais estão separados, configure o endpoint WSS da VPS no build/central de configuração. Ajuste a origem permitida no servidor.

Essa etapa provisiona recursos na sua conta e só estará pronta quando você a executar e validar. Não há segredo Cloudflare embutido neste projeto. Consulte [Wrangler](https://developers.cloudflare.com/workers/wrangler/) e [D1](https://developers.cloudflare.com/d1/get-started/).

## Steam e Android

O que precisa de configuração comercial e qual stack usar está em [MONETIZACAO.md](MONETIZACAO.md). Os IDs de Steam/Play não devem aparecer como “integração pronta” enquanto não houver wrapper, SDK e validação de compras implementados. O servidor de salas funciona independentemente das lojas; autorizar acesso a um jogo pago exige validar a licença/entitlement no backend.

## Matriz de ambiente

| Variável | Lida por | Segredo? | Efeito |
| --- | --- | --- | --- |
| `DOMAIN`, `ACME_EMAIL` | Caddy/Compose | Não | Hostname e certificado |
| `TRUST_PROXY` | Runtime | Não | Fixo em `1` no Compose com Caddy e porta privada. Desligue em Node exposto diretamente; só confie em cabeçalhos de um proxy conhecido. |
| `PUBLIC_ORIGIN`, `ALLOWED_ORIGINS` | Node | Não | Origem pública e lista exata permitida |
| `HOST`, `PORT`, `DATA_DIR` | Node | Não | Rede interna e dados persistentes |
| `ROOM_LIMIT`, `MAX_CLIENTS` | Node | Não | Limites de admissão |
| `ROOM_IDLE_SECONDS`, `ROOM_RESUME_SECONDS` | Node | Não | Expiração e retomada |
| `SIMULATION_HZ`, `ROOM_SNAPSHOT_HZ` | Node | Não | Simulação e envio de estado |
| `DRAIN_TIMEOUT_SECONDS` | Node | Não | Prazo antes de checkpoint/saída; máximo 120 no kit |
| `VITE_SERVER_URL` | Build frontend | Não | Endpoint externo WSS quando necessário; vazio usa mesma origem |
| `VITE_PHASE_API_URL` | Build frontend | Não | Origem HTTPS externa da API Phase, sem `/api/phase`; vazio usa mesma origem/endereço selecionado |
| `VITE_ASSET_BASE_URL` | Build frontend | Não | Base pública R2; exige novo build |
| `R2_PUBLIC_URL` | Diagnóstico do servidor | Não | Informa base pública; não autentica nem testa permissões sozinho |
| `R2_ENDPOINT`, `R2_BUCKET`, `R2_ASSET_PREFIX` | Publicador | Não | Destino S3 e pasta de assets |
| `BACKUP_R2_BUCKET` | Publicador de backup | Não | Bucket privado separado para snapshots |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | AWS CLI/publicador | **Sim** | Autoriza upload/backup, nunca enviado ao cliente |
| `GAME_IMAGE` | Compose/deploy | Não | Versão imutável; CI injeta tag SHA |
| `VPS_*`, chave SSH, known_hosts | GitHub Actions | Conforme campo | Acesso de deploy; não vira variável do frontend |

Mudanças em variáveis runtime exigem recriar o serviço; mudanças em `VITE_` exigem **rebuild**. Um `.env` alterado não reescreve JavaScript que já está no CDN.

As fontes DM Sans e Outfit são distribuídas localmente, com licenças SIL OFL em `assets/font-licenses/`; o jogo não precisa buscar fontes no Google durante a partida. Os modelos voxel e ícones são construídos pelo JavaScript compilado e seguem para o R2 junto com o bundle.
