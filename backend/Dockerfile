# syntax=docker/dockerfile:1

# Install all dependencies (lockfile-cached). Skip lifecycle scripts so postinstall
# does not run prisma generate before source and DATABASE_URL are available.
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

# Generate Prisma client and bundle the API entrypoint.
FROM deps AS build
COPY . .
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN bunx prisma generate && bun run build

# Production dependencies only (no devDependencies such as tsdown/prisma CLI).
FROM oven/bun:1 AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts

FROM oven/bun:1-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma/generated ./prisma/generated
COPY --from=build /app/src/modules ./modules
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=prod-deps /app/node_modules ./node_modules

# Default: API server. Worker override (same image):
#   docker run --rm backend-api bun run worker
CMD ["bun", "run", "start"]
