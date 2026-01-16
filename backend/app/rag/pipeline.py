import os
import numpy as np
from typing import List

from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq

from .embeddings import get_embeddings
from .vector_store import create_or_load_faiss
from .study_llm import study_only_answer

from dotenv import load_dotenv

load_dotenv()
# -----------------------------
# Config
# -----------------------------
FAISS_BASE_PATH = "data/faiss"
FACULTY_INDEX_PATH = os.path.join(FAISS_BASE_PATH, "faculty", "index.faiss")

GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


# -----------------------------
# LLM (Singleton)
# -----------------------------
_llm = None

def get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            api_key=GROQ_API_KEY,
            model_name=GROQ_MODEL,
            temperature=0.6
        )
    print("🔥 Initializing Groq LLM")
    return _llm


# -----------------------------
# Retrieve docs from FAISS
# -----------------------------
# def retrieve_docs(
#     query: str,
#     index_path: str,
#     metadata_path: str,
#     top_k: int = 5
# ) -> List[str]:

#     if not os.path.exists(index_path):
#         return []

#     embeddings = get_embeddings()
#     query_vec = embeddings.embed_query(query)

#     index = create_or_load_faiss(index_path, len(query_vec))

#     scores, ids = index.search(
#         np.array([query_vec]).astype("float32"),
#         top_k
#     )

#     if not os.path.exists(metadata_path):
#         return []

#     import pickle
#     with open(metadata_path, "rb") as f:
#         metadatas = pickle.load(f)

#     docs = []
#     for idx in ids[0]:
#         if idx < len(metadatas):
#             docs.append(metadatas[idx]["text"])

#     return docs

import pickle
import faiss
def retrieve_docs(query, index_path, metadata_path, top_k=5):
    if not os.path.exists(index_path):
        return []

    embeddings = get_embeddings()
    query_vec = embeddings.embed_query(query)

    query_vec = np.array([query_vec]).astype("float32")
    # faiss.normalize_L2(query_vec)

    index = create_or_load_faiss(index_path, len(query_vec[0]))

    scores, ids = index.search(query_vec, top_k)

    with open(metadata_path, "rb") as f:
        metadatas = pickle.load(f)

    results = []
    for score, idx in zip(scores[0], ids[0]):
        if idx < len(metadatas):
            results.append((metadatas[idx]["text"], float(score)))

    return results



# def retrieve_docs(
#     query: str,
#     index_path: str,
#     metadata_path: str,
#     top_k: int = 5
# ) -> List[tuple[str, float]]:

#     if not os.path.exists(index_path):
#         return []

#     embeddings = get_embeddings()
#     query_vec = embeddings.embed_query(query)

#     index = create_or_load_faiss(index_path, len(query_vec))

#     scores, ids = index.search(
#         np.array([query_vec]).astype("float32"),
#         top_k
#     )

#     if not os.path.exists(metadata_path):
#         return []

#     import pickle
#     with open(metadata_path, "rb") as f:
#         metadatas = pickle.load(f)

#     results = []
#     for score, idx in zip(scores[0], ids[0]):
#         if score < 0.25:      # 🔥 relevance threshold
#             continue
#         if idx < len(metadatas):
#             results.append((metadatas[idx]["text"], float(score)))

#     return results


def rag_answer(query: str, user_id: int, session_id: int | None):
    llm = get_llm()

    retrieved = []

    # Faculty docs
    retrieved.extend(
        retrieve_docs(
            query,
            FACULTY_INDEX_PATH,
            FACULTY_INDEX_PATH + ".meta"
        )
    )

    # Session-scoped student docs
    if session_id:
        session_index_path = f"data/faiss/sessions/{session_id}.faiss"
        retrieved.extend(
            retrieve_docs(
                query,
                session_index_path,
                session_index_path + ".meta"
            )
        )
    print("🔍 Retrieved:", len(retrieved))
    print("🔍 Retrieved:", retrieved)
    # ----------------------------
    # 🔑 RELEVANCE GATING
    # ----------------------------
    SIMILARITY_THRESHOLD = 0.1  # tune later

    if retrieved:
        texts, scores = zip(*retrieved)
        max_score = max(scores)
    else:
        max_score = 0
    print("🔍 Max score:", max_score)
    # ----------------------------
    # 📄 USE PDF ONLY IF RELEVANT
    # ----------------------------
    if max_score >= SIMILARITY_THRESHOLD:
        context = "\n\n".join(texts[:5])

        prompt = PromptTemplate(
            template="""
            You are an medical assistant.

            Context:
            {context}

            Question:
            {question}

            Rules:
            - Answer ONLY from context
            - If context does not answer, say so clearly

            Answer:
            """,
            input_variables=["context", "question"]
        )

        return (prompt | llm).invoke({
            "context": context,
            "question": query
        }).content.strip()

    # ----------------------------
    # 🧠 GENERAL STUDY ANSWER
    # ----------------------------
    return study_only_answer(query)
