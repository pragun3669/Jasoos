import json
import re
from app.services.ai_generation.llm import call_llm


def extract_json(text: str) -> str:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group(0)
    return text


def normalize_input_data(input_data):
    """
    Force inputData to ALWAYS be a string.
    Handles dict, list, nested structures, etc.
    """

    # If already string → return
    if isinstance(input_data, str):
        return input_data.strip()

    # If dictionary (common in string or multi-param problems)
    if isinstance(input_data, dict):
        # Flatten dict values in insertion order
        return " ".join(str(v) for v in input_data.values())

    # If list (rare but possible)
    if isinstance(input_data, list):
        # Convert to bracket format for arrays / linked list style
        return "[" + ", ".join(str(v) for v in input_data) + "]"

    # Fallback
    return str(input_data)


def normalize_expected_output(output):
    if isinstance(output, str):
        return output.strip()
    if isinstance(output, list):
        return "[" + ", ".join(str(v) for v in output) + "]"
    return str(output)


def testcase_agent(state: dict) -> dict:

    for question in state.get("questions", []):

        prompt = f"""
Generate 8 HIGH-QUALITY test cases for the following coding problem.

IMPORTANT RULES:
- inputData MUST be a single string.
- DO NOT return nested JSON.
- If multiple inputs exist, concatenate them with space.
- For arrays, use bracket format like: [1, 2, 3]
- For linked list, use bracket format like: [1, 2, 3]
- For binary trees, use level-order bracket format like: [1, 2, 3, null, 4]
- expectedOutput must also be a string.

Return STRICT JSON only in this format:

{{
  "testCases": [
    {{
      "inputData": "",
      "expectedOutput": ""
    }}
  ]
}}

Problem:
{question["description"]}
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
                "inputData": "[]",
                "expectedOutput": "[]"
            } for _ in range(5)]

        question["testCases"] = []

        for idx, tc in enumerate(testcases):

            raw_input = tc.get("inputData", "")
            raw_output = tc.get("expectedOutput", "")

            input_data = normalize_input_data(raw_input)
            expected_output = normalize_expected_output(raw_output)

            question["testCases"].append({
                "inputData": input_data,
                "expectedOutput": expected_output,
                "exampleCase": idx == 0
            })

    return state