-- ============================================================
-- V2__seed_data.sql
-- AMS – Initial seed data (realistic demo dataset)
-- ============================================================

-- Roles
INSERT INTO roles (role_name, description) VALUES
('ADMIN',   'System administrator'),
('EXPERT',  'Subject matter expert who creates templates'),
('TEACHER', 'Teacher who creates assignments and evaluates'),
('STUDENT', 'Student who registers and submits assignments');

-- Users  (passwords are BCrypt of "Password@123")
INSERT INTO users (username, email, password, full_name, account_status, created_at) VALUES
('admin',      'admin@fitc.edu.vn',              '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Nguyễn Xuân Kiên',    'ACTIVE',    NOW() - INTERVAL '320 days'),
('expert1',    'ha.tran@fitc.edu.vn',            '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Trần Thị Thu Hà',     'ACTIVE',    NOW() - INTERVAL '320 days'),
('expert2',    'duc.le@fitc.edu.vn',             '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Lê Minh Đức',         'ACTIVE',    NOW() - INTERVAL '318 days'),
('teacher1',   'bao.pham@fitc.edu.vn',           '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Phạm Quốc Bảo',       'ACTIVE',    NOW() - INTERVAL '315 days'),
('teacher2',   'mai.hoang@fitc.edu.vn',          '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Hoàng Thị Mai',       'ACTIVE',    NOW() - INTERVAL '315 days'),
('teacher3',   'tuan.vu@fitc.edu.vn',            '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Vũ Anh Tuấn',         'ACTIVE',    NOW() - INTERVAL '300 days'),
('student1',   'giahhan@student.fitc.edu.vn',    '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Nguyễn Gia Hân',      'ACTIVE',    NOW() - INTERVAL '120 days'),
('student2',   'thaolinh@student.fitc.edu.vn',   '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Trần Thảo Linh',      'ACTIVE',    NOW() - INTERVAL '118 days'),
('student3',   'quochdat@student.fitc.edu.vn',   '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Lê Quốc Đạt',        'ACTIVE',    NOW() - INTERVAL '115 days'),
('student4',   'minhanh@student.fitc.edu.vn',    '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Phạm Minh Anh',       'ACTIVE',    NOW() - INTERVAL '110 days'),
('student5',   'baochau@student.fitc.edu.vn',    '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Hoàng Bảo Châu',      'ACTIVE',    NOW() - INTERVAL '105 days'),
('student6',   'hoanglong@student.fitc.edu.vn',  '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Vũ Hoàng Long',       'ACTIVE',    NOW() - INTERVAL '100 days'),
('student7',   'ngocanh@student.fitc.edu.vn',    '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Đặng Ngọc Ánh',       'ACTIVE',    NOW() - INTERVAL '95 days'),
('student8',   'tuan.kiet@student.fitc.edu.vn',  '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Bùi Tuấn Kiệt',       'ACTIVE',    NOW() - INTERVAL '90 days'),
('student9',   'thanhha@student.fitc.edu.vn',    '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Đỗ Thanh Hằng',       'ACTIVE',    NOW() - INTERVAL '85 days'),
('student10',  'minhtuan@student.fitc.edu.vn',   '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Nguyễn Minh Tuấn',  'ACTIVE',    NOW() - INTERVAL '80 days'),
('student11',  'hoangphuc@student.fitc.edu.vn',  '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Trần Hoàng Phúc',     'SUSPENDED', NOW() - INTERVAL '75 days'),
('student12',  'tuongvi@student.fitc.edu.vn',    '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Lê Thị Tường Vi',     'ACTIVE',    NOW() - INTERVAL '70 days');

