#!/usr/bin/env bash
set -euo pipefail

# =========================
# Config
# =========================
AWS_ACCOUNT_ID="086015456585"
AWS_REGION="ap-northeast-2"

BE_IMAGE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/ai/be:latest"
FE_IMAGE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/ai/fe:latest"

BE_CONTAINER="ai-be"
FE_CONTAINER="ai-fe"

BE_PORT="8000"   # 호스트:컨테이너
FE_PORT="80"     # 호스트:컨테이너

NETWORK_NAME="ai-net"

# 필요 시 환경변수 수정
SPRING_PROFILES_ACTIVE="prod"
API_BASE_URL="http://localhost:${BE_PORT}"

# =========================
# Functions
# =========================
remove_if_exists() {
  local cname="$1"
  if docker ps -a --format '{{.Names}}' | grep -qx "$cname"; then
    echo "[INFO] Removing existing container: $cname"
    docker rm -f "$cname" >/dev/null 2>&1 || true
  fi
}

create_network_if_needed() {
  if ! docker network ls --format '{{.Name}}' | grep -qx "$NETWORK_NAME"; then
    echo "[INFO] Creating network: $NETWORK_NAME"
    docker network create "$NETWORK_NAME" >/dev/null
  fi
}

# =========================
# Main
# =========================
echo "[INFO] Starting AI stack..."

create_network_if_needed

remove_if_exists "$BE_CONTAINER"
remove_if_exists "$FE_CONTAINER"

echo "[INFO] Running backend container..."
docker run -d \
  --name "$BE_CONTAINER" \
  --network "$NETWORK_NAME" \
  -p "${BE_PORT}:8080" \
  -e SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE}" \
  --restart unless-stopped \
  "$BE_IMAGE"

echo "[INFO] Running frontend container..."
docker run -d \
  --name "$FE_CONTAINER" \
  --network "$NETWORK_NAME" \
  -p "${FE_PORT}:80" \
  -e API_BASE_URL="${API_BASE_URL}" \
  --restart unless-stopped \
  "$FE_IMAGE"

echo
echo "[DONE] Containers started:"
docker ps --filter "name=${BE_CONTAINER}" --filter "name=${FE_CONTAINER}"
echo
echo "[URL]"
echo " - Frontend: http://localhost:${FE_PORT}"
echo " - Backend : http://localhost:${BE_PORT}"