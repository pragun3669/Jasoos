import re

def normalize_code(code: str) -> str:
    if not code:
        return ""

    # Remove comments
    code = re.sub(r"//.*?$|/\*.*?\*/", "", code, flags=re.DOTALL | re.MULTILINE)

    # Remove whitespace and indentation
    code = "\n".join([line.strip() for line in code.split("\n") if line.strip()])

    # Normalize variable names: all alphabetic tokens → VAR
    code = re.sub(r"\b[a-zA-Z_][a-zA-Z0-9_]*\b", "VAR", code)

    # Normalize numbers
    code = re.sub(r"\b\d+\b", "NUM", code)

    return code
