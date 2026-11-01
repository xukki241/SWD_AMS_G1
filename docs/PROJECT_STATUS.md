# AMS Project Status — Health Check

**Ngày kiểm tra:** 2026-11-01  
**Repo:** `C:\FLM\Ki7\SWD\SWD_AMS_G1`  
**Kết luận:** **READY** cho demo end-to-end (có vài GAP nhỏ, không chặn flow chính).  
**Seed path:** Flyway on backend start (`V1`–`V8`). Fresh volume = full demo; existing volume applies pending migrations only (V8 is idempotent). Reset: `docker compose down -v` rồi `docker compose up --build`.

---

## 1. Stack URLs & Flyway

| Thành phần | URL / Port | Trạng thái |
|---|---|---|
| Frontend (Next.js) | http://localhost:3000 | Up (HTTP 200) |
| Backend (Spring Boot) | http://localhost:8080 | Up |
| Swagger UI | http://localhost:8080/swagger-ui/index.html | HTTP 200 |
| Postgres | localhost:**5433** → container `ams-postgres` (`ams_db` / `ams_user`) | Healthy |
| SePay tunnel (IPN) | `https://visual-assure-reflect-outlet.trycloudflare.com` | Có trong env backend (không lưu trong DB) |

**Flyway:** V1 → V8. Seeds chạy khi backend start — không có seed container riêng.

| Version | Mô tả | Seed / thay đổi |
|---|---|---|
| **V1** | Schema | Roles, users, subjects, subject_classes, templates, assignments, registrations, payments, submissions, evaluations, audit, configs |
| **V2** | Seed data | 4 roles, 18 users, 4 subjects, 8 classes, 8 templates, 10 assignments, 15 regs, 16 payments, submissions/evals, configs |
| **V3** | Classroom model | `join_code`, `capacity`, `registration_fee`; bảng `class_posts`; backfill join codes + fee; 5 posts mẫu |
| **V4** | Lower fee | Fee 5_000_000 → **50_000** VND; config `registration.fee.default` = 50000 |
| **V5** | Assignment topic | Cột `topic`; gán topic cho assignment 1–10 |
| **V6** | Room | Cột `room` (optional GC settings) |
| **V7** | Class status | Cột `status` ACTIVE/ARCHIVED (archive soft) |
| **V8** | Demo seed sync | Idempotent: join codes, 50k fees, topics, `registration.fee.default=50000`, `student1` ACTIVE@G1701 + PENDING_PAYMENT@G1801 (50k). Safe re-run on existing volumes. |

Live DB có thể còn vài lớp/reg/assignment từ golden-path tests — không phá seed gốc; wipe volume để DB “sạch” theo V1–V8.

---

## 2. Seed inventory (who / password / role)

**Password chung (V2):** `Password@123` (BCrypt)

| Username | Email | Role | Status | Ghi chú demo |
|---|---|---|---|---|
| `admin` | admin@fitc.edu.vn | ADMIN | ACTIVE | Quản lý users/roles + audit |
| `expert1` | ha.tran@fitc.edu.vn | EXPERT | ACTIVE | Templates SWD/DBI |
| `expert2` | duc.le@fitc.edu.vn | EXPERT | ACTIVE | Templates PRJ/MAE |
| `teacher1` | bao.pham@fitc.edu.vn | TEACHER | ACTIVE | **Demo chính** — 5 ACTIVE classes |
| `teacher2` | mai.hoang@fitc.edu.vn | TEACHER | ACTIVE | G1801 (50k), free PRJ lab |
| `teacher3` | tuan.vu@fitc.edu.vn | TEACHER | ACTIVE | PRJ/DBI/MAE |
| `student1` | giahhan@student.fitc.edu.vn | STUDENT | ACTIVE | **Demo chính** — ACTIVE + PENDING 50k |
| `student2`…`student10`, `student12` | *.student.fitc.edu.vn | STUDENT | ACTIVE | Seed phụ |
| `student11` | hoangphuc@… | STUDENT | **SUSPENDED** | Demo suspend |

### Join codes hữu ích

| Class | Join code | Fee (VND) | Teacher |
|---|---|---|---|
| SWD392-G1701 | `K7Q2M9` | 50_000 | teacher1 |
| SWD392-G1702 | `Q2M9K7` | 50_000 | teacher1 |
| SWD392-G1801 | `B7X4NP` | 50_000 | teacher2 — **student1 PENDING_PAYMENT** |
| PRJ301-G1703 | `M4T8ZD` | 0 (free) | teacher2 |
| PRJ301-G1704 | `X9R3VC` | 0 | teacher3 |
| DBI202-G1705 | `P6H2WS` | 2_500_000 | teacher3 |
| MAE101-G1806 | `Z5J7QB` | 1_500_000 | teacher3 |
| DBI202-G1807 | `T8N4LM` | 2_500_000 | teacher2 |

---

## 3. DB counts (live volume — có thể > seed tối thiểu)

