FROM --platform=linux/amd64 node:20-alpine AS development

WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++ && \
    addgroup -S appgroup && \
    adduser -S appuser -G appgroup

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci && \
    npx prisma generate

COPY . .

FROM --platform=linux/amd64 node:20-alpine AS build

WORKDIR /usr/src/app

COPY --from=development /usr/src/app ./

RUN npm run build

FROM --platform=linux/amd64 node:20-alpine AS production

WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++ && \
    addgroup -S appgroup && \
    adduser -S appuser -G appgroup

COPY --from=development /usr/src/app/package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

COPY --from=build /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/prisma ./prisma

RUN npx prisma generate && \
    chown -R appuser:appgroup /usr/src/app

USER appuser

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "dist/main.js"]