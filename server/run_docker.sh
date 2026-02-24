#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="transcribe-lab-server:dev"
CONTAINER_NAME="transcribe-lab-server"
HOST_PORT="${HOST_PORT:-3000}"
CONTAINER_PORT="${CONTAINER_PORT:-3000}"
AWS_REGION="${AWS_REGION:-ap-northeast-2}"

echo "==> Build image: ${IMAGE_NAME}"
docker build -t "${IMAGE_NAME}" .

echo "==> Stop & remove old container (if exists): ${CONTAINER_NAME}"
docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true

# AWS 자격증명 주입은 아래 중 하나만 사용하세요.
# A) -e AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN
# B) -v ~/.aws:/root/.aws:ro + -e AWS_PROFILE=default

echo "==> Run container: ${CONTAINER_NAME}"
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  -e AWS_REGION="${AWS_REGION}" \
  -e AWS_DEFAULT_REGION="${AWS_REGION}" \
  -e PORT="${CONTAINER_PORT}" \
  -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}" \
  -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}" \
  -e AWS_SESSION_TOKEN="${AWS_SESSION_TOKEN:-}" \
  "${IMAGE_NAME}"

echo "==> Logs (tail 50)"
docker logs --tail 50 "${CONTAINER_NAME}" || true

echo "==> Done. URL: http://localhost:${HOST_PORT}"
