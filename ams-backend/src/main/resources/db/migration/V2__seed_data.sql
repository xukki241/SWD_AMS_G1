-- ============================================================
-- V2__seed_data.sql
-- AMS – Initial seed data
-- ============================================================

-- Roles
INSERT INTO roles (role_name, description) VALUES
('ADMIN',   'System administrator'),
('EXPERT',  'Subject matter expert who creates templates'),
('TEACHER', 'Teacher who creates assignments and evaluates'),
('STUDENT', 'Student who registers and submits assignments');

-- Users  (passwords are BCrypt of "Password@123")
INSERT INTO users (username, email, password, full_name, account_status) VALUES
('admin',    'admin@ams.edu.vn',            '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFkAIkjv8zXzp0fv3IH3Gde', 'System Admin',       'ACTIVE'),
('expert1',  'expert1@ams.edu.vn',          '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFkAIkjv8zXzp0fv3IH3Gde', 'Nguyen Van Expert',  'ACTIVE'),
('expert2',  'expert2@ams.edu.vn',          '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFkAIkjv8zXzp0fv3IH3Gde', 'Tran Thi Expert',    'ACTIVE'),
('teacher1', 'teacher1@ams.edu.vn',         '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFkAIkjv8zXzp0fv3IH3Gde', 'Le Van Teacher',     'ACTIVE'),
('teacher2', 'teacher2@ams.edu.vn',         '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFkAIkjv8zXzp0fv3IH3Gde', 'Pham Thi Teacher',   'ACTIVE'),
('teacher3', 'teacher3@ams.edu.vn',         '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFkAIkjv8zXzp0fv3IH3Gde', 'Hoang Van Teacher',  'ACTIVE'),
('student1', 'student1@student.edu.vn',     '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFkAIkjv8zXzp0fv3IH3Gde', 'Nguyen Thi Student', 'ACTIVE'),
('student2', 'student2@student.edu.vn',     '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFkAIkjv8zXzp0fv3IH3Gde', 'Tran Van Student',   'ACTIVE'),
('student3', 'student3@student.edu.vn',     '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFkAIkjv8zXzp0fv3IH3Gde', 'Le Thi Student',     'ACTIVE'),
('student4', 'student4@student.edu.vn',     '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFkAIkjv8zXzp0fv3IH3Gde', 'Pham Van Student',   'ACTIVE'),
('student5', 'student5@student.edu.vn',     '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFkAIkjv8zXzp0fv3IH3Gde', 'Hoang Thi Student',  'ACTIVE'),
('student6', 'student6@student.edu.vn',     '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFkAIkjv8zXzp0fv3IH3Gde', 'Vo Van Student',     'ACTIVE'),
('student7', 'student7@student.edu.vn',     '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFkAIkjv8zXzp0fv3IH3Gde', 'Dang Thi Student',   'ACTIVE'),
('student8', 'student8@student.edu.vn',     '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFkAIkjv8zXzp0fv3IH3Gde', 'Bui Van Student',    'ACTIVE');

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
(14, (SELECT id FROM roles WHERE role_name = 'STUDENT'));

-- Subjects
INSERT INTO subjects (subject_code, subject_name, description, status) VALUES
('SWD392', 'Software Development Project',  'Capstone project course for software development',   'ACTIVE'),
('PRJ301', 'Java Web Application',          'Web application development using Java EE',           'ACTIVE'),
('DBI202', 'Database Systems',              'Relational database design and SQL',                  'ACTIVE'),
('MAE101', 'Mathematics for Engineering',   'Linear algebra and calculus for engineers',           'ACTIVE');

-- SubjectClasses
INSERT INTO subject_classes (subject_id, expert_id, teacher_id, class_code, class_name, term) VALUES
(1, 2, 4, 'SWD392-SE1701', 'SWD392 - SE1701', 'Fall2026'),
(1, 2, 5, 'SWD392-SE1702', 'SWD392 - SE1702', 'Fall2026'),
(2, 3, 4, 'PRJ301-SE1703', 'PRJ301 - SE1703', 'Fall2026'),
(2, 3, 6, 'PRJ301-SE1704', 'PRJ301 - SE1704', 'Fall2026'),
(3, 2, 5, 'DBI202-SE1705', 'DBI202 - SE1705', 'Fall2026'),
(4, 3, 6, 'MAE101-SE1706', 'MAE101 - SE1706', 'Fall2026');

