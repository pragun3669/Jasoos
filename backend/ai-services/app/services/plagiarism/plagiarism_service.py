# app/services/plagiarism/plagiarism_service.py

PLAGIARISM_ENABLED = False

def predict_plagiarism(codeA: str, codeB: str) -> float:
    if not PLAGIARISM_ENABLED:
        return 0.0
    
    # Future: real model logic here
    return 0.0