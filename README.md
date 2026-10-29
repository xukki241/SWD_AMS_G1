# AMS — Assignment Management System

> POC Demo Project · Group 1 · SWD392

## 🚀 Quick Start (Docker — 1 lệnh)

```bash
# Clone repo
git clone https://github.com/xukki241/SWD_AMS_G1.git
cd SWD_AMS_G1

# Chạy toàn bộ stack (DB + Backend + Frontend)
docker compose up --build

# Truy cập:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080/api
# Swagger UI: http://localhost:8080/swagger-ui.html
```

## 🔐 Test Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `Password@123` |
| Expert | `expert1` | `Password@123` |
| Teacher | `teacher1` | `Password@123` |
| Student | `student1` | `Password@123` |

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
