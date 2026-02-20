from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import plagiarism, proctoring
from app.routes import ai_test_generation


# -------------------------------
# Create FastAPI App
# -------------------------------
app = FastAPI(
    title="AI Smart Proctoring Unified Server",
    description="Unified backend for Plagiarism Detection and AI Proctoring and agentic ai",
    version="1.0.0"
)


# -------------------------------
# Global CORS (since frontend + Spring will call this)
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # You can restrict later in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------
# Include Routers
# -------------------------------
app.include_router(plagiarism.router)
app.include_router(proctoring.router)
app.include_router(ai_test_generation.router)


# -------------------------------
# Root Endpoint
# -------------------------------
@app.get("/")
def root():
    return {
        "message": "AI Services Running",
        "services": [
            "Plagiarism Detection",
            "AI Video Proctoring"
        ],
        "endpoints": {
            "plagiarism": "/plagiarism/*",
            "proctoring": "/proctoring/*"
        }
    }


# -------------------------------
# Unified Health Check
# -------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok",
        "services": {
            "plagiarism": "active",
            "proctoring": "active"
        }
    }