-- UserRoles
INSERT INTO user_roles (user_id, role_id) VALUES
(1,  (SELECT id FROM roles WHERE role_name = 'ADMIN')),
(2,  (SELECT id FROM roles WHERE role_name = 'EXPERT')),
(3,  (SELECT id FROM roles WHERE role_name = 'EXPERT')),
(4,  (SELECT id FROM roles WHERE role_name = 'TEACHER')),
(5,  (SELECT id FROM roles WHERE role_name = 'TEACHER')),
(6,  (SELECT id FROM roles WHERE role_name = 'TEACHER')),
(7,  (SELECT id FROM roles WHERE role_name = 'STUDENT')),
(8,  (SELECT id FROM roles WHERE role_name = 'STUDENT')),
(9,  (SELECT id FROM roles WHERE role_name = 'STUDENT')),
(10, (SELECT id FROM roles WHERE role_name = 'STUDENT')),
(11, (SELECT id FROM roles WHERE role_name = 'STUDENT')),
(12, (SELECT id FROM roles WHERE role_name = 'STUDENT')),
(13, (SELECT id FROM roles WHERE role_name = 'STUDENT')),
(14, (SELECT id FROM roles WHERE role_name = 'STUDENT')),
(15, (SELECT id FROM roles WHERE role_name = 'STUDENT')),
(16, (SELECT id FROM roles WHERE role_name = 'STUDENT')),
(17, (SELECT id FROM roles WHERE role_name = 'STUDENT')),
(18, (SELECT id FROM roles WHERE role_name = 'STUDENT'));

-- Subjects
INSERT INTO subjects (subject_code, subject_name, description, status) VALUES
('SWD392', 'Dự án Phát triển Phần mềm',
           'Môn dự án tốt nghiệp: làm việc nhóm theo Agile, quản lý sản phẩm phần mềm đầu-cuối (full-stack).', 'ACTIVE'),
('PRJ301', 'Ứng dụng Web Java',
           'Xây dựng ứng dụng web với JSP/Servlet và Spring MVC, tích hợp cơ sở dữ liệu quan hệ.', 'ACTIVE'),
('DBI202', 'Hệ thống Cơ sở dữ liệu',
           'Thiết kế quan hệ, chuẩn hoá (1NF–3NF), viết truy vấn SQL tối ưu và bảo trì CSDL.', 'ACTIVE'),
('MAE101', 'Toán ứng dụng cho Kỹ sư',
           'Đại số tuyến tính, phương trình vi phân và giải tích rời rạc áp dụng trong kỹ thuật.', 'ACTIVE');

-- SubjectClasses
-- teacher 1 (bao.pham) dạy G1701, G1702 · teacher 2 (mai.hoang) dạy G1801 ·
-- teacher 3 (tuan.vu) dạy G1703, G1704 · chuyên gia expert1 phụ trách SWD392/DBI202, expert2 phụ trách PRJ301/MAE101
INSERT INTO subject_classes (subject_id, expert_id, teacher_id, class_code, class_name, term) VALUES
(1, 2, 4, 'SWD392-G1701', 'SWD392 — Nhóm 1701 (Agile)', 'Fall2026'),
(1, 2, 4, 'SWD392-G1702', 'SWD392 — Nhóm 1702 (Agile)', 'Fall2026'),
(1, 3, 5, 'SWD392-G1801', 'SWD392 — Nhóm 1801 (Agile)', 'Fall2026'),
(2, 3, 5, 'PRJ301-G1703', 'PRJ301 — Lớp 1703',         'Fall2026'),
(2, 3, 6, 'PRJ301-G1704', 'PRJ301 — Lớp 1704',         'Fall2026'),
(3, 2, 6, 'DBI202-G1705', 'DBI202 — Lớp 1705',         'Fall2026'),
(4, 3, 6, 'MAE101-G1806', 'MAE101 — Lớp 1806',         'Fall2026'),
(3, 2, 5, 'DBI202-G1807', 'DBI202 — Lớp 1807',         'Fall2026');

-- AssignmentTemplates
INSERT INTO assignment_templates (subject_id, expert_id, title, instructions, default_due_rule) VALUES
(1, 2, 'Đề án dự án (Project Proposal)',
   'Đưa ra mục tiêu, phạm vi, timeline, phân công vai trò trong nhóm. Tối thiểu 5 trang, có Gantt chart và danh sách rủi ro.', '14 ngày sau khi phát bài'),
