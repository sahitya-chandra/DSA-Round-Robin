# AGENTS.md

## Cursor Cloud specific instructions

### Overview

DSA Round Robin is a TurboRepo monorepo with three apps (`apps/web`, `apps/server`, `apps/worker`) and shared packages under `packages/`. See `README.md` for full architecture and `CONTRIBUTING.md` for standard commands (`pnpm dev`, `pnpm lint`, `pnpm check-types`, `pnpm build`).

### Prerequisites

- **Node.js v22+**, **pnpm v9+**, and **Docker** must be available.
- The environment comes with nvm; Node 22 is pre-installed.

### Infrastructure services

PostgreSQL 16 and Redis 7.2 run via Docker Compose:

```bash
docker compose up -d
```

Wait for health checks before running migrations. Verify with `docker compose ps`.

### Database setup

After starting PostgreSQL, run migrations and generate the Prisma client:

```bash
pnpm db:migrate
pnpm db:generate
```

### Environment variables

Copy `.env.example` to `.env` and set `HOME_DIR` to a valid path (e.g. `/home/ubuntu`) and `BETTER_AUTH_SECRET` to any non-empty string. Google OAuth credentials are optional.

### Docker daemon in Cloud Agent VMs

The Cloud Agent VM runs inside a Docker container. To use Docker-in-Docker:

1. The daemon must be configured with `fuse-overlayfs` storage driver and `iptables-legacy`.
2. Start the daemon with `sudo dockerd &>/tmp/dockerd.log &` and wait ~3 seconds.
3. Fix socket permissions: `sudo chmod 666 /var/run/docker.sock`.

### Running dev servers

`pnpm dev` starts all three apps concurrently via TurboRepo:

- **web** (Next.js): http://localhost:3000
- **server** (Express + Socket.io): http://localhost:5000
- **worker** (BullMQ): requires Docker socket access for code execution

### Known issues

- The worker may crash on startup with `drainDelay must be greater than 0` due to a BullMQ configuration issue. This does not block the web or server apps.
- The Express server returns 404 on `GET /` — this is expected (no root route is defined). API routes work normally.
- Google OAuth warning in server logs (`Social provider google is missing clientId or clientSecret`) is benign when Google credentials are not configured.