-- AssignmentTemplates
INSERT INTO assignment_templates (subject_id, expert_id, title, instructions, default_due_rule) VALUES
(1, 2, 'Project Proposal',         'Submit a detailed project proposal including objectives, scope, timeline, and team roles. Minimum 5 pages.', '14 days after assignment'),
(1, 2, 'Sprint 1 Report',          'Document Sprint 1 progress including user stories completed, burndown chart, and retrospective.',             '21 days after assignment'),
(1, 2, 'Final Presentation',       'Prepare a 15-minute presentation demonstrating the complete system.',                                         '60 days after assignment'),
(2, 3, 'Servlet Lab',              'Implement a CRUD application using Java Servlets and JSP.',                                                   '7 days after assignment'),
(2, 3, 'MVC Assignment',           'Build a web application following MVC pattern with Spring MVC.',                                              '14 days after assignment'),
(3, 2, 'ERD Design',               'Design an ERD for a given business scenario, normalize to 3NF.',                                              '7 days after assignment'),
(3, 2, 'SQL Queries',              'Write 20 SQL queries of increasing complexity for the provided schema.',                                       '10 days after assignment'),
(4, 3, 'Linear Algebra Problems',  'Solve 30 problems on matrix operations and eigenvalues.',                                                     '7 days after assignment');

-- Assignments
INSERT INTO assignments (teacher_id, template_id, title, instructions, due_at) VALUES
(4, 1, 'Project Proposal - SE1701',  'Submit project proposal for SWD392. See template for details.',     NOW() + INTERVAL '14 days'),
(4, 2, 'Sprint 1 Report - SE1701',   'Document your Sprint 1. Include burndown chart.',                   NOW() + INTERVAL '21 days'),
(5, 1, 'Project Proposal - SE1702',  'Same as SE1701. Refer to template.',                                NOW() + INTERVAL '14 days'),
(5, 3, 'Final Presentation - SE1702','Prepare final demo. 15 minutes per group.',                         NOW() + INTERVAL '60 days'),
(4, 4, 'Servlet Lab - SE1703',       'Implement CRUD with Servlets. Deploy on Tomcat.',                   NOW() + INTERVAL '7 days'),
(4, 5, 'Spring MVC App - SE1703',    'Build a Spring MVC web app with database integration.',             NOW() + INTERVAL '14 days'),
(6, 4, 'Servlet Lab - SE1704',       'Same lab as SE1703.',                                               NOW() + INTERVAL '7 days'),
(5, 6, 'ERD Design - SE1705',        'Design ERD for hospital management system.',                        NOW() + INTERVAL '7 days'),
(5, 7, 'SQL Queries - SE1705',       '20 SQL queries on the hospital schema.',                            NOW() + INTERVAL '10 days'),
(6, 8, 'Linear Algebra - SE1706',    'Complete problem set 1.',                                           NOW() + INTERVAL '7 days');

-- AssignmentClasses
INSERT INTO assignment_classes (assignment_id, subject_class_id, allocation_status) VALUES
(1,  1, 'ACTIVE'),
(2,  1, 'ACTIVE'),
(3,  2, 'ACTIVE'),
(4,  2, 'ACTIVE'),
(5,  3, 'ACTIVE'),
(6,  3, 'ACTIVE'),
(7,  4, 'ACTIVE'),
(8,  5, 'ACTIVE'),
(9,  5, 'ACTIVE'),
(10, 6, 'ACTIVE');

-- ClassRegistrations
INSERT INTO class_registrations (student_id, subject_class_id, registration_reference, status, activated_at) VALUES
(7,  1, 'REG-2026-001', 'ACTIVE',          NOW() - INTERVAL '10 days'),
(8,  1, 'REG-2026-002', 'ACTIVE',          NOW() - INTERVAL '9 days'),
(9,  1, 'REG-2026-003', 'ACTIVE',          NOW() - INTERVAL '8 days'),
(10, 2, 'REG-2026-004', 'ACTIVE',          NOW() - INTERVAL '10 days'),
(11, 2, 'REG-2026-005', 'ACTIVE',          NOW() - INTERVAL '7 days'),
(12, 3, 'REG-2026-006', 'ACTIVE',          NOW() - INTERVAL '12 days'),
(13, 3, 'REG-2026-007', 'ACTIVE',          NOW() - INTERVAL '11 days'),
(14, 4, 'REG-2026-008', 'ACTIVE',          NOW() - INTERVAL '10 days'),
(7,  5, 'REG-2026-009', 'ACTIVE',          NOW() - INTERVAL '5 days'),
(8,  6, 'REG-2026-010', 'PENDING_PAYMENT', NULL),
(9,  4, 'REG-2026-011', 'PENDING_PAYMENT', NULL),
(10, 3, 'REG-2026-012', 'ACTIVE',          NOW() - INTERVAL '3 days');

