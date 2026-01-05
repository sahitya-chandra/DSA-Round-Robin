# Contributing to DSA Round Robin

Thank you for your interest in contributing to DSA Round Robin! We welcome contributions from the community to help make this platform better.

## Development Setup

The project is a monorepo managed with TurboRepo and pnpm.

1. Ensure you have Node.js v22+ and pnpm v9+ installed.
2. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/sahitya-chandra/DSA-Round-Robin.git
   cd DSA-Round-Robin
   pnpm install
   ```
3. Set up the environment by following the instructions in the README.md.

## Working with the Monorepo

- **apps/web**: Next.js frontend.
- **apps/server**: Express.js backend.
- **apps/worker**: Background task processor.
- **packages/**: Shared utilities and configurations.

### Useful Commands

- `pnpm dev`: Start all services in development mode.
- `pnpm build`: Build all applications.
- `pnpm lint`: Run linting checks.
- `pnpm format`: Format the codebase.
- `pnpm check-types`: Run TypeScript type checking.

## Contribution Workflow

1. Fork the repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and ensure they follow the project's coding standards.
4. Run tests and linting before committing:
   ```bash
   pnpm lint
   pnpm check-types
   ```
5. Commit your changes with descriptive messages.
6. Push to your fork and open a Pull Request.

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.
