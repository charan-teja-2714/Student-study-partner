from fastapi import FastAPI, UploadFile, File, Form, Body, Query, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import shutil
import os
import uuid
import json

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
# Safe column migrations (adds columns that may not exist in older DBs)
# -----------------------------
from sqlalchemy import text as _text
with engine.connect() as _conn:
    for _stmt in [
        "ALTER TABLE faculty_documents ADD COLUMN chapter TEXT",
        "ALTER TABLE faculty_documents ADD COLUMN faculty_uid TEXT",
        "ALTER TABLE subjects ADD COLUMN faculty_uid TEXT",
    ]:
        try:
            _conn.execute(_text(_stmt))
            _conn.commit()
        except Exception:
            pass  # column already exists

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
# USER PROFILE
# ============================================================
class UserProfileRequest(BaseModel):
    firebase_uid: str
    role: str
    display_name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    section: Optional[str] = None


@app.post("/user/profile")
def save_user_profile(req: UserProfileRequest):
    db = SessionLocal()
    try:
        profile = crud.upsert_user_profile(
            db, firebase_uid=req.firebase_uid, role=req.role,
            display_name=req.display_name, email=req.email,
            department=req.department, year=req.year, section=req.section
        )
        return {
            "id": profile.id,
            "firebase_uid": profile.firebase_uid,
            "role": profile.role,
            "department": profile.department,
            "year": profile.year,
            "section": profile.section
        }
    finally:
        db.close()


@app.get("/user/profile/{firebase_uid}")
def get_user_profile(firebase_uid: str):
    db = SessionLocal()
    try:
        profile = crud.get_user_profile(db, firebase_uid)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return {
            "id": profile.id,
            "firebase_uid": profile.firebase_uid,
            "role": profile.role,
            "display_name": profile.display_name,
            "email": profile.email,
            "department": profile.department,
            "year": profile.year,
            "section": profile.section
        }
    finally:
        db.close()


# ============================================================
# SUBJECTS
# ============================================================
class SubjectRequest(BaseModel):
    name: str
    department: str
    year: int
    faculty_uid: Optional[str] = None


@app.post("/subjects")
def create_subject(req: SubjectRequest):
    db = SessionLocal()
    try:
        subject = crud.create_subject(db, req.name, req.department, req.year, faculty_uid=req.faculty_uid)
        return {"id": subject.id, "name": subject.name}
    finally:
        db.close()


@app.get("/subjects")
def list_subjects(department: str = None, year: int = None, faculty_uid: str = None):
    db = SessionLocal()
    try:
        subjects = crud.get_subjects(db, department, year, faculty_uid=faculty_uid)
        return [{"id": s.id, "name": s.name, "department": s.department, "year": s.year} for s in subjects]
    finally:
        db.close()


@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int):
    db = SessionLocal()
    try:
        crud.delete_subject(db, subject_id)
        return {"message": "Subject deleted"}
    finally:
        db.close()


# ============================================================
# SECTIONS
# ============================================================
class SectionRequest(BaseModel):
    department: str
    year: int
    section_name: str


@app.post("/sections")
def create_section(req: SectionRequest):
    db = SessionLocal()
    try:
        section = crud.create_section(db, req.department, req.year, req.section_name)
        return {"id": section.id, "section_name": section.section_name}
    finally:
        db.close()


@app.get("/sections")
def list_sections(department: str = None, year: int = None):
    db = SessionLocal()
    try:
        sections = crud.get_sections(db, department, year)
        return [{"id": s.id, "department": s.department, "year": s.year, "section_name": s.section_name} for s in sections]
    finally:
        db.close()


@app.delete("/sections/{section_id}")
def delete_section(section_id: int):
    db = SessionLocal()
    try:
        crud.delete_section(db, section_id)
        return {"message": "Section deleted"}
    finally:
        db.close()


# ============================================================
# CHAT (JSON)
# ============================================================
class ChatRequest(BaseModel):
    question: str
    user_id: str
    session_id: Optional[int] = None
    chat_mode: str = "rag"  # "rag" or "general"


