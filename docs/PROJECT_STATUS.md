# AMS Project Status — Health Check

**Cập nhật:** 2026-11-03
**Repo:** `E:\Semester7\SWD392\SWD_AMS_G1`
**Kết luận:** Sẵn sàng demo end-to-end trên mô hình **Course** (Class domain đã bị xoá hoàn toàn).
**Seed path:** Flyway on backend start (`V1`–`V3`). Fresh volume = full demo. Reset: `docker compose down -v` rồi `docker compose up --build`.

---

## 1. Stack URLs & Flyway

| Thành phần | URL / Port | Trạng thái |
|---|---|---|
| Frontend (Next.js) | http://localhost:3000 | Up (HTTP 200) |
| Backend (Spring Boot) | http://localhost:8080 | Up |
| Swagger UI | http://localhost:8080/swagger-ui/index.html | HTTP 200 |
| Postgres | localhost:**5433** → container `ams-postgres` (`ams_db` / `ams_user`) | Healthy |
| SePay tunnel (IPN) | trycloudflare tunnel URL | Có trong env backend (không lưu trong DB) |

**Flyway:** V1 (schema thuần Course) → V2 (demo dataset) → V3 (unique index mã course chỉ áp dụng cho course chưa xoá). Schema cũ dựng Class (V1–V8 thời class) đã bị viết lại — **phải wipe volume một lần** trước khi chạy bộ migration mới.

| Version | Mô tả |
|---|---|
| **V1** | Schema Course-centric: roles/users/user_roles, audit, subjects, categories/courses/modules/lessons, course_enrollments (có amount + PENDING_PAYMENT), assignment_templates, assignments (course_id, topic, max_score), payment_transactions (course_enrollment_id), submissions (course_enrollment_id), evaluations |
| **V2** | Demo: 4 roles, 23 users (student1–student17), 4 subjects, 8 templates, 6 categories, 6 courses (CRS-SWD01, CRS-SCRUM2, CRS-SPRMVC, CRS-SRVLT1, CRS-DBSQL1, CRS-LINALG) + curriculum, 19 enrollments, 7 payments, 14 submissions, 5 evaluations |
| **V3** | Bỏ UNIQUE constraint toàn bảng trên `courses.code`, thay bằng partial unique index `uq_courses_code_active ... WHERE deleted = FALSE` — cho phép tái sử dụng mã của course đã soft-delete |

---

## 2. Seed inventory (who / password / role)

**Password chung:** `Password@123` (BCrypt)

| Role | Tài khoản |
|---|---|
| Admin | `admin` |
| Experts | `expert1`, `expert2` |
| Teachers | `teacher1` (CRS-SWD01, CRS-SCRUM2), `teacher2` (CRS-SPRMVC, CRS-SRVLT1), `teacher3` (CRS-DBSQL1, CRS-LINALG) |
| Students | `student1` … `student17` (`student11` SUSPENDED cho demo) |

## 3. Golden path (demo rubric)

| Bước | Hành động |
|---|---|
| Login teacher1 | Xem My Courses, CRUD course, Manage Content, AI outline (cần `GEMINI_API_KEY`) |
| Login student1 | Đã enroll CRS-SWD01 (free → ACTIVE), có submissions GRADED |
| Login student17 | Enroll CRS-SCRUM2 (50.000₫) → PENDING_PAYMENT, có 1 payment FAILED + 1 PENDING → retry VNPay/SePay/VietQR → ACTIVE |
| Login teacher2 | Chấm bài Servlet/Spring MVC qua GradeDialog |
| Login admin | Users, Courses, Enrollments, Audit |
| Login expert1 | Templates + Published courses (read-only) |

## 4. API chính (course-centric)

| Nhóm | Endpoint |
|---|---|
| Courses | `GET/POST /api/courses`, `GET/PUT/DELETE /api/courses/{id}`, content/ai |
| Public catalog | `GET /api/public/courses`, `GET /api/public/courses/{id}` — chỉ course PUBLISHED, không cần JWT (landing page, student, expert) |
| Enrollments | `POST /api/courses/{id}/enroll`, `GET /api/enrollments/my`, `GET /api/courses/{id}/enrollments[/me]`, `DELETE /api/enrollments/{id}` |
| Assignments | `GET /api/assignments/course/{courseId}`, `POST /api/assignments/course/{courseId}`, `PATCH /api/assignments/{id}`, `GET /api/assignments/overview` |
| Submissions | `POST /api/submissions` (multipart: courseEnrollmentId + assignmentId + file), `DELETE /api/submissions/{id}` |
| Evaluations | `POST /api/evaluations` (chỉ instructor của course hoặc admin) |
| Payments | `POST /api/payment/course/create/{enrollmentId}`, `…/create-sepay/…`, `…/confirm-vietqr/…`, IPN/return, `GET /api/payment/my` |

## 5. Đã xoá (không còn trong codebase)

- Bảng: `subject_classes`, `class_registrations`, `assignment_classes`, `class_posts`
- Backend: SubjectClass/ClassRegistration/AssignmentClass/ClassPost entities + repos + services + controllers + DTOs
- Frontend: `/classes/*` pages, class-only classroom components, subjectClass/registration services
- Tính năng kiểu Google Classroom: join code, stream posts, people, archive
