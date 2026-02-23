# app/services/ai_generation/agents/question_agent.py

import json
from app.services.ai_generation.llm import call_llm


def question_agent(state: dict) -> dict:
    topic = state["topic"]
    difficulty = state["difficulty"]
    count = state["count"]

    prompt = f"""
Generate {count} UNIQUE competitive programming (CP-style) DSA coding questions.

Topic: {topic}
Difficulty: {difficulty}

IMPORTANT:
This platform uses STANDARD INPUT / STANDARD OUTPUT (like CodeChef / Codeforces).

Each question must follow STRICT Competitive Programming format.

Requirements:
- Coding type problem
- NO solution
- NO implementation hints
- NO test case JSON section
- Clear and professional formatting
- Each question must be completely different

Each problem description MUST include:

1. Problem Statement (clear context)
2. Input Format section
   - Clearly explain how input is read from STDIN.
   - Example:
       First line contains integer n.
       Second line contains n space-separated integers.
3. Output Format section
   - Clearly explain what to print to STDOUT.
4. Constraints (realistic CP bounds like 1 ≤ n ≤ 10^5)
5. At least 2 Examples
   Each example must show:
       Input:
       <exact stdin format>
       Output:
       <exact expected output>
       Explanation:

STRICT RULES:
- DO NOT use LeetCode-style function signature.
- DO NOT mention class Solution.
- DO NOT include function-only problems.
- DO NOT include markdown.
- Return STRICT JSON only.

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
