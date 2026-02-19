# from sqlalchemy.orm import Session
# from .models import ChatSession, ChatMessage


# def create_chat_session(db: Session, user_id: int, title: str = "New Chat"):
#     session = ChatSession(user_id=user_id, title=title)
#     db.add(session)
#     db.commit()
#     db.refresh(session)
#     return session


# def get_user_sessions(db: Session, user_id: int):
#     return (
#         db.query(ChatSession)
#         .filter(ChatSession.user_id == user_id)
#         .order_by(ChatSession.created_at.desc())
#         .all()
#     )


# def add_message(db: Session, session_id: int, sender: str, content: str):
#     message = ChatMessage(
#         session_id=session_id,
#         sender=sender,
#         content=content
#     )
#     db.add(message)
#     db.commit()
#     db.refresh(message)
#     return message


# def get_session_messages(db: Session, session_id: int):
#     return (
#         db.query(ChatMessage)
#         .filter(ChatMessage.session_id == session_id)
#         .order_by(ChatMessage.created_at)
#         .all()
#     )


# def update_chat_title(db: Session, session_id: int, title: str):
#     session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
#     if session:
#         session.title = title
#         db.commit()


# def rename_chat(db: Session, session_id: int, title: str):
#     session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
#     if session:
#         session.title = title
#         db.commit()


# def delete_chat(db: Session, session_id: int):
#     session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
#     if session:
#         db.delete(session)
#         db.commit()


# def toggle_pin_chat(db: Session, session_id: int):
#     session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
#     if session:
#         session.pinned = 0 if session.pinned else 1
#         db.commit()


# def search_chats(db: Session, user_id: int, query: str):
#     return (
#         db.query(ChatSession)
#         .filter(
#             ChatSession.user_id == user_id,
#             ChatSession.title.ilike(f"%{query}%")
#         )
#         .order_by(ChatSession.pinned.desc(), ChatSession.created_at.desc())
#         .all()
#     )


import json
from sqlalchemy.orm import Session
from .models import (
    ChatSession, ChatMessage, FacultyDocument,
    UserProfile, Subject, Section, Timetable, StudentSubjectEnrollment
)


# ============================================================
# USER PROFILE CRUD
# ============================================================

def upsert_user_profile(db: Session, firebase_uid: str, role: str,
                        display_name: str = None, email: str = None,
                        department: str = None, year: int = None,
                        section: str = None):
    profile = db.query(UserProfile).filter(UserProfile.firebase_uid == firebase_uid).first()
    if profile:
        profile.role = role
        if display_name: profile.display_name = display_name
        if email: profile.email = email
        if department is not None: profile.department = department
        if year is not None: profile.year = year
        if section is not None: profile.section = section
    else:
        profile = UserProfile(
            firebase_uid=firebase_uid, role=role,
            display_name=display_name, email=email,
            department=department, year=year, section=section
        )
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def get_user_profile(db: Session, firebase_uid: str):
    return db.query(UserProfile).filter(UserProfile.firebase_uid == firebase_uid).first()


# ============================================================
# SUBJECT CRUD
# ============================================================

def create_subject(db: Session, name: str, department: str, year: int, faculty_uid: str = None):
    subject = Subject(name=name, department=department, year=year, faculty_uid=faculty_uid)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def get_subjects(db: Session, department: str = None, year: int = None, faculty_uid: str = None):
    q = db.query(Subject)
    if department: q = q.filter(Subject.department == department)
    if year: q = q.filter(Subject.year == year)
    if faculty_uid: q = q.filter(Subject.faculty_uid == faculty_uid)
    return q.all()


def delete_subject(db: Session, subject_id: int):
    subject = db.query(Subject).get(subject_id)
    if subject:
        db.delete(subject)
        db.commit()
        return True
    return False


# ============================================================
# SECTION CRUD
# ============================================================

def create_section(db: Session, department: str, year: int, section_name: str):
    section = Section(department=department, year=year, section_name=section_name)
    db.add(section)
    db.commit()
    db.refresh(section)
    return section


def get_sections(db: Session, department: str = None, year: int = None):
    q = db.query(Section)
    if department: q = q.filter(Section.department == department)
    if year: q = q.filter(Section.year == year)
    return q.all()


def delete_section(db: Session, section_id: int):
    section = db.query(Section).get(section_id)
    if section:
        db.delete(section)
        db.commit()
        return True
    return False


# ============================================================
# TIMETABLE CRUD
# ============================================================