| Entity | Count |
|---|---|
| users | 18 |
| subjects | 4 |
| subject_classes (ACTIVE / ARCHIVED) | 13 / 0 |
| class_registrations ACTIVE | 18 |
| class_registrations PENDING_PAYMENT | **2** (student1 @ 50k G1801; student11 @ 2.5M) |
| class_registrations CANCELLED | 1 |
| assignments | 15 (10 có `topic`) |
| payment_transactions | 19 (VNPAY + SEPAY PENDING) |
| submissions | 15 |
| class_posts | 7 |
| assignment_templates | 8 |

---

## 4. Flow matrix

| Flow | Status | Cách demo |
|---|---|---|
| Login ADMIN | **OK** | `admin` / `Password@123` → `/admin` |
| Login TEACHER | **OK** | `teacher1` / `Password@123` → `/teacher` |
| Login STUDENT | **OK** | `student1` / `Password@123` → `/student` |
| Login EXPERT | **OK** | `expert1` / `Password@123` → `/expert` |
| Teacher: tạo class (GC fields) | **OK** | Teaching → Create class; API `POST /api/subject-classes` (TEACHER/EXPERT). Seed đã có join_code, capacity, fee, room, status |
| Teacher: classwork in-class + topic | **OK** | Mở `SWD392-G1701` → Classwork; assignment có topic «Đồ án môn học» |
| Teacher: settings | **OK** | Class → Settings (rename / people / deadlines / room) |
| Teacher: archive | **OK** | Settings → Archive → `POST .../archive` (V7 status) |
| Student: find / join class | **OK** | Find a Class + join code (catalog public 13 lớp) |
| Student: PENDING_PAYMENT → SePay / VNPay / VietQR | **OK** | `student1` reg **id=21** `SWD392-G1801` fee 50k; UI Payments có SePay + VNPay/VietQR |
| Student: ACTIVE class + nộp bài | **OK** | `student1` ACTIVE trên G1701 (+ submissions seed); Classwork → nộp file |
| Admin: users only (không tạo subject trên UI) | **OK (UI)** / **GAP (API)** | UI admin chỉ accounts + audit (`#subjects` redirect users). **API** `POST /api/subjects` vẫn cho ADMIN+EXPERT |
| SePay merchant + IPN | **OK** | Merchant `SP-LIVE-NX3AA858`; IPN code `POST /api/payment/sepay-ipn` (401 nếu thiếu secret). Env IPN → tunnel Cloudflare |

---

## 5. SePay / IPN readiness (one-liner)

**READY:** merchant `SP-LIVE-NX3AA858`, secret có trong env container, handler IPN hoạt động; IPN URL public = `https://visual-assure-reflect-outlet.trycloudflare.com/api/payment/sepay-ipn` — cần giữ tunnel sống khi demo ORDER_PAID → ACTIVE.

Chi tiết cầm tay: [`docs/SEPAY_SETUP.md`](./SEPAY_SETUP.md).

---

## 6. Demo seed sync (V8)

**V8__demo_seed_sync.sql** (additive, idempotent) đảm bảo clone + `docker compose up --build` có:

- `registration.fee.default` = **50000**
- Join codes documented (`K7Q2M9`, `B7X4NP`, …) + seed classes `ACTIVE`
- `SWD392-G1701` / `G1702` / `G1801` fee **50_000**; free labs `PRJ301-*` fee **0**
- Seed assignment topics (Đồ án / Chuyên đề / Bài tập)
- `student1` ACTIVE trên G1701 (nếu thiếu); `student1` **PENDING_PAYMENT** trên G1801 50k (nếu thiếu)
- **Không** ghi SePay vào DB; **không** wipe volume trong migration

Reset full sync: `docker compose down -v && docker compose up --build`.

---

## 7. GAPs / notes (không chặn demo)

1. **Admin create-subject API** vẫn `hasAnyRole('ADMIN','EXPERT')` — lệch product note “admin chỉ users”; UI đã ẩn. Nên siết PreAuthorize bỏ ADMIN nếu muốn cứng.
2. **NAV_ITEMS** admin còn link «Subjects» → `#subjects` (redirect users) — dead/legacy nav.
3. **Room** nhiều lớp seed để trống — set được trong Settings (không bắt buộc).
4. **Tunnel Cloudflare** hostname đổi mỗi lần restart → cập nhật SePay portal + `SEPAY_IPN_URL`.
5. Lớp golden-path (`SWD17933…`, `T-TEST-01`) lẫn seed — có thể dọn sau nếu muốn DB “sạch”; không ảnh hưởng demo.

---

## 8. Verdict

| Hạng mục | Kết quả |
|---|---|
| Seeds & schema V1–V8 | Đủ (V8 sync idempotent) |
| Critical demo rows | Đủ — V8 đảm bảo trên volume mới |
| Login 4 roles | OK |
| Teacher / Student / Admin flows | OK (API admin-subject = GAP nhẹ) |
| SePay IPN | READY (tunnel-dependent) |
| Overall | **READY** |
