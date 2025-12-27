# API Stress Lab

A SaaS MVP for load testing APIs using OpenAPI specs. Upload your spec, configure your test, and get actionable performance insights.

![API Stress Lab](https://via.placeholder.com/800x400/0f172a/3b82f6?text=API+Stress+Lab)

## Features

- 📄 **OpenAPI Integration** - Upload OpenAPI 3.x specs (JSON/YAML) and auto-generate test scenarios
- 📊 **Rich Reports** - Latency percentiles (p50/p95/p99), RPS curves, error breakdowns
- 🔧 **Chaos Testing** - Inject latency, simulate failures, test burst traffic
- 🎯 **Bottleneck Detection** - AI-powered hints identify issues and suggest fixes
- 🔒 **Secure by Default** - SSRF protection, encrypted secrets, multi-tenant isolation
- ⚡ **Fast Setup** - Run locally with Docker Compose

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend API**: FastAPI (Python)
- **Worker/Queue**: Celery + Redis
- **Database**: PostgreSQL
- **Object Storage**: MinIO (S3-compatible)
- **Load Runner**: k6
- **Charts**: Recharts

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### 1. Clone and Setup

```bash
# Clone the repository
cd "api stress lab"

# Copy environment file
cp .env.example .env
```

### 2. Start Services

```bash
docker-compose up --build
```

This starts all services:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000
- **MinIO Console**: http://localhost:9001

### 3. Create Account

1. Open http://localhost:3000
2. Click "Get Started" or navigate to /signup
3. Create an account with email and password

### 4. Happy Path Test Flow

#### Step 1: Create a Project
1. Click "New Project" on the dashboard
2. Enter a name like "My API Test"
3. Click "Create Project"

#### Step 2: Configure the Project
1. Set **Base URL**: `https://jsonplaceholder.typicode.com`
2. Leave auth empty (this API doesn't require auth)
3. Click "Save Configuration"

#### Step 3: Upload OpenAPI Spec
1. Click "Upload Spec"
2. Select `samples/jsonplaceholder.json` from this repo
3. Wait for upload confirmation

#### Step 4: Generate Scenario
1. Click "Generate Scenario →" next to the uploaded spec
2. A scenario will be created with weighted endpoints

#### Step 5: Run Load Test
1. Click "Run Test" on the scenario
2. Configure test parameters:
   - **Load Profile**: Smoke (for quick test)
   - **Duration**: 30 seconds
   - **Virtual Users**: 5
3. Optional: Enable chaos toggles
4. Click "🚀 Start Load Test"

#### Step 6: View Report
1. Wait for test to complete (watch the status)
2. View detailed metrics:
   - Latency over time (p50/p95/p99)
   - RPS over time
   - Status code distribution
   - Endpoint breakdown
   - Bottleneck hints

## Sample OpenAPI Specs

Two sample specs are included in `/samples`:

1. **jsonplaceholder.json** - JSONPlaceholder API (public, no auth)
2. **petstore.yaml** - Pet Store API (public, no auth)

## API Endpoints

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user

### Projects
- `GET /projects` - List projects
- `POST /projects` - Create project
- `GET /projects/{id}` - Get project
- `PATCH /projects/{id}` - Update project
- `POST /projects/{id}/auth` - Set auth credentials
- `POST /projects/{id}/spec` - Upload OpenAPI spec
- `POST /projects/{id}/scenario/generate` - Generate scenario

### Runs
- `POST /runs` - Start a test run
- `GET /runs/{id}` - Get run status
- `GET /runs/{id}/report` - Get full report

## Tier Limits

| Tier | Monthly Requests | Per-Run Max | Max Duration | Max VUs |
|------|------------------|-------------|--------------|---------|
| Free | 10,000 | 1,000 | 60s | 10 |
| Dev | 100,000 | 10,000 | 300s | 50 |
| Pro | 1,000,000 | 100,000 | 600s | 200 |

## Security Features

### SSRF Protection
- Blocks private IP ranges (10.x, 172.16.x, 192.168.x, etc.)
- Blocks localhost and link-local addresses
- Blocks cloud metadata endpoints (169.254.169.254)
- Only allows HTTP/HTTPS schemes

### Secrets Management
- Auth credentials encrypted at rest using Fernet (AES-128)
- Encryption key configured via environment variable

### Multi-Tenancy
- All data isolated by user ID
- JWT-based authentication
- API key support for programmatic access

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | Database user | apistress |
| `POSTGRES_PASSWORD` | Database password | apistress123 |
| `POSTGRES_DB` | Database name | apistresslab |
| `MINIO_ROOT_USER` | MinIO access key | minioadmin |
| `MINIO_ROOT_PASSWORD` | MinIO secret key | minioadmin123 |
| `JWT_SECRET` | JWT signing secret | (change in prod!) |
| `ENCRYPTION_KEY` | Secrets encryption key | (change in prod!) |

## Development

### Running Backend Only
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Running Frontend Only
```bash
cd frontend
npm install
npm run dev
```

### Running Worker Only
```bash
cd backend
celery -A app.worker.celery_app worker --loglevel=info
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│   FastAPI   │────▶│  PostgreSQL │
│  Frontend   │     │   Backend   │     │   Database  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │    Redis    │
                   │    Queue    │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐     ┌─────────────┐
                   │   Celery    │────▶│     k6      │
                   │   Worker    │     │ Load Runner │
                   └──────┬──────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │    MinIO    │
                   │   Storage   │
                   └─────────────┘
```

## Troubleshooting

### Services won't start
```bash
docker-compose down -v
docker-compose up --build
```

### Database connection issues
```bash
docker-compose logs postgres
```

### Worker not processing jobs
```bash
docker-compose logs worker
```

### Frontend can't reach API
Check CORS configuration and ensure API is running on port 8000.

## License

MIT License - See LICENSE file for details.

---

Built with ❤️ for developers who care about API performance.
