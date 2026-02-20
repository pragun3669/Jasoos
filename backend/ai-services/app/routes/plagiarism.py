from fastapi import APIRouter
from pydantic import BaseModel

from app.services.plagiarism.plagiarism_service import predict_plagiarism

router = APIRouter(
    prefix="/plagiarism",
    tags=["Plagiarism"]
)


# -------------------------------
# Request Model (same as before)
# -------------------------------
class PairPayload(BaseModel):
    codeA: str
    codeB: str


# -------------------------------
# Health Check
# -------------------------------
@router.get("/health")
def health():
    return {
        "status": "ok",
        "service": "plagiarism"
    }


# -------------------------------
# Predict Endpoint
# -------------------------------
@router.post("/predict")
def predict(payload: PairPayload):

    score = predict_plagiarism(
        payload.codeA,
        payload.codeB
    )

    return {
        "plagiarism_score": score
    }
