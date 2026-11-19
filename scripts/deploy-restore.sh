#!/usr/bin/env bash
set -euo pipefail
task_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
[[ $# -ge 1 ]] || { echo "Uso: bash scripts/deploy-restore.sh /backup [--env /arquivo/.env]" >&2; exit 2; }
backup="$(realpath -- "$1")"; shift
env_file="$task_root/.env"
if (($#)); then [[ "$1" == --env && $# == 2 ]] || exit 2; env_file="$(realpath -- "$2")"; fi
[[ -d "$backup" && "$backup" != / ]] || { echo "Diretório de backup inválido." >&2; exit 1; }
compose=(docker compose --project-name custom-hero --env-file "$env_file" -f "$task_root/deploy/compose.yaml")
container="$("${compose[@]}" ps -q game)"
[[ -n "$container" ]] || { echo "Inicie a instalação para identificar o volume e a imagem antes de restaurar." >&2; exit 1; }
export GAME_IMAGE="$(docker inspect --format '{{.Image}}' "$container")"
"${compose[@]}" stop game
"${compose[@]}" run --rm --no-deps --no-build --pull never --volume "$backup:/restore:ro" --entrypoint node game scripts/deploy-restore-data.mjs /restore /data
"${compose[@]}" up -d --no-build --pull never game
echo "Backup restaurado; estado anterior preservado no volume. Verifique /healthz e abra uma sala de teste."
