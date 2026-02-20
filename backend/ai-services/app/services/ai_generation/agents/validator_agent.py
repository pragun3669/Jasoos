def validator_agent(state: dict) -> dict:

    for idx, question in enumerate(state.get("questions", [])):

        if not question.get("testCases"):
            question["validation_error"] = "Missing test cases"

        if not question.get("aiSolution"):
            question["validation_error"] = "Missing solution"

    state["validated"] = True
    return state