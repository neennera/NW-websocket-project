# NW WebSocket POC

Proof-of-concept monorepo demonstrating a simple WebSocket chat POC (1:1 chat and group chat).

Structure

- /apps/web - Next.js frontend (Tailwind CSS, Prettier) => frontend is in port 3000
- /apps/api - Express backend with WebSocket endpoint (/ws) and Prisma schema => frontend is in port 3001
- docker-compose.yml - launches PostgreSQL for Prisma

Quick run (Windows cmd.exe)

1. Start Postgres

```
   docker-compose up -d
   pnpm run seed
```

2. From project root, install dependencies (runs in each workspace)

```
cd apps/web -> pnpm install
cd apps/api -> pnpm install -> pnpm run seed
```

3. Start api and web in **separate terminals** or use the scripts:

```
cd apps/web -> pnpm run dev
cd apps/api -> pnpm run dev
```

API

- WebSocket endpoint: ws://localhost:3001/ws (server default port 3001)
- REST health check: GET http://localhost:3001/api/health

Notes

- Prisma schema is a starting point; migrations not run automatically. Set DATABASE_URL in `apps/api/.env` before running Prisma commands.
- This is a mock POC: rooms and message history are stored in memory in the server for demonstration only.

Important reminder

- Before starting the API (or running the app), run the Prisma migrations to create/update the database schema:

```powershell
cd "apps/api"
pnpm prisma migrate dev
```

Make sure `DATABASE_URL` is set in `apps/api/.env` (or in your environment) before running the command.

Seed the database (optional)

- After running migrations, you can seed the database with example data using Prisma's seed command:

```powershell
cd "apps/api"
pnpm prisma db seed
```

Ensure that `apps/api/package.json` contains the `prisma.seed` script pointing to your seed file (for example: `"prisma": { "seed": "node prisma\\seed.js" }`) and that the seed file (e.g. `apps/api/prisma/seed.js`) exists.

Seeded users (example)

- The provided seed file creates two example users you can use for testing:

  - email: `alice@example.com` | username: `alice` | password: `pass123`
  - email: `bob@example.com` | username: `bob` | password: `pass123`

  The seed script hashes the passwords before inserting into the database. Use these credentials in the frontend or API testers to sign in or simulate user actions.
