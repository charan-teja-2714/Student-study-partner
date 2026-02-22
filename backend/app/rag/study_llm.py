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


def study_only_answer(query: str, history: list = None) -> str:
    llm = _get_llm()

    system_prompt = """
        You are a Study and Career Assistant for students.

        Rules:
        - Answer academic, study-related, and career-related questions.
        - Allowed topics: academics, exams, programming, science, engineering, medicine,
          mathematics, research papers, document analysis, summarization of academic
          documents, reports, any uploaded study material, resume review, interview
          preparation, career guidance, job applications, internships, skills assessment,
          and professional development for students.
        - Use the conversation history (if any) to understand follow-up questions and
          references such as "explain more", "give an example", "what about point 3", etc.
        - Use clear explanations and examples.
        - If the question is clearly unrelated to academics or career (e.g. cooking,
          entertainment, personal chat), reply exactly:
          "This assistant is designed only for academic and career-related questions."
        - Do NOT reject questions about summarizing, analyzing, or explaining documents
          or reports — those are valid tasks.
        - Do NOT reject questions about resumes, CVs, interview preparation, job
          applications, or career planning — those are valid student concerns.
        """

    # Build message list: system → prior turns → current question
    messages = [("system", system_prompt)]

    for msg in (history or []):
        role = "human" if msg["sender"] == "user" else "ai"
        messages.append((role, msg["content"]))

    messages.append(("human", "{query}"))

    prompt = ChatPromptTemplate.from_messages(messages)
    response = (prompt | llm).invoke({"query": query})
    return response.content.strip()
