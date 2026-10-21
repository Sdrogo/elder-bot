# Multi-arch: builds on x86 and on ARM (Oracle Cloud Ampere A1).
FROM node:22-bookworm-slim AS build
WORKDIR /app
# better-sqlite3 compiles its native module during npm ci.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    DATABASE_PATH=/data/elder-bot.db
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY assets ./assets
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
CMD ["node", "dist/index.js"]
