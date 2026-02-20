from app.services.ai_generation.llm import call_llm


def solution_agent(state: dict) -> dict:

    for question in state.get("questions", []):

        prompt = f"""
You are a competitive programming expert.

Provide a clean and efficient C++17 solution for the following problem.

Problem:
{question["description"]}

STRICT RULES:
- Return ONLY raw C++ code.
- Do NOT use markdown.
- Do NOT wrap in ```cpp.
- Do NOT add explanation.
- Include necessary includes.
- Include main() if required.
- Ensure code compiles.
"""

        solution = call_llm(prompt).strip()

        # 🔥 Remove accidental markdown if model adds it
        solution = solution.replace("```cpp", "")
        solution = solution.replace("```", "").strip()

        question["aiSolution"] = solution

    return state