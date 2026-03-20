FROM node:18-slim as builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN rm -rf node_modules package-lock.json && npm install --legacy-peer-deps
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# 拷贝 Nginx 配置，支持单页应用路由
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
