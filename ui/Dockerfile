FROM nginx:alpine

# 기본 정적 파일 제거
RUN rm -rf /usr/share/nginx/html/*

# nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# UI 정적 파일 복사
COPY index.html /usr/share/nginx/html/index.html
COPY app.js /usr/share/nginx/html/app.js

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]