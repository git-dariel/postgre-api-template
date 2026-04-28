# Postgre API Template

A production-ready starter template for building REST APIs with Express, TypeScript, and PostgreSQL. The project includes a layered architecture, PostgreSQL connection pooling, SQL migrations, Docker-based local database services, and a sample users module.

## Tech Stack

- Node.js
- TypeScript
- Express 5
- PostgreSQL
- pg
- Docker Compose
- pnpm

## Features

- Express application configured with security, CORS, JSON parsing, and request logging
- PostgreSQL connection using a shared connection pool
- SQL migration runner with migration tracking
- Modular route, controller, service, and repository structure
- Central async route error handling
- Docker Compose setup for PostgreSQL and pgAdmin
- Strict TypeScript configuration

## Project Structure

```text
src/
  app.ts                         Express app configuration
  server.ts                      Application entry point
  config/
    env.ts                       Environment configuration
  controllers/
    user.controller.ts           User request handlers
  database/
    connection.ts                PostgreSQL pool and connection check
    migrate.ts                   SQL migration runner
    migrations/
      001_create_users_table.sql Users table migration
  models/
    user.model.ts                User TypeScript interfaces
  repositories/
    user.repository.ts           Database access layer
  routes/
    index.ts                     API route entry point
    user.routes.ts               User routes
  services/
    user.service.ts              Business logic layer
  utils/
    asyncHandler.ts              Async Express handler wrapper
```

## Prerequisites

- Node.js 20 or later
- pnpm
- Docker and Docker Compose

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start PostgreSQL and pgAdmin:

```bash
docker compose up -d
```

Create a `.env` file in the project root:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=express_ts_db
```

Run database migrations:

```bash
pnpm db:migrate
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

```bash
pnpm dev
```

Runs the API in development mode using `tsx watch`.

```bash
pnpm build
```

Compiles TypeScript into the `dist` directory.

```bash
pnpm start
```

Runs the compiled application from `dist/server.js`.

```bash
pnpm db:migrate
```

Runs pending SQL migrations from `src/database/migrations`.

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

Creates a new user.

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

## Database

The Docker Compose configuration starts:

- PostgreSQL on port `5432`
- pgAdmin on port `5050`

Default pgAdmin credentials:

```text
Email: admin@email.com
Password: admin
```

Default PostgreSQL credentials:

```text
Host: localhost
Port: 5432
User: postgres
Password: postgres
Database: express_ts_db
```

## Migrations

Migration files are stored in:

```text
src/database/migrations
```

The migration runner creates a `schema_migrations` table to track executed files. Migration files are executed in sorted order, so use a numbered naming convention:

```text
001_create_users_table.sql
002_add_profiles_table.sql
003_add_indexes.sql
```

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | API server port | `5000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `DB_NAME` | PostgreSQL database name | `express_ts_db` |

## Build and Run

Build the project:

```bash
pnpm build
```

Start the compiled server:

```bash
pnpm start
```

## Notes

- Passwords are currently stored as plain text in the sample users module. Add hashing before using this template in a real application.
- The default error handler returns error messages directly. Adjust this behavior before deploying public APIs.
- The generated `dist` directory is build output and should usually be excluded from version control.
