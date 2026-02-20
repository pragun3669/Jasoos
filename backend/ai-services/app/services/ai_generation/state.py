# app/services/ai_generation/state.py

from typing import TypedDict, List, Dict

class TestGenerationState(TypedDict, total=False):
    topic: str
    difficulty: str
    question_type: str
    count: int

    questions: List[Dict]
    selected_indices: List[int]

    final_output: Dict
