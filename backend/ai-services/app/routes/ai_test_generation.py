from fastapi import APIRouter
from app.services.ai_generation.models import (
    AIGenerateRequest,
    AIGenerateResponse
)
from app.services.ai_generation.full_graph import build_full_graph

router = APIRouter()


@router.post("/ai/generate", response_model=AIGenerateResponse)
def generate_full_test(request: AIGenerateRequest):

    graph = build_full_graph()

    # ✅ Build proper state once
    state = {
        "topic": request.topic,
        "difficulty": request.difficulty,
        "count": request.numberOfQuestions
    }

    # ✅ Invoke graph once
    result = graph.invoke(state)

    # ✅ Return full generated question list
    return {
        "questions": result["questions"]
    }
