# DSA Round Robin

DSA Round Robin is a real-time collaborative platform for gamified Data Structures and Algorithms (DSA) practice. It features 1v1 coding battles, real-time chat, friend duels, global leaderboards, and progress tracking in a high-performance environment.

## Tech Stack

The project uses a monorepo architecture managed by TurboRepo.

### Core
- Monorepo: TurboRepo
- Package Manager: pnpm
- Language: TypeScript

### Frontend (apps/web)
- Framework: Next.js 16 (App Router)
- Styling: TailwindCSS v4
- UI Components: Radix UI, Lucide React
- State Management: Zustand
- Code Editor: CodeMirror
- Animations: Framer Motion

### Backend (apps/server)
- Runtime: Node.js
- Framework: Express.js
- Real-time: Socket.io
- Background Tasks: Custom worker service (apps/worker)

### Database and Infrastructure
- Database: PostgreSQL
- ORM: Prisma
- Caching/Queues: Redis (BullMQ)
- Containerization: Docker

## Project Structure

### Apps
- web: Main Next.js frontend.
- server: Express.js backend for API and WebSockets.
- worker: Background service for asynchronous tasks.

### Packages
- db: Prisma schema and database client.
- ui: Shared UI components.
- queue: Redis queue configurations.
- types: Shared TypeScript interfaces.
- questions-set: Shared question data or logic.
- eslint-config: Shared linting rules.
- typescript-config: Shared TS configurations.

## Getting Started

### Prerequisites
- Node.js (v22 or higher)
- pnpm (v9 or higher)
- Docker

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sahitya-chandra/DSA-Round-Robin.git
   cd DSA-Round-Robin
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start infrastructure services:
   ```bash
   pnpm services:start
   ```

5. Set up the database:
   ```bash
   pnpm db:migrate
   pnpm db:generate
   ```

6. Start the development environment:
   ```bash
   pnpm dev
   ```

## Available Scripts

- `pnpm dev`: Start all apps in development mode.
- `pnpm build`: Build all apps and packages.
- `pnpm lint`: Run linting across the repository.
- `pnpm format`: Format code with Prettier.
- `pnpm check-types`: Run type checking.
- `pnpm services:start`: Start Docker containers.
- `pnpm services:stop`: Stop Docker containers.
- `pnpm db:studio`: Open Prisma Studio.