# Cardio Sense - Project Documentation Index

Welcome to Cardio Sense! This document provides an overview of all available documentation and setup guides.

## 🚀 Getting Started

**New to this project?** Start here:

1. **[PREREQUISITES.md](PREREQUISITES.md)** ⭐ **START HERE**
   - System requirements (Python, Node.js, PostgreSQL, Git)
   - Installation instructions for all tools
   - Environment setup and verification
   - Troubleshooting common setup issues

2. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** ⭐ **THEN READ THIS**
   - Complete step-by-step setup instructions
   - Quick start (5 minutes) for experienced developers
   - Running the application
   - Database configuration
   - Testing and verification

---

## 📚 Documentation Structure

### Root Level Guides

```
Cardio Sense/
├── PREREQUISITES.md              ✓ System requirements & installation
├── SETUP_GUIDE.md                ✓ Complete setup instructions
└── README.md                      (Project overview - if exists)
```

### Backend Documentation

```
backend/
├── requirements.txt              # Python dependencies
├── .env                          # Configuration (create from .env.example)
├── db_queries.sql                # Database DDL/DML reference
├── app/
│   ├── main.py                   # FastAPI entry point
│   ├── database.py               # Database configuration
│   ├── models/                   # Database models (schema)
│   ├── routes/                   # API endpoints
│   ├── services/                 # Business logic
│   ├── schemas/                  # Request/Response validation
│   └── utils/                    # Utilities (security, helpers)
└── documents/                    # Detailed backend docs
    ├── INDEX.md                  # Documentation index
    ├── AI_INTEGRATION_SUMMARY.txt # AI model integration
    ├── IMPLEMENTATION_SUMMARY.md  # Confidence calibration
    ├── QUICK_START_CALIBRATION.txt
    ├── CONFIDENCE_CALIBRATION_REPORT.md
    ├── GMAIL_OTP_SETUP.md        # Email OTP configuration
    ├── FRONTEND_QUICK_START.md
    ├── FRONTEND_README.md
    └── STYLE_GUIDE.md
```

### Frontend Documentation

```
frontend/
├── package.json                  # Node.js dependencies
├── vite.config.js                # Vite configuration
├── tailwind.config.cjs           # Tailwind CSS setup
├── README.md                      # Frontend overview
├── QUICK_START.md                # Frontend quick start
├── STYLE_GUIDE.md                # UI/UX design guidelines
├── api_contract.md               # API contract definition
└── src/
    ├── main.jsx                  # Entry point
    ├── App.jsx                   # Main component
    ├── components/               # Reusable components
    ├── pages/                    # Page components
    ├── contexts/                 # React contexts (Auth)
    ├── services/                 # API service
    ├── mocks/                    # MSW mock setup
    └── utils/                    # Utilities
```

### AI/ML Documentation

```
ai/
├── hybrid_cnn_lstm_heart_sound_final.h5  # Pre-trained model
├── requirements.txt              # AI dependencies
├── fyp_training.ipynb            # Original training notebook
├── fyp_training_calibrated.py    # Calibrated training script
├── test_calibration.py           # Test suite
├── check_data_balance.py         # Data analysis
└── IMPLEMENTATION_SUMMARY.md     # AI implementation guide
```

---

## 🎯 Quick Navigation

### I want to...

**Set up the project**
→ Read [PREREQUISITES.md](PREREQUISITES.md) then [SETUP_GUIDE.md](SETUP_GUIDE.md)

**Understand the database**
→ Check [backend/db_queries.sql](backend/db_queries.sql)

**Configure Gmail OTP**
→ Read [backend/documents/GMAIL_OTP_SETUP.md](backend/documents/GMAIL_OTP_SETUP.md)

**Work on the frontend**
→ Check [frontend/README.md](frontend/README.md) and [frontend/STYLE_GUIDE.md](frontend/STYLE_GUIDE.md)

**Work with the AI model**
→ Read [backend/documents/AI_INTEGRATION_SUMMARY.txt](backend/documents/AI_INTEGRATION_SUMMARY.txt)

**Understand the API**
→ Check [frontend/api_contract.md](frontend/api_contract.md)

