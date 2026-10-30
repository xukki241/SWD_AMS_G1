# AMS — Assignment Management System

> POC Demo Project · Group 1 · SWD392

## 🚀 Quick Start (Docker — one command)

```bash
# Clone repo
git clone https://github.com/xukki241/SWD_AMS_G1.git
cd SWD_AMS_G1

# Run the full stack (DB + Backend + Frontend)
docker compose up --build

# Open:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080/api
# Swagger UI: http://localhost:8080/swagger-ui.html
```

## 🏫 How it works (Google-Classroom model)

- **Classes have a 6-character join code** (e.g. `K7Q2M9`). Teachers/Experts create a class (subject, name, term, fee, capacity) — the code is auto-generated. Students "Find a class" by entering the code.
- **Free classes (fee = 0)** enroll the student instantly (`ACTIVE`); **paid classes** go to `PENDING_PAYMENT` until the tuition is paid.
- Each class is a **workspace** with three tabs: **Stream** (announcements & material uploads), **Assignments** (classwork: submit → grade → review), and **People**.
- Payments: **VNPay Sandbox** (primary) or **VietQR sandbox confirm** (manual "I have transferred" — no real money moves; it is a demo).

## 🔐 Demo Accounts

All accounts use password `Password@123`:

| Role | Username |
|------|----------|
| Admin | `admin` |
| Experts | `expert1`, `expert2` |
| Teachers | `teacher1`, `teacher2`, `teacher3` |
| Students | `student1` … `student12` |

Sample join codes (from seed data): `K7Q2M9`, `Q2M9K7`, `B7X4NP`, `M4T8ZD`, `X9R3VC`, `P6H2WS`, `Z5J7QB`, `T8N4LM`.

## 💳 VNPay Test Card

| Field | Value |
|-------|-------|
| Bank | NCB |
| Card Number | `9704198526191432198` |
| Name | `NGUYEN VAN A` |
| Issue Date | `07/15` |
| OTP | `123456` |

## 🛠️ Tech Stack

### Backend
- Spring Boot 3.2 + Java 21
- Spring Data JPA + Hibernate + Flyway
- PostgreSQL 16
- Spring Security + JWT
- VNPay Sandbox integration
- Cloudinary file upload
- SpringDoc OpenAPI (Swagger)

### Frontend
- Next.js 14 (App Router) + TypeScript
- TanStack Query v5
- Zustand (auth state)
- React Hook Form + Zod
- shadcn/ui + Tailwind CSS

## 📦 Local Development (without Docker)

### Prerequisites
- Java 21
- Node.js 20+
- PostgreSQL 16 running locally

### Backend
```bash
cd ams-backend
# Copy và edit env
cp .env.example .env
# Run
./mvnw spring-boot:run
```

### Frontend
```bash
cd ams-frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## 🌐 Deploy

### Frontend → Vercel
```bash
# Push to GitHub, connect Vercel to repo
# Set env var: NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

### Backend → Render
1. New Web Service → connect GitHub repo
2. Root directory: `ams-backend`
3. Build command: `./mvnw package -DskipTests`
4. Start command: `java -jar target/*.jar`
5. Set all environment variables from `.env.example`
6. Add PostgreSQL addon (or use Render free PostgreSQL)

## 🏗️ Architecture

```
┌─────────────────┐    HTTPS/JSON    ┌──────────────────┐
│   Next.js 14    │ ──────────────▶  │  Spring Boot 3   │
│   (Vercel)      │                  │  (Render)        │
│                 │ ◀──────────────  │                  │
└─────────────────┘                  └────────┬─────────┘
                                              │ JPA/Flyway
                                    ┌─────────▼─────────┐
                                    │   PostgreSQL 16   │
                                    │   (Render DB)     │
                                    └───────────────────┘
                                    
External Services:
  Cloudinary (file storage)
  VNPay Sandbox (payment)
```

## 📐 ERD

See `AMS_ERD.png` or `AMS_ERD.drawio` for the full Entity Relationship Diagram.

13 entities across 4 domains:
- **Identity & Access**: User, Role, UserRole
- **Governance**: SystemConfiguration, AuditLog  
- **Academic & Assignment**: Subject, SubjectClass, AssignmentTemplate, Assignment, AssignmentClass
- **Registration & Assessment**: ClassRegistration, PaymentTransaction, Submission, AssignmentEvaluation
