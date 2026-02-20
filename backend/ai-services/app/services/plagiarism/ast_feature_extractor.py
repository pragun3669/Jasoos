import ast
import numpy as np
import pandas as pd
from tqdm import tqdm

class ASTFeatureExtractor:
    """Extract structural features from code using AST"""

    def extract_features(self, code):
        features = {
            'num_functions': 0,
            'num_classes': 0,
            'num_loops': 0,
            'num_conditionals': 0,
            'num_variables': 0,
            'max_nesting_depth': 0,
            'num_lines': 0,
            'num_comments': 0,
            'avg_line_length': 0,
            'has_recursion': 0,
            'num_imports': 0,
            'num_return_statements': 0
        }

        try:
            lines = code.split('\n')
            features['num_lines'] = len(lines)
            features['num_comments'] = sum(1 for line in lines if line.strip().startswith('#'))
            non_empty = [line for line in lines if line.strip()]
            if non_empty:
                features['avg_line_length'] = np.mean([len(line) for line in non_empty])

            tree = ast.parse(code)

            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    features['num_functions'] += 1
                elif isinstance(node, ast.ClassDef):
                    features['num_classes'] += 1
                elif isinstance(node, (ast.For, ast.While)):
                    features['num_loops'] += 1
                elif isinstance(node, ast.If):
                    features['num_conditionals'] += 1
                elif isinstance(node, ast.Name):
                    features['num_variables'] += 1
                elif isinstance(node, (ast.Import, ast.ImportFrom)):
                    features['num_imports'] += 1
                elif isinstance(node, ast.Return):
                    features['num_return_statements'] += 1

            # Detect recursion
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    func = node.name
                    for child in ast.walk(node):
                        if isinstance(child, ast.Call):
                            if hasattr(child.func, 'id') and child.func.id == func:
                                features['has_recursion'] = 1

            # Max nesting depth
            def depth(node, level=0):
                max_d = level
                for child in ast.iter_child_nodes(node):
                    max_d = max(max_d, depth(child, level + 1))
                return max_d

            features['max_nesting_depth'] = depth(tree)

        except:
            pass

        return features

    def extract_batch(self, codes):
        return pd.DataFrame([self.extract_features(c) for c in tqdm(codes)])
 