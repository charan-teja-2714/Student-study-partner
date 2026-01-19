import os
import io
import re
import tempfile
from typing import List, Tuple

from PyPDF2 import PdfReader
import pytesseract
from pdf2image import convert_from_path

from langchain_text_splitters import RecursiveCharacterTextSplitter

# ⚠️ Update this path if needed (Windows only)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


# -----------------------------
# Regex for lab-style lines (reused from your logic)
# -----------------------------
LAB_LINE = re.compile(
    r"([A-Za-z\s]+)\s*[:\-]\s*([\d\.]+)\s*([a-zA-Z/%]+)?",
    re.IGNORECASE
)


# -----------------------------
# Extract text from PDF (OCR fallback)
# -----------------------------
def extract_text_from_pdf(pdf_path: str) -> Tuple[List[str], List[dict]]:
    reader = PdfReader(pdf_path)
    texts, metadata = [], []

    for page_num, page in enumerate(reader.pages):
        try:
            text = page.extract_text()
        except Exception:
            text = None

        if text and text.strip():
            texts.append(text)
            metadata.append({"page": page_num, "ocr": False})
        else:
            # OCR fallback
            images = convert_from_path(
                pdf_path,
                first_page=page_num + 1,
                last_page=page_num + 1
            )
            for img in images:
                ocr_text = pytesseract.image_to_string(img)
                texts.append(ocr_text)
                metadata.append({"page": page_num, "ocr": True})

    return texts, metadata


# -----------------------------
# Domain-aware chunking (from your project)
# -----------------------------
def study_aware_chunking(text: str) -> List[str]:
    lines = text.split("\n")
    buffer, chunks = [], []

    for line in lines:
        buffer.append(line)

        if LAB_LINE.search(line):
            continue

        if len(" ".join(buffer)) > 700:
            chunks.append(" ".join(buffer))
            buffer = []

    if buffer:
        chunks.append(" ".join(buffer))

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150
    )

    final_chunks = []
    for chunk in chunks:
        final_chunks.extend(splitter.split_text(chunk))

    return final_chunks


# -----------------------------
# Main ingestion function
# -----------------------------
def ingest_pdf(
    pdf_path: str,
    owner_type: str,          # "faculty" or "student"
    owner_id: int | None,      # None for faculty, user_id for student
    session_id: int | None    # None for faculty, session_id for student
) -> Tuple[List[str], List[dict]]:
    """
    Extracts text, chunks it, and attaches metadata.
    """

    texts, metas = extract_text_from_pdf(pdf_path)

    all_chunks, all_metadata = [], []

    for text, meta in zip(texts, metas):
        chunks = study_aware_chunking(text)
        for chunk in chunks:
            all_chunks.append(chunk)
            all_metadata.append({
                "owner_type": owner_type,
                "owner_id": owner_id,
                "session_id": session_id,
                "page": meta["page"],
                "ocr": meta["ocr"],
                "source": os.path.basename(pdf_path)
            })

    return all_chunks, all_metadata
