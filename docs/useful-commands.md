# Useful Commands

This document contains common commands for working with the **Express + TypeScript + PostgreSQL + Prisma ORM + pnpm** backend template.

---

## 1. Project Setup Commands

### Initialize project

```bash
pnpm init
```

### Install dependencies

```bash
pnpm add express pg dotenv cors helmet morgan @prisma/client @prisma/adapter-pg
```

### Install development dependencies

```bash
pnpm add -D typescript tsx nodemon prisma @types/node @types/express @types/pg @types/cors @types/morgan
```

### Initialize Prisma

```bash
npx prisma init
```

This creates `prisma/schema.prisma` and a `.env` file with a `DATABASE_URL` placeholder.

### Create TypeScript config

```bash
pnpm tsc --init
```

---

## 2. pnpm Commands

### Install all dependencies

```bash
pnpm install
```

### Run development server

```bash
pnpm dev
```

### Build TypeScript project

```bash
pnpm build
```

### Start production build

```bash
pnpm start
```

---

## 3. Prisma ORM Commands

### Generate Prisma client

Regenerates the Prisma client after schema changes. Required after every `schema.prisma` update.

```bash
pnpm prisma:generate
```

### Format schema file

Auto-formats `prisma/schema.prisma` for consistent styling.

```bash
pnpm prisma:format
```

### Push schema to database (no migration)

Syncs the schema directly to the database without creating a migration file. Useful during prototyping.

```bash
pnpm prisma:push
```

> **Warning:** This can cause data loss if columns are removed. Use migrations for production databases.

### Create and apply a migration

Creates a new migration file and applies it to the database.

```bash
pnpm prisma:migrate
```

You will be prompted to name the migration (e.g. `add_user_table`).

### Deploy migrations (production)

Applies all pending migrations without prompting. Use this in CI/CD or production.

```bash
pnpm prisma:deploy
```

### Reset database

Drops the database, re-creates it, and applies all migrations from scratch.

```bash
pnpm prisma:reset
```

> **Warning:** This deletes all data in the database.

### Open Prisma Studio

Opens a visual database browser at `http://localhost:5555`.

```bash
pnpm prisma:studio
```

### Check migration status

Shows which migrations have been applied and which are pending.

```bash
npx prisma migrate status
```

### Validate schema

Checks your `schema.prisma` for errors without generating anything.

```bash
npx prisma validate
```

### Pull schema from existing database

Introspects an existing database and updates `schema.prisma` to match.

```bash
npx prisma db pull
```

---

## 4. Common API Testing Commands Using curl

### Check API health

```bash
curl http://localhost:5000/api
```

### Create user

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dariel Avila",
    "email": "dariel@example.com",
    "password": "password123"
  }'
```

### Get all users

```bash
curl http://localhost:5000/api/users
```

### Get user by ID

```bash
curl http://localhost:5000/api/users/USER_ID_HERE
```

### Update user

```bash
curl -X PATCH http://localhost:5000/api/users/USER_ID_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dariel Updated"
  }'
```

### Delete user

```bash
curl -X DELETE http://localhost:5000/api/users/USER_ID_HERE
```

---

## 5. Useful Troubleshooting Commands

### Check if port 5432 is already used

#### Windows PowerShell

```powershell
netstat -ano | findstr :5432
```

#### macOS/Linux

```bash
lsof -i :5432
```

### Check if port 5000 is already used

#### Windows PowerShell

```powershell
netstat -ano | findstr :5000
```

#### macOS/Linux

```bash
lsof -i :5000
```

### Kill a process by PID on Windows

```powershell
taskkill /PID PID_HERE /F
```

### Kill a process by PID on macOS/Linux

```bash
kill -9 PID_HERE
```

---

## 6. Reset Database Completely

Reset via Prisma (drops + re-creates + applies all migrations):

```bash
pnpm prisma:reset
```

---

## 7. Recommended Daily Workflow

### Run your backend server

```bash
pnpm dev
```

### When you update `prisma/schema.prisma`

```bash
pnpm prisma:migrate
```

This creates a migration file and applies it. The Prisma client is auto-regenerated.

### Browse your data visually

```bash
pnpm prisma:studio
```

---

## 8. Quick Reference

```bash
# Project
pnpm install
pnpm dev
pnpm build
pnpm start

# Prisma
pnpm prisma:generate
pnpm prisma:format
pnpm prisma:push
pnpm prisma:migrate
pnpm prisma:deploy
pnpm prisma:reset
pnpm prisma:studio
```
