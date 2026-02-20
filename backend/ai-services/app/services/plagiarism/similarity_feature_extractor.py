import numpy as np
import pandas as pd
import re
from tqdm import tqdm

class SimilarityFeatureExtractor:

    def normalize_code(self, code):
        code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
        code = re.sub(r'\s+', ' ', code)
        return code.strip()

    def tokenize(self, code):
        return set(re.findall(r'\w+', code))

    def extract_features(self, code1, code2):
        features = {}

        norm1 = self.normalize_code(code1)
        norm2 = self.normalize_code(code2)

        len1, len2 = len(code1), len(code2)
        features["len1"] = len1
        features["len2"] = len2
        features["len_diff"] = abs(len1 - len2)
        features["len_ratio"] = min(len1, len2) / max(len1, len2) if max(len1, len2) else 0

        tokens1 = self.tokenize(norm1)
        tokens2 = self.tokenize(norm2)

        features["token_overlap"] = len(tokens1 & tokens2)

        if len(tokens1 | tokens2) > 0:
            features["jaccard_similarity"] = len(tokens1 & tokens2) / len(tokens1 | tokens2)
        else:
            features["jaccard_similarity"] = 0

        features["unique_tokens1"] = len(tokens1)
        features["unique_tokens2"] = len(tokens2)

        features["char_overlap"] = sum(1 for c in set(norm1) if c in set(norm2))

        lines1 = set(line.strip() for line in code1.split("\n") if line.strip())
        lines2 = set(line.strip() for line in code2.split("\n") if line.strip())
        if len(lines1 | lines2) > 0:
            features["line_jaccard"] = len(lines1 & lines2) / len(lines1 | lines2)
        else:
            features["line_jaccard"] = 0

        # cosine similarity of tokens
        all_tokens = tokens1 | tokens2
        v1 = np.array([norm1.count(t) for t in all_tokens])
        v2 = np.array([norm2.count(t) for t in all_tokens])

        if np.linalg.norm(v1) > 0 and np.linalg.norm(v2) > 0:
            features["token_cosine"] = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
        else:
            features["token_cosine"] = 0

        return features

    def extract_batch(self, pairs):
        return pd.DataFrame([self.extract_features(a, b) for a, b in tqdm(pairs)])
