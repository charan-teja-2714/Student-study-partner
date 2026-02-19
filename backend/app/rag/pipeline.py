import os
import re
import numpy as np
from typing import List

from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq

from .embeddings import get_embeddings
from .vector_store import create_or_load_faiss
from .study_llm import study_only_answer

from dotenv import load_dotenv

load_dotenv()

# Detect meta/summary queries that ask about the document as a whole.
# These have low cosine similarity to any specific chunk, so threshold is bypassed.
_SUMMARY_RE = re.compile(
    r'\b(summarize|summarise|summary|summaries|summarization|'
    r'overview|brief|brief summary|outline|main points|key points|'
    r'what is this (about|document|paper|report|file)|'
    r'describe (this|the) (document|paper|report|file)|'
    r'introduction to|what does this (say|cover|discuss)|'
    r'explain this (document|paper|report)|'
    r'give (me )?(a )?(summary|overview|brief))\b',
    re.IGNORECASE
)

def _is_summary_query(query: str) -> bool:
    return bool(_SUMMARY_RE.search(query))
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
    return _llm


import json
import pickle
import faiss


def retrieve_docs(query, index_path, metadata_path, top_k=5,
                  department=None, year=None, section=None):
    if not os.path.exists(index_path):
        return []

    embeddings = get_embeddings()
    query_vec = embeddings.embed_query(query)
    query_vec = np.array([query_vec]).astype("float32")
    faiss.normalize_L2(query_vec)  # normalize to match stored vectors

    index = create_or_load_faiss(index_path, len(query_vec[0]))

    # Retrieve more candidates to allow for filtering
    fetch_k = top_k * 4 if (department or year or section) else top_k
    scores, ids = index.search(query_vec, min(fetch_k, index.ntotal))

    with open(metadata_path, "rb") as f:
        metadatas = pickle.load(f)

    results = []
    for score, idx in zip(scores[0], ids[0]):
        if idx < 0 or idx >= len(metadatas):
            continue
        meta = metadatas[idx]

        # Filter by academic metadata if provided
        if department and meta.get("department") and meta["department"] != department:
            continue
        if year and meta.get("year") and meta["year"] != year:
            continue
        if section and meta.get("section") and meta["section"] != section:
            continue

        results.append({
            "text": meta["text"],
            "score": float(score),
            "source": meta.get("source", "Unknown"),
            "page": meta.get("page", 0)
        })

        if len(results) >= top_k:
            break

    return results


def rag_answer(query: str, user_id, session_id: int | None,
               chat_mode: str = "rag",
               department: str = None, year: int = None, section: str = None):
    llm = get_llm()

    # ----------------------------
    # GENERAL MODE: Skip FAISS entirely
    # ----------------------------
    if chat_mode == "general":
        return {"answer": study_only_answer(query), "sources": []}

    SIMILARITY_THRESHOLD = 0.35

    # ----------------------------
    # RAG MODE: Session docs take priority over faculty docs.
    # If the student uploaded a paper to this session, answer from it first.
    # Only fall back to faculty docs if the session has no relevant content.
    # ----------------------------

    # STEP 1: Try student-uploaded paper (session-scoped)
    session_relevant = []
    if session_id:
        session_index_path = f"data/faiss/sessions/{session_id}.faiss"
        session_results = retrieve_docs(
            query,
            session_index_path,
            session_index_path + ".meta"
        )
        if session_results:
            if _is_summary_query(query):
                # Summary/meta queries ("summarise the report", "give an overview")
                # have inherently low cosine similarity to any specific chunk.
                # Bypass the threshold so the document is still used.
                session_relevant = session_results
            else:
                # Specific queries: only use session chunks that are genuinely relevant.
                # If none pass the threshold, fall through to faculty docs.
                session_relevant = [r for r in session_results if r["score"] >= SIMILARITY_THRESHOLD]

    # STEP 2: Use session results if relevant; otherwise fall back to faculty docs.
    if session_relevant:
        top_results = sorted(session_relevant, key=lambda x: x["score"], reverse=True)[:4]
    else:
        faculty_results = retrieve_docs(
            query,
            FACULTY_INDEX_PATH,
            FACULTY_INDEX_PATH + ".meta",
            department=department,
            year=year,
            section=section
        )
        faculty_relevant = [r for r in faculty_results if r["score"] >= SIMILARITY_THRESHOLD]
        top_results = sorted(faculty_relevant, key=lambda x: x["score"], reverse=True)[:4]

    # ----------------------------
    # USE PDF ONLY IF RELEVANT CHUNKS FOUND
    # ----------------------------
    if top_results:
        context = "\n\n".join(r["text"] for r in top_results)

        # Build citation sources (deduplicated)
        seen = set()
        sources = []
        for r in top_results:
            key = (r["source"], r["page"])
            if key not in seen:
                seen.add(key)
                sources.append({
                    "document_name": r["source"],
                    "page_number": r["page"] + 1  # 1-indexed for display
                })

        prompt = PromptTemplate(
            template="""You are an academic assistant helping students understand their course materials.

The following excerpts are from the uploaded document:
---
{context}
---

Student's Question: {question}

Instructions:
- Answer using ONLY the information in the excerpts above.
- If the question asks to summarize or give an overview, synthesize the excerpts into a coherent summary.
- Do NOT add facts or details from outside the provided excerpts.
- If the excerpts cover the topic, give a clear, well-structured answer.
- If the excerpts do not contain enough information, state what IS covered and note what is missing.
- Use bullet points or sections where they help readability.
- Do not invent, guess, or infer details not explicitly stated in the excerpts.

Answer:""",
            input_variables=["context", "question"]
        )

        answer = (prompt | llm).invoke({
            "context": context,
            "question": query
        }).content.strip()

        return {"answer": answer, "sources": sources}

    # ----------------------------
    # GENERAL STUDY ANSWER (fallback when no relevant docs found)
    # ----------------------------
    return {"answer": study_only_answer(query), "sources": []}
