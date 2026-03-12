from fastapi import FastAPI  # Import FastAPI framework
from fastapi.middleware.cors import CORSMiddleware  # Import CORS (security)
from app.routers import auth, companies, projects, issues, users, comments


# API Framework

app = FastAPI(  # Create the API application
    title="Issue Tracker API",
    version="1.0.0"
)

app.add_middleware(  # Add CORS middleware
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Allow frontend to call backend
    allow_credentials=True,  # Allow cookies
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
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