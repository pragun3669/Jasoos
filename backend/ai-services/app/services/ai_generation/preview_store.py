# app/services/ai_generation/preview_store.py

import uuid

preview_store = {}

def save_preview(questions):
    preview_id = str(uuid.uuid4())
    preview_store[preview_id] = questions
    return preview_id

def get_preview(preview_id):
    return preview_store.get(preview_id)
