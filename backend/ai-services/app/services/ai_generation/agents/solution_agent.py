from app.services.ai_generation.llm import call_llm


def solution_agent(state: dict) -> dict:

    for question in state.get("questions", []):

        prompt = f"""
You are a competitive programming expert.

Provide a clean and efficient C++17 solution.

IMPORTANT:
- Read input using standard input (cin).
- Print output using cout.
- Do NOT use class Solution.
- Include main().
- Follow EXACT input format described in the problem.
- Ensure solution runs in O(N) or required complexity.
- Include necessary headers.
- Code must compile.

Problem:
{question["description"]}

STRICT RULES:
- Return ONLY raw C++ code.
- No markdown.
- No explanations.
"""

        solution = call_llm(prompt).strip()

        # 🔥 Remove accidental markdown if model adds it
        solution = solution.replace("```cpp", "")
        solution = solution.replace("```", "").strip()

        question["aiSolution"] = solution

    return state