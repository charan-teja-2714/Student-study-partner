from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
import os

_llm = None

def _get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            api_key=os.getenv("GROQ_API_KEY"),
            model_name="llama-3.3-70b-versatile",
            temperature=0.4
        )
    return _llm


def study_only_answer(query: str) -> str:
    llm = _get_llm()

    system_prompt = """
        You are a Study Assistant for students.

        Rules:
        - Answer ONLY academic or study-related questions.
        - Allowed topics: academics, exams, programming, science, engineering, medicine,
          mathematics, research papers, document analysis, summarization of academic
          documents, reports, and any uploaded study material.
        - Use clear explanations and examples.
        - If the question is clearly not study-related (e.g. cooking, entertainment,
          personal chat), reply exactly:
          "This assistant is designed only for academic and study-related questions."
        - Do NOT reject questions about summarizing, analyzing, or explaining documents
          or reports — those are valid academic tasks.
        """

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{query}")
    ])

    response = (prompt | llm).invoke({"query": query})
    return response.content.strip()
