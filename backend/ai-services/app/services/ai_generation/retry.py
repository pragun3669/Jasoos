def safe_execute(agent_func, state, retries=2):
    last_exception = None

    for attempt in range(retries):
        try:
            return agent_func(state)
        except Exception as e:
            last_exception = e
            print(f"⚠ Retry {attempt + 1} failed in {agent_func.__name__}: {e}")

    print(f"❌ Agent {agent_func.__name__} failed after {retries} retries.")

    # store error in state instead of hiding it
    state.setdefault("agent_errors", []).append({
        "agent": agent_func.__name__,
        "error": str(last_exception)
    })

    return state