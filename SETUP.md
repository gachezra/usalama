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
```bash
cd backend
```

### Create virtual env
```bash
python -m venv venv
```

## Activate it
### Windows:
```bash
venv\Scripts\activate
```
### Mac/Linux:
```bash
source venv/bin/activate
```

### Install dependencies
```bash
pip install -r requirements.txt
```

### Configure Secrets
```bash
cp .env.example .env
```

(No need to edit .env if you are using the default Docker setup)

### Run Database Migrations
```bash
alembic upgrade head
```

### Start the Brain
```bash
uvicorn app.main:app --reload
```

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
Once it is done downloading, run:
```bash
ollama serve &
```
This will start the LLM if you want to run a quick audit or classification test on the dashboard.

### Testing
Access the dashboard at http://localhost:3000/dashboard/login

**Admin ID:** admin
**Key:** usalama123
