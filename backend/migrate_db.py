"""
Database migration script.
Run this ONCE to add new columns and tables to the existing SQLite DB.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "chat.db")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# -------------------------------------------------------
# 1. faculty_documents — add new columns
# -------------------------------------------------------
fd_cols = [row[1] for row in cursor.execute("PRAGMA table_info(faculty_documents)")]

if "faculty_uid" not in fd_cols:
    cursor.execute("ALTER TABLE faculty_documents ADD COLUMN faculty_uid TEXT")
    print("Added faculty_uid to faculty_documents")

if "subject_id" not in fd_cols:
    cursor.execute("ALTER TABLE faculty_documents ADD COLUMN subject_id INTEGER")
    print("Added subject_id to faculty_documents")

if "department" not in fd_cols:
    cursor.execute("ALTER TABLE faculty_documents ADD COLUMN department TEXT")
    print("Added department to faculty_documents")

if "year" not in fd_cols:
    cursor.execute("ALTER TABLE faculty_documents ADD COLUMN year INTEGER")
    print("Added year to faculty_documents")

if "section" not in fd_cols:
    cursor.execute("ALTER TABLE faculty_documents ADD COLUMN section TEXT")
    print("Added section to faculty_documents")

# -------------------------------------------------------
# 2. chat_messages — add sources column
# -------------------------------------------------------
cm_cols = [row[1] for row in cursor.execute("PRAGMA table_info(chat_messages)")]

if "sources" not in cm_cols:
    cursor.execute("ALTER TABLE chat_messages ADD COLUMN sources TEXT")
    print("Added sources to chat_messages")

# -------------------------------------------------------
# 3. Create new tables
# -------------------------------------------------------
cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        display_name TEXT,
        email TEXT,
        department TEXT,
        year INTEGER,
        section TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")
print("Ensured user_profiles table exists")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        year INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")
print("Ensured subjects table exists")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        department TEXT NOT NULL,
        year INTEGER NOT NULL,
        section_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")
print("Ensured sections table exists")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS timetables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        faculty_uid TEXT NOT NULL,
        subject TEXT NOT NULL,
        department TEXT NOT NULL,
        year INTEGER NOT NULL,
        section TEXT NOT NULL,
        day TEXT NOT NULL,
        time TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")
print("Ensured timetables table exists")

conn.commit()
conn.close()
print("\n✅ Migration complete!")