def create_timetable_entry(db: Session, faculty_uid: str, subject: str,
                           department: str, year: int, section: str,
                           day: str, time: str):
    entry = Timetable(
        faculty_uid=faculty_uid, subject=subject,
        department=department, year=year, section=section,
        day=day, time=time
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_timetable_by_faculty(db: Session, faculty_uid: str):
    return db.query(Timetable).filter(Timetable.faculty_uid == faculty_uid).all()


def get_timetable_for_student(db: Session, department: str, year: int, section: str):
    return (
        db.query(Timetable)
        .filter(
            Timetable.department == department,
            Timetable.year == year,
            Timetable.section == section
        )
        .all()
    )


def update_timetable_entry(db: Session, entry_id: int, **kwargs):
    entry = db.query(Timetable).get(entry_id)
    if not entry:
        return None
    for key, value in kwargs.items():
        if hasattr(entry, key) and value is not None:
            setattr(entry, key, value)
    db.commit()
    db.refresh(entry)
    return entry


def delete_timetable_entry(db: Session, entry_id: int):
    entry = db.query(Timetable).get(entry_id)
    if entry:
        db.delete(entry)
        db.commit()
        return True
    return False


# ============================================================
# CHAT CRUD
# ============================================================

def create_chat_session(db: Session, user_id):
    session = ChatSession(user_id=str(user_id))
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_user_sessions(db: Session, user_id: int):
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.pinned.desc(), ChatSession.updated_at.desc())
        .all()
    )


def get_session_messages(db: Session, session_id: int):
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
        .all()
    )


def add_message(db: Session, session_id: int, sender: str, content: str, sources: str = None):
    from datetime import datetime
    msg = ChatMessage(session_id=session_id, sender=sender, content=content, sources=sources)
    db.add(msg)

    # Update session's updated_at so it floats to top in sidebar
    session = db.query(ChatSession).get(session_id)
    if session:
        session.updated_at = datetime.utcnow()

    db.commit()
    return msg


def update_chat_title(db: Session, session_id: int, title: str):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if session:
        session.title = title
        db.commit()


def rename_session(db: Session, session_id: int, title: str):
    session = db.query(ChatSession).get(session_id)
    if not session:
        return None

    session.title = title
    db.commit()
    return session


def delete_session(db: Session, session_id: int):
    session = db.query(ChatSession).get(session_id)
    if not session:
        return False

    db.delete(session)
    db.commit()
    return True


def toggle_pin_session(db: Session, session_id: int):
    session = db.query(ChatSession).get(session_id)
    if not session:
        return None

    session.pinned = not session.pinned
    db.commit()
    return session


def search_chats(db: Session, user_id: int, query: str):
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id, ChatSession.title.ilike(f"%{query}%"))
        .order_by(ChatSession.pinned.desc(), ChatSession.created_at.desc())
        .all()
    )


# ============================================================
# 🔹 FACULTY FILE MANAGER CRUD
# ============================================================


def create_faculty_folder(db: Session, path: str, folder_name: str,
                           faculty_uid: str = None, year: int = None, section: str = None):
    """
    Create a virtual folder by inserting a placeholder record.
    year/section tag which students this folder targets (pre-fills the upload modal).
    """
    logical_path = f"{path}/{folder_name}" if path else folder_name

    folder = FacultyDocument(
        name=folder_name,
        file_path="__FOLDER__",
        logical_path=logical_path,
        pinned=False,
        faculty_uid=faculty_uid,
        year=year,
        section=section,
    )

    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


def list_faculty_items(db: Session, path: str, faculty_uid: str = None):
    path = path.strip("/")

    q = db.query(FacultyDocument)
    if faculty_uid:
        q = q.filter(FacultyDocument.faculty_uid == faculty_uid)
    records = q.all()

    # Build subject name lookup
    subject_ids = {r.subject_id for r in records if r.subject_id}
    subject_map = {}
    if subject_ids:
        subjects = db.query(Subject).filter(Subject.id.in_(subject_ids)).all()
        subject_map = {s.id: s.name for s in subjects}

    # Build folder record lookup: logical_path → record (for year/section metadata)
    folder_records = {
        r.logical_path.strip("/"): r
        for r in records if r.file_path == "__FOLDER__"
    }

    # folders_map: folder name → metadata dict (deduplicates by name)
    folders_map = {}
    files = []

    def add_folder(name, logical_path):
        if name in folders_map:
            return
        rec = folder_records.get(logical_path)
        folders_map[name] = {
            "name": name,
            "year": rec.year if rec else None,
            "section": rec.section if rec else None,
        }

    for r in records:
        full_path = r.logical_path.strip("/")

        # ROOT LEVEL
        if path == "":
            parts = full_path.split("/", 1)
            folder_name = parts[0]

            if r.file_path == "__FOLDER__":
                add_folder(folder_name, folder_name)
            elif len(parts) == 1:
                # File directly under root
                files.append({
                    "id": r.id,
                    "name": r.name,
                    "pinned": r.pinned,
                    "subject_name": subject_map.get(r.subject_id),
                    "chapter": r.chapter,
                })
            else:
                # File inside a subfolder — add the top-level folder
                add_folder(folder_name, folder_name)

        # INSIDE A FOLDER
        elif full_path.startswith(path + "/"):
            remaining = full_path[len(path) + 1:]

            if "/" in remaining:
                sub_name = remaining.split("/")[0]
                add_folder(sub_name, f"{path}/{sub_name}")
            else:
                if r.file_path == "__FOLDER__":
                    add_folder(remaining, f"{path}/{remaining}")
                else:
                    files.append({
                        "id": r.id,
                        "name": r.name,
                        "pinned": r.pinned,
                        "subject_name": subject_map.get(r.subject_id),
                        "chapter": r.chapter,
                    })

    return {"folders": sorted(folders_map.values(), key=lambda x: x["name"]), "files": files}


