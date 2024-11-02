FROM node:20-alpine as development

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate

FROM node:20-alpine as build

WORKDIR /usr/src/app

COPY --from=development /usr/src/app/node_modules ./node_modules
COPY --from=development /usr/src/app/package*.json ./
COPY --from=development /usr/src/app/prisma ./prisma
COPY . .

RUN npm run build
RUN npm ci --only=production
RUN npx prisma generate

FROM node:20-alpine as production

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma
COPY --from=build /usr/src/app/package*.json ./

ENV PORT=3000
EXPOSE ${PORT}

CMD ["node", "dist/main.js"]