@app.post("/chat")
def chat(req: ChatRequest = Body(...)):
    db = SessionLocal()

    try:
        # Create session if needed
        if req.session_id is None:
            session = crud.create_chat_session(db, req.user_id)
            session_id = session.id
        else:
            session_id = req.session_id

        if req.question == "__create_session__":
            return {"session_id": session_id, "answer": "", "sources": []}

        # Save user message
        crud.add_message(db, session_id, "user", req.question)

        # Get user profile for academic filtering
        profile = crud.get_user_profile(db, req.user_id)
        department = profile.department if profile else None
        year = profile.year if profile else None
        section = profile.section if profile else None

        # RAG + fallback (now returns dict with answer + sources)
        result = rag_answer(
            query=req.question,
            user_id=req.user_id,
            session_id=session_id,
            chat_mode=req.chat_mode,
            department=department,
            year=year,
            section=section
        )

        answer = result["answer"]
        sources = result["sources"]

        # Enrich sources with doc_id for PDF preview.
        # FAISS stores source = basename(saved_path) = "{uuid}_{original}.pdf"
        # DB stores file_path = full path ending with "{uuid}_{original}.pdf"
        enriched_sources = []
        for src in sources:
            doc_name = src.get("document_name", "")
            doc = db.query(models.FacultyDocument).filter(
                models.FacultyDocument.file_path.like(f"%{doc_name}%"),
                models.FacultyDocument.file_path != "__FOLDER__"
            ).first()
            enriched = dict(src)
            if doc:
                enriched["doc_id"] = doc.id
            enriched_sources.append(enriched)
        sources = enriched_sources

        # Save AI message with sources
        crud.add_message(db, session_id, "ai", answer,
                         sources=json.dumps(sources) if sources else None)

        # Auto-generate title ONLY if still "New Chat"
        session_obj = db.query(models.ChatSession).filter(
            models.ChatSession.id == session_id
        ).first()

        if session_obj and session_obj.title == "New Chat":
            messages = crud.get_session_messages(db, session_id)
            text_messages = [m.content for m in messages if m.sender == "user"]
            if len(text_messages) >= 1:
                from app.rag.title_generator import generate_chat_title
                new_title = generate_chat_title(text_messages)
                crud.update_chat_title(db, session_id, new_title)

        return {"session_id": session_id, "answer": answer, "sources": sources}

    finally:
        db.close()


@app.post("/chat/session")
def create_session(user_id: str = Body(...)):
    db = SessionLocal()
    session = crud.create_chat_session(db, user_id)
    db.close()
    return {"session_id": session.id}


# ============================================================
# CHAT SIDEBAR
# ============================================================
@app.get("/chat/sessions/{user_id}")
def list_chat_sessions(user_id: str):
    db = SessionLocal()
    sessions = crud.get_user_sessions(db, user_id)
    db.close()
    return sessions


@app.get("/chat/messages/{session_id}")
def get_chat_messages(session_id: int):
    db = SessionLocal()
    messages = crud.get_session_messages(db, session_id)
    db.close()
    return [
        {
            "id": m.id,
            "session_id": m.session_id,
            "sender": m.sender,
            "content": m.content,
            "sources": json.loads(m.sources) if m.sources else [],
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in messages
    ]


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
    crud.rename_session(db, session_id, title)
    db.close()
    return {"title": title}


@app.delete("/chat/{session_id}")
def delete_chat(session_id: int):
    db = SessionLocal()
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id
    ).first()

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
def search_chat(user_id: str, q: str = Query(...)):
    db = SessionLocal()
    results = crud.search_chats(db, user_id, q)
    db.close()
    return results


# ============================================================
# FACULTY PDF UPLOAD (enhanced with metadata)
# ============================================================
@app.post("/upload/faculty")
def upload_faculty_pdf(
    file: UploadFile = File(...),
    faculty_uid: str = Form(None),
    subject_id: int = Form(None),
    chapter: str = Form(None),
    department: str = Form(None),
    year: int = Form(None),
    section: str = Form(None),
    path: str = Form("")
):
    if not file.filename.lower().endswith(".pdf"):
        return {"error": "Only PDF files are allowed"}

    file_id = str(uuid.uuid4())
    save_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Ingest with academic metadata
    ingest_and_store_pdf(
        pdf_path=save_path,
        owner_type="faculty",
        owner_id=None,
        department=department,
        year=year,
        section=section
    )

    # Save file record in DB with metadata
    db = SessionLocal()
    try:
        logical_path = f"{path}/{file.filename}" if path else file.filename
        crud.add_faculty_file(
            db, name=file.filename, file_path=save_path,
            logical_path=logical_path,
            faculty_uid=faculty_uid, subject_id=subject_id,
            chapter=chapter or None,
            department=department, year=year, section=section
        )
    finally:
        db.close()

    return {"message": "Faculty PDF uploaded and indexed"}


