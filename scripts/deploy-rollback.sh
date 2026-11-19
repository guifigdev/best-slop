#!/usr/bin/env bash
set -euo pipefail
task_state="${XDG_STATE_HOME:-$HOME/.local/state}/custom-hero"
[[ -f "$task_state/previous-image" && -f "$task_state/current-kit" && -f "$task_state/current-env" ]] || { echo "Não há atualização anterior registrada." >&2; exit 1; }
image="$(cat "$task_state/previous-image")"
kit="$(cat "$task_state/current-kit")"
env_file="$(cat "$task_state/current-env")"
[[ "$image" =~ ^sha256:[a-f0-9]{64}$ ]] || { echo "ID de imagem anterior inválido." >&2; exit 1; }
GAME_IMAGE="$image" docker compose --project-name custom-hero --env-file "$env_file" -f "$kit/deploy/compose.yaml" up -d --no-build --pull never game
echo "Imagem anterior solicitada. Verifique /healthz. Dados não foram revertidos automaticamente."
