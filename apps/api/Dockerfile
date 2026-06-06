FROM node:20-alpine AS base
RUN apk add --no-cache openssl && corepack enable && corepack prepare pnpm@9.0.0 --activate

# ── deps: install all workspace deps (cached unless lock file changes) ──────
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api/package.json                 ./apps/api/
COPY packages/shared/package.json          ./packages/shared/
COPY packages/config/package.json          ./packages/config/
COPY packages/database/package.json        ./packages/database/
COPY packages/ui/package.json              ./packages/ui/
RUN pnpm install --frozen-lockfile

# ── builder: compile everything needed for the API ──────────────────────────
FROM deps AS builder
WORKDIR /app
COPY . .

# 1. Generate Prisma client (must run before any TypeScript compilation)
RUN pnpm --filter @terangatable/database db:generate

# 2. Compile workspace packages (produces dist/ used by pnpm deploy)
RUN pnpm --filter @terangatable/shared build
RUN pnpm --filter @terangatable/database build

# 3. Compile the NestJS API
RUN pnpm --filter api build

# 4. Compile seed.ts → seed.js (ts-node available here via devDeps)
RUN cd /app/packages/database && npx tsc --project ./prisma/tsconfig.json

# 5. Create a self-contained production bundle (resolves workspace symlinks)
RUN pnpm --filter api --prod deploy /deploy

# ── runner: minimal production image ────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

# Production node_modules from pnpm deploy (prisma is now a direct dep → binary linked)
COPY --from=builder /deploy/node_modules ./node_modules

# Prisma schema — needed for generate and migrate deploy
COPY --from=builder /app/packages/database/prisma ./prisma

# Generate Prisma client into the flat node_modules (.prisma/client)
RUN node_modules/.bin/prisma generate --schema=./prisma/schema.prisma

# Compiled NestJS output
COPY --from=builder /app/apps/api/dist ./dist

EXPOSE 3001
CMD ["node", "dist/main"]
