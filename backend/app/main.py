from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi.staticfiles import StaticFiles
import os
import sentry_sdk
from app.routers import auth, companies, projects, issues, users, comments, attachments, invites
from app.limiter import limiter

# Sentry monitoring — only active when SENTRY_DSN is set
sentry_dsn = os.getenv("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(dsn=sentry_dsn, traces_sample_rate=0.1)

app = FastAPI(
    title="Issue Tracker API",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)
# Include routers
app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(projects.router)
app.include_router(issues.router)
app.include_router(users.router)

app.include_router(comments.router)
app.include_router(attachments.router)
app.include_router(invites.router)

# Serve uploaded files
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")  # Create endpoint at "/"
def read_root():  # This function runs when someone visits "/"
    return {"message": "Issue Tracker API", "status": "running"}

@app.get("/health")  # Create endpoint at "/health"
def health_check():
    return {"status": "healthy"}