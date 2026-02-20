from app.services.ai_generation.llm import call_llm

def difficulty_agent(state: dict) -> dict:

    mapping = {
        "Easy": (1, 3),
        "Medium": (4, 7),
        "Hard": (8, 10)
    }

    expected = state.get("difficulty", "Medium")
    min_d, max_d = mapping.get(expected, (1, 10))

    for question in state.get("questions", []):

        prompt = f"""
Rate the difficulty of this programming problem from 1 to 10.

Problem:
{question["description"]}

Return only a number.
"""

        try:
            rating = int(call_llm(prompt).strip())
        except:
            rating = 5

        question["difficulty_rating"] = rating
        question["difficulty_match"] = min_d <= rating <= max_d

    return state