(1, 2, 'Báo cáo Sprint 1',
   'Tài liệu hoá tiến độ Sprint 1: user stories đã hoàn thành, burndown chart, kết luận retrospective.',               '21 ngày sau khi phát bài'),
(1, 2, 'Trình bày cuối kỳ (Final Presentation)',
   'Chuẩn bị bài thuyết trình 15 phút demo toàn bộ hệ thống, kèm mã nguồn đã code-review.',                           '60 ngày sau khi phát bài'),
(2, 3, 'Lab Servlet CRUD',
   'Thực hiện ứng dụng CRUD với Java Servlet + JSP, triển khai trên Tomcat, kèm hướng dẫn chạy.',                   '7 ngày sau khi phát bài'),
(2, 3, 'Ứng dụng Spring MVC',
   'Xây dựng web app theo mẫu MVC với Spring, tích hợp JPA/PostgreSQL và upload tệp đính kèm.',                       '14 ngày sau khi phát bài'),
(3, 2, 'Thiết kế ERD bệnh viện',
   'Thiết kế ERD cho hệ thống quản lý bệnh viện, chuẩn hoá tối thiểu 3NF, kèm script tạo bảng SQL.',                 '7 ngày sau khi phát bài'),
(3, 2, 'Bộ 20 truy vấn SQL',
   'Viết 20 truy vấn SQL tăng dần độ khó trên schema được cung cấp, giải thích kế hoạch truy vấn (EXPLAIN).',        '10 ngày sau khi phát bài'),
(4, 3, 'Bộ bài tập Đại số tuyến tính',
   'Giải 30 bài toán về phép toán ma trận, giá trị riêng và không gian vectơ.',                                       '7 ngày sau khi phát bài');

-- Assignments
INSERT INTO assignments (teacher_id, template_id, title, instructions, due_at) VALUES
(4, 1, 'Đề án dự án — G1701',   'Báo cáo đề án nhóm cho SWD392. Chi tiết xem trong template chuẩn.',           NOW() + INTERVAL '14 days'),
(4, 2, 'Sprint 1 Report — G1701','Tài liệu hoá sprint 1, kèm burndown chart và retrospective.',                 NOW() + INTERVAL '21 days'),
(4, 1, 'Đề án dự án — G1702',   'Tương tự G1701, tham chiếu template.',                                         NOW() + INTERVAL '14 days'),
(5, 3, 'Final Demo — G1801',    'Trình bày 15 phút/group demo hệ thống hoàn chỉnh.',                           NOW() + INTERVAL '60 days'),
(5, 4, 'Lab Servlet — G1703',   'CRUD với Servlet, deploy trên Tomcat.',                                        NOW() + INTERVAL '7 days'),
(5, 5, 'Spring MVC App — G1703','Web app Spring MVC tích hợp PostgreSQL.',                                      NOW() + INTERVAL '14 days'),
(6, 4, 'Lab Servlet — G1704',   'Tương tự Lab Servlet G1703.',                                                 NOW() + INTERVAL '7 days'),
(6, 6, 'ERD Bệnh viện — G1705', 'Thiết kế ERD hệ thống quản lý bệnh viện, chuẩn hoá 3NF.',                     NOW() + INTERVAL '7 days'),
(6, 7, 'Truy vấn SQL — G1705',  'Bộ 20 câu SQL trên schema bệnh viện.',                                         NOW() + INTERVAL '10 days'),
(6, 8, 'Đại số tuyến tính — G1806', 'Bộ bài tập số 1 (ma trận, giá trị riêng).',                               NOW() - INTERVAL '2 days');

