# NW WebSocket POC

Proof-of-concept monorepo demonstrating a simple WebSocket chat POC (1:1 chat and group chat).

Structure

- /apps/web - Next.js frontend (Tailwind CSS, Prettier) => frontend is in port 3000
- /apps/api - Express backend with WebSocket endpoint (/ws) and Prisma schema => frontend is in port 3001
- docker-compose.yml - launches PostgreSQL for Prisma

Quick run (Windows cmd.exe)

1. Start Postgres

   docker-compose up -d

2. From project root, install dependencies (runs in each workspace)

```
cd apps/web -> pnpm install
cd apps/api -> pnpm install
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
