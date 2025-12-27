from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import auth, projects, runs, billing

app = FastAPI(
    title="API Stress Lab",
    description="Load testing SaaS for APIs using OpenAPI specs",
    version="1.0.0"
)

# CORS - Always allow localhost:3000 for development
origins = settings.cors_origins.split(",") if settings.cors_origins else []
if "http://localhost:3000" not in origins:
    origins.append("http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(runs.router)
app.include_router(billing.router)


@app.get("/")
def root():
    return {"message": "API Stress Lab API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
