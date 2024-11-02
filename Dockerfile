# Stage 1: Development
FROM node:20-alpine as development

WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate --schema ./prisma/schema.prisma

# Copy the rest of the application code
COPY . .

# Copy .env file for local development (optional)
COPY .env .env

# Stage 2: Build
FROM node:20-alpine as build

WORKDIR /usr/src/app

# Copy dependencies and application code from the development stage
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY --from=development /usr/src/app/package*.json ./
COPY --from=development /usr/src/app/prisma ./prisma
COPY --from=development /usr/src/app/dist ./dist

# Build the application
RUN npm run build

# Stage 3: Production
FROM node:20-alpine as production

WORKDIR /usr/src/app

# Copy dependencies and built application from the build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/prisma ./prisma
COPY --from=build /usr/src/app/dist ./dist

# Set environment variables (optional, for local development)
# COPY --from=build /usr/src/app/.env .env

# Set the port and expose it
ENV PORT=3000
EXPOSE ${PORT}

# Command to run the application
CMD ["node", "dist/main.js"]
