import numpy as np
import pickle

# -------------------------------
# IMPORT FEATURE MODULES (relative imports)
# -------------------------------
#from .codebert_embeddings import CodeBERTEmbeddingExtractor
from .ast_feature_extractor import ASTFeatureExtractor
from .similarity_feature_extractor import SimilarityFeatureExtractor
from .normalization import normalize_code

# -------------------------------
# MODEL PATH (inside plagiarism folder)
# -------------------------------
MODEL_PATH = "app/services/plagiarism/best_model_xgboost.pkl"

# -------------------------------
# LOAD FEATURE EXTRACTORS ONCE
# -------------------------------
codebert = None

ast_extractor = ASTFeatureExtractor()
sim_extractor = SimilarityFeatureExtractor()

MODEL = None


# -------------------------------
# LOAD ML MODEL
# -------------------------------
def load_model():
    global MODEL
    if MODEL is None:
        try:
            with open(MODEL_PATH, "rb") as f:
                MODEL = pickle.load(f)
            print("✅ Plagiarism ML model loaded")
        except Exception as e:
            print("❌ Failed to load plagiarism model:", e)


# -------------------------------
# FEATURE EXTRACTION PIPELINE
# -------------------------------
def extract_all_features(codeA: str, codeB: str):

    codeA_norm = normalize_code(codeA)
    codeB_norm = normalize_code(codeB)

    # CodeBERT embeddings
    embA = codebert.extract(codeA_norm)
    embB = codebert.extract(codeB_norm)

    embedding_cosine = np.dot(embA, embB) / (
        np.linalg.norm(embA) * np.linalg.norm(embB) + 1e-8
    )
    embedding_l2 = np.linalg.norm(embA - embB)

    # AST features
    astA = ast_extractor.extract_features(codeA_norm)
    astB = ast_extractor.extract_features(codeB_norm)

    ast_diff = []
    ast_ratio = []

    for k in astA.keys():
        a = astA[k]
        b = astB.get(k, 0)
        ast_diff.append(abs(a - b))
        ast_ratio.append(a / (b + 1e-8))

    # Token similarity
    sim = sim_extractor.extract_features(codeA_norm, codeB_norm)
    sim_values = list(sim.values())

    features = (
        [embedding_cosine, embedding_l2]
        + ast_diff
        + ast_ratio
        + sim_values
    )

    return np.array(features).reshape(1, -1)


# -------------------------------
# MAIN PREDICTION FUNCTION
# -------------------------------
def predict_plagiarism(codeA: str, codeB: str) -> float:
    return 0.0
    if MODEL is None:
        load_model()

    if MODEL is None:
        return 0.0

    codeA = codeA.strip()
    codeB = codeB.strip()

    # Basic validation
    if len(codeA) < 5 or len(codeB) < 5:
        return 0.0

    try:
        X = extract_all_features(codeA, codeB)

        if hasattr(MODEL, "predict_proba"):
            prob = MODEL.predict_proba(X)[0][1]
        else:
            prob = MODEL.predict(X)[0]

        return round(float(prob) * 100, 2)

    except Exception as e:
        print("❌ Prediction error:", e)
        return 0.0
