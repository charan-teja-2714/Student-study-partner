from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from datetime import datetime
from sqlalchemy.orm import relationship
from .database import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)

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
    # active_document = Column(String, nullable=True)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))

    sender = Column(String)  # user / ai
    content = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")
    

class FacultyDocument(Base):
    __tablename__ = "faculty_documents"

    id = Column(Integer, primary_key=True, index=True)

    # Display name (what faculty sees)
    name = Column(String, nullable=False)

    # Actual stored file path on disk
    file_path = Column(String, nullable=False)

    # Logical folder path (UI breadcrumbs)
    # Example: "Semester 5/DBMS/Unit 2"
    logical_path = Column(String, nullable=False)

    # Pin important documents
    pinned = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
