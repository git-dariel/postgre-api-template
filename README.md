# Postgre API Template

A production-ready starter template for building REST APIs with Express, TypeScript, PostgreSQL, and Prisma ORM. The project includes a layered architecture, Prisma for database access and migrations, Winston logging, middleware for error handling and validation, and a sample users module.

## Tech Stack

- Node.js
- TypeScript
- Express 5
- PostgreSQL
- Prisma ORM
- Winston
- pnpm

## Features

- Express application configured with security, CORS, JSON parsing, and structured request logging
- Prisma ORM for type-safe database access and schema migrations
- Winston logger with colorized console output, timestamps, and environment-based log levels
- Custom error classes with proper HTTP status codes (`AppError`, `NotFoundError`, `BadRequestError`, `ConflictError`)
- Global error handler middleware with structured error logging
- Request body validation middleware
- Modular route, controller, service, and repository architecture
- Async route error handling

## Project Structure

```text
src/
  app.ts                         Express app configuration
  server.ts                      Application entry point
  config/
    env.ts                       Environment configuration
  controllers/
    user.controller.ts           User request handlers
  lib/
    logger.ts                    Winston logger configuration
    prisma.ts                    Prisma client instance
  middlewares/
    errorHandler.ts              Global error handler
    notFoundHandler.ts           404 route handler
    requestLogger.ts             HTTP request logger (Morgan + Winston)
    validateBody.ts              Request body validation
  repositories/
    user.repository.ts           Database access layer (Prisma)
  routes/
    index.ts                     API route entry point
    user.routes.ts               User routes
  services/
    user.service.ts              Business logic layer
  utils/
    appError.ts                  Custom error classes
    asyncHandler.ts              Async Express handler wrapper
prisma/
  schema.prisma                  Prisma database schema
```

## Prerequisites

- Node.js 20 or later
- pnpm
- PostgreSQL database (local or hosted)

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create a `.env` file in the project root:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/your_database_name
```

Push the schema to your database:

```bash
pnpm prisma:push
```

Or create and apply a migration:

```bash
pnpm prisma:migrate
```

Start the development server:

```bash
pnpm dev
```

The API will be available at:

```text
http://localhost:5000/api
```

## Available Scripts

### Project

| Script       | Description                                       |
| ------------ | ------------------------------------------------- |
| `pnpm dev`   | Run the API in development mode using `tsx watch` |
| `pnpm build` | Compile TypeScript into the `dist` directory      |
| `pnpm start` | Run the compiled application from `dist`          |

### Prisma

| Script                 | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `pnpm prisma:generate` | Regenerate Prisma client after schema changes           |
| `pnpm prisma:format`   | Auto-format `prisma/schema.prisma`                      |
| `pnpm prisma:push`     | Sync schema to database without creating a migration    |
| `pnpm prisma:migrate`  | Create and apply a new migration                        |
| `pnpm prisma:deploy`   | Apply pending migrations (production / CI)              |
| `pnpm prisma:reset`    | Drop database, re-create, and apply all migrations      |
| `pnpm prisma:studio`   | Open visual database browser at `http://localhost:5555` |

## API Endpoints

### Health Check

```http
GET /api
```

Returns a simple response confirming that the API is running.

### Users

```http
GET /api/users
```

Returns all users.

```http
GET /api/users/:id
```

Returns a single user by ID.

```http
POST /api/users
```

Creates a new user. Required fields: `email`, `password`.

Request body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

```http
PATCH /api/users/:id
```

Updates an existing user.

Request body:

```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "password": "new-password"
}
```

```http
DELETE /api/users/:id
```

Deletes a user by ID.

## Prisma Schema

The database schema is defined in `prisma/schema.prisma`. After editing the schema:

1. Run `pnpm prisma:migrate` to create a migration and apply it
2. The Prisma client is automatically regenerated

To browse your data visually:

```bash
pnpm prisma:studio
```

## Environment Variables

| Variable       | Description                                | Default       |
| -------------- | ------------------------------------------ | ------------- |
| `PORT`         | API server port                            | `5000`        |
| `DATABASE_URL` | PostgreSQL connection string               | —             |
| `NODE_ENV`     | Environment (`development` / `production`) | `development` |

## Error Handling

The template includes a structured error handling system:

- **`AppError`** — base error class with `statusCode` and `isOperational` flag
- **`NotFoundError`** — 404 errors (e.g. user not found)
- **`BadRequestError`** — 400 errors (e.g. missing required fields)
- **`ConflictError`** — 409 errors (e.g. duplicate email)
- Unexpected errors return `500 Internal Server Error` and log the full stack trace

## Logging

Winston is configured with:

- Colorized console output for readability
- Timestamps in `YYYY-MM-DD HH:mm:ss` format
- Error stack traces for unexpected errors
- Log level: `debug` in development, `warn` in production
- HTTP request logging via Morgan piped through Winston

## Notes

- Passwords are currently stored as plain text in the sample users module. Add hashing before using this template in a real application.
- The generated `dist` directory is build output and should be excluded from version control.
