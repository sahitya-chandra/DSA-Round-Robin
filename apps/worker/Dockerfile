FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

# Enable corepack (pnpm)
RUN corepack enable

# Install Docker CLI ONLY (correct package for Debian)
RUN apt-get update && \
    apt-get install -y docker.io ca-certificates && \
    rm -rf /var/lib/apt/lists/*


FROM base AS builder
WORKDIR /app

COPY . .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

RUN pnpm --filter worker build


FROM base AS runner
WORKDIR /app

# Non-root user (matches VM sandbox expectations)
RUN groupadd -g 1001 worker && \
    useradd -m -u 1001 -g 1001 worker

COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

USER worker

CMD ["node", "apps/worker/dist/index.js"]
