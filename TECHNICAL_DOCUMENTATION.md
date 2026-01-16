# Student Study Partner - Technical Documentation

## 📚 Table of Contents
1. [System Overview](#system-overview)
2. [Core Concepts Explained](#core-concepts-explained)
3. [Architecture Deep Dive](#architecture-deep-dive)
4. [Dataset & Data Flow](#dataset--data-flow)
5. [Implemented Features](#implemented-features)
6. [Technical Stack Explained](#technical-stack-explained)
7. [API Reference](#api-reference)
8. [Deployment Guide](#deployment-guide)

---

## 🎯 System Overview

**Student Study Partner** is an AI-powered academic assistant that uses **Retrieval-Augmented Generation (RAG)** to help students learn from uploaded course materials. The system allows:
- **Faculty**: Upload and organize academic PDFs
- **Students**: Ask questions and get AI-generated answers grounded in those documents

### What Makes This Different?
Unlike generic chatbots, this system:
- ✅ **Grounds answers in uploaded documents** (prevents hallucinations)
- ✅ **Maintains session-scoped context** (documents don't leak across chats)
- ✅ **Falls back to general knowledge** when documents aren't relevant
- ✅ **Restricts to academic domain** (no casual conversations)

---

## 🧠 Core Concepts Explained

### 1. **Retrieval-Augmented Generation (RAG)**

**What is RAG?**
RAG is a technique that combines:
- **Retrieval**: Finding relevant information from a knowledge base
- **Generation**: Using an LLM to create answers based on retrieved information

**Why RAG?**
- **Problem**: LLMs can "hallucinate" (make up facts)
- **Solution**: Ground LLM responses in actual documents
- **Result**: More accurate, verifiable answers

**How RAG Works in This Project:**
```
1. Student asks: "What is photosynthesis?"
2. System retrieves relevant chunks from biology PDFs
3. LLM generates answer using ONLY those chunks
4. Student gets accurate, document-grounded response
```

---

### 2. **Vector Embeddings**

**What are Embeddings?**
Embeddings convert text into numerical vectors (arrays of numbers) that capture semantic meaning.

**Example:**
```
Text: "The cat sat on the mat"
Embedding: [0.23, -0.45, 0.67, ..., 0.12]  (384 dimensions)
```

**Why Embeddings?**
- Similar meanings → Similar vectors
- Enables semantic search (not just keyword matching)
- "photosynthesis" and "plant energy production" are close in vector space

**Model Used:**
- **all-MiniLM-L6-v2** (Sentence Transformers)
- Converts text to 384-dimensional vectors
- Fast and lightweight (suitable for student projects)

---

### 3. **FAISS (Vector Database)**

**What is FAISS?**
FAISS (Facebook AI Similarity Search) is a library for efficient similarity search in high-dimensional vector spaces.

**How It Works:**
```
1. Store document embeddings in FAISS index
2. When query comes in, embed it
3. FAISS finds most similar document embeddings
4. Return corresponding text chunks
```

**Why FAISS?**
- **Fast**: Searches millions of vectors in milliseconds
- **Efficient**: Uses optimized indexing algorithms
- **Scalable**: Can handle large document collections

**In This Project:**
- Faculty PDFs → Global FAISS index
- Student PDFs → Session-specific FAISS indices

---

### 4. **Session-Scoped Context**

**What is Session Scoping?**
Each chat session has its own isolated context and document scope.

**Why Session Scoping?**
- **Problem**: Documents from one chat affecting another
- **Solution**: Separate FAISS indices per session
- **Result**: Clean, independent conversations

**Example:**
```
Session 1: Student uploads "Biology.pdf"
  → Questions answered from Biology.pdf

Session 2: Student uploads "Physics.pdf"
  → Questions answered from Physics.pdf
  → Biology.pdf NOT used here
```

---

### 5. **Relevance Gating**

**What is Relevance Gating?**
A threshold-based mechanism to decide whether retrieved documents are relevant enough to use.

**How It Works:**
```python
similarity_score = cosine_similarity(query_embedding, doc_embedding)

if similarity_score >= 0.1:  # Threshold
    use_document_based_answer()
else:
    use_general_academic_knowledge()
```

**Why Relevance Gating?**
- Prevents using irrelevant documents
- Falls back gracefully when no relevant docs exist
- Improves answer quality

---

## 🏗️ Architecture Deep Dive

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ ChatBox  │  │ Sidebar  │  │  Upload  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────▼────────────────────────────────────┐
│                  BACKEND (FastAPI)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │              RAG Pipeline                        │  │
│  │  1. Embed Query                                  │  │
│  │  2. Retrieve from FAISS                          │  │
│  │  3. Check Relevance                              │  │
│  │  4. Generate Answer                              │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌───────────────┐         ┌───────────────┐
│    SQLite     │         │     FAISS     │
│   Database    │         │ Vector Store  │
│               │         │               │
│ • Sessions    │         │ • Faculty     │
│ • Messages    │         │   Index       │
│ • Metadata    │         │ • Session     │
│               │         │   Indices     │
└───────────────┘         └───────────────┘
```

### Data Flow: Student Asks a Question

```
1. Student types: "Explain Newton's First Law"
   ↓
2. Frontend sends POST /chat
   {
     "question": "Explain Newton's First Law",
     "user_id": 123,
     "session_id": 456
   }
   ↓
3. Backend embeds question → [0.12, -0.34, ...]
   ↓
4. FAISS searches:
   - Faculty index (global physics PDFs)
   - Session index (student's uploaded PDFs)
   ↓
5. Retrieves top 5 chunks with similarity scores
   ↓
6. Relevance check:
   - If max_score >= 0.1 → Use document chunks
   - If max_score < 0.1 → Use general knowledge
   ↓
7. LLM generates answer using appropriate prompt
   ↓
8. Save message to database
   ↓
9. Return answer to frontend
   ↓
10. Display with typing animation
```

---

## 📊 Dataset & Data Flow

### Data Types in the System

#### 1. **User Data**
```json
{
  "user_id": 123,
  "email": "student@university.edu",
  "role": "student",
  "created_at": "2024-01-15T10:30:00Z"
}
```
**Storage**: Firebase Authentication
**Purpose**: User identification and access control

---

#### 2. **Chat Sessions**
```json
{
  "id": 456,
  "user_id": 123,
  "title": "Physics - Newton's Laws",
  "created_at": "2024-01-15T10:30:00Z",
  "is_pinned": false
}
```
**Storage**: SQLite (`chat_sessions` table)
**Purpose**: Organize conversations, enable history

---

#### 3. **Messages**
```json
{
  "id": 789,
  "session_id": 456,
  "sender": "user",
  "content": "Explain Newton's First Law",
  "timestamp": "2024-01-15T10:31:00Z"
}
```
**Storage**: SQLite (`messages` table)
**Purpose**: Persist conversation history

---

#### 4. **Document Chunks**
```python
{
  "text": "Newton's First Law states that an object at rest...",
  "embedding": [0.23, -0.45, 0.67, ..., 0.12],  # 384 dimensions
  "metadata": {
    "document_name": "physics_chapter1.pdf",
    "owner_type": "faculty",
    "session_id": None,
    "chunk_index": 5
  }
}
```
**Storage**: FAISS index + Pickle metadata file
**Purpose**: Enable semantic search for RAG

---

### Dataset Structure

```
backend/
├── data/
│   ├── uploads/              # Original PDF files
│   │   ├── uuid1_physics.pdf
│   │   ├── uuid2_biology.pdf
│   │   └── ...
│   │
│   ├── faiss/                # Vector indices
│   │   ├── faculty/          # Global faculty documents
│   │   │   ├── index.faiss   # FAISS index file
│   │   │   └── index.faiss.meta  # Metadata (text chunks)
│   │   │
│   │   └── sessions/         # Session-scoped documents
│   │       ├── 456.faiss     # Session 456's index
│   │       ├── 456.faiss.meta
│   │       ├── 789.faiss
│   │       └── 789.faiss.meta
│   │
│   └── database.db           # SQLite database
```

---

### Document Processing Pipeline

```
1. Faculty uploads "physics_chapter1.pdf"
   ↓
2. PDF saved to data/uploads/
   ↓
3. PyPDF2 extracts text
   ↓
4. Text split into chunks:
   - Chunk size: 500 characters
   - Overlap: 50 characters
   Example chunks:
   [
     "Newton's First Law states...",
     "...states that an object at rest...",
     "...at rest remains at rest unless..."
   ]
   ↓
5. Each chunk embedded using Sentence Transformers
   ↓
6. Embeddings stored in FAISS:
   - index.faiss (vector data)
   - index.faiss.meta (text + metadata)
   ↓
7. Ready for retrieval!
```

---

### Example Dataset Sizes

**Small Deployment (10 students, 5 faculty):**
- PDFs: ~50 files (500MB)
- FAISS indices: ~10MB
- SQLite database: ~5MB
- Total: ~515MB

**Medium Deployment (100 students, 20 faculty):**
- PDFs: ~500 files (5GB)
- FAISS indices: ~100MB
- SQLite database: ~50MB
- Total: ~5.15GB

---

## ✅ Implemented Features

### 🟢 **Fully Implemented**

#### 1. Authentication System
- ✅ Firebase Auth integration
- ✅ Google OAuth login
- ✅ GitHub OAuth login
- ✅ Email/Password login
- ✅ User profile with avatar
- ✅ Logout functionality

#### 2. Chat System
- ✅ Session-based conversations
- ✅ Message persistence in database
- ✅ Real-time message display
- ✅ Typing animation for AI responses
- ✅ Auto-scroll to latest message
- ✅ User/AI message differentiation

#### 3. RAG Pipeline
- ✅ PDF upload (faculty & student)
- ✅ Document chunking (500 chars, 50 overlap)
- ✅ Embedding generation (Sentence Transformers)
- ✅ FAISS vector storage
- ✅ Semantic similarity search
- ✅ Relevance gating (threshold: 0.1)
- ✅ Document-grounded answer generation
- ✅ Fallback to general academic knowledge

#### 4. Session Management
- ✅ Create new chat session
- ✅ Auto-generate chat titles
- ✅ Rename chat sessions
- ✅ Delete chat sessions
- ✅ Pin/unpin chats
- ✅ Search chat history
- ✅ Load previous conversations

#### 5. Document Management
- ✅ Faculty folder creation
- ✅ Folder rename/delete
- ✅ PDF upload to folders
- ✅ Session-scoped student uploads
- ✅ File validation (PDF only)

#### 6. UI/UX Features
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Dark/Light theme toggle
- ✅ Mobile hamburger menu
- ✅ Sidebar with chat history
- ✅ Three-dot menu for chat actions
- ✅ Attachment button for PDFs
- ✅ User profile dropdown

---

### 🔴 **Not Implemented** (Future Scope)

- ❌ Multi-modal support (images, videos)
- ❌ Voice input/output
- ❌ Collaborative chats
- ❌ Analytics dashboard
- ❌ Quiz generation
- ❌ Citation tracking
- ❌ Export conversations
- ❌ Real-time notifications
- ❌ Admin panel
- ❌ Usage analytics

---

## 🛠️ Technical Stack Explained

### Frontend Technologies

#### **React.js**
- **What**: JavaScript library for building UIs
- **Why**: Component-based, efficient re-rendering
- **Used For**: Chat interface, sidebar, forms

#### **Vite**
- **What**: Fast build tool and dev server
- **Why**: Faster than Create React App
- **Used For**: Development and production builds

#### **Firebase Auth**
- **What**: Authentication service by Google
- **Why**: Handles OAuth, security, user management
- **Used For**: Login, signup, session management

#### **Axios**
- **What**: HTTP client for API requests
- **Why**: Promise-based, interceptors, error handling
- **Used For**: Backend API communication

---

### Backend Technologies

#### **FastAPI**
- **What**: Modern Python web framework
- **Why**: Fast, automatic API docs, async support
- **Used For**: REST API endpoints

#### **SQLite**
- **What**: Lightweight file-based database
- **Why**: No server needed, perfect for prototypes
- **Used For**: Chat sessions, messages, metadata

#### **SQLAlchemy**
- **What**: Python ORM (Object-Relational Mapping)
- **Why**: Write Python instead of SQL, prevents injection
- **Used For**: Database operations

#### **FAISS**
- **What**: Vector similarity search library
- **Why**: Fast, efficient, production-ready
- **Used For**: Semantic document retrieval

#### **Sentence Transformers**
- **What**: Library for text embeddings
- **Why**: Pre-trained models, easy to use
- **Used For**: Converting text to vectors

#### **Groq LLM**
- **What**: Fast LLM inference API
- **Why**: Low latency, LLaMA 3.3 70B model
- **Used For**: Answer generation

#### **PyPDF2**
- **What**: PDF text extraction library
- **Why**: Simple, reliable
- **Used For**: Extracting text from uploaded PDFs

---

## 🔌 API Reference

### Chat Endpoints

#### **POST /chat**
Send a message and get AI response.

**Request:**
```json
{
  "question": "What is photosynthesis?",
  "user_id": 123,
  "session_id": 456
}
```

**Response:**
```json
{
  "session_id": 456,
  "answer": "Photosynthesis is the process by which plants..."
}
```

**Flow:**
1. Create session if `session_id` is null
2. Save user message to database
3. Run RAG pipeline
4. Save AI response to database
5. Auto-generate title if first message
6. Return response

---

#### **POST /chat/session**
Create a new chat session.

**Request:**
```json
{
  "user_id": 123
}
```

**Response:**
```json
{
  "session_id": 789
}
```

---

#### **GET /chat/sessions/{user_id}**
Get all chat sessions for a user.

**Response:**
```json
[
  {
    "id": 456,
    "title": "Physics - Newton's Laws",
    "created_at": "2024-01-15T10:30:00Z",
    "is_pinned": false
  },
  {
    "id": 789,
    "title": "Biology - Photosynthesis",
    "created_at": "2024-01-16T14:20:00Z",
    "is_pinned": true
  }
]
```

---

#### **GET /chat/messages/{session_id}**
Get all messages in a session.

**Response:**
```json
[
  {
    "id": 1,
    "sender": "user",
    "content": "What is Newton's First Law?",
    "timestamp": "2024-01-15T10:31:00Z"
  },
  {
    "id": 2,
    "sender": "ai",
    "content": "Newton's First Law states...",
    "timestamp": "2024-01-15T10:31:05Z"
  }
]
```

---

#### **PUT /chat/{session_id}/rename**
Rename a chat session.

**Request:**
```json
{
  "title": "My Physics Notes"
}
```

**Response:**
```json
{
  "message": "Chat renamed"
}
```

---

#### **DELETE /chat/{session_id}**
Delete a chat session and all its messages.

**Response:**
```json
{
  "message": "Chat deleted"
}
```

---

#### **POST /chat/{session_id}/pin**
Toggle pin status of a chat.

**Response:**
```json
{
  "message": "Pin toggled"
}
```

---

#### **GET /chat/search/{user_id}?q=physics**
Search user's chats by title or content.

**Response:**
```json
[
  {
    "id": 456,
    "title": "Physics - Newton's Laws",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### Upload Endpoints

#### **POST /upload/faculty**
Upload PDF to global knowledge base.

**Request:** (multipart/form-data)
```
file: physics_chapter1.pdf
```

**Response:**
```json
{
  "message": "Faculty PDF uploaded and indexed"
}
```

**Process:**
1. Validate PDF format
2. Save to `data/uploads/`
3. Extract text with PyPDF2
4. Chunk text (500 chars, 50 overlap)
5. Generate embeddings
6. Store in `data/faiss/faculty/index.faiss`

---

#### **POST /upload/student**
Upload PDF scoped to a session.

**Request:** (multipart/form-data)
```
user_id: 123
session_id: 456
file: my_notes.pdf
```

**Response:**
```json
{
  "message": "PDF uploaded",
  "session_id": 456
}
```

**Process:**
1. Create session if not exists
2. Save PDF
3. Extract and chunk text
4. Generate embeddings
5. Store in `data/faiss/sessions/456.faiss`

---

### Faculty Management Endpoints

#### **GET /faculty/files?path=/physics**
List folders and files under a path.

**Response:**
```json
{
  "folders": [
    {"id": 1, "name": "Chapter 1"},
    {"id": 2, "name": "Chapter 2"}
  ],
  "files": [
    {"id": 10, "name": "syllabus.pdf"}
  ]
}
```

---

#### **POST /faculty/folder**
Create a new folder.

**Request:**
```json
{
  "path": "/physics",
  "name": "Chapter 3"
}
```

**Response:**
```json
{
  "id": 3,
  "name": "Chapter 3"
}
```

---

#### **PUT /faculty/folder/rename**
Rename a folder.

**Request:**
```json
{
  "old_path": "/physics/Chapter 3",
  "new_name": "Chapter 3 - Mechanics"
}
```

**Response:**
```json
{
  "message": "Folder renamed successfully"
}
```

---

#### **DELETE /faculty/folder**
Delete a folder and its contents.

**Request:**
```json
{
  "path": "/physics/Chapter 3"
}
```

**Response:**
```json
{
  "message": "Folder deleted successfully"
}
```

---

## 🚀 Deployment Guide

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- Firebase project (for authentication)
- Groq API key (free tier available)

---

### Backend Setup

#### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

**Key Dependencies:**
```
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
faiss-cpu==1.7.4
sentence-transformers==2.2.2
langchain-groq==0.0.1
pypdf2==3.0.1
python-dotenv==1.0.0
```

#### 2. Configure Environment
Create `.env` file:
```env
GROQ_API_KEY=your_groq_api_key_here
```

#### 3. Initialize Database
```bash
# Database tables are auto-created on first run
python -c "from app.db.database import engine; from app.db import models; models.Base.metadata.create_all(bind=engine)"
```

#### 4. Run Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Server will start at:** `http://localhost:8000`
**API Docs:** `http://localhost:8000/docs`

---

### Frontend Setup

#### 1. Install Dependencies
```bash
cd student-study-partner
npm install
```

**Key Dependencies:**
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.11.0",
  "axios": "^1.13.2",
  "firebase": "^10.7.1"
}
```

#### 2. Configure Firebase
Create `src/firebase/config.js`:
```javascript
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "your_api_key",
  authDomain: "your_domain.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_bucket.appspot.com",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const githubProvider = new GithubAuthProvider()
```

#### 3. Run Development Server
```bash
npm run dev
```

**App will start at:** `http://localhost:5173`

---

### Firebase Setup

#### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: "student-study-partner"
4. Disable Google Analytics (optional)
5. Click "Create Project"

#### 2. Enable Authentication
1. Go to "Authentication" → "Sign-in method"
2. Enable:
   - Email/Password
   - Google
   - GitHub (requires OAuth app setup)

#### 3. Get Configuration
1. Go to Project Settings → General
2. Scroll to "Your apps"
3. Click "Web" icon
4. Copy configuration object

---

### Groq API Setup

#### 1. Get API Key
1. Go to [Groq Console](https://console.groq.com/)
2. Sign up / Log in
3. Go to "API Keys"
4. Click "Create API Key"
5. Copy the key

#### 2. Add to Backend
```bash
# backend/.env
GROQ_API_KEY=gsk_your_api_key_here
```

---

### Production Deployment

#### Backend (Example: Railway/Render)
```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend (Example: Vercel/Netlify)
```bash
# Build for production
npm run build

# Output in dist/ folder
# Deploy dist/ folder to hosting service
```

---

## 📝 Key Takeaways

### What This System Does:
✅ Enables students to chat with academic PDFs
✅ Provides document-grounded answers (prevents hallucinations)
✅ Maintains session-scoped context (no data leakage)
✅ Falls back to general knowledge when needed
✅ Restricts to academic domain only

### What This System Does NOT Do:
❌ Production-scale hospital deployment
❌ Real-time collaboration
❌ Multi-modal support (images/videos)
❌ Advanced analytics
❌ Enterprise features

### Technical Highlights:
- **RAG Pipeline**: Retrieval → Relevance Gating → Generation
- **Vector Search**: FAISS for fast semantic similarity
- **Session Isolation**: Separate indices per chat
- **Academic Focus**: Domain-constrained responses

---

## 📧 Support

For technical questions or issues:
- **Documentation**: This file
- **API Docs**: `http://localhost:8000/docs`
- **GitHub Issues**: [Create an issue]

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Project Type**: Final Year Academic Project
