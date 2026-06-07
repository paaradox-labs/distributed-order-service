# Order Service

A microservice for managing orders within a distributed system. Part of the CGS distributed architecture.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js v5
- **Database:** MongoDB via Mongoose v9
- **Auth:** JWT / RS256 (express-jwt + jwks-rsa)
- **Logging:** Winston
- **Config:** node-config (YAML)

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- MongoDB instance

## Getting Started

```bash
pnpm install
pnpm dev
```

The server starts on port **5503** (development) or **5502** (production).

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with hot-reload |
| `pnpm build` | Lint + compile TypeScript |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |

## Configuration

Config files in `config/` use node-config with YAML. Key values:

- `server.port` — listen port
- `database.url` — MongoDB connection string
- `auth.jwksUri` — JWKS endpoint for JWT verification
