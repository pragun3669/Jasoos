from fastapi import APIRouter, Request
from app.services.proctoring import videoproctoring

router = APIRouter(
    prefix="/proctoring",
    tags=["Proctoring"]
)

# -------------------------------
# Guidelines
# -------------------------------
@router.get("/get-guidelines")
def get_guidelines():
    return videoproctoring.get_guidelines()


# -------------------------------
# Reference Frame
# (Now expects JSON landmarks data from frontend)
# -------------------------------
@router.post("/reference-frame")
async def reference_frame(request: Request):
    data = await request.json()
    return videoproctoring.reference_frame(data)


# -------------------------------
# Start Proctoring
# -------------------------------
@router.post("/start-proctoring")
def start_proctoring():
    return videoproctoring.start_proctoring()


# -------------------------------
# Stop Proctoring
# -------------------------------
@router.post("/stop-proctoring")
def stop_proctoring():
    return videoproctoring.stop_proctoring()


# -------------------------------
# Process Frame
# (Now receives processed analysis JSON from frontend)
# -------------------------------
@router.post("/process-frame")
async def process_frame(request: Request):
    data = await request.json()
    return videoproctoring.process_frame(data)


# -------------------------------
# Run Check
# -------------------------------
@router.post("/run")
def run_check():
    return videoproctoring.run_check()


# -------------------------------
# Health Check
# -------------------------------
@router.get("/health")
def health():
    return {
        "status": "ok",
        "service": "proctoring",
        "mode": "client-side-ai"
    }