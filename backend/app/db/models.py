from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from datetime import datetime
from sqlalchemy.orm import relationship
from .database import Base


# ============================================================
# USER PROFILE (stored in SQLite, linked to Firebase UID)
# ============================================================
class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)  # "student" or "faculty"
    display_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    department = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    section = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================
# SUBJECTS
# ============================================================
class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    faculty_uid = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================
# SECTIONS
# ============================================================
class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    department = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    section_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================
# CHAT SESSIONS
# ============================================================
class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)  # Firebase UID

    title = Column(String, default="New Chat")
    pinned = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    messages = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete"
    )


# ============================================================
# CHAT MESSAGES
# ============================================================
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))

    sender = Column(String)  # user / ai
    content = Column(Text)
    sources = Column(Text, nullable=True)  # JSON string of citation sources

    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")


# ============================================================
# FACULTY DOCUMENTS (file manager)
# ============================================================
class FacultyDocument(Base):
    __tablename__ = "faculty_documents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    logical_path = Column(String, nullable=False)
    pinned = Column(Boolean, default=False)

    # Academic metadata for filtering
    faculty_uid = Column(String, nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    chapter = Column(String, nullable=True)       # e.g. "Chapter 1", "Unit 2"
    department = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    section = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================
# STUDENT SUBJECT ENROLLMENT (manual, secondary source)
# ============================================================
class StudentSubjectEnrollment(Base):
    __tablename__ = "student_subject_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_uid = Column(String, nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================
# TIMETABLE
# ============================================================
class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    faculty_uid = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    department = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    section = Column(String, nullable=False)
    day = Column(String, nullable=False)
    time = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
