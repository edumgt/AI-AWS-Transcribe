# Dockerfile
FROM node:20.20-alpine3.23

WORKDIR /app

# 운영에 필요한 최소 패키지
COPY package*.json ./
RUN npm ci --omit=dev

# 소스 복사
COPY . .

# (선택) 서버 포트가 3000이라 가정. index.js에서 쓰는 포트에 맞추세요.
EXPOSE 3000

# 환경변수 기본값(필요시 docker run -e 로 override)
ENV NODE_ENV=production

CMD ["node", "index.js"]