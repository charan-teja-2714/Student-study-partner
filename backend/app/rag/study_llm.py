from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
import os

def study_only_answer(query: str) -> str:
    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model_name="llama-3.3-70b-versatile",
        temperature=0.4
    )

    system_prompt = """
You are a Study Assistant for students.

Rules:
- Answer ONLY academic or study-related questions.
- Allowed topics: academics, exams, programming, science, engineering, medicine.
- Use clear explanations and examples.
- If the question is not study-related, reply exactly:
"This assistant is designed only for academic and study-related questions."
"""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{query}")
    ])

    response = (prompt | llm).invoke({"query": query})
    return response.content.strip()
