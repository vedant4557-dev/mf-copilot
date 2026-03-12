# apps/api/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable pnpm

# ── Dependencies ─────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/analytics/package.json packages/analytics/
COPY packages/ai/package.json packages/ai/
COPY packages/data/package.json packages/data/
COPY packages/utils/package.json packages/utils/
RUN pnpm install --frozen-lockfile --filter=apps/api...

# ── Build ─────────────────────────────────────────────────────
FROM deps AS build
WORKDIR /app
COPY . .
RUN pnpm turbo build --filter=apps/api

# ── Production image ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -S mfcopilot && adduser -S mfcopilot -G mfcopilot

COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json .

USER mfcopilot
EXPOSE 4000

CMD ["node", "dist/index.js"]