-- AssignmentClasses
INSERT INTO assignment_classes (assignment_id, subject_class_id, allocation_status, allocated_at) VALUES
(1,  1, 'ACTIVE',    NOW() - INTERVAL '10 days'),
(2,  1, 'ACTIVE',    NOW() - INTERVAL '7 days'),
(3,  2, 'ACTIVE',    NOW() - INTERVAL '10 days'),
(4,  3, 'ACTIVE',    NOW() - INTERVAL '9 days'),
(5,  4, 'ACTIVE',    NOW() - INTERVAL '8 days'),
(6,  4, 'ACTIVE',    NOW() - INTERVAL '6 days'),
(7,  5, 'ACTIVE',    NOW() - INTERVAL '8 days'),
(8,  6, 'ACTIVE',    NOW() - INTERVAL '5 days'),
(9,  6, 'ACTIVE',    NOW() - INTERVAL '5 days'),
(10, 7, 'ACTIVE',    NOW() - INTERVAL '12 days');

-- ClassRegistrations (12 sinh viên, phân bổ đa lớp)
INSERT INTO class_registrations (student_id, subject_class_id, registration_reference, status, activated_at) VALUES
(7,  1, 'REG-F26-1001', 'ACTIVE',          NOW() - INTERVAL '9 days'),
(8,  1, 'REG-F26-1002', 'ACTIVE',          NOW() - INTERVAL '8 days'),
(9,  1, 'REG-F26-1003', 'ACTIVE',          NOW() - INTERVAL '8 days'),
(10, 2, 'REG-F26-1004', 'ACTIVE',          NOW() - INTERVAL '9 days'),
(11, 1, 'REG-F26-1005', 'ACTIVE',          NOW() - INTERVAL '7 days'),
(12, 4, 'REG-F26-1006', 'ACTIVE',          NOW() - INTERVAL '6 days'),
(13, 4, 'REG-F26-1007', 'ACTIVE',          NOW() - INTERVAL '6 days'),
(14, 5, 'REG-F26-1008', 'ACTIVE',          NOW() - INTERVAL '10 days'),
(15, 5, 'REG-F26-1009', 'ACTIVE',          NOW() - INTERVAL '9 days'),
(16, 6, 'REG-F26-1010', 'ACTIVE',          NOW() - INTERVAL '5 days'),
(17, 6, 'REG-F26-1011', 'PENDING_PAYMENT', NULL),
(18, 7, 'REG-F26-1012', 'ACTIVE',          NOW() - INTERVAL '4 days'),
(18, 8, 'REG-F26-1013', 'CANCELLED',       NULL),
(7,  6, 'REG-F26-1014', 'ACTIVE',          NOW() - INTERVAL '4 days'),
(17, 7, 'REG-F26-1015', 'ACTIVE',          NOW() - INTERVAL '3 days');

-- PaymentTransactions (đủ các trạng thái: SUCCESS / PENDING / FAILED / REFUNDED)
INSERT INTO payment_transactions (class_registration_id, provider, provider_reference, amount, transaction_status, created_at) VALUES
(1,  'VNPAY', 'VNPAY20261015000001', 5000000, 'SUCCESS',  NOW() - INTERVAL '9 days'),
(2,  'VNPAY', 'VNPAY20261015000002', 5000000, 'SUCCESS',  NOW() - INTERVAL '8 days'),
(3,  'VNPAY', 'VNPAY20261015000003', 5000000, 'SUCCESS',  NOW() - INTERVAL '8 days'),
(4,  'VNPAY', 'VNPAY20261016000004', 5000000, 'SUCCESS',  NOW() - INTERVAL '9 days'),
(5,  'VNPAY', 'VNPAY20261017000005', 5000000, 'SUCCESS',  NOW() - INTERVAL '7 days'),
(6,  'VNPAY', 'VNPAY20261018000006', 5000000, 'SUCCESS',  NOW() - INTERVAL '6 days'),
(7,  'VNPAY', 'VNPAY20261018000007', 5000000, 'SUCCESS',  NOW() - INTERVAL '6 days'),
(8,  'VNPAY', 'VNPAY20261012000008', 5000000, 'SUCCESS',  NOW() - INTERVAL '10 days'),
(9,  'VNPAY', 'VNPAY20261013000009', 5000000, 'SUCCESS',  NOW() - INTERVAL '9 days'),
(10, 'VNPAY', 'VNPAY20261019000010', 5000000, 'SUCCESS',  NOW() - INTERVAL '5 days'),
(11, 'VNPAY', 'VNPAY20261023000011', 5000000, 'PENDING',  NOW() - INTERVAL '1 day'),
(11, 'VNPAY', 'VNPAY20261022000012', 5000000, 'FAILED',   NOW() - INTERVAL '2 days'),
(12, 'VNPAY', 'VNPAY20261024000016', 5000000, 'SUCCESS',  NOW() - INTERVAL '4 days'),
(13, 'VNPAY', 'VNPAY20261010000013', 5000000, 'REFUNDED', NOW() - INTERVAL '15 days'),
(14, 'VNPAY', 'VNPAY20261022000014', 5000000, 'SUCCESS',  NOW() - INTERVAL '4 days'),
(15, 'VNPAY', 'VNPAY20261024000015', 5000000, 'SUCCESS',  NOW() - INTERVAL '3 days');

