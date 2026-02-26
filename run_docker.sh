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

BE_PORT="8000"
FE_PORT="80"

NETWORK_NAME="ai-net"

SPRING_PROFILES_ACTIVE="prod"

EC2_PUBLIC_IP="$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo localhost)"
API_BASE_URL="http://${EC2_PUBLIC_IP}:${BE_PORT}"

# 호스트의 AWS credential 디렉터리
AWS_DIR="${HOME}/.aws"

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

ecr_login() {
  echo "[INFO] Logging in to Amazon ECR..."
  aws ecr get-login-password --region "$AWS_REGION" \
    | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
}

pull_images() {
  echo "[INFO] Pulling backend image..."
  docker pull "$BE_IMAGE"

  echo "[INFO] Pulling frontend image..."
  docker pull "$FE_IMAGE"
}

check_aws_dir() {
  if [ ! -d "$AWS_DIR" ]; then
    echo "[ERROR] AWS credential directory not found: $AWS_DIR"
    exit 1
  fi

  if [ ! -f "$AWS_DIR/credentials" ]; then
    echo "[ERROR] AWS credentials file not found: $AWS_DIR/credentials"
    exit 1
  fi
}

# =========================
# Main
# =========================
echo "[INFO] Starting AI stack on EC2..."

command -v aws >/dev/null 2>&1 || { echo "[ERROR] aws CLI is not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "[ERROR] docker is not installed."; exit 1; }

check_aws_dir
create_network_if_needed
remove_if_exists "$BE_CONTAINER"
remove_if_exists "$FE_CONTAINER"

ecr_login
pull_images

echo "[INFO] Running backend container..."
docker run -d \
  --name "$BE_CONTAINER" \
  --network "$NETWORK_NAME" \
  -p "${BE_PORT}:8080" \
  -v "${AWS_DIR}:/ubuntu/.aws:ro" \
  -e AWS_REGION="${AWS_REGION}" \
  -e AWS_DEFAULT_REGION="${AWS_REGION}" \
  -e AWS_SHARED_CREDENTIALS_FILE="/ubuntu/.aws/credentials" \
  -e AWS_CONFIG_FILE="/ubuntu/.aws/config" \
  -e SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE}" \
  --restart unless-stopped \
  "$BE_IMAGE"

echo "[INFO] Running frontend container..."
docker run -d \
  --name "$FE_CONTAINER" \
  --network "$NETWORK_NAME" \
  -p "${FE_PORT}:80" \
  -v "${AWS_DIR}:/ubuntu/.aws:ro" \
  -e AWS_REGION="${AWS_REGION}" \
  -e AWS_DEFAULT_REGION="${AWS_REGION}" \
  -e AWS_SHARED_CREDENTIALS_FILE="/ubuntu/.aws/credentials" \
  -e AWS_CONFIG_FILE="/ubuntu/.aws/config" \
  -e API_BASE_URL="${API_BASE_URL}" \
  --restart unless-stopped \
  "$FE_IMAGE"

echo
echo "[DONE] Containers started:"
docker ps --filter "name=${BE_CONTAINER}" --filter "name=${FE_CONTAINER}"

echo
echo "[URL]"
echo " - Frontend: http://${EC2_PUBLIC_IP}:${FE_PORT}"
echo " - Backend : http://${EC2_PUBLIC_IP}:${BE_PORT}"