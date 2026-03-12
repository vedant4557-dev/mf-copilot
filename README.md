# MF Copilot — AI Mutual Fund Intelligence Platform

> An AI-powered mutual fund analytics and insights platform for Indian retail investors.
> Built as a production-grade monorepo with CAS import, AMFI NAV pipeline, quantitative analytics, and RAG-powered AI advisor.

---

## Architecture

```
apps/
├── web/          → Next.js 14 + TypeScript + Tailwind (Vercel)
└── api/          → Express.js + TypeScript + Prisma (AWS ECS)

packages/
├── analytics/    → XIRR, Sharpe, Sortino, Monte Carlo, Drawdown
├── ai/           → Claude API wrapper + RAG knowledge base
├── data/         → Fund types, Zod schemas, constants
└── utils/        → Finance helpers, formatters

services/
├── cas-parser/         → Python FastAPI — CAMS/KFintech PDF parser
├── ingestion-service/  → Node.js cron — AMFI NAV pipeline (11:30 PM IST)
├── ai-service/         → Claude + RAG orchestration
└── analytics-engine/   → Python Pandas — heavy number crunching

infra/
├── schema.sql          → PostgreSQL 16 schema (8 tables, partitioned nav_history)
├── docker-compose.yml  → Full local/prod stack
├── nginx.conf          → TLS, rate limiting, WebSocket proxy
└── .github/workflows/  → CI/CD: GitHub Actions → ECR → ECS + Vercel
```

---

## Quick Start (local)

### Prerequisites
- Node.js 20+, pnpm 9+
- Docker + Docker Compose
- Python 3.12+ (for CAS parser)

### 1. Clone and install
```bash
git clone https://github.com/yourname/mf-copilot.git
cd mf-copilot
cp .env.example .env          # fill in secrets
pnpm install
```

### 2. Start infrastructure
```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```

### 3. Run DB migrations
```bash
pnpm db:migrate               # runs Prisma migrations
psql -U mfcopilot mfcopilot < infra/schema.sql   # or raw SQL
```

### 4. Start services
```bash
pnpm dev                      # starts all apps via Turborepo
```

### 5. CAS Parser (separate terminal)
```bash
cd services/cas-parser
pip install -r requirements.txt
uvicorn main:app --reload --port 5000
```

URLs:
- Frontend: http://localhost:3000
- API:       http://localhost:4000
- CAS Parser: http://localhost:5000

---

## Full Production Deployment

### Docker Compose (VPS / DigitalOcean Droplet)
```bash
# Copy SSL certs to infra/ssl/
cp fullchain.pem infra/ssl/
cp privkey.pem   infra/ssl/

# Set environment variables
cp .env.example .env
# Edit .env with production values

# Start everything
docker compose -f infra/docker-compose.yml up -d
```

### AWS ECS + Vercel (recommended for scale)
1. Push to `main` branch
2. GitHub Actions CI/CD runs automatically:
   - Lint → Test → Build Docker images
   - Push to Amazon ECR
   - Deploy API to ECS Fargate (rolling update)
   - Deploy Web to Vercel (auto)

See `.github/workflows/ci-cd.yml` for full pipeline.

---

## Key Features

| Feature | Stack |
|---|---|
| CAS PDF Import | Python + Camelot + Tabula + PyPDF2 |
| Daily NAV sync | Node.js + node-cron + AMFI API |
| Portfolio analytics | XIRR · Sharpe · Sortino · Monte Carlo |
| Tax engine | LTCG/STCG · ₹1.25L exemption · Harvesting |
| Corporate actions | Dividend · Bonus · Merger adjustments |
| AI Advisor | Claude API + RAG (SEBI + AMFI knowledge base) |
| Real-time NAV | WebSocket (Socket.io) + Redis pub/sub |
| Auth | Supabase Auth + JWT + Aadhaar KYC (DigiLocker) |
| Payments | Razorpay subscriptions |
| Security | Helmet · Rate limiting · AWS KMS encryption · DPDP Act |

---

## Compliance

This platform provides **analytics and insights only** and does **not execute trades**.

Users should consult a SEBI-registered investment adviser for personalised advice.

Compliant with:
- SEBI Investment Adviser Regulations 2013
- Digital Personal Data Protection Act 2023 (DPDP)
- Finance Act 2024 (tax treatment)

---

## Environment Variables

See `.env.example` for all required variables. In production, use **Doppler** or **AWS Secrets Manager**.

Required:
- `DATABASE_URL` — PostgreSQL connection
- `REDIS_URL` — Redis connection
- `ANTHROPIC_API_KEY` — Claude AI
- `JWT_SECRET` — min 32 chars
- `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`
- `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`
