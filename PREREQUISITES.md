# Cardio Sense - Prerequisites & System Requirements

This document outlines all the system requirements and prerequisites needed to set up and run the Cardio Sense project.

## 📋 Table of Contents

- [System Requirements](#system-requirements)
- [Software Prerequisites](#software-prerequisites)
- [Installation Instructions](#installation-instructions)
- [Verification Steps](#verification-steps)
- [Environment Setup](#environment-setup)
- [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

### Operating System
- **Windows 10/11** (Primary - all instructions tested on Windows)
- **macOS 10.15+** (Compatible, paths may differ)
- **Linux Ubuntu 20.04+** (Compatible, package managers differ)

### Hardware Requirements
| Component | Minimum | Recommended |
|-----------|---------|------------|
| **CPU** | Quad-core (2.0 GHz) | 6+ cores (2.5+ GHz) |
| **RAM** | 8 GB | 16 GB or more |
| **Storage** | 10 GB free | 20 GB free (for models & data) |
| **GPU** | Not required | NVIDIA CUDA 11.8+ (optional, for faster AI inference) |

---

## 💻 Software Prerequisites

### 1. Python 3.11 or Later

**Required for:** Backend, AI model training and inference

**Current Project Uses:** Python 3.11+

#### Windows Installation:
1. Download from: https://www.python.org/downloads/ (Windows Installer)
2. Run installer and **check "Add Python to PATH"**
3. Choose "Install Now" or customize installation
4. Verify installation:
```powershell
python --version
pip --version
```

#### macOS Installation:
```bash
# Using Homebrew (recommended)
brew install python@3.11

# Verify
python3 --version
pip3 --version
```

#### Linux Installation:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip

# Verify
python3 --version
pip3 --version
```

### 2. Node.js 20.19.0 or Later (>=22.12.0 recommended)

**Required for:** Frontend development, Vite build tool

**Current Project Uses:** React 19 with Node.js

#### Windows Installation:
1. Download from: https://nodejs.org/ (LTS version recommended)
2. Run installer, accept defaults
3. Verify installation:
```powershell
node --version
npm --version
```

#### macOS Installation:
```bash
# Using Homebrew
brew install node@20

# Verify
node --version
npm --version
```

#### Linux Installation:
```bash
# Ubuntu/Debian
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs

# Verify
node --version
npm --version
```

### 3. PostgreSQL 12 or Later

**Required for:** Database (users, PCG uploads, analysis results)

**Current Project Uses:** PostgreSQL with SQLAlchemy ORM

**Default Connection:** `postgresql://postgres:2025@localhost:5432/postgres`

#### Windows Installation:
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer, set password: `2025` (or update `.env`)
3. Accept default port: `5432`
4. Select "Stack Builder" to install pgAdmin (optional)
5. Verify installation:
```powershell
psql --version
```

#### macOS Installation:
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Verify
psql --version
```

#### Linux Installation:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
psql --version
```

### 4. Git (Optional but Recommended)

**Required for:** Version control, cloning repositories

#### Windows Installation:
1. Download from: https://git-scm.com/download/win
2. Run installer, accept defaults
3. Verify installation:
```powershell
git --version
```

#### macOS Installation:
```bash
brew install git
```

#### Linux Installation:
```bash
sudo apt install git
```

---

## 📦 Python Virtual Environment

**Why:** Isolate project dependencies from system Python

### Create Virtual Environment

#### Windows (PowerShell):
```powershell
cd "c:\Users\Raja\Desktop\Cursor\Fyp\Cardio Sense\backend"
python -m venv venv
.\venv\Scripts\Activate.ps1
```

#### Windows (Command Prompt):
```cmd
cd c:\Users\Raja\Desktop\Cursor\Fyp\Cardio Sense\backend
python -m venv venv
venv\Scripts\activate.bat
```

#### macOS/Linux:
```bash
cd ~/Cardio\ Sense/backend
python3 -m venv venv
source venv/bin/activate
```

**Verify activation:** Your terminal should show `(venv)` prefix

---

## 🗄️ Database Setup

### PostgreSQL Configuration

#### 1. Start PostgreSQL Service

**Windows:**
```powershell
# PostgreSQL service should auto-start
# If not, start manually:
net start postgresql-x64-15
```

**macOS:**
```bash
brew services start postgresql@15
```

**Linux:**
```bash
sudo systemctl start postgresql
```

#### 2. Create Database (Optional)

```bash
psql -U postgres

# Inside psql:
CREATE DATABASE cardio_sense;
\q
```

#### 3. Test Connection

```powershell
psql -U postgres -h localhost -d postgres
# Should connect successfully
\q
```

**If connection fails:**
- Check PostgreSQL service is running: `services.msc` (Windows)
- Verify port 5432 is not blocked by firewall
- Check username and password in `.env` file

---

## 📁 Project Structure Check

Ensure you have all folders present:

```
Cardio Sense/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── models/       # Database models
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   └── main.py
│   ├── requirements.txt
│   └── .env              # Environment config (create from .env.example)
├── frontend/             # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── ai/                   # AI/ML models and scripts
│   ├── hybrid_cnn_lstm_heart_sound_final.h5
│   ├── fyp_training.ipynb
│   └── requirements.txt
└── SETUP_GUIDE.md       # Setup instructions
```

---

## 🔧 Environment Variables (.env file)

### Create Backend .env File

Create `backend/.env` with these variables:

```env
# Database
DATABASE_URL=postgresql://postgres:2025@localhost:5432/postgres

# Admin Credentials
ADMIN_EMAIL=admin@cardiosense.com
ADMIN_PASSWORD=AdminPass123!

# JWT Secret (generate a random string)
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production

# Email Configuration (Gmail)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=CardioSense

# API URLs
API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# Debug Mode
DEBUG=True
```

**Note:** 
- Change JWT_SECRET_KEY to a random strong string in production
- For Gmail SMTP, follow [GMAIL_OTP_SETUP.md](backend/documents/GMAIL_OTP_SETUP.md)
- Sensitive values should never be committed to Git

---

## 🔍 Verification Steps

### Verify All Prerequisites

Run these commands in PowerShell/Terminal to confirm all tools are installed:

```powershell
# Python
python --version
pip --version

# Node.js & npm
node --version
npm --version

# PostgreSQL
psql --version

# Git (optional)
git --version
```

**Expected outputs:**
```
Python 3.11.x or higher
pip 23.x or higher
node v20.x or v22.x
npm 10.x or higher
psql 12.x or higher
```

### Verify Database Connection

```powershell
cd backend
python -c "from app.database import engine; print('Database connection: OK')" 
```

Should print: `Database connection: OK`

### Verify Backend Dependencies

After creating virtual environment and installing requirements:

```powershell
cd backend
pip install -r requirements.txt

# Test import
python -c "import fastapi; import sqlalchemy; import tensorflow; print('All imports OK')"
```

### Verify Frontend Dependencies

```powershell
cd frontend
npm install

# Check React
npm list react react-dom vite
```

---

## ⚠️ Common Issues & Troubleshooting

### Issue: Python not found / "python is not recognized"

**Solution:**
- Ensure Python is in PATH
- Use `python` (Windows) or `python3` (macOS/Linux)
- Reinstall Python and check "Add Python to PATH" option
- Verify: `echo $env:PATH` should include Python directory

### Issue: PostgreSQL connection refused

**Solution:**
- Check if PostgreSQL service is running: `services.msc` (Windows)
- Verify default port 5432 is not blocked
- Check `.env` DATABASE_URL is correct
- Reset PostgreSQL password: `ALTER ROLE postgres WITH PASSWORD 'newpassword';`

### Issue: npm install fails

**Solution:**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Run: `npm install` again
- Check Node.js version is 20.19.0 or higher

### Issue: Virtual environment activation fails

**Solution:**
- Ensure you're in the correct directory: `cd backend`
- Windows PowerShell: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Try using Command Prompt instead of PowerShell
- Recreate venv: `rmdir venv` then `python -m venv venv`

### Issue: TensorFlow/AI imports fail

**Solution:**
- Install Visual C++ Redistributable: https://aka.ms/vs/16/release/vc_redist.x64.exe
- Update requirements: `pip install --upgrade tensorflow librosa`
- Check GPU drivers if using CUDA

### Issue: Port already in use (8000 or 3000)

**Solution:**
- Backend port 8000: `lsof -i :8000` or `netstat -ano | findstr :8000`
- Frontend port 3000: `lsof -i :3000` or `netstat -ano | findstr :3000`
- Kill process or change ports in config files
- Alternative: Change port in `.env` or `vite.config.js`

---

## 📝 Checklist Before Setup

- [ ] Python 3.11+ installed
- [ ] Node.js 20.19.0+ installed  
- [ ] PostgreSQL 12+ installed and running
- [ ] Git installed (optional)
- [ ] Firewall allows ports 8000 (backend), 3000 (frontend), 5432 (database)
- [ ] At least 10GB free disk space
- [ ] Project folder cloned/extracted
- [ ] `.env` file created in `backend/` folder
- [ ] Virtual environment ready to activate

---

## 🚀 Next Steps

Once all prerequisites are verified:

1. **Read [SETUP_GUIDE.md](SETUP_GUIDE.md)** for complete setup instructions
2. **Install dependencies** for backend and frontend
3. **Set up database** and run migrations
4. **Start backend** server (http://localhost:8000)
5. **Start frontend** development server (http://localhost:3000)
6. **Test the application** with mock data

---

## 📞 Support & References

- **Python Documentation**: https://docs.python.org/3.11/
- **Node.js Documentation**: https://nodejs.org/en/docs/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **React Documentation**: https://react.dev/
- **Vite Documentation**: https://vitejs.dev/

---

**Last Updated:** February 17, 2026  
**Project Version:** 1.0  
**Tested On:** Windows 11, Python 3.11, Node.js 20.19.0, PostgreSQL 15
