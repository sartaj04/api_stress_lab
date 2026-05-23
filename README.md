# API Stress Lab

API Stress Lab is an open-source, AI-powered tool and dashboard for load testing APIs using OpenAPI specifications. Upload your spec, configure your test parameters, and get actionable, real-time performance insights with AI-driven analysis.

It is designed to be easily run locally using Docker Compose or deployed to free-tier cloud platforms.

![API Stress Lab Banner](frontend/public/og-image-home.png)

## Features

- 📄 **OpenAPI Integration** - Upload OpenAPI 3.x specs (JSON/YAML) and auto-generate test scenarios using AI.
- 📊 **Rich Reports & Metrics** - Real-time metrics including latency percentiles (p50/p95/p99), RPS curves, and error breakdowns.
- 🔧 **Chaos Testing** - Inject latency, simulate failures, and test burst traffic to evaluate API resilience.
- 🎯 **Bottleneck Detection** - AI-powered analysis to identify performance bottlenecks and suggest actionable fixes.
- 🔒 **Secure by Default** - Built-in SSRF protection, encrypted credential storage, and user data isolation.
- ⚡ **Fast Setup** - Run the entire stack locally with a single Docker Compose command.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend API**: FastAPI (Python)
- **Worker/Queue**: Celery + Redis
- **Database**: PostgreSQL
- **Object Storage**: MinIO (S3-compatible) or Cloudflare R2
- **Load Runner**: k6
- **Charts**: Recharts

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
                    ┌─────────────┐
                    │   Celery    │────▶│     k6      │
                    │   Worker    │     │ Load Runner │
                    └──────┬──────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  MinIO/R2   │
                    │   Storage   │
                    └─────────────┘
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/api_stress_lab.git
cd api_stress_lab

# Copy environment file template
cp env.example.txt .env
```

### 2. Start Services

To start the entire stack locally:

```bash
docker-compose up --build
```

Once loaded, the services will be available at:
- **Frontend Web UI**: http://localhost:3000
- **FastAPI Backend**: http://localhost:8000
- **MinIO Object Console**: http://localhost:9001

### 3. Create an Account

1. Open http://localhost:3000 in your browser.
2. Click **Get Started** or navigate to `/signup`.
3. Create an account with an email and password.

### 4. Running a Test Scenario

#### Step 1: Create a Project
- Click **New Project** on the dashboard, enter a name (e.g., "User Service API"), and click **Create Project**.

#### Step 2: Configure the Project
- Set the **Base URL** (e.g., `https://jsonplaceholder.typicode.com`) and optional authorization credentials, then save the configuration.

#### Step 3: Upload OpenAPI Spec
- Click **Upload Spec** and choose a sample file (e.g., `samples/jsonplaceholder.json` from this repository).

#### Step 4: Generate Scenario
- Click **Generate Scenario** next to the uploaded spec to auto-generate endpoint test scenarios with default weights.

#### Step 5: Run Load Test
- Click **Run Test** on the generated scenario.
- Configure parameters such as **Load Profile** (e.g., Smoke, Load, Stress), **Duration**, and **Virtual Users (VUs)**.
- Optional: Enable chaos options (inject latency or error rates).
- Click **🚀 Start Load Test**.

#### Step 6: View Performance Report
- Monitor the test run progress.
- Once completed, analyze the generated reports including latency over time, request breakdown, and AI-powered bottleneck hints.

## Sample OpenAPI Specs

Two sample specs are included in the `/samples` directory for testing:

1. **jsonplaceholder.json** - JSONPlaceholder API (public, no authentication required).
2. **petstore.yaml** - Pet Store API (public, no authentication required).

## API Endpoints

### Authentication
- `POST /auth/signup` - Register a new account
- `POST /auth/login` - Authenticate and retrieve token
- `GET /auth/me` - Retrieve current user profile

### Projects
- `GET /projects` - List all projects
- `POST /projects` - Create a new project
- `GET /projects/{id}` - Retrieve project configuration
- `PATCH /projects/{id}` - Update project parameters
- `POST /projects/{id}/auth` - Set authentication credentials
- `POST /projects/{id}/spec` - Upload OpenAPI specification
- `POST /projects/{id}/scenario/generate` - Generate load test scenario

### Runs
- `POST /runs` - Trigger a load test run
- `GET /runs/{id}` - Retrieve run status
- `GET /runs/{id}/report` - Retrieve detailed performance report

## Security Features

### SSRF Protection
- Out-of-the-box protection blocks private IP ranges (`10.x`, `172.16.x`, `192.168.x`), localhost, and loopback/link-local addresses to prevent Server-Side Request Forgery.
- Blocks access to cloud metadata endpoints (`169.254.169.254`).
- Strictly permits HTTP and HTTPS protocols.

### Credentials Encryption
- User-supplied API keys and credentials are encrypted at rest using **Fernet (AES-128)** encryption.
- Encryption key is configured via the `ENCRYPTION_KEY` environment variable.

### User Isolation & Auth
- Secure data isolation by user account.
- JWT-based authentication for API endpoints.

## Environment Variables

| Variable | Description | Default / Example |
|----------|-------------|-------------------|
| `DATABASE_URL` | PostgreSQL Connection URI | `postgresql://apistress:apistress123@localhost:5432/apistresslab` |
| `REDIS_URL` | Redis connection URI | `redis://localhost:6379/0` |
| `S3_ENDPOINT` | S3/Object Storage Endpoint | Local MinIO or Cloudflare R2 |
| `S3_ACCESS_KEY` | Access Key ID | Storage service access key |
| `S3_SECRET_KEY` | Secret Access Key | Storage service secret key |
| `JWT_SECRET` | JWT signing secret | (Change to a secure random key in production) |
| `ENCRYPTION_KEY` | Fernet credentials encryption key | (Change to a 32-byte key in production) |

## Development Setup

### Running Backend Independently

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Running Frontend Independently

```bash
cd frontend
npm install
npm run dev
```

### Running Celery Worker Independently

```bash
cd backend
celery -A app.worker.celery_app worker --loglevel=info
```

## Deployment

For a detailed walkthrough on deploying API Stress Lab on free-tier services (Vercel, Render, Supabase, Upstash, Cloudflare R2, and Railway), check the [Deployment Guide](DEPLOYMENT.md).

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
