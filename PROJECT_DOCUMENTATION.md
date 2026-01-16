# Student Study Partner - AI-Based Academic Assistant

## 📋 Project Overview

**Student Study Partner** is an intelligent academic assistant platform that leverages **Retrieval-Augmented Generation (RAG)** technology to help students learn more effectively. The system allows faculty members to upload educational materials and enables students to interact with these documents through natural conversations, receiving accurate, context-aware answers to their academic questions.

---

## 🎯 Core Value Proposition

### For Students:
- **Instant Academic Support**: Get immediate answers to study questions 24/7
- **Document-Based Learning**: Ask questions directly about uploaded course materials
- **Personalized Study Sessions**: Each chat maintains its own context and document scope
- **General Academic Help**: Receive answers even without specific documents

### For Faculty:
- **Easy Content Management**: Upload and organize course materials in folders
- **Scalable Distribution**: Share resources with all students instantly
- **No Manual Q&A**: Let AI handle repetitive student questions

---

## 🏗️ Technical Architecture

### Technology Stack

#### Frontend
- **Framework**: React.js with Vite
- **Styling**: CSS3 with responsive design
- **State Management**: React Hooks (useState, useContext)
- **Authentication**: Firebase Auth (Google, GitHub, Email/Password)
- **HTTP Client**: Axios

#### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **Vector Store**: FAISS (Facebook AI Similarity Search)
- **AI Model**: Groq LLM (LLaMA-based)
- **Embeddings**: Sentence Transformers (all-MiniLM-L6-v2)
- **PDF Processing**: PyPDF2

#### Infrastructure
- **Development Server**: Uvicorn (ASGI)
- **CORS**: Enabled for cross-origin requests
- **File Storage**: Local filesystem with UUID-based naming

---

## 🔄 System Architecture Flow

```
┌─────────────┐
│   Student   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         React Frontend                  │
│  • Chat Interface                       │
│  • Sidebar (Chat History)               │
│  • Document Upload                      │
│  • Theme Toggle (Light/Dark)            │
└──────────────┬──────────────────────────┘
               │ REST API
               ▼
┌─────────────────────────────────────────┐
│         FastAPI Backend                 │
│  • /chat - Main RAG endpoint            │
│  • /upload/student - Session PDFs       │
│  • /upload/faculty - Global PDFs        │
│  • /chat/sessions - History management  │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐  ┌──────────────┐
│   SQLite    │  │    FAISS     │
│  Database   │  │ Vector Store │
│             │  │              │
│ • Sessions  │  │ • Embeddings │
│ • Messages  │  │ • Chunks     │
│ • Metadata  │  │ • Similarity │
└─────────────┘  └──────────────┘
       │                │
       └────────┬───────┘
                ▼
         ┌──────────────┐
         │   Groq LLM   │
         │  (LLaMA 3)   │
         └──────────────┘
```

---

## ✨ Key Features

### 1. **Role-Based Access Control**
- **Student Role**: Chat interface, document upload, session management
- **Faculty Role**: Bulk PDF upload, folder organization, content management
- **Authentication**: Firebase-based secure login with multiple providers

### 2. **Intelligent Chat System**
- **Session-Based Conversations**: Each chat is independent with its own context
- **Auto-Generated Titles**: AI creates meaningful chat titles from first message
- **Chat History Sidebar**: View, search, rename, delete, and pin conversations
- **Real-Time Responses**: Streaming-like typing animation for AI answers
- **Message Persistence**: All conversations saved in database

### 3. **RAG-Powered Question Answering**

#### How RAG Works:
1. **Document Ingestion**:
   - PDFs are uploaded and split into chunks (500 characters, 50 overlap)
   - Each chunk is converted to embeddings using Sentence Transformers
   - Embeddings stored in FAISS vector database

2. **Query Processing**:
   - Student asks a question
   - Question is embedded using same model
   - FAISS retrieves top-k most similar chunks (cosine similarity)

3. **Relevance Gating**:
   - System checks if retrieved chunks are relevant (threshold-based)
   - If relevant → Use chunks as context for LLM
   - If not relevant → Answer from general academic knowledge

4. **Answer Generation**:
   - Groq LLM generates response grounded in retrieved context
   - Prevents hallucinations by staying within document scope
   - Academic domain constraint (no casual conversations)

### 4. **Document Management**

#### Faculty Upload:
- Upload PDFs to global knowledge base
- Create folder hierarchies for organization
- Rename, delete, and manage folders
- All students can access faculty-uploaded materials

#### Student Upload:
- Upload PDFs scoped to specific chat session
- Documents only affect that particular conversation
- No cross-session document leakage
- Attachment preview before upload

### 5. **Session Management**
- **Create New Chat**: Fresh session with clean context
- **Rename Chat**: Custom titles or AI-generated
- **Delete Chat**: Remove session and all messages
- **Pin Chat**: Keep important conversations at top
- **Search Chats**: Find conversations by title or content

