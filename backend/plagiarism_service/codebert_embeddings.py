from transformers import RobertaTokenizer, RobertaModel
import torch
import numpy as np
from tqdm import tqdm

class CodeBERTEmbeddingExtractor:

    def __init__(self):
        print("🔄 Loading CodeBERT model…")
        self.tokenizer = RobertaTokenizer.from_pretrained("microsoft/codebert-base")
        self.model = RobertaModel.from_pretrained("microsoft/codebert-base")
        print("✅ CodeBERT ready!")

    def extract(self, code):
        tokens = self.tokenizer(code, return_tensors="pt", truncation=True, max_length=256)
        with torch.no_grad():
            outputs = self.model(**tokens)
        embedding = torch.mean(outputs.last_hidden_state, dim=1).squeeze().numpy()
        return embedding

    def extract_batch(self, codes, batch_size=8):
        embeddings = []
        for i in tqdm(range(0, len(codes), batch_size)):
            batch = codes[i:i+batch_size]
            for code in batch:
                embeddings.append(self.extract(code))
        return embeddings
