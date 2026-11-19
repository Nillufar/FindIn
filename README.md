# FindIn Starter Project

Starter monorepo for the FindIn project-management and developer-collaboration platform.

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

For Google/GitHub sign-in, configure the OAuth credentials and callback URLs described in `docs/AUTHENTICATION.md`.

### Demo data (local only)

```bash
npm run db:seed:demo
```

This **deletes all local data** and loads students from several majors, companies, clubs, projects, jobs,
collaborations, requests, invitations and announcements. On the login page, click
**Continue as demo student** to sign in as `maya@findin.test` without OAuth keys. That button and the
`/api/auth/dev-login` endpoint only exist when `NODE_ENV=development`.

## Pages

| Path | What it does |
|---|---|
| `/` | Log in / sign up with Google or GitHub |
| `/welcome` | First-time profile setup (university, major) |
| `/explore` | Tabs for Projects, Jobs, Collaborations and People |
| `/posts/:id` | Post details; apply or request to join; owners review requests, invite people, post announcements |
| `/posts/new` | Create a project, job or collaboration |
| `/profile`, `/people/:id` | Profiles with "Works at …" / "Member of …" badges and experience |
| `/organizations/:id` | Company, school or club page with members, open posts and announcements |
| `/dashboard` | Requests to review, applications, invitations, my posts and announcements |

Accepting someone for a **job** that belongs to an organization adds that role to their profile
automatically (for example "Works at Bright Labs").

Frontend: `http://localhost:5173`  
API: `http://localhost:4000`  
Health check: `curl http://localhost:4000/api/health`

## Branching

```bash
git checkout main
git pull origin main
git checkout -b feature/project-cards
```

Suggested branches include `feature/authentication`, `feature/project-cards`, `feature/project-filtering`,
`feature/developer-filtering`, `feature/invitations`, and `feature/frontend-layout`.

Keep commits focused, open pull requests into `main`, and never commit `.env`, passwords, or API keys.
