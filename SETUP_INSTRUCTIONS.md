# Student Study Partner - Setup Instructions

## Prerequisites

1. **Python 3.8+** - Download from [python.org](https://www.python.org/downloads/)
2. **Node.js 16+** - Download from [nodejs.org](https://nodejs.org/)
3. **Git** - Download from [git-scm.com](https://git-scm.com/)

## Additional Requirements

### Tesseract OCR (Required for PDF text extraction)

#### Windows:
1. Download Tesseract installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer (tesseract-ocr-w64-setup-v5.3.0.exe or latest)
3. Install to default location: `C:\Program Files\Tesseract-OCR\`
4. The backend code is already configured for this path

#### Mac:
```bash
brew install tesseract
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install tesseract-ocr
```

#### Verify Installation:
Open terminal/command prompt and run:
```bash
tesseract --version
```
You should see version information if installed correctly.

## Step-by-Step Setup

### 1. Clone the Project
```bash
git clone <your-repository-url>
cd student-study-partner
```

### 2. Backend Setup

#### Navigate to backend directory:
```bash
cd backend
```

#### Create virtual environment:
```bash
python -m venv venv
```

#### Activate virtual environment:
**Windows:**
```bash
venv\Scripts\activate
```
**Mac/Linux:**
```bash
source venv/bin/activate
```

#### Install Python dependencies:
```bash
pip install -r requirements.txt
```

#### Create environment file:
Create a file named `.env` in the `backend` folder with this content:
```
GROQ_API_KEY="your-groq-api-key-here"
LANGCHAIN_API_KEY="your-langchain-api-key-here"
SECRET_KEY="your-secret-key-here"
HF_API_KEY="your-huggingface-api-key-here"
HF_TOKEN="your-huggingface-token-here"
```

#### Create required directories:
```bash
mkdir -p data/uploads
mkdir -p data/faiss/sessions
mkdir -p data/faiss/faculty
```

### 3. Firebase Setup (Authentication)

The app uses Firebase for user authentication. The configuration is already included, but for production use:

#### Option 1: Use Existing Configuration (Quick Start)
The project includes a working Firebase configuration. No additional setup needed for testing.

#### Option 2: Create Your Own Firebase Project (Recommended for Production)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google (optional)
   - Enable GitHub (optional)
4. Get your config from Project Settings > General > Your apps
5. Replace the config in `frontend/src/firebase/config.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 4. Frontend Setup

#### Open new terminal and navigate to frontend:
```bash
cd frontend
```

#### Install Node.js dependencies:
```bash
npm install
```

### 4. Database Setup

The database (SQLite) will be created automatically when you first run the backend. No manual setup required.

### 5. Running the Application

#### Terminal 1 - Start Backend:
```bash
cd backend
# Activate virtual environment if not already active
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Start the server
uvicorn app.main:app --reload
```
Backend will run on: http://127.0.0.1:8000

#### Terminal 2 - Start Frontend:
```bash
cd frontend
npm run dev
```
Frontend will run on: http://localhost:5173

### 6. Access the Application

1. Open your browser
2. Go to: http://localhost:5173
3. The application is ready to use!

## Test Accounts

For testing purposes, create separate accounts:

### Student Account:
- Email: student@test.com
- Password: student123
- Role: Student

### Faculty Account:
- Email: faculty@test.com  
- Password: faculty123
- Role: Faculty

### Or use different login methods:
- Student: Email/Password
- Faculty: Google login
- This ensures different Firebase users

## Features Available

### For Students:
- Login/Register with email or social auth (Google/GitHub)
- Upload PDF documents
- Chat with AI about uploaded content
- Session-based document management

### For Faculty:
- File management system
- Create folders and organize documents
- Upload PDFs for student access
- Pin/rename/delete files and folders

## API Documentation

Backend API docs available at: http://127.0.0.1:8000/docs

## Troubleshooting

### Common Issues:

1. **Port already in use:**
   - Backend: Change port with `uvicorn app.main:app --reload --port 8001`
   - Frontend: It will automatically suggest a different port

2. **Python packages not installing:**
   - Make sure virtual environment is activated
   - Try: `pip install --upgrade pip` then retry

3. **Node modules issues:**
   - Delete `node_modules` folder
   - Run `npm install` again

4. **Database errors:**
   - Delete `chat.db` file in backend directory
   - Restart backend (database will be recreated)

5. **FAISS/AI not working:**
   - Check if all API keys are correctly set in `.env`
   - Ensure internet connection for AI services

### File Structure:
```
student-study-partner/
├── backend/
│   ├── app/
│   ├── data/          # Created automatically
│   ├── venv/          # Created by you
│   ├── .env           # Created by you
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── node_modules/  # Created by npm install
│   └── package.json
└── README.md
```

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Ensure all prerequisites are installed
3. Verify all steps were followed correctly
4. Check terminal outputs for specific error messages

## Security Note

The provided API keys and Firebase config are for development/demo purposes. For production use, please:
1. Get your own API keys from respective services (Groq, HuggingFace)
2. Create your own Firebase project with proper security rules
3. Keep the `.env` file secure and never share it publicly
4. Consider using environment-specific configurations
5. Set up proper Firebase security rules for production