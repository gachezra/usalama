# 🛡️ USALAMA Developer Setup

Welcome to the National Integrity & Oversight Engine. Follow these steps to get the "Sovereign Stack" running locally.

## Prerequisites
1. **Docker Desktop** (For the Database)
2. **Node.js 18+** (For the Frontend)
3. **Python 3.10+** (For the Intelligence Engine)
4. **Ollama** (For the AI Model)

---

## 🚀 Quick Start Guide

### 1. Wake up the Database
```bash
docker compose up -d
```
### 2. Activate the intelligence Engine (Backend)

cd backend

# Create virtual env
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure Secrets
cp .env.example .env
# (No need to edit .env if you are using the default Docker setup)

# Run Database Migrations
alembic upgrade head

# Start the Brain
uvicorn app.main:app --reload

### 3. Launch the Command Center (Frontend)
Open a new terminal
```bash
cd ..  # Go back to root
npm install
npm run dev
```

### 4. Verify AI Model (LLM)
Ensure you have the model downloaded:
```Bash
ollama pull llama3.2:3b
```

### Testing
Access the dashboard at http://localhost:3000/dashboard/login

**Admin ID:** admin
**Key:** usalama123
