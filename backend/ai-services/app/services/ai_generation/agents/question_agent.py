# app/services/ai_generation/agents/question_agent.py

import json
from app.services.ai_generation.llm import call_llm


def question_agent(state: dict) -> dict:
    topic = state["topic"]
    difficulty = state["difficulty"]
    count = state["count"]

    prompt = f"""
Generate {count} UNIQUE DSA coding questions.

Topic: {topic}
Difficulty: {difficulty}

Each question must follow a LeetCode-style structure and be highly detailed.

Requirements:
- Coding type problem
- NO solution
- NO implementation hints
- NO test case section
- Clear and professional formatting
- Each question must be completely different

Each problem description MUST include:

1. Problem Statement (clear real-world or abstract context)
2. Function Signature (e.g., implement function solve(...) )
3. Input Format
4. Output Format
5. Constraints (realistic bounds like 1 ≤ n ≤ 10^5)
6. At least 2 Examples
   - Input
   - Output
   - Explanation

Return STRICT JSON only.

Format:
{{
  "questions": [
    {{
      "title": "",
      "description": "",
      "estimated_complexity": ""
    }}
  ]
}}

Return ONLY valid JSON.
"""

    raw_output = call_llm(prompt)

    try:
        parsed = json.loads(raw_output)
    except Exception:
        repair_prompt = f"""
Return ONLY valid JSON in this format:

{{
  "questions": [
    {{
      "title": "",
      "description": "",
      "estimated_complexity": ""
    }}
  ]
}}

Topic: {topic}
Difficulty: {difficulty}
Count: {count}
"""
        repaired_output = call_llm(repair_prompt)
        parsed = json.loads(repaired_output)

    state["questions"] = []

    for q in parsed["questions"]:
        state["questions"].append({
            "title": q.get("title", ""),
            "description": q.get("description", ""),
            "complexity": q.get("estimated_complexity", ""),
            "testCases": [],
            "solution": ""
        })

    return state
