from rag.vector_store import ingest_and_store_pdf

result = ingest_and_store_pdf(
    pdf_path="C:/Users/charan27/OneDrive/Desktop/Final Year Projects/student-study-partner/backend/app/rag/HP Warranty status.pdf",
    owner_type="faculty",
    owner_id=None
)

print(result)
