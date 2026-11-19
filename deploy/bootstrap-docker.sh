#!/usr/bin/env bash
set -euo pipefail
[[ "${EUID:-$(id -u)}" == 0 ]] || { echo "Execute com sudo bash deploy/bootstrap-docker.sh." >&2; exit 1; }
if command -v docker >/dev/null; then
  docker compose version >/dev/null 2>&1 && { echo "Docker e Compose já estão disponíveis."; exit 0; }
  echo "Docker já existe, mas falta o plugin Compose. Siga a instalação oficial para seu sistema; não vou substituir sua instalação." >&2
  exit 1
fi
# This installer only targets a new Debian/Ubuntu machine; no existing Docker
# packages, containers, volumes or firewall rules are removed.
source /etc/os-release
case "$ID" in ubuntu|debian) docker_repo_os="$ID" ;; *) echo "Sistema não suportado pelo instalador: use docs.docker.com/engine/install/." >&2; exit 1 ;; esac
docker_repo_suite="${UBUNTU_CODENAME:-${VERSION_CODENAME:-}}"
[[ "$docker_repo_suite" =~ ^[a-z]+$ ]] || { echo "Não foi possível determinar a distribuição." >&2; exit 1; }
apt-get update
apt-get install -y ca-certificates curl
install -d -m 0755 /etc/apt/keyrings
docker_key_temp="$(mktemp)"
trap 'rm -f "$docker_key_temp"' EXIT
curl --fail --silent --show-error --proto '=https' "https://download.docker.com/linux/$docker_repo_os/gpg" -o "$docker_key_temp"
if [[ -e /etc/apt/keyrings/docker.asc ]] && ! cmp -s "$docker_key_temp" /etc/apt/keyrings/docker.asc; then
  echo "Há uma chave Docker diferente em /etc/apt/keyrings/docker.asc; confira a instalação oficial antes de alterar." >&2; exit 1
fi
install -m 0644 "$docker_key_temp" /etc/apt/keyrings/docker.asc
printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/%s %s stable\n' "$(dpkg --print-architecture)" "$docker_repo_os" "$docker_repo_suite" > /etc/apt/sources.list.d/custom-hero-docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
docker compose version
echo "Docker instalado. Volte a docs/HOSPEDAGEM.md para domínio, .env e primeiro deploy."
