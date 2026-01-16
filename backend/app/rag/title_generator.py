from app.rag.pipeline import get_llm

def generate_chat_title(messages: list[str]) -> str:
    llm = get_llm()

    text = "\n".join(messages[:3])  # only first few messages

    prompt = f"""
Generate a very short (3–6 words) title for this student chat.
Rules:
- No quotes
- No punctuation
- Academic tone
- Simple words

Chat:
{text}

Title:
"""

    response = llm.invoke(prompt)
    title = response.content.strip()

    return title or "New Chat"
