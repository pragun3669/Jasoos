# app/services/ai_generation/preview_graph.py

from langgraph.graph import StateGraph, END
from app.services.ai_generation.state import TestGenerationState
from app.services.ai_generation.agents.question_agent import question_agent


def build_preview_graph():
    workflow = StateGraph(TestGenerationState)

    workflow.add_node("question_generator", question_agent)

    workflow.set_entry_point("question_generator")
    workflow.add_edge("question_generator", END)

    return workflow.compile()
