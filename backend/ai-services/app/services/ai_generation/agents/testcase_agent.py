import json
import re
from app.services.ai_generation.llm import call_llm


# ===============================
# JSON EXTRACTION
# ===============================
def extract_json(text: str) -> str:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group(0)
    return "{}"


# ===============================
# NORMALIZATION
# ===============================
def normalize_text(value):
    if value is None:
        return ""
    return str(value).strip().replace("\r", "")


# ===============================
# BASIC VALIDATION
# ===============================
def is_valid_testcase(tc):
    if not isinstance(tc, dict):
        return False
    if "inputData" not in tc or "expectedOutput" not in tc:
        return False
    if not isinstance(tc["inputData"], str):
        return False
    if not isinstance(tc["expectedOutput"], str):
        return False
    if tc["inputData"].strip() == "":
        return False
    if tc["expectedOutput"].strip() == "":
        return False
    return True


# ===============================
# INPUT STRUCTURE DETECTION
# ===============================
def detect_input_structure(description: str):
    desc = description.lower()

    # Matrix / Grid
    if any(k in desc for k in ["matrix", "grid", "2d array", "rows and columns"]):
        return (
            "Input format:\nrows cols\nrow1 elements\nrow2 elements\n...",
            "3 3\n1 2 3\n4 5 6\n7 8 9"
        )

    # Two strings
    if (
        "two string" in desc
        or ("string" in desc and "second" in desc)
        or ("text" in desc and "pattern" in desc)
        or ("window" in desc and "substring" in desc)
    ):
        return (
            "Input format:\nstring1\nstring2",
            "ADOBECODEBANC\nABC"
        )

    # Single string
    if "string" in desc and "array" not in desc:
        return (
            "Input format:\nstring",
            "racecar"
        )

    # Two arrays
    if any(k in desc for k in ["two array", "two list", "merge two", "second array"]):
        return (
            "Input format:\nn\narray1 elements\nm\narray2 elements",
            "3\n1 2 3\n3\n4 5 6"
        )

    # Graph
    if any(k in desc for k in ["graph", "edge", "node", "connected"]):
        return (
            "Input format:\nn m\nu1 v1\nu2 v2\n...",
            "4 3\n1 2\n2 3\n3 4"
        )

    # Linked list
    if "linked list" in desc:
        return (
            "Input format:\nn\nnode1 node2 ... nodeN",
            "5\n1 2 3 4 5"
        )

    # Single number
    if any(k in desc for k in ["given n", "given an integer", "single number"]):
        return (
            "Input format:\nn",
            "42"
        )

    # Default: single array
    return (
        "Input format:\nn\narray elements",
        "5\n1 2 3 4 5"
    )


# ===============================
# PROMPT BUILDER
# ===============================
def build_prompt(description: str):
    input_hint, example_input = detect_input_structure(description)
    escaped_example_input = example_input.replace("\n", "\\n")
    return f"""
You are an expert competitive programming test case generator.

PROBLEM:
{description}

DETECTED INPUT FORMAT:
{input_hint}

STRICT RULES:
1. Generate BETWEEN 7 AND 12 test cases.
2. inputData MUST follow EXACTLY the detected input format.
3. DO NOT use brackets like [1,2,3].
4. DO NOT include JSON inside inputData.
5. inputData must simulate exact terminal input.
6. expectedOutput must be exact console output.
7. Cover edge cases and normal cases.
8. Return STRICT JSON only.
9. No explanations.
10. No markdown.

OUTPUT FORMAT:

{{
  "testCases": [
    {{
      "inputData": "{escaped_example_input}",
      "expectedOutput": "example_output"
    }}
  ]
}}
"""


# ===============================
# FILTER TESTCASES
# ===============================
def filter_testcases(testcases, description):
    valid_cases = []

    input_hint, _ = detect_input_structure(description)
    desc = description.lower()

    for tc in testcases:
        if not is_valid_testcase(tc):
            continue

        input_data = normalize_text(tc["inputData"])
        expected_output = normalize_text(tc["expectedOutput"])

        # Reject bracket / JSON style
        if any(c in input_data for c in ["[", "]", "{", "}"]):
            continue

        # Ensure multi-line when required
        if "string1\nstring2" in input_hint and "\n" not in input_data:
            continue

        # Basic sanity: substring problems shouldn't return only digits
        if (
            "substring" in desc
            and expected_output.isdigit()
        ):
            continue

        valid_cases.append({
            "inputData": input_data,
            "expectedOutput": expected_output
        })

    return valid_cases


# ===============================
# RETRY CALL
# ===============================
def call_with_retry(prompt: str, description: str, max_retries: int = 2):
    for _ in range(max_retries):
        raw_output = call_llm(prompt)

        try:
            clean_json = extract_json(raw_output)
            parsed = json.loads(clean_json)
            testcases = parsed.get("testCases", [])
        except Exception:
            testcases = []

        valid_cases = filter_testcases(testcases, description)

        if len(valid_cases) >= 5:
            return valid_cases

    return []


# ===============================
# FALLBACK
# ===============================
def get_fallback_cases(description: str):
    _, example_input = detect_input_structure(description)
    return [
        {
            "inputData": example_input,
            "expectedOutput": "0"
        }
        for _ in range(5)
    ]


# ===============================
# MAIN AGENT
# ===============================
def testcase_agent(state: dict) -> dict:
    for question in state.get("questions", []):
        description = question.get("description", "")

        prompt = build_prompt(description)
        valid_cases = call_with_retry(prompt, description)

        if len(valid_cases) < 5:
            valid_cases = get_fallback_cases(description)

        # Cap at 12
        valid_cases = valid_cases[:12]

        question["testCases"] = [
            {
                "inputData": tc["inputData"],
                "expectedOutput": tc["expectedOutput"],
                "exampleCase": idx == 0
            }
            for idx, tc in enumerate(valid_cases)
        ]

    return state