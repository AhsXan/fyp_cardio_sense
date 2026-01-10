# Cardio Sense - Complete Setup Guide

A step-by-step guide to set up and run the Cardio Sense project from scratch.

## 📋 Table of Contents

- [Quick Start (5 minutes)](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Running the Application](#running-the-application)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## ⚡ Quick Start (5 minutes)

For experienced developers who already have all prerequisites installed.

### 1. Backend Setup

```powershell
cd "c:\Users\Raja\Desktop\Cursor\Fyp\Cardio Sense\backend"

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: **http://localhost:8000**

### 2. Frontend Setup (New Terminal)

```powershell
cd "c:\Users\Raja\Desktop\Cursor\Fyp\Cardio Sense\frontend"

# Install dependencies
npm install

# Start frontend
npm run dev
```

Frontend runs at: **http://localhost:3000**

### 3. Login

- **Email:** admin@cardiosense.com
- **Password:** AdminPass123!

---

## 🔧 Detailed Setup

### Step 1: Verify Prerequisites

Before starting, verify all required software is installed:

```powershell
# Check Python
python --version  # Should be 3.11 or higher

# Check Node.js
node --version    # Should be 20.19.0 or higher
npm --version     # Should be 10.x or higher

# Check PostgreSQL
psql --version    # Should be 12 or higher
```

**Not installed?** Follow [PREREQUISITES.md](PREREQUISITES.md)

---

### Step 2: Clone/Prepare Project

If you haven't already extracted the project:

```powershell
# Navigate to project root
cd "c:\Users\Raja\Desktop\Cursor\Fyp\Cardio Sense"

# Verify structure
dir  # Should show: backend, frontend, ai, SETUP_GUIDE.md, etc.
```

---

### Step 3: Backend Setup

#### 3a. Create Virtual Environment

```powershell
cd backend

# Create virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1
```

**Verify:** Your terminal should show `(venv)` prefix

If activation fails:

```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Try again
.\venv\Scripts\Activate.ps1
```

#### 3b. Install Python Dependencies

```powershell
# Make sure (venv) is active
pip install --upgrade pip

# Install all requirements
pip install -r requirements.txt
```

**Expected time:** 5-10 minutes (includes TensorFlow download)

**Verification:**
```powershell
python -c "import fastapi; import sqlalchemy; import tensorflow; print('✅ All imports successful')"
```

#### 3c. Create .env Configuration File

Create `backend/.env` with this content:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:2025@localhost:5432/postgres

# Admin Credentials (change in production)
ADMIN_EMAIL=admin@cardiosense.com
ADMIN_PASSWORD=AdminPass123!

# JWT Configuration (generate random string for production)
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production

# Email Configuration (Optional - for OTP via Gmail)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=CardioSense

# API Configuration
API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# Debug Mode
DEBUG=True
```

**Notes:**
- Keep `DEBUG=False` in production
- Replace JWT_SECRET_KEY with a random strong string
- For Gmail SMTP setup, see [backend/documents/GMAIL_OTP_SETUP.md](backend/documents/GMAIL_OTP_SETUP.md)

---

### Step 4: Database Setup

#### 4a. Start PostgreSQL

**Windows:**
```powershell
# Check if running
Get-Service postgresql-x64-15

# If stopped, start it
Start-Service postgresql-x64-15
```

**macOS:**
```bash
brew services start postgresql@15
```

**Linux:**
```bash
sudo systemctl start postgresql
```

#### 4b. Verify Connection

```powershell
# Test PostgreSQL connection
psql -U postgres -h localhost -c "SELECT version();"
```

Should output PostgreSQL version.

#### 4c. Create Database (Optional)

```bash
# Open PostgreSQL CLI
psql -U postgres

# Create database
CREATE DATABASE cardio_sense;
\q
```

#### 4d. Initialize Database Tables

Backend will auto-create tables on first run, but you can pre-initialize:

```powershell
# From backend folder with (venv) active
cd c:\Users\Raja\Desktop\Cursor\Fyp\Cardio Sense\backend

python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine); print('✅ Database tables created')"
```

---

### Step 5: Frontend Setup

#### 5a. Install Node Modules

```powershell
cd "c:\Users\Raja\Desktop\Cursor\Fyp\Cardio Sense\frontend"

# Install dependencies
npm install
```

**Expected time:** 2-3 minutes

**Verify:**
```powershell
npm list react react-dom vite
```

#### 5b. Build Configuration Check

Frontend uses **Vite** with these features:
- Development server on port 3000
- API proxy to backend (http://localhost:8000)
- MSW mocking for development
- Tailwind CSS styling

No additional configuration needed for local development.

---

### Step 6: AI Model Setup

#### 6a. Verify Model File

The pre-trained model should be at:
```
ai/hybrid_cnn_lstm_heart_sound_final.h5
```

Check it exists:
```powershell
cd ai
ls -la hybrid_cnn_lstm_heart_sound_final.h5
```

**Expected size:** ~899 KB

#### 6b. AI Python Dependencies

AI dependencies are already in `backend/requirements.txt`:
- TensorFlow 2.15.0
- librosa 0.10.1
- scipy 1.11.4
- numpy 1.24.3

These are installed when you run `pip install -r requirements.txt`

#### 6c. Optional: Retrain Model

To retrain with calibration improvements:

```powershell
cd ai

# Activate backend venv
..\backend\venv\Scripts\Activate.ps1

# Run calibrated training
python fyp_training_calibrated.py
```

**Note:** Requires training data in `ai/normal/` and `ai/abnormal/` folders

---

## 🚀 Running the Application

### Terminal Setup

Open **3 terminals** (PowerShell or Command Prompt) in the project root:

```
Terminal 1: Backend
Terminal 2: Frontend  
Terminal 3: Optional (for testing, AI training, etc.)
```

### Terminal 1: Start Backend

```powershell
cd "c:\Users\Raja\Desktop\Cursor\Fyp\Cardio Sense\backend"

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start FastAPI server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

**API Documentation:** http://localhost:8000/docs

### Terminal 2: Start Frontend

```powershell
cd "c:\Users\Raja\Desktop\Cursor\Fyp\Cardio Sense\frontend"

# Start Vite development server
npm run dev
```

**Expected output:**
```
  VITE v7.2.2  ready in 245 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

### Access Application

Open browser and navigate to: **http://localhost:3000**

---

## 🔐 Authentication

### Test Login Credentials

**Admin Account:**
- Email: `admin@cardiosense.com`
- Password: `AdminPass123!`

**Mock Users (in development):**
- Doctor: `raja3.ahsan@gmail.com` / `password123`
- Researcher: `ahsan3.dev@gmail.com` / `password123`
- Patient: `ahsan3.aahmed@gmail.com` / `password123`

### First-Time Login

1. Click "Login" on landing page
2. Enter admin credentials
3. Click "Sign In"
4. On production, you'd receive OTP via email
5. In development, OTP appears in backend terminal

---

## 📊 Database Configuration

### Tables Created Automatically

On first run, the backend creates these tables:

- **users** - Patient, Doctor, Researcher, Admin accounts
- **otp_tokens** - One-time passwords for verification
- **pcg_uploads** - Heart sound audio file uploads
- **analysis_results** - AI model predictions and analysis
- **datasets** - Research datasets available to researchers
- **dataset_access** - Access requests for datasets

### View Database

```powershell
# Connect to database
psql -U postgres -d postgres

# List tables
\dt

# View users table
SELECT * FROM users;

# Quit
\q
```

### Reset Database

⚠️ **Warning:** This deletes all data!

```powershell
# From backend folder
python -c "from app.database import Base, engine; Base.metadata.drop_all(bind=engine); Base.metadata.create_all(bind=engine); print('✅ Database reset')"
```

---

## 📁 Project Structure

```
Cardio Sense/
│
├── backend/                          # FastAPI Backend
│   ├── app/
│   │   ├── main.py                  # FastAPI application entry
│   │   ├── database.py              # SQLAlchemy configuration
│   │   ├── models/                  # Database models
│   │   │   ├── user.py              # User model
│   │   │   ├── pcg_upload.py        # Upload model
│   │   │   ├── analysis_result.py   # AI results
│   │   │   ├── otp_token.py         # OTP verification
│   │   │   ├── dataset.py           # Datasets
│   │   │   └── doctor_patient.py    # Doctor-Patient relation
│   │   ├── routes/                  # API routes
│   │   │   ├── auth.py              # Authentication endpoints
│   │   │   ├── pcg.py               # PCG upload/results
│   │   │   ├── doctor.py            # Doctor operations
│   │   │   ├── researcher.py        # Researcher operations
│   │   │   ├── admin.py             # Admin operations
│   │   │   └── ai_test.py           # AI model testing
│   │   ├── services/                # Business logic
│   │   │   ├── ai_service.py        # AI predictions
│   │   │   ├── email_service.py     # Email sending
│   │   │   ├── file_service.py      # File handling
│   │   │   └── otp_service.py       # OTP generation
│   │   ├── schemas/                 # Request/Response schemas
│   │   └── utils/
│   │       └── security.py          # JWT, password hashing
│   ├── requirements.txt              # Python dependencies
│   ├── .env                          # Environment variables (create this)
│   ├── venv/                         # Virtual environment (created locally)
│   └── db_queries.sql               # Database DDL/DML reference
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── main.jsx                 # Entry point
│   │   ├── App.jsx                  # Main app component
│   │   ├── components/              # Reusable components
│   │   ├── pages/                   # Page components
│   │   ├── contexts/                # React contexts (Auth)
│   │   ├── services/                # API service
│   │   ├── mocks/                   # MSW mocking setup
│   │   └── utils/                   # Utilities
│   ├── package.json                 # Node dependencies
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.cjs          # Tailwind CSS setup
│   └── node_modules/                # Dependencies (created locally)
│
├── ai/                               # AI/ML Models
│   ├── hybrid_cnn_lstm_heart_sound_final.h5  # Pre-trained model
│   ├── fyp_training.ipynb           # Original training notebook
│   ├── fyp_training_calibrated.py   # Calibrated training script
│   ├── test_calibration.py          # Calibration tests
│   ├── fy_testing.ipynb             # Testing notebook
│   └── requirements.txt              # AI dependencies
│
├── documents/                        # Documentation (root level)
│   ├── PROJECT_OVERVIEW.md
│   ├── API_CONTRACT.md
│   └── ...
│
├── PREREQUISITES.md                 # System requirements
├── SETUP_GUIDE.md                   # This file
└── README.md                         # Project overview
```

---

## 🧪 Testing

### Test Backend API

```powershell
# From Terminal 1 (backend running)
# Visit in browser:
http://localhost:8000/docs  # Interactive API docs (Swagger UI)
http://localhost:8000/redoc # Alternative API docs

# Or test with curl:
curl -X GET "http://localhost:8000/api/health"
```

### Test Frontend

```powershell
# From Terminal 2 (frontend running)
# Visit in browser:
http://localhost:3000         # Application
http://localhost:3000/docs    # (if available)

# Test uploads:
1. Login with admin credentials
2. Navigate to Upload page
3. Select a WAV audio file
4. Click Upload
5. View analysis results
```

### Run Frontend Tests

```powershell
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Database

```powershell
# Test connection
python -c "from app.database import engine; print('✅ Database connection OK')"

# Check tables
psql -U postgres -d postgres -c "\dt"
```

---

## ⚙️ Configuration Files

### Backend: .env

Essential variables for running the backend:

```env
# Required
DATABASE_URL=postgresql://...
ADMIN_EMAIL=admin@cardiosense.com
ADMIN_PASSWORD=AdminPass123!
JWT_SECRET_KEY=your-secret-key

# Optional (Gmail OTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Frontend: .env.local (Optional)

```env
# Override API base URL
VITE_API_BASE_URL=http://localhost:8000/api

# Use real backend instead of MSW mocks
# (MSW is enabled by default in development)
```

### Backend: .env.production (For Deployment)

```env
DEBUG=False
JWT_SECRET_KEY=generate-new-random-string
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host:5432/cardio_db
API_URL=https://api.cardiosense.com
FRONTEND_URL=https://cardiosense.com
```

---

## 🐛 Troubleshooting

### Backend Issues

#### Error: "ModuleNotFoundError: No module named 'fastapi'"

**Cause:** Virtual environment not activated

```powershell
# Activate it
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt
```

#### Error: "psycopg2.OperationalError: could not connect to server"

**Cause:** PostgreSQL not running or wrong connection string

```powershell
# Check PostgreSQL is running
Get-Service postgresql-x64-15

# Start if stopped
Start-Service postgresql-x64-15

# Verify connection manually
psql -U postgres -h localhost -c "SELECT 1"
```

#### Error: "Port 8000 already in use"

```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID 12345 /F

# Or use different port
python -m uvicorn app.main:app --port 8001
```

#### Error: "TensorFlow DLL initialization failed"

**Cause:** Missing Visual C++ Runtime

```powershell
# Install Visual C++ Redistributable
# Download: https://aka.ms/vs/16/release/vc_redist.x64.exe
# Or in PowerShell:
choco install visualstudio2015-runtime  # If Chocolatey installed
```

### Frontend Issues

#### Error: "npm: command not found"

**Cause:** Node.js not installed or PATH not set

```powershell
# Check Node installation
node --version
npm --version

# If not found, reinstall Node.js from https://nodejs.org/
```

#### Error: "Port 3000 already in use"

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID 12345 /F

# Or change port in vite.config.js
```

#### Error: "Cannot GET /"

**Cause:** Frontend not built properly

```powershell
# Rebuild frontend
cd frontend

# Clear cache
rm -r node_modules
rm package-lock.json

# Reinstall
npm install

# Start
npm run dev
```

### Database Issues

#### Error: "FATAL: password authentication failed"

**Cause:** Wrong PostgreSQL password

```powershell
# Reset password in PostgreSQL
psql -U postgres

# Inside psql:
ALTER ROLE postgres WITH PASSWORD '2025';
\q
```

#### Error: "database does not exist"

**Cause:** Database not created

```powershell
# Create database
psql -U postgres -c "CREATE DATABASE cardio_sense;"

# Verify
psql -U postgres -l | grep cardio_sense
```

### General Issues

#### Slow Performance

```powershell
# Check system resources
Get-Process | Sort-Object -Property WS -Descending | Select-Object -First 10

# Free up memory
# Close unnecessary applications
# Ensure at least 8GB RAM available
```

#### Application crashes immediately

```powershell
# Check for errors in terminal
# Read full error message

# Try running with detailed logging
python -m uvicorn app.main:app --reload --log-level debug
```

---

## 📚 Documentation Files

Inside this project:

| File | Purpose |
|------|---------|
| `PREREQUISITES.md` | System requirements (this document) |
| `SETUP_GUIDE.md` | Complete setup instructions |
| `backend/documents/` | Detailed technical docs |
| `backend/db_queries.sql` | Database schema and queries |
| `frontend/README.md` | Frontend documentation |
| `frontend/STYLE_GUIDE.md` | UI/UX design guidelines |
| `ai/IMPLEMENTATION_SUMMARY.md` | AI model documentation |

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Set `DEBUG=False` in .env
- [ ] Generate new random JWT_SECRET_KEY
- [ ] Update DATABASE_URL to production database
- [ ] Configure SMTP for actual email sending
- [ ] Update API_URL and FRONTEND_URL to production domains
- [ ] Run `npm run build` for frontend
- [ ] Test all features in staging environment
- [ ] Set up SSL certificates (HTTPS)
- [ ] Configure firewall and security groups
- [ ] Enable database backups
- [ ] Set up monitoring and logging

---

## ✅ Verification Checklist

After completing setup, verify everything works:

- [ ] Python virtual environment created and activated
- [ ] All Python dependencies installed (`pip install -r requirements.txt`)
- [ ] PostgreSQL running and accessible
- [ ] Backend starts without errors (`python -m uvicorn app.main:app --reload`)
- [ ] Backend API docs available at http://localhost:8000/docs
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend starts without errors (`npm run dev`)
- [ ] Frontend accessible at http://localhost:3000
- [ ] Can login with admin credentials
- [ ] Can upload audio file (if sample available)
- [ ] Database tables created successfully
- [ ] No errors in browser console
- [ ] No errors in terminal output

---

## 📞 Support & Resources

### Getting Help

1. **Check Troubleshooting section** above
2. **Read relevant documentation** in `backend/documents/`
3. **Check terminal/console** for detailed error messages
4. **Review API docs** at http://localhost:8000/docs

### External Resources

- **FastAPI**: https://fastapi.tiangolo.com/
- **React**: https://react.dev/
- **PostgreSQL**: https://www.postgresql.org/
- **TensorFlow**: https://www.tensorflow.org/
- **Vite**: https://vitejs.dev/

---

## 🎉 Success!

If you can:
- ✅ Access http://localhost:3000
- ✅ Login with admin@cardiosense.com
- ✅ View API docs at http://localhost:8000/docs
- ✅ See no errors in terminals

**Congratulations! Your Cardio Sense setup is complete! 🎊**

---

**Last Updated:** February 17, 2026  
**Project Version:** 1.0  
**Tested On:** Windows 11, Python 3.11, Node.js 20.19.0, PostgreSQL 15
