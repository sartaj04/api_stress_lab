# Free Tier Deployment Guide

Deploy API Stress Lab for **$0/month** using free tiers from multiple providers.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FREE TIER STACK                          │
│                                                             │
│   ┌───────────────┐         ┌───────────────┐              │
│   │    Vercel     │────────▶│    Render     │              │
│   │  (Frontend)   │  API    │   (Backend)   │              │
│   │   Next.js     │ Calls   │   FastAPI     │              │
│   └───────────────┘         └───────┬───────┘              │
│                                     │                       │
│                 ┌───────────────────┼───────────────────┐  │
│                 │                   │                   │  │
│                 ▼                   ▼                   ▼  │
│   ┌─────────────────┐  ┌─────────────────┐  ┌───────────┐ │
│   │    Supabase     │  │     Upstash     │  │ Cloudflare│ │
│   │   PostgreSQL    │  │      Redis      │  │    R2     │ │
│   │   (Database)    │  │  (Cache/Queue)  │  │ (Storage) │ │
│   └─────────────────┘  └─────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- GitHub account with repo: `sartaj04/api_stress_lab`
- Email address for signing up to services

## Total Setup Time: ~30 minutes

---

## Step 1: Supabase (PostgreSQL Database)

**Time: 5 minutes**

### 1.1 Create Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" and sign up with GitHub

### 1.2 Create Project
1. Click "New Project"
2. Fill in:
   - **Organization**: Create new or select existing
   - **Project name**: `api-stress-lab`
   - **Database password**: Click "Generate" and **SAVE THIS PASSWORD**
   - **Region**: Select closest to you (EU West for London)
3. Click "Create new project"
4. Wait ~2 minutes for provisioning

### 1.3 Get Connection String
1. Go to **Settings** (gear icon) → **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your saved password

**Save this value:**
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

---

## Step 2: Upstash (Redis)

**Time: 3 minutes**

