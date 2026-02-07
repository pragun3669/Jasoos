from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import numpy as np
import pickle
from fastapi.middleware.cors import CORSMiddleware

# -------------------------------
# IMPORT FEATURE EXTRACTORS
# -------------------------------
from codebert_embeddings import CodeBERTEmbeddingExtractor
from ast_feature_extractor import ASTFeatureExtractor
from similarity_feature_extractor import SimilarityFeatureExtractor
from normalization import normalize_code     # NEW

MODEL_PATH = "best_model_xgboost.pkl"

app = FastAPI()

# -------------------------------
# CORS
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# LOAD EXTRACTORS
# -------------------------------
codebert = CodeBERTEmbeddingExtractor()
ast_extractor = ASTFeatureExtractor()
sim_extractor = SimilarityFeatureExtractor()

MODEL = None


# -------------------------------
# REQUEST BODY
# -------------------------------
class PairPayload(BaseModel):
    codeA: str
    codeB: str


# =====================================================
#  GUARDRAILS: Language detection & Minimum length check
# =====================================================

def detect_language(code: str):
    """Very simple and reliable language classifier."""
    c = code.lower()

    if "public class" in c or "system.out" in c:
        return "java"
    if "def " in c or "print(" in c or ":" in c:
        return "python"
    if "#include" in c or "std::" in c:
        return "cpp"

    return "unknown"


def is_too_short(code: str):
    """Reject meaningless tiny code."""
    return len(code.strip()) < 20


# -----------------------------------------------------
# STARTUP – Load ML model
# -----------------------------------------------------
@app.on_event("startup")
async def startup_event():
    global MODEL
    try:
        with open(MODEL_PATH, "rb") as f:
            MODEL = pickle.load(f)
        print("✅ ML Model Loaded Successfully")
    except Exception as e:
        print("❌ Failed to load model:", e)


# =====================================================
#  FEATURE EXTRACTION PIPELINE (High Accuracy)
# =====================================================
def extract_all_features(codeA: str, codeB: str):

    # 1️⃣ Normalize code (removes formatting differences)
    codeA_norm = normalize_code(codeA)
    codeB_norm = normalize_code(codeB)

    # 2️⃣ CodeBERT embeddings
    embA = codebert.extract(codeA_norm)
    embB = codebert.extract(codeB_norm)

    embedding_cosine = np.dot(embA, embB) / (
        np.linalg.norm(embA) * np.linalg.norm(embB)
    )
    embedding_l2 = np.linalg.norm(embA - embB)

    # 3️⃣ AST structural features
    astA = ast_extractor.extract_features(codeA_norm)
    astB = ast_extractor.extract_features(codeB_norm)

    ast_diff = []
    ast_ratio = []

    for k in astA.keys():
        a = astA[k]
        b = astB.get(k, 0)

        ast_diff.append(abs(a - b))
        ast_ratio.append(a / (b + 1e-8))

    # 4️⃣ Token-level similarity
    sim = sim_extractor.extract_features(codeA_norm, codeB_norm)
    sim_values = list(sim.values())

    # Final combined features
    features = (
        [embedding_cosine, embedding_l2]
        + ast_diff
        + ast_ratio
        + sim_values
    )

    return np.array(features).reshape(1, -1)


# -----------------------------------------------------
# HEALTH CHECK
# -----------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": MODEL is not None}


# =====================================================
#  MAIN PREDICTION ENDPOINT (with guardrails)
# =====================================================
@app.post("/predict")
def predict(payload: PairPayload):

    if MODEL is None:
        return {"error": "Model not loaded", "plagiarism_score": None}

    codeA = payload.codeA.strip()
    codeB = payload.codeB.strip()

    # -------------------------------------
    # 🚫 1. Reject tiny code segments
    # -------------------------------------
    if is_too_short(codeA) or is_too_short(codeB):
        return {
            "plagiarism_score": 0.0,
            "is_plagiarized": False,
            "reason": "Code too short for meaningful comparison",
        }

    # -------------------------------------
    # 🚫 2. Reject comparisons across languages
    # -------------------------------------
    langA = detect_language(codeA)
    langB = detect_language(codeB)

    if langA != "unknown" and langB != "unknown" and langA != langB:
        return {
            "plagiarism_score": 0.0,
            "is_plagiarized": False,
            "reason": f"Different languages detected: {langA} vs {langB}",
        }

    # -------------------------------------
    # 3️⃣ Extract features + Model prediction
    # -------------------------------------
    try:
        X = extract_all_features(codeA, codeB)

        if hasattr(MODEL, "predict_proba"):
            prob = MODEL.predict_proba(X)[0][1]
        else:
            prob = MODEL.predict(X)[0]

        score = round(float(prob) * 100, 2)

        return {
            "plagiarism_score": score,
            "is_plagiarized": score >= 60,
            "similarity_level": (
                "high" if score > 85 else
                "medium" if score > 60 else
                "low"
            ),
        }

    except Exception as e:
        return {"error": f"Feature extraction failed: {str(e)}"}


# -----------------------------------------------------
# RUN SERVER
# -----------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("plagiarism_service:app", host="0.0.0.0", port=8001, reload=True)