@app.post("/upload/student")
def upload_student_pdf(
    user_id: str = Form(...),
    session_id: int = Form(None),
    file: UploadFile = File(...)
):
    db = SessionLocal()

    if session_id is None:
        session = crud.create_chat_session(db, user_id)
        session_id = session.id
    else:
        session = db.query(models.ChatSession).get(session_id)
        if not session:
            db.close()
            raise HTTPException(status_code=404, detail="Session not found")

    if not file.filename.lower().endswith(".pdf"):
        db.close()
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    file_id = str(uuid.uuid4())
    save_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        ingest_and_store_pdf(
            pdf_path=save_path,
            owner_type="student",
            owner_id=user_id,
            session_id=session_id
        )

    except Exception as e:
        db.close()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    db.close()
    return {"message": "PDF uploaded", "session_id": session_id}


# ============================================================
# STUDENT RESOURCES
# ============================================================

# IMPORTANT: declare the specific route BEFORE the parameterized route
@app.get("/resources/file/{doc_id}")
def download_resource(doc_id: int, inline: bool = True):
    db = SessionLocal()
    try:
        doc = crud.get_faculty_document_by_id(db, doc_id)
        if not doc or doc.file_path == "__FOLDER__":
            raise HTTPException(status_code=404, detail="Document not found")
        disposition = "inline" if inline else "attachment"
        return FileResponse(
            path=doc.file_path,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'{disposition}; filename="{doc.name}"',
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    finally:
        db.close()


@app.get("/resources/{firebase_uid}")
def get_student_resources(firebase_uid: str):
    db = SessionLocal()
    try:
        profile = crud.get_user_profile(db, firebase_uid)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        # Primary: subjects from timetable
        timetable_subjects = crud.get_student_timetable_subjects(
            db, profile.department, profile.year, profile.section
        )

        # Secondary: manually enrolled subjects
        enrolled_rows = crud.get_student_enrolled_subjects(db, firebase_uid)
        enrolled_subject_ids = [r.subject_id for r in enrolled_rows]
        enrolled_subjects_objs = []
        if enrolled_subject_ids:
            enrolled_subjects_objs = db.query(models.Subject).filter(
                models.Subject.id.in_(enrolled_subject_ids)
            ).all()
        enrolled_subject_names = [s.name for s in enrolled_subjects_objs]

        # Combine both (case-insensitive dedup)
        combined_lower = set()
        combined_subjects = []
        for name in timetable_subjects + enrolled_subject_names:
            if name.lower() not in combined_lower:
                combined_lower.add(name.lower())
                combined_subjects.append(name)

        # Fetch resources (filter by combined subjects if any, else show all for dept/year/section)
        docs = crud.get_faculty_resources(
            db, profile.department, profile.year, profile.section,
            subject_names=combined_subjects if combined_subjects else None
        )

        # Build subject name lookup
        all_subject_ids = {d.subject_id for d in docs if d.subject_id}
        subject_map = {}
        if all_subject_ids:
            subjects = db.query(models.Subject).filter(
                models.Subject.id.in_(all_subject_ids)
            ).all()
            subject_map = {s.id: s.name for s in subjects}

        return [
            {
                "id": d.id,
                "name": d.name,
                "department": d.department,
                "year": d.year,
                "section": d.section,
                "subject_name": subject_map.get(d.subject_id),
                "chapter": d.chapter,
                "logical_path": d.logical_path,
                "created_at": d.created_at.isoformat() if d.created_at else None
            }
            for d in docs
        ]
    finally:
        db.close()


# ============================================================
# STUDENT SUBJECT ENROLLMENT
# ============================================================

@app.get("/enrollment/{student_uid}")
def get_enrollment(student_uid: str):
    """Get all manually enrolled subjects for a student."""
    db = SessionLocal()
    try:
        rows = crud.get_student_enrolled_subjects(db, student_uid)
        subject_ids = [r.subject_id for r in rows]
        subjects = db.query(models.Subject).filter(
            models.Subject.id.in_(subject_ids)
        ).all() if subject_ids else []
        return [{"id": s.id, "name": s.name, "department": s.department, "year": s.year}
                for s in subjects]
    finally:
        db.close()


class EnrollmentRequest(BaseModel):
    student_uid: str
    subject_id: int


@app.post("/enrollment")
def enroll_subject(req: EnrollmentRequest):
    db = SessionLocal()
    try:
        crud.enroll_student_in_subject(db, req.student_uid, req.subject_id)
        return {"message": "Enrolled"}
    finally:
        db.close()


@app.delete("/enrollment")
def unenroll_subject(req: EnrollmentRequest):
    db = SessionLocal()
    try:
        crud.unenroll_student_from_subject(db, req.student_uid, req.subject_id)
        return {"message": "Unenrolled"}
    finally:
        db.close()


# ============================================================
# TIMETABLE
# ============================================================
class TimetableRequest(BaseModel):
    faculty_uid: str
    subject: str
    department: str
    year: int
    section: str
    day: str
    time: str


class TimetableUpdateRequest(BaseModel):
    subject: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    section: Optional[str] = None
    day: Optional[str] = None
    time: Optional[str] = None


@app.post("/timetable")
def create_timetable(req: TimetableRequest):
    db = SessionLocal()
    try:
        entry = crud.create_timetable_entry(
            db, faculty_uid=req.faculty_uid, subject=req.subject,
            department=req.department, year=req.year, section=req.section,
            day=req.day, time=req.time
        )
        return {"id": entry.id, "message": "Timetable entry created"}
    finally:
        db.close()


@app.get("/timetable/faculty/{faculty_uid}")
def get_faculty_timetable(faculty_uid: str):
    db = SessionLocal()
    try:
        entries = crud.get_timetable_by_faculty(db, faculty_uid)
        return [
            {
                "id": e.id, "subject": e.subject, "department": e.department,
                "year": e.year, "section": e.section, "day": e.day, "time": e.time
            }
            for e in entries
        ]
    finally:
        db.close()


@app.get("/timetable/student/{firebase_uid}")
def get_student_timetable(firebase_uid: str):
    db = SessionLocal()
    try:
        profile = crud.get_user_profile(db, firebase_uid)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        entries = crud.get_timetable_for_student(
            db, profile.department, profile.year, profile.section
        )
        return [
            {
                "id": e.id, "subject": e.subject, "department": e.department,
                "year": e.year, "section": e.section, "day": e.day, "time": e.time
            }
            for e in entries
        ]
    finally:
        db.close()


@app.put("/timetable/{entry_id}")
def update_timetable(entry_id: int, req: TimetableUpdateRequest):
    db = SessionLocal()
    try:
        entry = crud.update_timetable_entry(db, entry_id, **req.dict(exclude_none=True))
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")
        return {"message": "Timetable entry updated"}
    finally:
        db.close()


@app.delete("/timetable/{entry_id}")
def delete_timetable(entry_id: int):
    db = SessionLocal()
    try:
        crud.delete_timetable_entry(db, entry_id)
        return {"message": "Timetable entry deleted"}
    finally:
        db.close()


# ============================================================
# FACULTY FILE MANAGER
# ============================================================
@app.get("/faculty/files")
def list_faculty_files(path: str = "", faculty_uid: str = ""):
    db = SessionLocal()
    try:
        result = crud.list_faculty_items(db, path, faculty_uid=faculty_uid or None)
        return result
    finally:
        db.close()


class CreateFolderRequest(BaseModel):
    path: str
    name: str
    faculty_uid: Optional[str] = None
    year: Optional[int] = None
    section: Optional[str] = None


@app.post("/faculty/folder")
def create_faculty_folder_api(req: CreateFolderRequest):
    db = SessionLocal()
    try:
        folder = crud.create_faculty_folder(
            db=db, path=req.path, folder_name=req.name,
            faculty_uid=req.faculty_uid, year=req.year, section=req.section
        )
        return {"id": folder.id, "name": folder.name}
    finally:
        db.close()


class RenameFolderRequest(BaseModel):
    old_path: str
    new_name: str


@app.put("/faculty/folder/rename")
def rename_faculty_folder_api(req: RenameFolderRequest):
    db = SessionLocal()
    try:
        crud.rename_faculty_folder(db=db, old_path=req.old_path, new_name=req.new_name)
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


# ============================================================
# FACULTY FILE ITEM OPERATIONS (pin / rename / delete)
# ============================================================

class RenameItemRequest(BaseModel):
    new_name: str


@app.put("/faculty/{item_id}/rename")
def rename_faculty_file(item_id: int, req: RenameItemRequest):
    db = SessionLocal()
    try:
        item = crud.rename_faculty_item(db, item_id, req.new_name)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"message": "Renamed successfully"}
    finally:
        db.close()


@app.post("/faculty/{item_id}/pin")
def pin_faculty_item(item_id: int):
    db = SessionLocal()
    try:
        item = crud.toggle_pin_faculty_item(db, item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"message": "Pin toggled", "pinned": item.pinned}
    finally:
        db.close()


@app.delete("/faculty/{item_id}")
def delete_faculty_file(item_id: int):
    db = SessionLocal()
    try:
        item = crud.get_faculty_document_by_id(db, item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        logical_path = item.logical_path
        crud.delete_faculty_item(db, logical_path)
        return {"message": "Deleted successfully"}
    finally:
        db.close()
