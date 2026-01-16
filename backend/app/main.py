from fastapi import FastAPI, UploadFile, File, Form, Body, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
import uuid

# -----------------------------
# RAG
# -----------------------------
from app.rag.pipeline import rag_answer
from app.rag.vector_store import ingest_and_store_pdf

# -----------------------------
# Database
# -----------------------------
from app.db.database import SessionLocal, engine
from app.db import models, crud

# -----------------------------
# FastAPI app
# -----------------------------
app = FastAPI(title="Student Study Partner API")

# -----------------------------
# Create DB tables
# -----------------------------
models.Base.metadata.create_all(bind=engine)

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Paths
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# -----------------------------
# Health check
# -----------------------------
@app.get("/")
def root():
    return {"status": "Backend running successfully"}


# ============================================================
# 🔹 CHAT (JSON)
# ============================================================
class ChatRequest(BaseModel):
    question: str
    user_id: int
    session_id: int | None = None


@app.post("/chat")
def chat(req: ChatRequest = Body(...)):
    db = SessionLocal()

    # Create session if needed
    if req.session_id is None:
        session = crud.create_chat_session(db, req.user_id)
        session_id = session.id
    else:
        session_id = req.session_id
    if req.question == "__create_session__":
        return {"session_id": session_id, "answer": ""}

    # Save user message
    crud.add_message(db, session_id, "user", req.question)

    # RAG + fallback
    answer = rag_answer(query=req.question, user_id=req.user_id, session_id=session_id)

    # Save AI message
    # Save AI message
    crud.add_message(db, session_id, "ai", answer)

    # 🔹 Auto-generate title ONLY if still "New Chat"
    session_obj = (
        db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    )

    if session_obj.title == "New Chat":
        messages = crud.get_session_messages(db, session_id)

        text_messages = [m.content for m in messages if m.sender == "user"]

        if len(text_messages) >= 1:
            from app.rag.title_generator import generate_chat_title

            new_title = generate_chat_title(text_messages)
            crud.update_chat_title(db, session_id, new_title)

        db.close()
    print("🧩 CHAT REQUEST")
    print("question:", req.question)
    print("user_id:", req.user_id)
    print("session_id:", req.session_id)

    return {"session_id": session_id, "answer": answer}

@app.post("/chat/session")
def create_session(user_id: int = Body(...)):
    db = SessionLocal()
    session = crud.create_chat_session(db, user_id)
    db.close()
    return {"session_id": session.id}

# ============================================================
# 🔹 CHAT SIDEBAR
# ============================================================
@app.get("/chat/sessions/{user_id}")
def list_chat_sessions(user_id: int):
    db = SessionLocal()
    sessions = crud.get_user_sessions(db, user_id)
    db.close()
    return sessions


@app.get("/chat/messages/{session_id}")
def get_chat_messages(session_id: int):
    db = SessionLocal()
    messages = crud.get_session_messages(db, session_id)
    db.close()
    return messages

class RenameChatRequest(BaseModel):
    title: str

@app.put("/chat/{session_id}/rename")
def rename_chat(session_id: int, req: RenameChatRequest):
    db = SessionLocal()
    crud.rename_session(db, session_id, req.title)
    db.close()
    return {"message": "Chat renamed"}



@app.post("/chat/{session_id}/regenerate-title")
def regenerate_title(session_id: int):
    db = SessionLocal()
    messages = crud.get_session_messages(db, session_id)

    texts = [m.content for m in messages if m.sender == "user"]

    from app.rag.title_generator import generate_chat_title

    title = generate_chat_title(texts)

    crud.rename_chat(db, session_id, title)
    db.close()

    return {"title": title}


@app.delete("/chat/{session_id}")
def delete_chat(session_id: int):
    db = SessionLocal()

    session = (
        db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    )

    if not session:
        db.close()
        raise HTTPException(status_code=404, detail="Chat not found")

    try:
        db.delete(session)
        db.commit()
    except Exception as e:
        db.rollback()
        db.close()
        raise HTTPException(status_code=500, detail=str(e))

    db.close()
    return {"message": "Chat deleted"}


@app.post("/chat/{session_id}/pin")
def pin_chat(session_id: int):
    db = SessionLocal()
    crud.toggle_pin_session(db, session_id)
    db.close()
    return {"message": "Pin toggled"}


@app.get("/chat/search/{user_id}")
def search_chat(user_id: int, q: str = Query(...)):
    db = SessionLocal()
    results = crud.search_chats(db, user_id, q)
    db.close()
    return results


# ============================================================
# 🔹 FACULTY PDF UPLOAD
# ============================================================
@app.post("/upload/faculty")
def upload_faculty_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        return {"error": "Only PDF files are allowed"}

    file_id = str(uuid.uuid4())
    save_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    ingest_and_store_pdf(pdf_path=save_path, owner_type="faculty", owner_id=None)

    return {"message": "Faculty PDF uploaded and indexed"}



@app.post("/upload/student")
def upload_student_pdf(
    user_id: int = Form(...),
    session_id: int | None = Form(None),
    file: UploadFile = File(...)
):
    
    print("FILE:", file)
    print("USER:", user_id)
    print("SESSION:", session_id)
    db = SessionLocal()

    # 🔹 CREATE SESSION IF NOT EXISTS
    if session_id is None:
        session = crud.create_chat_session(db, user_id)
        session_id = session.id
    else:
        session = db.query(models.ChatSession).get(session_id)

    if not file.filename.lower().endswith(".pdf"):
        return {"error": "Only PDF files allowed"}

    file_id = str(uuid.uuid4())
    save_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    ingest_and_store_pdf(
        pdf_path=save_path,
        owner_type="student",
        owner_id=user_id,
        session_id=session_id
    )

    db.close()

    return {
        "message": "PDF uploaded",
        "session_id": session_id
    }

@app.get("/faculty/files")
def list_faculty_files(path: str = ""):
    """
    List folders and files under a given logical path.
    """
    db = SessionLocal()
    try:
        result = crud.list_faculty_items(db, path)
        return result
    finally:
        db.close()
    
class CreateFolderRequest(BaseModel):
    path: str
    name: str


@app.post("/faculty/folder")
def create_faculty_folder_api(req: CreateFolderRequest):
    db = SessionLocal()
    try:
        folder = crud.create_faculty_folder(
            db=db,
            path=req.path,
            folder_name=req.name
        )
        return {
            "id": folder.id,
            "name": folder.name
        }
    finally:
        db.close()
        
class RenameFolderRequest(BaseModel):
    old_path: str
    new_name: str


@app.put("/faculty/folder/rename")
def rename_faculty_folder_api(req: RenameFolderRequest):
    db = SessionLocal()
    try:
        crud.rename_faculty_item(
            db=db,
            old_path=req.old_path,
            new_name=req.new_name
        )
        return {"message": "Folder renamed successfully"}
    finally:
        db.close()

class DeleteFolderRequest(BaseModel):
    path: str


@app.delete("/faculty/folder")
def delete_faculty_folder_api(req: DeleteFolderRequest):
    db = SessionLocal()
    try:
        crud.delete_faculty_item(db, req.path)
        return {"message": "Folder deleted successfully"}
    finally:
        db.close()
