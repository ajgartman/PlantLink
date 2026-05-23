from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.routers import auth, companies, projects, issues, users, comments
from app.limiter import limiter

app = FastAPI(
    title="Issue Tracker API",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

@app.get("/")  # Create endpoint at "/"
def read_root():  # This function runs when someone visits "/"
    return {"message": "Issue Tracker API", "status": "running"}

@app.get("/health")  # Create endpoint at "/health"
def health_check():
    return {"status": "healthy"}