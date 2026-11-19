#!/usr/bin/env bash
set -euo pipefail
task_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
env_file="$task_root/.env"
upload=false
while (($#)); do case "$1" in --env) env_file="$(realpath -- "$2")"; shift 2 ;; --r2) upload=true; shift ;; *) echo "Uso: deploy-backup.sh [--env /arquivo] [--r2]" >&2; exit 2 ;; esac; done
compose=(docker compose --project-name custom-hero --env-file "$env_file" -f "$task_root/deploy/compose.yaml")
snapshot="$("${compose[@]}" exec -T game node scripts/deploy-snapshot.mjs /data)"
[[ "$snapshot" =~ ^/data/backups/[a-zA-Z0-9_-]+$ ]] || { echo "Snapshot retornou um caminho inválido." >&2; exit 1; }
backup_root="${XDG_STATE_HOME:-$HOME/.local/state}/custom-hero/backups"
mkdir -p -- "$backup_root"
"${compose[@]}" cp "game:$snapshot" "$backup_root/"
result="$backup_root/$(basename -- "$snapshot")"
echo "Backup consistente criado em $result"
if [[ "$upload" == true ]]; then
  command -v node >/dev/null || { echo "Envio R2 opcional requer Node24 e AWS CLI no host; backup local está salvo." >&2; exit 1; }
  node "$task_root/scripts/deploy-r2-backup.mjs" --env "$env_file" --directory "$result"
fi
