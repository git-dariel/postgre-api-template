# Project

## Overview

Postgre API Template is a reusable starter for REST APIs using Express 5, TypeScript, PostgreSQL, and Prisma ORM. It includes a health endpoint and a sample users CRUD module.

## Stack

- Node.js 20+
- TypeScript 6 with ESM
- Express 5
- PostgreSQL
- Prisma ORM 7 with `@prisma/adapter-pg`
- Winston and Morgan logging
- pnpm

## Commands

- `pnpm dev` — run the development server with Nodemon and TSX
- `pnpm build` — compile TypeScript
- `pnpm test` — run focused tests through `tsx` and Node's test runner
- `pnpm start` — run compiled output
- `pnpm prisma:generate` — regenerate the Prisma client
- `pnpm prisma:migrate` — create and apply a development migration
- `pnpm prisma:deploy` — apply migrations in production or CI

## Scope and constraints

- The HTTP API is mounted at `/api`; users endpoints are under `/api/users`.
- Server startup verifies the database connection before listening.
- `DATABASE_URL` is required by Prisma configuration.
- User passwords are hashed with bcrypt before persistence and omitted from service/API responses.
- Focused user service tests are configured; broader route and repository coverage is still pending.
