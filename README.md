# Project USALAMA

**Uwazi. Usalama. Amani.** (Transparency. Security. Peace.)

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

## Overview

Project USALAMA is a citizen-powered government oversight platform designed to fight corruption in Kenyan public infrastructure projects. By leveraging crowd-sourced photo verification and AI-powered analysis, USALAMA creates an immutable record of project progress that holds contractors and officials accountable.

## The Problem

Kenya loses an estimated **KSh 608 billion annually** to corruption. Public infrastructure projects—roads, bridges, schools, hospitals—are particularly vulnerable. Contractors submit false completion reports, officials approve ghost projects, and citizens are left with crumbling infrastructure and broken promises.

## Our Solution

USALAMA empowers ordinary Kenyans to become watchdogs. Citizens photograph infrastructure projects in their communities, and our AI verifies the actual state of construction against official reports. Every verification is recorded on an immutable ledger, creating a transparent record that can't be altered or deleted.

### Key Features

- **Citizen Verification** - Earn rewards (via M-Pesa) for photographing and verifying projects in your area
- **AI-Powered Analysis** - Computer vision algorithms detect discrepancies between reported and actual progress
- **Immutable Ledger** - All verifications are permanently recorded for accountability
- **Real-time Monitoring** - Government dashboard tracks project status across all 47 counties

## How It Works

1. **Receive a Task** - Get notified about a project near you that needs verification
2. **Take a Photo** - Visit the site and photograph the current state of construction
3. **AI Verification** - Our system compares your photo against official reports
4. **Get Paid** - Receive instant M-Pesa payment for valid verifications

## Impact Goals

- **50,000+** verified infrastructure reports
- **KSh 2.3B+** in corruption exposed and prevented
- **47 counties** covered across Kenya
- **100,000+** active citizen verifiers

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Vercel Deployment

## Contributing

We welcome contributions from developers passionate about fighting corruption and building a better Kenya. Please reach out to discuss how you can help.

## License

This project is proprietary software. All rights reserved.

---

_"Mwenye macho haambiwi tazama"_ - One who has eyes needs not be told to look.

**Built for Kenya. Built for transparency. Built for the future.**


# How to Run

## 🛡️ USALAMA Developer Setup                                                                                                                                                                                                        Welcome to the National Integrity & Oversight Engine. Follow these steps to get the "Sovereign Stack" running locally.

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
