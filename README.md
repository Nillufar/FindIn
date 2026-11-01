# FindIn

Monorepo for the FindIn project-management and developer-collaboration platform.

## Stack

- React + TypeScript + Vite
- Node.js + Express + TypeScript
- PostgreSQL + Prisma
- Zod for validation
- Docker Compose for local PostgreSQL

## Structure

```text
findin/
├── frontend/                 # React presentation layer
├── backend/                  # Express API and feature modules
│   ├── prisma/               # Database schema and migrations
│   └── src/
│       ├── config/           # Environment configuration
│       ├── lib/              # Shared infrastructure
│       ├── middleware/       # Request middleware
│       ├── modules/          # Feature modules
│       └── server.ts         # API composition root
├── packages/shared/          # Shared API contracts and types
├── docs/                     # Architecture and contribution docs
├── docker-compose.yml
└── .env.example
```

## Run locally

Requirements: Node.js 20+, npm 10+, and Docker.

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run dev
```

Frontend: `http://localhost:5173`  
API: `http://localhost:4000`  
Health check: `curl http://localhost:4000/api/health`

## Branching

```bash
git checkout main
git pull origin main
git checkout -b feature/project-cards
```

Suggested branches include `feature/authentication`, `feature/project-cards`, `feature/project-filtering`, `feature/developer-filtering`, `feature/invitations`, and `feature/frontend-layout`.

Keep commits focused, open pull requests into `main`, and never commit `.env`, passwords, or API keys.
