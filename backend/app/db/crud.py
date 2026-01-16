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


from sqlalchemy.orm import Session
from .models import ChatSession, ChatMessage, FacultyDocument


def create_chat_session(db: Session, user_id: int):
    session = ChatSession(user_id=user_id)
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


def add_message(db: Session, session_id: int, sender: str, content: str):
    msg = ChatMessage(session_id=session_id, sender=sender, content=content)
    db.add(msg)

    # update session timestamp
    session = db.query(ChatSession).get(session_id)
    if session:
        session.updated_at = session.updated_at

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


def create_faculty_folder(db: Session, path: str, folder_name: str):
    """
    Create a virtual folder by inserting a placeholder record.
    """
    logical_path = f"{path}/{folder_name}" if path else folder_name

    folder = FacultyDocument(
        name=folder_name,
        file_path="__FOLDER__",  # marker, not a real file
        logical_path=logical_path,
        pinned=False,
    )

    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


def list_faculty_items(db: Session, path: str):
    path = path.strip("/")

    records = db.query(FacultyDocument).all()

    folders = set()
    files = []

    for r in records:
        full_path = r.logical_path.strip("/")

        # ROOT LEVEL
        if path == "":
            parts = full_path.split("/", 1)

            # Folder (even if empty)
            if r.file_path == "__FOLDER__":
                folders.add(parts[0])

            # File directly under root
            elif len(parts) == 1:
                files.append(r)

            # File/folder inside subfolder
            else:
                folders.add(parts[0])

        # INSIDE A FOLDER
        elif full_path.startswith(path + "/"):
            remaining = full_path[len(path) + 1 :]

            if "/" in remaining:
                folders.add(remaining.split("/")[0])
            else:
                if r.file_path == "__FOLDER__":
                    folders.add(remaining)
                else:
                    files.append(r)

    return {"folders": sorted(list(folders)), "files": files}


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


def add_faculty_file(db: Session, name: str, file_path: str, logical_path: str):
    doc = FacultyDocument(
        name=name, file_path=file_path, logical_path=logical_path, pinned=False
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


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


def delete_faculty_item(db: Session, item_id: int):
    item = db.query(FacultyDocument).get(item_id)
    if not item:
        return False

    db.delete(item)
    db.commit()
    return True
