FROM --platform=linux/amd64 node:20-alpine AS development

WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY . .

FROM --platform=linux/amd64 node:20-alpine AS build

WORKDIR /usr/src/app

COPY --from=development /usr/src/app ./

RUN npm run build

FROM --platform=linux/amd64 node:20-alpine AS production

WORKDIR /usr/src/app

COPY --from=development /usr/src/app/package*.json ./
RUN npm ci --only=production

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/main.js"]