### 2.1 Create Account
1. Go to [console.upstash.com](https://console.upstash.com)
2. Sign up with GitHub or email

### 2.2 Create Database
1. Click "Create Database"
2. Fill in:
   - **Name**: `api-stress-lab`
   - **Type**: Regional
   - **Region**: US-West-1 (Oregon) - matches Render
3. Click "Create"

### 2.3 Get Connection URL
1. On the database page, scroll to **Details**
2. Find the Redis URL (starts with `rediss://`)

**Save this value:**
```
REDIS_URL=rediss://default:xxxxx@us1-xxxxx.upstash.io:6379
```

---

## Step 3: Cloudflare R2 (Object Storage)

**Time: 5 minutes**

### 3.1 Create Account
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sign up for free account

### 3.2 Create Buckets
1. In left sidebar, click **R2 Object Storage**
2. Click "Create bucket" and create these 3 buckets:
   - `specs`
   - `artifacts`
   - `reports`

### 3.3 Create API Token
1. Go to **R2** → **Manage R2 API Tokens**
2. Click "Create API Token"
3. Configure:
   - **Token name**: `api-stress-lab`
   - **Permissions**: Object Read and Write
   - **Specify bucket(s)**: Select all 3 buckets
4. Click "Create API Token"
5. **COPY BOTH KEYS IMMEDIATELY** (shown only once)

### 3.4 Get Account ID
1. Look at your browser URL or R2 overview page
2. Find your Account ID (32-character string)

**Save these values:**
```
S3_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
S3_ACCESS_KEY=your_access_key_id
S3_SECRET_KEY=your_secret_access_key
```

---

## Step 4: Render (Backend API)

**Time: 10 minutes**

### 4.1 Create Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### 4.2 Create Web Service
1. Click **New** → **Web Service**
2. Connect your GitHub repo: `sartaj04/api_stress_lab`
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `api-stress-lab` |
| **Region** | Oregon (US West) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free |

### 4.3 Add Environment Variables
Click **Advanced** → **Add Environment Variable** for each:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Supabase connection string |
| `REDIS_URL` | Your Upstash Redis URL |
| `S3_ENDPOINT` | Your Cloudflare R2 endpoint |
| `S3_ACCESS_KEY` | Your R2 access key |
| `S3_SECRET_KEY` | Your R2 secret key |
| `S3_BUCKET_SPECS` | `specs` |
| `S3_BUCKET_ARTIFACTS` | `artifacts` |
| `S3_BUCKET_REPORTS` | `reports` |
| `JWT_SECRET` | Click "Generate" button |
| `ENCRYPTION_KEY` | Click "Generate" button |
| `CORS_ORIGINS` | `https://temp.vercel.app` |

### 4.4 Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Copy your URL: `https://api-stress-lab.onrender.com`

---

## Step 5: Vercel (Frontend)

**Time: 5 minutes**

### 5.1 Create Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### 5.2 Import Project
1. Click **Add New** → **Project**
2. Import `sartaj04/api_stress_lab`

### 5.3 Configure
| Setting | Value |
|---------|-------|
| **Root Directory** | `frontend` |
| **Framework** | Next.js (auto-detected) |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |

### 5.4 Add Environment Variable
| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://api-stress-lab.onrender.com` |

### 5.5 Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. Copy your URL: `https://api-stress-lab.vercel.app`

---

## Step 6: Update CORS on Render

**Time: 1 minute**

1. Go to Render Dashboard → Your service → **Environment**
2. Find `CORS_ORIGINS`
3. Update value to your actual Vercel URL:
   ```
   https://api-stress-lab.vercel.app
   ```
4. Click "Save Changes"
5. Render will auto-redeploy

---

## Step 7: Run Database Migrations

**Time: 2 minutes**

### Option A: Using Render Shell
1. Go to Render Dashboard → Your service
2. Click **Shell** tab
3. Run:
   ```bash
   alembic upgrade head
   ```

### Option B: Using Render Console
1. Go to Render Dashboard → Your service
2. Click **Logs** tab, then **Shell**
3. Run the same command

### Verify Migration
```bash
alembic current
```

---

## Verification Checklist

Test each of these after deployment:

- [ ] **Backend Health**: `https://your-api.onrender.com/health`
  - Should return: `{"status": "healthy"}`

- [ ] **API Docs**: `https://your-api.onrender.com/docs`
  - Should show Swagger UI

- [ ] **Frontend**: `https://your-app.vercel.app`
  - Should load the homepage

- [ ] **Sign Up**: Create a new account
  - Should succeed and redirect to dashboard

- [ ] **Login**: Log in with created account
  - Should succeed

---

## Environment Variables Summary

### Backend (Render)

| Variable | Source | Example |
|----------|--------|---------|
| `DATABASE_URL` | Supabase | `postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres` |
| `REDIS_URL` | Upstash | `rediss://default:xxx@us1-xxx.upstash.io:6379` |
| `S3_ENDPOINT` | Cloudflare | `https://xxx.r2.cloudflarestorage.com` |
| `S3_ACCESS_KEY` | Cloudflare | `xxx` |
| `S3_SECRET_KEY` | Cloudflare | `xxx` |
| `S3_BUCKET_SPECS` | - | `specs` |
| `S3_BUCKET_ARTIFACTS` | - | `artifacts` |
| `S3_BUCKET_REPORTS` | - | `reports` |
| `JWT_SECRET` | Generate | 32+ random characters |
| `ENCRYPTION_KEY` | Generate | 32+ random characters |
| `CORS_ORIGINS` | Vercel URL | `https://your-app.vercel.app` |
| `OPENAI_API_KEY` | OpenAI (optional) | `sk-xxx` |

### Frontend (Vercel)

| Variable | Source | Example |
|----------|--------|---------|
| `NEXT_PUBLIC_API_URL` | Render URL | `https://your-api.onrender.com` |

---

## Free Tier Limitations

| Service | Limit | Impact |
|---------|-------|--------|
| **Render** | Sleeps after 15 min inactivity | First request takes 30-60 sec cold start |
| **Supabase** | 500MB database, 2 projects | Enough for thousands of test runs |
| **Upstash** | 10,000 commands/day | Enough for light-moderate usage |
| **Cloudflare R2** | 10GB storage, 10M requests/mo | Enough for many test artifacts |
| **Vercel** | 100GB bandwidth/mo | Enough for moderate traffic |

---

## Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify all environment variables are set
- Ensure DATABASE_URL has correct password

### Frontend can't reach API
- Check CORS_ORIGINS matches your Vercel URL exactly
- Verify NEXT_PUBLIC_API_URL is set correctly
- Check browser console for errors

### Database connection fails
- Verify Supabase project is active (not paused)
- Check DATABASE_URL format and password
- Ensure you're using the correct connection string

### Redis connection fails
- Verify Upstash database is active
- Check REDIS_URL format (should start with `rediss://`)
- Ensure TLS is enabled (the extra 's' in rediss)

### File uploads fail
- Verify R2 buckets exist with correct names
- Check S3 credentials are correct
- Ensure S3_ENDPOINT includes your account ID

---

## Upgrading from Free Tier

When you need more resources:

| Service | Free → Paid | Starting Price |
|---------|-------------|----------------|
| Render | Starter plan | $7/month |
| Supabase | Pro plan | $25/month |
| Upstash | Pay-as-you-go | $0.20/100k commands |
| Cloudflare R2 | Pay-as-you-go | $0.015/GB/month |
| Vercel | Pro plan | $20/month |

---

## Support

- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Upstash**: [docs.upstash.com](https://docs.upstash.com)
- **Cloudflare R2**: [developers.cloudflare.com/r2](https://developers.cloudflare.com/r2)
- **Render**: [render.com/docs](https://render.com/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)