**Troubleshoot issues**
→ See Troubleshooting sections in [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

## 📋 Setup Checklist

Use this before starting development:

### Prerequisites Installation
- [ ] Python 3.11+ installed
- [ ] Node.js 20.19.0+ installed
- [ ] PostgreSQL 12+ installed and running
- [ ] Git installed (optional)
- [ ] All verified with version commands

### Backend Setup
- [ ] Virtual environment created: `python -m venv venv`
- [ ] Virtual environment activated: `.\venv\Scripts\Activate.ps1`
- [ ] Dependencies installed: `pip install -r requirements.txt`
- [ ] `.env` file created in `backend/` folder
- [ ] Database connection verified

### Frontend Setup
- [ ] Node modules installed: `npm install`
- [ ] Vite configuration understood
- [ ] MSW mock setup confirmed
- [ ] Tailwind CSS working

### Database Setup
- [ ] PostgreSQL running
- [ ] Database connection tested
- [ ] Tables created (automatic on first backend run)
- [ ] Sample data loaded (if needed)

### Application Ready
- [ ] Backend runs: `python -m uvicorn app.main:app --reload`
- [ ] Frontend runs: `npm run dev`
- [ ] Can access http://localhost:3000
- [ ] Can login with admin@cardiosense.com
---

## 🔑 Key Files Reference

| File | Purpose | Location |
|------|---------|----------|
| PREREQUISITES.md | System requirements | Root |
| SETUP_GUIDE.md | Setup instructions | Root |
| requirements.txt | Python dependencies | backend/ |
| package.json | Node dependencies | frontend/ |
| .env | Backend configuration | backend/ |
| db_queries.sql | Database schema | backend/ |
| main.py | FastAPI app | backend/app/ |
| vite.config.js | Frontend config | frontend/ |
| tailwind.config.cjs | Tailwind setup | frontend/ |
---

## 🔐 Credentials
### Development Environment

**Admin Account:**
- Email: `admin@cardiosense.com`
- Password: `AdminPass123!`

**Mock Test Accounts:**
- Doctor: `raja3.ahsan@gmail.com` / `password123`
- Researcher: `ahsan3.dev@gmail.com` / `password123`
- Patient: `ahsan3.aahmed@gmail.com` / `password123`

### Production

⚠️ **Never use development credentials in production!**
- Generate strong passwords
- Use environment variables
- Implement proper access controls
- Enable HTTPS and SSL certificates

---

## 🚀 Running the Application

### Quick Start

```powershell
# Terminal 1: Backend
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload

# Terminal 2: Frontend (new terminal)
cd frontend
npm run dev
```

Open browser: http://localhost:3000

### API Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## 📞 Common Issues & Solutions

### Backend Won't Start
1. Check virtual environment is activated (should see `(venv)` in terminal)
2. Verify PostgreSQL is running
3. Check `.env` file exists in `backend/` folder
4. See [SETUP_GUIDE.md troubleshooting](SETUP_GUIDE.md#-troubleshooting)

### Frontend Won't Start
1. Verify Node modules installed: `npm install`
2. Check port 3000 isn't in use
3. Clear cache: `rm -r node_modules && npm install`
4. See [SETUP_GUIDE.md troubleshooting](SETUP_GUIDE.md#-troubleshooting)

### Database Connection Failed
1. Ensure PostgreSQL service is running
2. Check `.env` DATABASE_URL is correct
3. Verify username/password
4. See [PREREQUISITES.md](PREREQUISITES.md#-database-setup)

---

## 📊 Technology Stack

### Backend
- **Framework:** FastAPI 0.104.1
- **Database:** PostgreSQL + SQLAlchemy ORM
- **Authentication:** JWT (python-jose)
- **AI/ML:** TensorFlow 2.15.0
- **Server:** Uvicorn

### Frontend
- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.2.2
- **Styling:** Tailwind CSS 3.4.1
- **HTTP Client:** Axios
- **Testing:** Jest + React Testing Library
- **Mocking:** Mock Service Worker (MSW)

### AI/ML
- **Model:** Hybrid CNN+LSTM
- **Framework:** TensorFlow 2.15.0
- **Audio Processing:** librosa 0.10.1
- **Signal Processing:** scipy 1.11.4

### Database
- **System:** PostgreSQL 12+
- **ORM:** SQLAlchemy 2.0.23

---

## ✅ Project Status

| Component | Status | Version |
|-----------|--------|---------|
| Backend | ✅ Complete | 1.0 |
| Frontend | ✅ Complete | 1.0 |
| AI Model | ✅ Integrated | 1.0 |
| Database | ✅ Configured | PostgreSQL 15 |
| Documentation | ✅ Complete | 1.0 |

---

## 📝 Version Information

- **Project Version:** 1.0.0
- **Last Updated:** February 17, 2026
- **Python Version:** 3.11+
- **Node.js Version:** 20.19.0+
- **PostgreSQL Version:** 12+

---

## 🎓 Learning Resources

### Backend Development
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Frontend Development
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

### AI/ML
- [TensorFlow Documentation](https://www.tensorflow.org/)
- [Keras Documentation](https://keras.io/)
- [librosa Documentation](https://librosa.org/)

---

## 🤝 Contributing

When contributing to this project:

1. Read the relevant documentation
2. Follow the code style in [frontend/STYLE_GUIDE.md](frontend/STYLE_GUIDE.md)
3. Test your changes locally
4. Update documentation if needed
5. Ensure no errors in terminal/console

---

## 📄 License & Credits

See individual component documentation for detailed information.

---

## 🎉 Ready to Start?

1. **First Time?** → Start with [PREREQUISITES.md](PREREQUISITES.md)
2. **Setting Up?** → Follow [SETUP_GUIDE.md](SETUP_GUIDE.md)
3. **Troubleshooting?** → Check the troubleshooting sections
4. **Questions?** → Review relevant documentation files

**Good luck! Happy coding! 🚀**
