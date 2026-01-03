FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install Docker CLI so the worker can spawn sandboxes
RUN apt-get update && apt-get install -y docker.io && rm -rf /var/lib/apt/lists/*

FROM base AS builder
WORKDIR /app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter worker build

FROM base AS runner
WORKDIR /app

# Ensure we have docker CLI in the runner stage too
RUN apt-get update && apt-get install -y docker.io && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# The worker doesn't expose any ports, it connects to Redis
# IMPORTANT: This container must be run with /var/run/docker.sock mounted
CMD ["node", "apps/worker/dist/index.js"]
