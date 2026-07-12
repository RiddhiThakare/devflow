# DevFlow — CI/CD Pipeline Engine

A full-stack CI/CD platform that lets developers define pipelines in YAML, execute them in isolated environments, and watch logs stream live in real time.

**Live Demo:** [devflow-gamma-sable.vercel.app](https://devflow-gamma-sable.vercel.app)  
**Backend API:** [devflow-production-ee94.up.railway.app](https://devflow-production-ee94.up.railway.app/health)

---

## Features

- Define CI/CD pipelines in YAML with a target Git repo and steps
- Trigger pipeline runs via the UI or REST API
- Clones the repo and executes each step in an isolated environment
- Streams logs live to the browser via WebSocket in real time
- Tracks run history, status, and metrics per project
- JWT authentication with role-based access control
- Redis-backed rate limiting on pipeline triggers
- Deployed on Railway (backend + PostgreSQL + Redis) and Vercel (frontend)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | NestJS, TypeScript |
| Queue | BullMQ + Redis |
| Database | PostgreSQL + Prisma ORM |
| Real-time | Socket.io (WebSockets) |
| Execution | Docker (local) / child_process (production) |
| Auth | JWT + bcrypt |
| Deployment | Railway + Vercel |

---

## Pipeline YAML Format

```yaml
name: Build and Test
repo: https://github.com/your-username/your-repo.git
steps:
  - name: Install dependencies
    run: npm install
  - name: Run tests
    run: npm test
  - name: Build
    run: npm run build
```

---

## Local Development

### Prerequisites
- Node.js 18+
- Docker Desktop
- PostgreSQL
- Redis (or `docker run -d -p 6379:6379 redis`)

### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

**backend/.env**
DATABASE_URL=postgresql://postgres:password@localhost:5432/devflow
JWT_SECRET=your-secret-key
REDIS_HOST=localhost
REDIS_PORT=6379

**frontend/.env**
VITE_API_URL=http://localhost:3000