# Multi-stage: build the Vite frontend, then run the Node server that serves it.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY --from=build /app/web/dist ./web/dist
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["node", "server/index.js"]
