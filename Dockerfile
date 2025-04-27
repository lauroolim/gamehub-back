#Build: instala dependências e gera artefatos
FROM --platform=linux/amd64 node:20-alpine AS builder
WORKDIR /usr/src/app

# ferramentas necessárias de build (Python, make e g++)
RUN apk add --no-cache python3 make g++

# Copia dependências e esquema do Prisma, instala módulos e gera cliente
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# Copia o codigo-fonte e executa o build (compila TypeScript)
COPY . .
RUN npm run build

# Remove dependências de desenvolvimento (mantem apenas produção)
RUN npm prune --production

# Prod: imagem mais enxuta
FROM --platform=linux/amd64 node:20-alpine AS production
WORKDIR /usr/src/app

# Define variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

#Artefatos de build e dependências de produção do builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE ${PORT}
CMD ["node", "dist/main.js"]