-- Submissions (SUBMITTED / LATE / GRADED; tệp thật kiểu Cloudinary)
INSERT INTO submissions (class_registration_id, assignment_id, submitted_at, secure_file_reference, file_metadata, submission_status) VALUES
(1,  1,  NOW() - INTERVAL '5 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759248000/submissions/g1701_denan_han.pdf',     '{"name":"de_an_du_an_g1701.pdf","size":1245184,"type":"application/pdf"}', 'GRADED'),
(2,  1,  NOW() - INTERVAL '4 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759334400/submissions/g1701_denan_linh.pdf',    '{"name":"de_an_Nhom1701.pdf","size":2150400,"type":"application/pdf"}',    'GRADED'),
(3,  1,  NOW() - INTERVAL '6 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759161600/submissions/g1701_denan_dat.pdf',     '{"name":"project_proposal.pdf","size":890880,"type":"application/pdf"}',   'GRADED'),
(4,  3,  NOW() - INTERVAL '3 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759420800/submissions/g1702_denan_anh.pdf',    '{"name":"de_an_nhom_1702.pdf","size":1572864,"type":"application/pdf"}',   'SUBMITTED'),
(5,  2,  NOW() - INTERVAL '2 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759507200/submissions/g1701_sprint1_baochau.docx', '{"name":"sprint1_report.docx","size":348160,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}', 'SUBMITTED'),
(6,  5,  NOW() - INTERVAL '2 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759507201/submissions/g1703_servlet_long.zip', '{"name":"servlet-lab-tomcat.zip","size":4194304,"type":"application/zip"}','GRADED'),
(7,  5,  NOW() - INTERVAL '1 day',  'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759593600/submissions/g1703_servlet_ngocanh.zip', '{"name":"servlet_crud.zip","size":1048576,"type":"application/zip"}', 'SUBMITTED'),
(8,  7,  NOW() - INTERVAL '1 day',  'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759593601/submissions/g1704_servlet_minhanh.zip', '{"name":"servlet-lab.zip","size":983040,"type":"application/zip"}',   'SUBMITTED'),
(12, 10, NOW() - INTERVAL '1 day',  'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759593602/submissions/g1806_daistuyen_tuongvi.pdf', '{"name":"baitap_daistuyen.pdf","size":189440,"type":"application/pdf"}','SUBMITTED'),
(14, 8,  NOW() - INTERVAL '1 day',  'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759593603/submissions/g1705_erd_han.pdf',       '{"name":"erd_benh_vien_3nf.pdf","size":327680,"type":"application/pdf"}','SUBMITTED'),
(10, 8,  NOW() - INTERVAL '3 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759420801/submissions/g1705_erd_thanhha.pdf',   '{"name":"erd_hospital.pdf","size":294912,"type":"application/pdf"}',      'GRADED'),
(9,  7,  NOW() - INTERVAL '1 day',  'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759593604/submissions/g1704_spring_hang.zip',   '{"name":"spring-mvc-app.zip","size":5242880,"type":"application/zip"}',   'SUBMITTED'),
(15, 10, NOW() - INTERVAL '1 day',  'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759593605/submissions/g1806_daistuyen_hoangphuc.pdf', '{"name":"baitap_daistuyen_b1.pdf","size":208896,"type":"application/pdf"}','LATE');

