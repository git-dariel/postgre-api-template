# Architecture

## Request flow

`src/server.ts` verifies database connectivity and starts the Express app from `src/app.ts`. Requests flow through security, CORS, logging, and JSON middleware before reaching routes.

The users feature follows this dependency direction:

`routes → controllers → services → repositories → Prisma → PostgreSQL`

- Routes define endpoints and attach validation and async error wrappers.
- Controllers translate HTTP requests and responses.
- Services contain business rules such as duplicate-email and not-found handling.
- Repositories own Prisma database operations.
- Global not-found and error middleware run after application routes.

## Main components

- `src/app.ts` — Express middleware and route composition
- `src/server.ts` — startup and database connectivity gate
- `src/config/env.ts` — environment-derived port and runtime mode
- `src/lib/prisma.ts` — shared Prisma client and connection verification
- `src/lib/logger.ts` — Winston logger configuration
- `src/routes/` — health and users routes
- `src/controllers/` — HTTP handlers
- `src/services/` — business logic
- `src/repositories/` — persistence logic
- `src/middlewares/` — request logging, validation, 404, and error handling
- `prisma/schema.prisma` and `prisma/models/` — database schema
- `generated/prisma/` — generated Prisma client, excluded from Git

## Data model

The `User` model has an auto-incrementing integer ID, unique email, optional name, password, and created/updated timestamps.
