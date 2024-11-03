FROM --platform=linux/amd64 node:20-alpine as development

WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY . .

FROM --platform=linux/amd64 node:20-alpine as builder

WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++

COPY --from=development /usr/src/app/node_modules ./node_modules
COPY --from=development /usr/src/app/package*.json ./
COPY --from=development /usr/src/app/prisma ./prisma
COPY . .

RUN npm run build

FROM --platform=linux/amd64 node:20-alpine as production

WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=8080

RUN npx prisma generate

EXPOSE 8080

CMD ["node", "dist/main.js"]