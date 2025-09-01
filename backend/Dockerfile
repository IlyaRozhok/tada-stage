# ---------- Builder ----------
  FROM node:18-alpine AS builder
  WORKDIR /app
  
  COPY package*.json ./
  # НУЖНЫ devDeps для сборки (nest/tsc)
  RUN npm ci
  
  COPY . .
  # Собираем в dist/
  RUN npm run build
  
  # ---------- Production ----------
  FROM node:18-alpine AS production
  WORKDIR /app
  
  # Необязательно, но ок
  RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
  
  COPY package*.json ./
  # Только прод-зависимости (npm v8+)
  RUN npm ci --omit=dev && npm cache clean --force
  
  # Копируем результат сборки
  COPY --from=builder /app/dist ./dist
  
  USER nestjs
  EXPOSE 3002
  
  HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3002/health', r=>process.exit(r.statusCode===200?0:1))"
  
    CMD ["node", "dist/main.js"]