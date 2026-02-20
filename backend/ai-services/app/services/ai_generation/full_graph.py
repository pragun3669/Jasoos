from langgraph.graph import StateGraph, END
from app.services.ai_generation.agents.question_agent import question_agent
from app.services.ai_generation.agents.testcase_agent import testcase_agent
from app.services.ai_generation.agents.solution_agent import solution_agent
from app.services.ai_generation.agents.difficulty_agent import difficulty_agent
from app.services.ai_generation.agents.validator_agent import validator_agent
from app.services.ai_generation.retry import safe_execute


def build_full_graph():

    workflow = StateGraph(dict)

    workflow.add_node("generate_question",
        lambda state: safe_execute(question_agent, state)
    )

    workflow.add_node("generate_testcases",
        lambda state: safe_execute(testcase_agent, state)
    )

    workflow.add_node("generate_solution",
        lambda state: safe_execute(solution_agent, state)
    )

    workflow.add_node("check_difficulty",
        lambda state: safe_execute(difficulty_agent, state)
    )

    workflow.add_node("validate",
        lambda state: safe_execute(validator_agent, state)
    )

    workflow.set_entry_point("generate_question")

    workflow.add_edge("generate_question", "generate_testcases")
    workflow.add_edge("generate_testcases", "generate_solution")
    workflow.add_edge("generate_solution", "check_difficulty")
    workflow.add_edge("check_difficulty", "validate")
    workflow.add_edge("validate", END)

    return workflow.compile()