-- PaymentTransactions
INSERT INTO payment_transactions (class_registration_id, provider, provider_reference, amount, transaction_status) VALUES
(1,  'VNPAY', 'VNPAY20261001001', 5000000, 'SUCCESS'),
(2,  'VNPAY', 'VNPAY20261001002', 5000000, 'SUCCESS'),
(3,  'VNPAY', 'VNPAY20261001003', 5000000, 'SUCCESS'),
(4,  'VNPAY', 'VNPAY20261002001', 5000000, 'SUCCESS'),
(5,  'VNPAY', 'VNPAY20261002002', 5000000, 'SUCCESS'),
(6,  'VNPAY', 'VNPAY20261003001', 4500000, 'SUCCESS'),
(7,  'VNPAY', 'VNPAY20261003002', 4500000, 'SUCCESS'),
(8,  'VNPAY', 'VNPAY20261004001', 4500000, 'SUCCESS'),
(9,  'VNPAY', 'VNPAY20261005001', 4000000, 'SUCCESS'),
(10, 'VNPAY', NULL,               3500000, 'PENDING'),
(11, 'VNPAY', NULL,               4500000, 'PENDING'),
(12, 'VNPAY', 'VNPAY20261010001', 4500000, 'SUCCESS');

-- Submissions
INSERT INTO submissions (class_registration_id, assignment_id, submitted_at, secure_file_reference, file_metadata, submission_status) VALUES
(1, 1, NOW() - INTERVAL '5 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/submissions/proposal_se1701_s1.pdf', '{"name":"proposal.pdf","size":524288,"type":"application/pdf"}',         'SUBMITTED'),
(2, 1, NOW() - INTERVAL '4 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/submissions/proposal_se1701_s2.pdf', '{"name":"project_proposal.pdf","size":614400,"type":"application/pdf"}', 'GRADED'),
(3, 1, NOW() - INTERVAL '6 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/submissions/proposal_se1701_s3.pdf', '{"name":"proposal_final.pdf","size":450560,"type":"application/pdf"}',   'GRADED'),
(4, 3, NOW() - INTERVAL '3 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/submissions/proposal_se1702_s4.pdf', '{"name":"proposal_group.pdf","size":786432,"type":"application/pdf"}',   'SUBMITTED'),
(6, 5, NOW() - INTERVAL '2 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/submissions/servlet_se1703_s6.zip', '{"name":"servlet-lab.zip","size":102400,"type":"application/zip"}',       'GRADED'),
(7, 5, NOW() - INTERVAL '1 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/submissions/servlet_se1703_s7.zip', '{"name":"my-servlet-project.zip","size":204800,"type":"application/zip"}','SUBMITTED'),
(9, 8, NOW() - INTERVAL '1 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/submissions/erd_se1705_s9.pdf',     '{"name":"erd-hospital.pdf","size":327680,"type":"application/pdf"}',     'SUBMITTED');

-- AssignmentEvaluations
INSERT INTO assignment_evaluations (submission_id, evaluator_id, score, feedback, evaluation_status) VALUES
(2, 4, 8.5, 'Good proposal with clear objectives. Timeline needs more detail.',              'COMPLETED'),
(3, 4, 9.0, 'Excellent proposal. Very detailed scope and risk assessment.',                  'COMPLETED'),
(5, 4, 7.5, 'Servlet implementation works but code quality needs improvement. Add more comments.', 'COMPLETED');

-- SystemConfigurations
INSERT INTO system_configurations (configuration_name, business_value, effective_status, last_reviewed_at) VALUES
('registration.fee.default',      '5000000',              'ACTIVE', NOW()),
('submission.max_file_size_mb',   '50',                   'ACTIVE', NOW()),
('submission.allowed_types',      'pdf,zip,docx,pptx',   'ACTIVE', NOW()),
('evaluation.passing_score',      '5.0',                  'ACTIVE', NOW()),
('academic.current_term',         'Fall2026',             'ACTIVE', NOW());
