# DSA Round Robin

**DSA Round Robin** is a real-time collaborative platform designed to gamify Data Structures and Algorithms (DSA) practice. Users can compete in 1v1 coding battles, chat with friends, and track their progress in a dynamic, engaging environment.

## 🚀 Tech Stack

This project is built as a monorepo using **TurboRepo** for high-performance build system management.

### Core
-   **Monorepo**: [TurboRepo](https://turbo.build/)
-   **Package Manager**: [pnpm](https://pnpm.io/)
-   **Languages**: TypeScript

### Frontend (`apps/web`)
-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
-   **UI Components**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
-   **Code Editor**: [CodeMirror](https://uiwjs.github.io/react-codemirror/)
-   **Animations**: Framer Motion

### Backend (`apps/server`)
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Real-time**: [Socket.io](https://socket.io/)
-   **Background Tasks**: Custom worker service (`apps/worker`)

### Database & Infrastructure
-   **Database**: PostgreSQL
-   **ORM**: [Prisma](https://www.prisma.io/)
-   **Caching/Queues**: Redis
-   **Containerization**: Docker & Docker Compose

---

## 🏗 Architecture Overview

The project is structured as follows:

### Apps (`/apps`)
-   **`web`**: The main Next.js frontend application.
-   **`server`**: The Express.js backend handling API requests and WebSocket connections for real-time features (battles, chat).
-   **`worker`**: A background worker service for processing asynchronous tasks (e.g., code execution results, matchmaking queues).

### Packages (`/packages`)
-   **`ui`**: Shared UI components (design system).
-   **`db`**: Prisma schema and database client configuration.
-   **`auth`**: Authentication logic and utilities.
-   **`queue`**: Redis queue configurations for job processing.
-   **`types`**: Shared TypeScript interfaces and types.
-   **`eslint-config`**, **`typescript-config`**: Shared configuration files.

---

## 🛠 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
-   **Node.js** (v18 or higher)
-   **pnpm** (v9.0.0 or higher)
-   **Docker** & **Docker Compose** (for running Postgres and Redis)

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd DSA-Round-Robin
    ```

2.  **Install dependencies**
    ```bash
    pnpm install
    ```

3.  **Environment Setup**
    Copy the example environment file to create your local `.env`.
    ```bash
    cp .env.example .env
    ```
    *Note: You may need to adjust the variables in `.env` if your local ports differ.*

4.  **Start Infrastructure**
    Spin up the PostgreSQL and Redis containers.
    ```bash
    pnpm services:start
    # Or manually: docker compose up -d
    ```

5.  **Database Setup**
    Push the Prisma schema to your local database.
    ```bash
    pnpm db:migrate
    # Seed the database (optional)
    # pnpm db:seed
    ```

6.  **Start Development Server**
    Run all apps (web, server, worker) in development mode.
    ```bash
    pnpm dev
    ```

    -   **Web**: [http://localhost:3000](http://localhost:3000)
    -   **Server**: [http://localhost:8080](http://localhost:8080) (or port defined in env)

---

## 📜 Available Scripts

Run these commands from the root directory:

-   `pnpm dev`: Start the development server for all apps.
-   `pnpm build`: Build all apps and packages.
-   `pnpm lint`: Run ESLint across the monorepo.
-   `pnpm format`: Format code using Prettier.
-   `pnpm check-types`: Run TypeScript type checking.
-   `pnpm db:studio`: Open Prisma Studio to view/edit database records.
-   `pnpm services:start`: Start Docker containers (Postgres, Redis).
-   `pnpm services:stop`: Stop Docker containers.

---

## 🤝 Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.