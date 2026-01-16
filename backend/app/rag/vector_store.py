import numpy as np
import os
import faiss
import pickle
from typing import List

from .embeddings import get_embeddings
from .ingest import ingest_pdf


FAISS_BASE_PATH = "data/faiss"


# -----------------------------
# Utility
# -----------------------------
def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


# -----------------------------
# Load or create FAISS index
# -----------------------------
def create_or_load_faiss(index_path: str, dim: int):
    if os.path.exists(index_path):
        return faiss.read_index(index_path)
    return faiss.IndexFlatIP(dim)


def save_faiss(index, index_path: str):
    faiss.write_index(index, index_path)


# -----------------------------
# Ingest PDF and store vectors
# -----------------------------
def ingest_and_store_pdf(
    pdf_path: str,
    owner_type: str,          # "faculty" or "student"
    owner_id: int | None,
    session_id: int | None
):
    embeddings = get_embeddings()
    print("🔢 Embedding dim:", len(embeddings.embed_query("test")))
    dim = len(embeddings.embed_query("dimension_check"))

    # ---------------------------------
    # Decide storage path
    # ---------------------------------
    if owner_type == "faculty":
        index_dir = os.path.join(FAISS_BASE_PATH, "faculty")
        index_path = os.path.join(index_dir, "index.faiss")

    elif owner_type == "student":
        if session_id is None:
            raise ValueError("session_id is required for student uploads")

        index_dir = os.path.join(FAISS_BASE_PATH, "sessions")
        index_path = os.path.join(index_dir, f"{session_id}.faiss")

    else:
        raise ValueError("Invalid owner_type")

    ensure_dir(index_dir)

    # ---------------------------------
    # Load or create FAISS index
    # ---------------------------------
    index = create_or_load_faiss(index_path, dim)

    # ---------------------------------
    # Load metadata
    # ---------------------------------
    meta_path = index_path + ".meta"
    if os.path.exists(meta_path):
        with open(meta_path, "rb") as f:
            metadata_store = pickle.load(f)
    else:
        metadata_store = []

    # ---------------------------------
    # Ingest PDF
    # ---------------------------------
    chunks, metadatas = ingest_pdf(
        pdf_path=pdf_path,
        owner_type=owner_type,
        owner_id=owner_id,
        session_id=session_id     # ✅ PASS SESSION
    )
    print("📄 PDF chunks:", len(chunks))
    # print("📐 Vector shape:", vectors.shape)
    print("📦 Index size BEFORE:", index.ntotal)

    # ---------------------------------
    # Embed & add
    # ---------------------------------
    vectors = np.array(
        embeddings.embed_documents(chunks)
    ).astype("float32")
    # faiss.normalize_L2(vectors)
    index.add(vectors)
    print("📦 Index size AFTER:", index.ntotal)

    for meta, text in zip(metadatas, chunks):
        meta["text"] = text
        metadata_store.append(meta)

    # ---------------------------------
    # Persist
    # ---------------------------------
    save_faiss(index, index_path)
    print("🧠 Saving index to:", index_path)
    with open(meta_path, "wb") as f:
        pickle.dump(metadata_store, f)

    return {
        "chunks_added": len(chunks),
        "index_path": index_path
    }
