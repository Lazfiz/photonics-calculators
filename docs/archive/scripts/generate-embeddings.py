#!/usr/bin/env python3
"""Generate semantic embeddings for all calculators in the search index."""

import json
import numpy as np
from sentence_transformers import SentenceTransformer

# Load search index
with open("public/search-index.json") as f:
    items = json.load(f)

print(f"Loaded {len(items)} items")

# Build text to embed: combine title + description + tags + category
texts = []
for item in items:
    parts = [
        item["title"],
        item.get("description", ""),
        item.get("category", ""),
        " ".join(item.get("tags", [])),
    ]
    # Also add some natural language expansions
    kind = item.get("kind", "")
    if kind == "page":
        parts.append(f"calculator for {item['title'].lower()}")
    texts.append(" ".join(parts))

# Load model (small, fast, good quality)
print("Loading model all-MiniLM-L6-v2...")
model = SentenceTransformer("all-MiniLM-L6-v2")

# Generate embeddings
print("Generating embeddings...")
embeddings = model.encode(texts, show_progress_bar=True, normalize_embeddings=True)

# Convert to list of lists for JSON
embedding_list = embeddings.tolist()

# Build output: array of objects with href, title, embedding
output = []
for i, item in enumerate(items):
    output.append({
        "href": item["href"],
        "title": item["title"],
        "embedding": embedding_list[i],
    })

print(f"Generated {len(output)} embeddings, dim={len(embedding_list[0])}")

# Save as JSON
with open("public/search-embeddings.json", "w") as f:
    json.dump(output, f)

import os
size_kb = os.path.getsize("public/search-embeddings.json") / 1024
print(f"Saved to public/search-embeddings.json ({size_kb:.0f} KB)")
