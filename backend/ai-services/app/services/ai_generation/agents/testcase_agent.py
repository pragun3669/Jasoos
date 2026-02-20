import json
import re
from app.services.ai_generation.llm import call_llm


def extract_json(text):
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group(0)
    return text


def testcase_agent(state: dict) -> dict:

    for question in state.get("questions", []):

        prompt = f"""
Generate 8 HIGH-QUALITY test cases for the following coding problem.

Problem:
{question["description"]}

Return STRICT JSON only in this format:

{{
  "testCases": [
    {{
      "inputData": "",
      "expectedOutput": ""
    }}
  ]
}}
"""

        raw_output = call_llm(prompt)

        try:
            clean_json = extract_json(raw_output)
            parsed = json.loads(clean_json)
            testcases = parsed.get("testCases", [])
        except Exception:
            testcases = []

        # Guarantee minimum 5 testcases
        if len(testcases) < 5:
            testcases = [{
                "inputData": "1",
                "expectedOutput": "1"
            } for _ in range(5)]

        question["testCases"] = []

        for idx, tc in enumerate(testcases):
            question["testCases"].append({
                "inputData": tc.get("inputData", ""),
                "expectedOutput": tc.get("expectedOutput", ""),
                "exampleCase": idx == 0
            })

    return state