-- AssignmentEvaluations
INSERT INTO assignment_evaluations (submission_id, evaluator_id, score, feedback, evaluation_status) VALUES
(1,  4, 8.5, 'Đề án rõ mục tiêu và phạm vi. Cần bổ sung timeline chi tiết cho từng tuần.',                 'COMPLETED'),
(2,  4, 9.0, 'Đề án xuất sắc: scope rõ ràng, có đánh giá rủi ro và Gantt chart đầy đủ.',                   'COMPLETED'),
(3,  4, 7.5, 'Nội dung ổn, nhưng thiếu phân công vai trò trong nhóm. Nên bổ sung RACI matrix.',           'COMPLETED'),
(6,  5, 8.0, 'Servlet chạy được trên Tomcat. Chất lượng code cần cải thiện: tách business logic khỏi servlet, thêm javadoc.', 'COMPLETED'),
(11, 6, 9.2, 'ERD chuẩn hoá 3NF đầy đủ, kèm script DDL rõ ràng và EXPLAIN cho từng câu. Xuất sắc.',      'COMPLETED');

-- AuditLogs (các nghiệp vụ hệ thống mẫu)
INSERT INTO audit_logs (actor_id, action, resource_type, resource_reference, occurred_at) VALUES
(4,  'SUBJECT_CLASS_CREATED',  'SUBJECT_CLASS', 'SWD392-G1701',            NOW() - INTERVAL '30 days'),
(4,  'SUBJECT_CLASS_CREATED',  'SUBJECT_CLASS', 'SWD392-G1702',            NOW() - INTERVAL '30 days'),
(4,  'ASSIGNMENT_PUBLISHED',   'ASSIGNMENT',    'Đề án dự án — G1701',     NOW() - INTERVAL '10 days'),
(7,  'CLASS_REGISTERED',       'REGISTRATION',  'REG-F26-1001',            NOW() - INTERVAL '9 days'),
(7,  'PAYMENT_SUCCESS',        'PAYMENT',       'VNPAY20261015000001',     NOW() - INTERVAL '9 days'),
(18, 'PAYMENT_FAILED',         'PAYMENT',       'VNPAY20261022000012',     NOW() - INTERVAL '1 day'),
(18, 'REGISTRATION_CANCELLED', 'REGISTRATION',  'REG-F26-1013',            NOW() - INTERVAL '15 days'),
(18, 'REFUND_ISSUED',         'PAYMENT',       'VNPAY20261010000013',     NOW() - INTERVAL '15 days'),
(4,  'SUBMISSION_GRADED',      'EVALUATION',    'Sprint 1 Report — G1701', NOW() - INTERVAL '4 days'),
(1,  'USER_SUSPENDED',        'USER',          'student11',               NOW() - INTERVAL '60 days'),
(2,  'TEMPLATE_CREATED',       'TEMPLATE',      'Đề án dự án (Project Proposal)', NOW() - INTERVAL '45 days'),
(7,  'PAYMENT_SUCCESS',        'PAYMENT',       'VNPAY20261022000014',     NOW() - INTERVAL '4 days');

-- SystemConfigurations
INSERT INTO system_configurations (configuration_name, business_value, effective_status, last_reviewed_at) VALUES
('registration.fee.default',      '5000000',             'ACTIVE', NOW() - INTERVAL '30 days'),
('registration.fee.discount',     '10',                  'ACTIVE', NOW() - INTERVAL '30 days'),
('submission.max_file_size_mb',   '50',                  'ACTIVE', NOW() - INTERVAL '60 days'),
('submission.allowed_types',      'pdf,zip,docx,pptx',   'ACTIVE', NOW() - INTERVAL '60 days'),
('evaluation.passing_score',      '5.0',                 'ACTIVE', NOW() - INTERVAL '90 days'),
('academic.current_term',         'Fall2026',            'ACTIVE', NOW() - INTERVAL '7 days');
