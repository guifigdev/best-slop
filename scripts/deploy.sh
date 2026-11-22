#!/usr/bin/env bash
set -euo pipefail
task_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
env_file="$task_root/.env"
image=""
while (($#)); do
  case "$1" in
    --env) env_file="$(realpath -- "$2")"; shift 2 ;;
    --image) image="$2"; shift 2 ;;
    *) echo "Uso: bash scripts/deploy.sh [--env /caminho/.env] [--image ghcr.io/conta/jogo:SHA]" >&2; exit 2 ;;
  esac
done
[[ -f "$env_file" ]] || { echo "Falta $env_file. Copie .env.example e siga docs/HOSPEDAGEM.md." >&2; exit 1; }
command -v docker >/dev/null || { echo "Instale Docker Engine e o plugin Compose: docs/HOSPEDAGEM.md." >&2; exit 1; }
docker compose version >/dev/null
task_state="${XDG_STATE_HOME:-$HOME/.local/state}/custom-hero"
mkdir -p -- "$task_state"
exec 9>"$task_state/deploy.lock"
flock -n 9 || { echo "Outra atualização já está em execução." >&2; exit 1; }
compose=(docker compose --project-name custom-hero --env-file "$env_file" -f "$task_root/deploy/compose.yaml")
old_id="$("${compose[@]}" ps -q game 2>/dev/null || true)"
old_image=""
if [[ -n "$old_id" ]]; then old_image="$(docker inspect --format '{{.Image}}' "$old_id")"; fi
if [[ -n "$image" ]]; then
  [[ "$image" =~ ^[a-zA-Z0-9./:@_-]+$ ]] || { echo "Referência de imagem inválida." >&2; exit 1; }
  export GAME_IMAGE="$image"
  "${compose[@]}" pull game
else
  export GAME_IMAGE=custom-hero:local
  "${compose[@]}" build --pull game
fi
doctor_args=(--env /configuration.env --built-index dist/client/index.html)
[[ -z "$image" ]] || doctor_args+=(--assets-published)
# Match the mounted file owner so chmod 600 remains private on the host.
# The checker is offline, read-only and has no Linux capabilities.
doctor=(docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges:true --user "$(stat -c '%u:%g' "$env_file")" --mount "type=bind,src=$env_file,dst=/configuration.env,readonly" --entrypoint node "$GAME_IMAGE" scripts/doctor-deploy.mjs "${doctor_args[@]}")
"${doctor[@]}"
"${compose[@]}" config --quiet
asset_base="$("${doctor[@]}" --public-asset-base)"
proxy_mode="$("${doctor[@]}" --proxy-mode)"
up_services=()
if [[ "$proxy_mode" == host ]]; then up_services=(game); fi
if [[ -n "$asset_base" && -z "$image" ]]; then
  command -v node >/dev/null && command -v aws >/dev/null || { echo "CDN R2 habilitada: instale Node24 e AWS CLI no host ou publique pelo CI; docs/CONFIGURACOES.md." >&2; exit 1; }
  asset_temp="$(mktemp -d /tmp/custom-hero-assets.XXXXXX)"
  asset_container="$(docker create "$GAME_IMAGE")"
  docker cp "$asset_container:/app/dist/client" "$asset_temp/"
  docker rm "$asset_container" >/dev/null
  node "$task_root/scripts/deploy-r2-assets.mjs" --env "$env_file" --directory "$asset_temp/client"
  [[ "$asset_temp" == /tmp/custom-hero-assets.* ]] && rm -rf -- "$asset_temp"
fi
if [[ "$proxy_mode" != host ]]; then "${compose[@]}" pull caddy; fi
if [[ -n "$old_id" ]] && [[ "$(docker inspect --format '{{.State.Running}}' "$old_id")" == true ]]; then
  bash "$task_root/scripts/deploy-backup.sh" --env "$env_file"
fi
up_ok=true
"${compose[@]}" up -d --no-build --pull never "${up_services[@]}" || up_ok=false
healthy=false
for ((attempt=0; attempt<40; attempt++)); do
  [[ "$up_ok" == true ]] || break
  current_id="$("${compose[@]}" ps -q game)"
  status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$current_id" 2>/dev/null || true)"
  if [[ "$status" == healthy ]]; then healthy=true; break; fi
  if [[ "$status" == unhealthy ]]; then break; fi
  sleep 2
done
if [[ "$healthy" != true ]]; then
  echo "Nova versão não passou no healthcheck; veja docker compose logs game." >&2
  if [[ -n "$old_image" ]]; then
    export GAME_IMAGE="$old_image"
    "${compose[@]}" up -d --no-build --pull never game
    echo "Imagem anterior reiniciada. O banco foi preservado; restauração de dados é separada." >&2
  fi
  exit 1
fi
if [[ -n "$old_image" ]]; then printf '%s\n' "$old_image" > "$task_state/previous-image"; fi
printf '%s\n' "$GAME_IMAGE" > "$task_state/current-image"
printf '%s\n' "$task_root" > "$task_state/current-kit"
printf '%s\n' "$env_file" > "$task_state/current-env"
if [[ "$proxy_mode" == host ]]; then
  echo "Jogo saudável. Configure o proxy HTTPS existente para 127.0.0.1:GAME_BIND_PORT (2567 por padrão); docs/COMECE_AQUI_VPS.md."
else
  echo "Versão saudável. Abra seu domínio e /api/config para verificar as integrações."
fi