### 6. **User Experience Features**
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: Toggle between themes
- **Mobile Hamburger Menu**: Collapsible sidebar for mobile
- **ChatGPT-like Interface**: Familiar and intuitive design
- **Typing Animation**: Simulates real-time AI thinking
- **User Profile Dropdown**: Avatar with logout and settings

---

## 📊 Database Schema

### Tables

#### 1. **chat_sessions**
```sql
- id (Primary Key)
- user_id (Foreign Key)
- title (Auto-generated or custom)
- created_at (Timestamp)
- is_pinned (Boolean)
```

#### 2. **messages**
```sql
- id (Primary Key)
- session_id (Foreign Key)
- sender (user/ai)
- content (Text)
- timestamp (DateTime)
```

#### 3. **faculty_folders**
```sql
- id (Primary Key)
- name (Folder name)
- path (Logical path)
- parent_id (Self-referencing FK)
- created_at (Timestamp)
```

#### 4. **document_metadata** (Implicit in FAISS)
```
- chunk_id
- document_name
- owner_type (faculty/student)
- owner_id
- session_id (for student docs)
- embedding_vector
```

---

## 🔌 API Endpoints

### Chat Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Send message and get AI response |
| POST | `/chat/session` | Create new chat session |
| GET | `/chat/sessions/{user_id}` | Get all user chat sessions |
| GET | `/chat/messages/{session_id}` | Get messages for a session |
| PUT | `/chat/{session_id}/rename` | Rename chat session |
| DELETE | `/chat/{session_id}` | Delete chat session |
| POST | `/chat/{session_id}/pin` | Toggle pin status |
| GET | `/chat/search/{user_id}` | Search user's chats |

### Upload Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/faculty` | Upload PDF to global knowledge base |
| POST | `/upload/student` | Upload PDF scoped to session |
| GET | `/faculty/files` | List faculty folders and files |
| POST | `/faculty/folder` | Create new folder |
| PUT | `/faculty/folder/rename` | Rename folder |
| DELETE | `/faculty/folder` | Delete folder |

---

## 🚀 Deployment & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Firebase Project (for authentication)
- Groq API Key

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd student-study-partner
npm install
npm run dev
```

### Environment Variables
```env
# Backend
GROQ_API_KEY=your_groq_api_key

# Frontend
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

---

## 🎨 UI/UX Highlights

### Design Principles
- **Minimalist**: Clean, distraction-free interface
- **Intuitive**: ChatGPT-inspired familiar layout
- **Responsive**: Mobile-first design approach
- **Accessible**: Proper contrast ratios and touch targets

### Key UI Components
1. **Navbar**: User profile, theme toggle, navigation
2. **Sidebar**: Chat history with search and actions
3. **Chat Area**: Message bubbles with avatars
4. **Input Form**: Text input with attachment and send buttons
5. **Mobile Menu**: Hamburger navigation for small screens

---

## 🔒 Security Features

- **Firebase Authentication**: Industry-standard auth
- **Session Isolation**: No data leakage between chats
- **Input Validation**: PDF-only uploads, sanitized inputs
- **CORS Protection**: Configured allowed origins
- **SQL Injection Prevention**: SQLAlchemy ORM parameterization

---

## 📈 Performance Optimizations

- **FAISS Indexing**: Fast similarity search (O(log n))
- **Chunk Caching**: Reuse embeddings for same documents
- **Lazy Loading**: Load chat history on demand
- **Debounced Search**: Reduce API calls during typing
- **Optimized Embeddings**: Lightweight model (all-MiniLM-L6-v2)

---

## 🔮 Future Enhancements

### Planned Features
1. **Multi-Modal Support**: Images, videos, audio
2. **Collaborative Chats**: Share sessions with peers
3. **Analytics Dashboard**: Study patterns and insights
4. **Voice Input**: Speech-to-text for questions
5. **Export Conversations**: PDF/Markdown export
6. **Citation Tracking**: Show source chunks in answers
7. **Quiz Generation**: Auto-create quizzes from documents
8. **Notification System**: Alerts for new faculty uploads

---

## 📞 Support & Maintenance

### System Requirements
- **Storage**: ~500MB for base system + uploaded PDFs
- **RAM**: 2GB minimum, 4GB recommended
- **CPU**: 2 cores minimum for concurrent users

### Monitoring
- Backend health check: `GET /`
- Database integrity checks
- FAISS index validation
- API response time tracking

---

## 📄 License & Credits

**Developed By**: [Your Team Name]  
**Project Type**: Final Year Academic Project  
**Technology**: RAG (Retrieval-Augmented Generation)  
**AI Model**: Groq LLaMA 3  
**Year**: 2024-2025

---

## 📧 Contact Information

For technical support or inquiries:
- **Email**: [your-email@example.com]
- **GitHub**: [repository-link]
- **Documentation**: [docs-link]

---

**Note**: This system is designed for educational purposes and should be deployed in a controlled academic environment with proper data privacy measures.
