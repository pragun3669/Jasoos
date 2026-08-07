<div align="center">

# 🕵️ JASOOS
### AI-Powered Smart Exam Proctoring & Coding Assessment Platform

<p align="center">
An intelligent online examination platform that combines <b>AI-powered proctoring</b>, <b>automatic coding assessment</b>, <b>LLM-based question generation</b>, and <b>hybrid plagiarism detection</b> to conduct secure coding examinations at scale.
</p>

<p align="center">

🌐 **Live Demo:** https://jasooss.vercel.app/

</p>

---

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Spring Boot](https://img.shields.io/badge/SpringBoot-3.x-6DB33F?logo=springboot)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker)
![LangGraph](https://img.shields.io/badge/LangGraph-Agentic_AI-purple)
![OpenAI](https://img.shields.io/badge/LLM-Powered-black)

</div>

---

# 📖 Overview

Traditional online examination systems rely heavily on manual invigilation and static question banks, making them vulnerable to cheating, plagiarism, and repetitive assessments.

**JASOOS** is an AI-powered coding examination platform designed to solve these challenges by integrating intelligent proctoring, automated code evaluation, AI-generated programming questions, and advanced plagiarism detection into one scalable system.

The platform enables instructors to create coding assessments in minutes while continuously monitoring students during examinations and automatically evaluating both submissions and suspicious activities.

---

# ✨ Key Features

## 👨‍🏫 Teacher Portal

- Secure authentication
- Dashboard for managing coding exams
- AI-powered question generation
- Manual question creation
- Configure:
  - Duration
  - Number of questions
  - Programming language
  - Difficulty level
- View submissions
- Student analytics
- Plagiarism reports

---

## 🤖 AI Question Generator

Generate coding questions instantly using Agentic AI.

Features:

- Topic-based generation
- Easy / Medium / Hard difficulty
- Automatic test case generation
- Reference solution generation
- Human review before publishing

Powered using:

- LangGraph
- LLM APIs
- Prompt Engineering

---

## 💻 Coding Examination

Students receive an online coding IDE with:

- Multiple programming languages
- Real-time code execution
- Public & hidden test cases
- Countdown timer
- Auto save
- One-click submission

---

## 🎯 Automatic Code Evaluation

Every submission is automatically evaluated against:

- Hidden test cases
- Public test cases
- Runtime validation
- Output comparison

Results include:

- Score
- Passed test cases
- Failed test cases
- Attempt history

---

## 🎥 AI Proctoring

Real-time examination monitoring using Computer Vision.

Current capabilities include:

- Face detection
- Candidate presence monitoring
- Face outside frame detection
- Live webcam monitoring
- Suspicious activity logging

---

## 🧠 Hybrid Plagiarism Detection

One of the major features of JASOOS is its intelligent plagiarism detection engine.

Instead of relying on simple string matching, the system combines multiple techniques:

- CodeBERT semantic embeddings
- AST (Abstract Syntax Tree) comparison
- XGBoost similarity classifier
- AI-generated code detection
- Student-to-student similarity matching

This significantly improves plagiarism detection accuracy while reducing false positives.

---

## 📊 Performance Analytics

Teachers can access:

- Student scores
- Question-wise analysis
- Test case statistics
- Submission rate
- Individual performance
- Plagiarism reports

---
## 🎥 Project Demo

https://github.com/user-attachments/assets/b49f0ca2-ec2f-4aa5-8e5f-509199996375


> Click the button above to watch the full demonstration of JASOOS.
---

# 🏗️ System Architecture

```
                        Teacher
                           │
                           ▼
                   React Frontend
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
 Spring Boot API      FastAPI AI       Runner Service
        │              Services           (Docker)
        │                  │                  │
        │                  ▼                  ▼
 PostgreSQL        LangGraph + LLM      Code Execution
        │
        ▼
 Student Results
```

---

# ⚙️ Technology Stack

## Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios

---

## Backend

- Spring Boot
- Spring Security
- JWT Authentication
- PostgreSQL
- Hibernate

---

## AI Services

- Python
- FastAPI
- LangGraph
- OpenAI / LLM APIs
- CodeBERT
- XGBoost
- AST Parsing

---

## Proctoring

- OpenCV
- MediaPipe
- Face Detection

---

## DevOps

- Docker
- Docker Compose
- GitHub
- Vercel

---

# 📂 Project Structure

```
JASOOS

frontend/
    React Application

backend/
    Spring Boot APIs

ai-service/
    FastAPI
    LangGraph
    Question Generator
    Plagiarism Detection

runner/
    Secure Docker Code Execution

database/
    PostgreSQL

docs/

screenshots/
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/pragun3669/Jasoos.git

cd Jasoos
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

## Backend

```bash
cd backend

./mvnw spring-boot:run
```

---

## AI Service

```bash
cd ai-service

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

## Docker Runner

```bash
docker compose up
```

---

# 🔐 Environment Variables

Example:

```
OPENAI_API_KEY=

DATABASE_URL=

JWT_SECRET=

CODE_RUNNER_URL=

FASTAPI_URL=

SPRING_DATASOURCE_URL=
```

---

# 🎯 Future Improvements

- Voice activity detection
- Browser lockdown
- Screen recording
- Tab switching alerts
- Eye gaze tracking
- Liveness detection
- Distributed code execution
- Kubernetes deployment
- Multi-language code execution
- Real-time analytics dashboard

---

# 👨‍💻 Author

**Pragun Singh**

B.Tech Computer Science Engineering

Jaypee Institute of Information Technology

GitHub

https://github.com/pragun3669

LinkedIn

https://www.linkedin.com/in/pragun18

---

# ⭐ If you found this project useful

Please consider giving it a ⭐ on GitHub.

It helps others discover the project and motivates future development.

---

## 📜 License

This project is developed for educational and research purposes.
