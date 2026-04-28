# Useful Commands

This document contains common commands for working with the **Express + TypeScript + PostgreSQL + Docker + pnpm** backend template.

---

## 1. Project Setup Commands

### Initialize project

```bash
pnpm init
```

### Install dependencies

```bash
pnpm add express pg dotenv cors helmet morgan
```

### Install development dependencies

```bash
pnpm add -D typescript tsx nodemon @types/node @types/express @types/pg @types/cors @types/morgan
```

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

### Run database migration

```bash
pnpm db:migrate
```

---

## 3. Docker Compose Commands

### Start PostgreSQL and pgAdmin containers

```bash
docker compose up -d
```

The `-d` means detached mode. It runs the containers in the background.

### Stop containers

```bash
docker compose down
```

### Stop containers and remove volumes

```bash
docker compose down -v
```

Use this only if you want to delete the PostgreSQL data stored in the Docker volume.

### Restart containers

```bash
docker compose restart
```

### Rebuild and start containers

```bash
docker compose up -d --build
```

### View running containers

```bash
docker ps
```

### View all containers, including stopped containers

```bash
docker ps -a
```

### View container logs

```bash
docker logs express_ts_postgres
```

```bash
docker logs express_ts_pgadmin
```

### Follow live container logs

```bash
docker logs -f express_ts_postgres
```

### Remove a container manually

```bash
docker rm express_ts_postgres
```

### Force remove a running container

```bash
docker rm -f express_ts_postgres
```

---

## 4. Docker Volume Commands

### List Docker volumes

```bash
docker volume ls
```

### Inspect PostgreSQL volume

```bash
docker volume inspect express-ts-postgres-template_postgres_data
```

> Note: The actual volume name may be different depending on your project folder name.

### Remove a Docker volume

```bash
docker volume rm express-ts-postgres-template_postgres_data
```

### Remove unused Docker volumes

```bash
docker volume prune
```

Be careful with this command because it removes unused Docker volumes.

---

## 5. Docker Network Commands

### List Docker networks

```bash
docker network ls
```

### Inspect Docker Compose network

```bash
docker network inspect express-ts-postgres-template_default
```

> Note: The actual network name may depend on your project folder name.

---

## 6. PostgreSQL Container Commands

### Open PostgreSQL shell inside the container

```bash
docker exec -it express_ts_postgres psql -U postgres -d express_ts_db
```

### List databases inside psql

```sql
\l
```

### Connect to a database inside psql

```sql
\c express_ts_db
```

### List tables inside psql

```sql
\dt
```

### Describe users table

```sql
\d users
```

### Select all users

```sql
SELECT * FROM users;
```

### Exit psql

```sql
\q
```

---

## 7. pgAdmin Access

### pgAdmin URL

```txt
http://localhost:5050
```

### pgAdmin login

```txt
Email: admin@email.com
Password: admin
```

### Add new PostgreSQL server in pgAdmin

Go to:

```txt
Add New Server
```

### General tab

```txt
Name: Express TS PostgreSQL
```

### Connection tab

```txt
Host name/address: postgres
Port: 5432
Maintenance database: express_ts_db
Username: postgres
Password: postgres
```

Enable:

```txt
Save password
```

Then click **Save**.

### Why use `postgres` as host?

Because pgAdmin is running inside Docker. Inside Docker Compose, containers communicate using service names. In your `docker-compose.yml`, the PostgreSQL service name is:

```yaml
postgres:
```

So pgAdmin should connect using:

```txt
postgres
```

not:

```txt
localhost
```

---

## 8. Database Migration Commands

### Run all migrations

```bash
pnpm db:migrate
```

### Example migration folder

```txt
src/database/migrations/
├── 001_create_users_table.sql
├── 002_create_posts_table.sql
├── 003_add_role_to_users.sql
└── 004_create_products_table.sql
```

### Recommended naming convention

Use numbers so migrations run in the correct order:

```txt
001_create_users_table.sql
002_create_products_table.sql
003_create_orders_table.sql
```

Avoid random names like:

```txt
users.sql
orders.sql
products.sql
```

Order matters because some tables may depend on other tables.

---

## 9. Common API Testing Commands Using curl

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

## 10. Useful Troubleshooting Commands

### Check if port 5432 is already used

#### Windows PowerShell

```powershell
netstat -ano | findstr :5432
```

#### macOS/Linux

```bash
lsof -i :5432
```

### Check if port 5050 is already used

#### Windows PowerShell

```powershell
netstat -ano | findstr :5050
```

#### macOS/Linux

```bash
lsof -i :5050
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

## 11. Reset Database Completely

Use this when you want a clean PostgreSQL database from scratch.

```bash
docker compose down -v
```

Then start again:

```bash
docker compose up -d
```

Then run migrations:

```bash
pnpm db:migrate
```

This will delete the old database volume and recreate the tables.

---

## 12. Recommended Daily Workflow

### Start your database containers

```bash
docker compose up -d
```

### Run your backend server

```bash
pnpm dev
```

### When you add or update SQL migration files

```bash
pnpm db:migrate
```

### Stop Docker containers after coding

```bash
docker compose down
```

---

## 13. Quick Reference

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
pnpm db:migrate

docker compose up -d
docker compose down
docker compose down -v
docker compose restart
docker ps
docker logs -f express_ts_postgres
docker exec -it express_ts_postgres psql -U postgres -d express_ts_db
```