def rename_faculty_folder(db: Session, old_path: str, new_name: str):
    items = (
        db.query(FacultyDocument)
        .filter(FacultyDocument.logical_path.startswith(old_path))
        .all()
    )

    if "/" in old_path:
        parent = old_path.rsplit("/", 1)[0]
        new_base = f"{parent}/{new_name}"
    else:
        new_base = new_name

    for item in items:
        item.logical_path = item.logical_path.replace(old_path, new_base, 1)

    db.commit()


def add_faculty_file(db: Session, name: str, file_path: str, logical_path: str,
                     faculty_uid: str = None, subject_id: int = None,
                     chapter: str = None,
                     department: str = None, year: int = None, section: str = None):
    doc = FacultyDocument(
        name=name, file_path=file_path, logical_path=logical_path, pinned=False,
        faculty_uid=faculty_uid, subject_id=subject_id,
        chapter=chapter,
        department=department, year=year, section=section
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_student_timetable_subjects(db: Session, department: str, year: int, section: str):
    """Returns unique subject names from timetable for a student's dept/year/section."""
    rows = (
        db.query(Timetable.subject)
        .filter(
            Timetable.department == department,
            Timetable.year == year,
            Timetable.section == section,
        )
        .distinct()
        .all()
    )
    return [r.subject for r in rows]


def get_faculty_resources(db: Session, department: str, year: int, section: str,
                          subject_names: list = None):
    from sqlalchemy import or_
    q = db.query(FacultyDocument).filter(
        FacultyDocument.file_path != "__FOLDER__",
        FacultyDocument.department == department,
        FacultyDocument.year == year
    )
    # Show resources that match the student's section OR have no section (available to all)
    if section:
        q = q.filter(or_(
            FacultyDocument.section == section,
            FacultyDocument.section.is_(None),
            FacultyDocument.section == ""
        ))
    # Filter by subjects if provided (case-insensitive, from timetable + enrollment)
    if subject_names:
        from sqlalchemy import func
        lower_names = [s.lower() for s in subject_names]
        matching_subjects = db.query(Subject).filter(
            func.lower(Subject.name).in_(lower_names),
            Subject.department == department,
            Subject.year == year,
        ).all()
        subject_ids = [s.id for s in matching_subjects]
        if subject_ids:
            q = q.filter(FacultyDocument.subject_id.in_(subject_ids))
    return q.order_by(FacultyDocument.created_at.desc()).all()


def get_faculty_document_by_id(db: Session, doc_id: int):
    return db.query(FacultyDocument).get(doc_id)


def rename_faculty_item(db: Session, item_id: int, new_name: str):
    item = db.query(FacultyDocument).get(item_id)
    if not item:
        return None

    item.name = new_name
    db.commit()
    return item


def toggle_pin_faculty_item(db: Session, item_id: int):
    item = db.query(FacultyDocument).get(item_id)
    if not item:
        return None

    item.pinned = not item.pinned
    db.commit()
    return item


def delete_faculty_item(db: Session, path: str):
    """
    Delete faculty item by logical path (works for both files and folders)
    """
    # Delete all items that match or start with this path
    items = (
        db.query(FacultyDocument)
        .filter(
            (FacultyDocument.logical_path == path) |
            (FacultyDocument.logical_path.startswith(path + "/"))
        )
        .all()
    )
    
    if not items:
        return False
    
    for item in items:
        db.delete(item)

    db.commit()
    return True


# ============================================================
# STUDENT SUBJECT ENROLLMENT (manual enrollment)
# ============================================================

def get_student_enrolled_subjects(db: Session, student_uid: str):
    """Returns subject_id rows that the student has manually enrolled in."""
    return (
        db.query(StudentSubjectEnrollment)
        .filter(StudentSubjectEnrollment.student_uid == student_uid)
        .all()
    )


def enroll_student_in_subject(db: Session, student_uid: str, subject_id: int):
    """Enroll a student in a subject (idempotent)."""
    existing = (
        db.query(StudentSubjectEnrollment)
        .filter(
            StudentSubjectEnrollment.student_uid == student_uid,
            StudentSubjectEnrollment.subject_id == subject_id,
        )
        .first()
    )
    if existing:
        return existing
    enrollment = StudentSubjectEnrollment(student_uid=student_uid, subject_id=subject_id)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


def unenroll_student_from_subject(db: Session, student_uid: str, subject_id: int):
    """Remove a student's manual enrollment in a subject."""
    existing = (
        db.query(StudentSubjectEnrollment)
        .filter(
            StudentSubjectEnrollment.student_uid == student_uid,
            StudentSubjectEnrollment.subject_id == subject_id,
        )
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        return True
    return False
