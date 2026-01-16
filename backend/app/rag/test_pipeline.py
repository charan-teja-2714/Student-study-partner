# from ingest import ingest_pdf

# chunks, metas = ingest_pdf(
#     pdf_path="C:/Users/charan27/OneDrive/Desktop/Final Year Projects/student-study-partner/backend/app/rag/HP Warranty status.pdf",
#     owner_type="faculty",
#     owner_id=None
# )

# print(len(chunks), len(metas))
# print(metas[0])

from rag.pipeline import rag_answer

print(
    rag_answer(
        query="what is the document about?",
        user_id=1
    )
)
