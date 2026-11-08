-- ============================================================
-- V2__seed_data.sql
-- AMS – Demo dataset on the course-centric model
-- ============================================================

-- Roles
INSERT INTO roles (role_name, description) VALUES
('ADMIN',   'System administrator'),
('EXPERT',  'Subject matter expert who creates templates'),
('TEACHER', 'Teacher who creates courses, assignments and evaluates'),
('STUDENT', 'Student who enrolls in courses and submits assignments');

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
('student3',   'quochdat@student.fitc.edu.vn',   '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Lê Quốc Đạt',         'ACTIVE',    NOW() - INTERVAL '115 days'),
('student4',   'minhanh@student.fitc.edu.vn',    '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Phạm Minh Anh',       'ACTIVE',    NOW() - INTERVAL '110 days'),
('student5',   'baochau@student.fitc.edu.vn',    '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Hoàng Bảo Châu',      'ACTIVE',    NOW() - INTERVAL '105 days'),
('student6',   'hoanglong@student.fitc.edu.vn',  '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Vũ Hoàng Long',       'ACTIVE',    NOW() - INTERVAL '100 days'),
('student7',   'ngocanh@student.fitc.edu.vn',    '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Đặng Ngọc Ánh',       'ACTIVE',    NOW() - INTERVAL '95 days'),
('student8',   'tuan.kiet@student.fitc.edu.vn',  '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Bùi Tuấn Kiệt',       'ACTIVE',    NOW() - INTERVAL '90 days'),
('student9',   'thanhha@student.fitc.edu.vn',    '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Đỗ Thanh Hằng',       'ACTIVE',    NOW() - INTERVAL '85 days'),
('student10',  'minhtuan@student.fitc.edu.vn',   '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Nguyễn Minh Tuấn',    'ACTIVE',    NOW() - INTERVAL '80 days'),
('student11',  'hoangphuc@student.fitc.edu.vn',  '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Trần Hoàng Phúc',     'SUSPENDED', NOW() - INTERVAL '75 days'),
('student12',  'tuongvi@student.fitc.edu.vn',    '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Lê Thị Tường Vi',     'ACTIVE',    NOW() - INTERVAL '70 days'),
('student13',  'khanhlinh@student.fitc.edu.vn',  '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Ngô Khánh Linh',      'ACTIVE',    NOW() - INTERVAL '65 days'),
('student14',  'trungduc@student.fitc.edu.vn',   '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Phan Trung Đức',      'ACTIVE',    NOW() - INTERVAL '60 days'),
('student15',  'kimngan@student.fitc.edu.vn',    '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Vương Kim Ngân',      'ACTIVE',    NOW() - INTERVAL '55 days'),
('student16',  'thanhtung@student.fitc.edu.vn',  '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Hà Thanh Tùng',       'ACTIVE',    NOW() - INTERVAL '50 days'),
('student17',  'thuyduong@student.fitc.edu.vn',  '$2a$10$ShO9sVu4WVBMAsyIjkoiPui3aBWOt4p6aDuxaD7XMICofkVWb3Fi2', 'Lý Thùy Dương',       'ACTIVE',    NOW() - INTERVAL '45 days');

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
(18, (SELECT id FROM roles WHERE role_name = 'STUDENT')),
(19, (SELECT id FROM roles WHERE role_name = 'STUDENT')),
(20, (SELECT id FROM roles WHERE role_name = 'STUDENT')),
(21, (SELECT id FROM roles WHERE role_name = 'STUDENT')),
(22, (SELECT id FROM roles WHERE role_name = 'STUDENT')),
(23, (SELECT id FROM roles WHERE role_name = 'STUDENT'));

-- Subjects (back the expert template catalogue)
INSERT INTO subjects (subject_code, subject_name, description, status) VALUES
('SWD392', 'Software Development Project',
           'Capstone project course: team-based Agile delivery and full-stack product lifecycle management.', 'ACTIVE'),
('PRJ301', 'Java Web Applications',
           'Building web applications with JSP/Servlet and Spring MVC, integrating relational databases.', 'ACTIVE'),
('DBI202', 'Database Systems',
           'Relational design, normalization (1NF-3NF), writing and optimizing SQL queries.', 'ACTIVE'),
('MAE101', 'Applied Mathematics for Engineers',
           'Linear algebra, differential equations, and discrete analysis applied to engineering.', 'ACTIVE');

-- AssignmentTemplates (expert feature, unchanged)
INSERT INTO assignment_templates (subject_id, expert_id, title, instructions, default_due_rule) VALUES
(1, 2, 'Project Proposal',
   'Define goals, scope, timeline, and team role breakdown. Minimum 5 pages, include a Gantt chart and a risk list.', '14 days after publication'),
(1, 2, 'Sprint 1 Report',
   'Document Sprint 1 progress: completed user stories, burndown chart, and retrospective conclusions.',               '21 days after publication'),
(1, 2, 'Final Presentation',
   'Prepare a 15-minute presentation demoing the complete system, with code-reviewed source code attached.',           '60 days after publication'),
(2, 3, 'Servlet CRUD Lab',
   'Implement a CRUD application with Java Servlet + JSP, deploy on Tomcat, and include run instructions.',            '7 days after publication'),
(2, 3, 'Spring MVC Application',
   'Build a web app following the MVC pattern with Spring, integrating JPA/PostgreSQL and file upload.',               '14 days after publication'),
(3, 2, 'Hospital ERD Design',
   'Design the ERD for a hospital management system, normalized to at least 3NF, with SQL table creation scripts.',    '7 days after publication'),
(3, 2, 'Set of 20 SQL Queries',
   'Write 20 SQL queries of increasing difficulty on the provided schema, explaining the query plan (EXPLAIN).',       '10 days after publication'),
(4, 3, 'Linear Algebra Exercise Set',
   'Solve 30 problems on matrix operations, eigenvalues, and vector spaces.',                                          '7 days after publication');

-- Categories
INSERT INTO categories (name) VALUES
('Programming'), ('Web Development'), ('Database'),
('Software Engineering'), ('Data Science'), ('Mobile Development');

-- Courses (instructors: teacher1=4, teacher2=5, teacher3=6)
INSERT INTO courses (title, code, category_id, description, price, is_free, status, difficulty_level, about, what_students_will_learn, prerequisites, instructor_id, created_at, updated_at) VALUES
('Agile Software Development with Scrum', 'CRS-SWD01', 4,
 'Team-based Agile delivery capstone: sprints, ceremonies, and shipping a full-stack product.',
 0, TRUE, 'PUBLISHED', 'BEGINNER',
 'Work in a Scrum team to plan, build and ship a product over several sprints.',
 'Sprint planning and estimation; writing user stories; running retrospectives; CI basics.',
 'Basic programming experience.', 4, NOW() - INTERVAL '60 days', NOW() - INTERVAL '10 days'),
('Scrum in Practice: Team Projects', 'CRS-SCRUM2', 4,
 'Hands-on Scrum for real team projects: backlog grooming, burndown tracking and DoD checklists.',
 50000, FALSE, 'PUBLISHED', 'INTERMEDIATE',
 'A practice-focused follow-up to the Agile capstone with graded sprint reports.',
 'Backlog refinement; velocity tracking; facilitation skills, retrospective formats and DoD checklists.',
 'Agile Software Development with Scrum or equivalent.', 4, NOW() - INTERVAL '45 days', NOW() - INTERVAL '8 days'),
('Spring MVC Web Applications', 'CRS-SPRMVC', 2,
 'Build layered web apps with Spring MVC, JPA and PostgreSQL, including file upload and validation.',
 0, TRUE, 'PUBLISHED', 'INTERMEDIATE',
 'From controllers to repositories: a complete tour of the Spring MVC stack.',
 'Spring MVC request lifecycle; JPA/Hibernate mapping; form validation; integration testing.',
 'Core Java and relational SQL.', 5, NOW() - INTERVAL '50 days', NOW() - INTERVAL '12 days'),
('Java Servlet Fundamentals', 'CRS-SRVLT1', 2,
 'Servlets, JSP and Tomcat deployment for classic Java web development.',
 0, TRUE, 'PUBLISHED', 'BEGINNER',
 'Understand the HTTP servlet lifecycle and build your first deployed web app.',
 'Servlet lifecycle; JSP templating; session management; WAR deployment on Tomcat.',
 'Core Java.', 5, NOW() - INTERVAL '55 days', NOW() - INTERVAL '15 days'),
('Database Systems with SQL', 'CRS-DBSQL1', 3,
 'Relational design, 3NF normalization and query optimization with real EXPLAIN plans.',
 120000, FALSE, 'PUBLISHED', 'INTERMEDIATE',
 'Design schemas that survive contact with production traffic.',
 'ER modelling; normalization to 3NF; indexing strategies; reading EXPLAIN output.',
 'Basic SQL familiarity.', 6, NOW() - INTERVAL '40 days', NOW() - INTERVAL '6 days'),
('Linear Algebra for Engineers', 'CRS-LINALG', 5,
 'Matrices, eigenvalues and vector spaces with engineering applications.',
 0, TRUE, 'DRAFT', 'BEGINNER',
 'A refresher on linear algebra oriented toward machine learning and control.',
 'Matrix operations; eigen-decomposition; least squares; applications.', NULL, 6, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days');

-- Curriculum (modules -> lessons), order_index contiguous per parent
INSERT INTO modules (course_id, title, order_index) VALUES
(1, 'Sprint Zero',             0),
(1, 'Shipping the Product',    1),
(2, 'Backlog Mastery',         0),
(2, 'Facilitation & Review',   1),
(3, 'Spring MVC Core',         0),
(3, 'Data Layer with JPA',     1),
(4, 'Servlet Basics',          0),
(4, 'Deploying to Tomcat',     1),
(5, 'Relational Design',       0),
(5, 'Query Optimization',      1);

INSERT INTO lessons (module_id, title, type, duration, status, order_index) VALUES
(1,  'Team formation and roles',        'READING',   15, 'PUBLISHED', 0),
(1,  'Writing user stories',            'VIDEO',     25, 'PUBLISHED', 1),
(1,  'Estimation poker',                'VIDEO',     20, 'PUBLISHED', 2),
(2,  'CI pipelines for teams',          'VIDEO',     30, 'PUBLISHED', 0),
(2,  'Release checklist',               'READING',   10, 'DRAFT',     1),
(3,  'Backlog refinement workshop',     'VIDEO',     35, 'PUBLISHED', 0),
(3,  'Velocity and burndown',           'READING',   20, 'PUBLISHED', 1),
(4,  'Running retrospectives',          'VIDEO',     30, 'PUBLISHED', 0),
(4,  'Definition of Done checklists',   'READING',   15, 'PUBLISHED', 1),
(5,  'Controllers and views',           'VIDEO',     40, 'PUBLISHED', 0),
(5,  'Form validation',                 'READING',   20, 'PUBLISHED', 1),
(6,  'JPA entity mapping',              'VIDEO',     45, 'PUBLISHED', 0),
(6,  'Repository testing',              'READING',   25, 'DRAFT',     1),
(7,  'Servlet lifecycle',               'VIDEO',     30, 'PUBLISHED', 0),
(7,  'Sessions and cookies',            'READING',   15, 'PUBLISHED', 1),
(8,  'Packaging a WAR',                 'VIDEO',     25, 'PUBLISHED', 0),
(9,  'ER modelling',                    'VIDEO',     35, 'PUBLISHED', 0),
(9,  'Normalization to 3NF',            'READING',   30, 'PUBLISHED', 1),
(10, 'Indexes and EXPLAIN',             'VIDEO',     40, 'PUBLISHED', 0),
(10, 'Query rewriting patterns',        'READING',   20, 'PUBLISHED', 1);

-- CourseEnrollments (free enrollments are ACTIVE immediately; paid need payment)
INSERT INTO course_enrollments (course_id, student_id, registration_reference, status, amount, registered_at, activated_at) VALUES
(1, 7,  'ENR-F26-1001', 'ACTIVE',          0,      NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
(1, 8,  'ENR-F26-1002', 'ACTIVE',          0,      NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
(1, 9,  'ENR-F26-1003', 'ACTIVE',          0,      NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
(1, 10, 'ENR-F26-1004', 'ACTIVE',          0,      NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days'),
(1, 11, 'ENR-F26-1005', 'ACTIVE',          0,      NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days'),
(3, 12, 'ENR-F26-1006', 'ACTIVE',          0,      NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
(3, 13, 'ENR-F26-1007', 'ACTIVE',          0,      NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
(3, 21, 'ENR-F26-1008', 'ACTIVE',          0,      NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
(4, 14, 'ENR-F26-1009', 'ACTIVE',          0,      NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
(4, 15, 'ENR-F26-1010', 'ACTIVE',          0,      NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
(4, 16, 'ENR-F26-1011', 'ACTIVE',          0,      NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
(4, 17, 'ENR-F26-1012', 'ACTIVE',          0,      NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
(5, 7,  'ENR-F26-1013', 'ACTIVE',          120000, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
(5, 9,  'ENR-F26-1014', 'ACTIVE',          120000, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(2, 22, 'ENR-F26-1015', 'ACTIVE',          50000,  NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
(2, 20, 'ENR-F26-1016', 'ACTIVE',          50000,  NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(2, 23, 'ENR-F26-1017', 'PENDING_PAYMENT', 50000,  NOW() - INTERVAL '1 day',   NULL),
(3, 18, 'ENR-F26-1018', 'CANCELLED',       0,      NOW() - INTERVAL '20 days', NULL),
(2, 18, 'ENR-F26-1019', 'CANCELLED',       50000,  NOW() - INTERVAL '16 days', NULL);

-- PaymentTransactions (paid enrollments only)
INSERT INTO payment_transactions (course_enrollment_id, provider, provider_reference, amount, transaction_status, created_at) VALUES
(13, 'VNPAY', 'VNPAY20261019000101', 120000, 'SUCCESS',  NOW() - INTERVAL '15 days'),
(14, 'VNPAY', 'VNPAY20261020000102', 120000, 'SUCCESS',  NOW() - INTERVAL '14 days'),
(15, 'VNPAY', 'VNPAY20261022000103', 50000,  'SUCCESS',  NOW() - INTERVAL '12 days'),
(16, 'VNPAY', 'VNPAY20261024000104', 50000,  'SUCCESS',  NOW() - INTERVAL '10 days'),
(17, 'VNPAY', 'VNPAY20261102000105', 50000,  'PENDING',  NOW() - INTERVAL '1 day'),
(17, 'VNPAY', 'VNPAY20261101000106', 50000,  'FAILED',   NOW() - INTERVAL '2 days'),
(19, 'VNPAY', 'VNPAY20261018000107', 50000,  'REFUNDED', NOW() - INTERVAL '16 days');

-- Assignments (owned by the course instructor)
INSERT INTO assignments (course_id, teacher_id, template_id, title, instructions, topic, max_score, due_at) VALUES
(1, 4, 1, 'Project Proposal',  'Define goals, scope, timeline and team roles. Minimum 5 pages with a Gantt chart.', 'Proposal',   10,   NOW() + INTERVAL '14 days'),
(1, 4, 2, 'Sprint 1 Report',   'Document Sprint 1: completed stories, burndown chart, retrospective.',              'Sprint 1',   10,   NOW() + INTERVAL '21 days'),
(1, 4, 3, 'Final Demo',        '15-minute demo of the complete system with reviewed source code.',                  'Demo',       10,   NOW() + INTERVAL '60 days'),
(3, 5, 5, 'Spring MVC App',    'Build an MVC web app with JPA/PostgreSQL and file upload.',                         'Project',    10,   NOW() + INTERVAL '14 days'),
(4, 5, 4, 'Servlet CRUD Lab',  'CRUD application with Servlet + JSP deployed on Tomcat.',                           'Lab',        10,   NOW() + INTERVAL '7 days'),
(5, 6, 6, 'Hospital ERD',      'Design the hospital ERD normalized to 3NF with DDL scripts.',                       'ERD',        10,   NOW() + INTERVAL '7 days'),
(5, 6, 7, 'SQL Query Set',     '20 SQL queries of increasing difficulty with EXPLAIN notes.',                       'SQL',        10,   NOW() + INTERVAL '10 days'),
(6, 6, 8, 'Exercise Set 1',    'Matrix operations, eigenvalues and vector spaces.',                                 'Exercises',  10,   NOW() - INTERVAL '2 days');

-- Submissions
INSERT INTO submissions (course_enrollment_id, assignment_id, submitted_at, secure_file_reference, file_metadata, submission_status) VALUES
(1,  1, NOW() - INTERVAL '5 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759248000/submissions/crs_swd01_proposal_han.pdf',  '{"name":"project_proposal.pdf","size":1245184,"type":"application/pdf"}', 'GRADED'),
(2,  1, NOW() - INTERVAL '4 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759334400/submissions/crs_swd01_proposal_linh.pdf', '{"name":"project_proposal.pdf","size":2150400,"type":"application/pdf"}', 'GRADED'),
(3,  1, NOW() - INTERVAL '6 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759161600/submissions/crs_swd01_proposal_dat.pdf',  '{"name":"project_proposal.pdf","size":890880,"type":"application/pdf"}',  'GRADED'),
(4,  1, NOW() - INTERVAL '3 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759420800/submissions/crs_swd01_proposal_anh.pdf',  '{"name":"project_proposal.pdf","size":1572864,"type":"application/pdf"}', 'SUBMITTED'),
(5,  2, NOW() - INTERVAL '2 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759507200/submissions/crs_swd01_sprint1_chau.docx', '{"name":"sprint1_report.docx","size":348160,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}', 'SUBMITTED'),
(8,  5, NOW() - INTERVAL '2 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759507201/submissions/crs_srvlt1_lab_linh.zip',     '{"name":"servlet-lab-tomcat.zip","size":4194304,"type":"application/zip"}', 'GRADED'),
(9,  5, NOW() - INTERVAL '1 day',  'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759593600/submissions/crs_srvlt1_lab_kiet.zip',     '{"name":"servlet_crud.zip","size":1048576,"type":"application/zip"}',     'SUBMITTED'),
(10, 5, NOW() - INTERVAL '1 day',  'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759593601/submissions/crs_srvlt1_lab_ngan.zip',     '{"name":"servlet-lab.zip","size":983040,"type":"application/zip"}',       'SUBMITTED'),
(11, 6, NOW() - INTERVAL '1 day',  'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759593602/submissions/crs_dbsql1_erd_han.pdf',      '{"name":"hospital_erd_3nf.pdf","size":327680,"type":"application/pdf"}',  'SUBMITTED'),
(12, 6, NOW() - INTERVAL '3 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759420801/submissions/crs_dbsql1_erd_hang.pdf',     '{"name":"hospital_erd.pdf","size":294912,"type":"application/pdf"}',      'GRADED'),
(11, 7, NOW() - INTERVAL '1 day',  'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759593603/submissions/crs_dbsql1_sql_han.pdf',      '{"name":"sql_queries.pdf","size":208896,"type":"application/pdf"}',       'SUBMITTED'),
(6,  4, NOW() - INTERVAL '2 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759593604/submissions/crs_sprmvc_app_vi.zip',       '{"name":"spring-mvc-app.zip","size":5242880,"type":"application/zip"}',   'SUBMITTED'),
(7,  4, NOW() - INTERVAL '1 day',  'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759593605/submissions/crs_sprmvc_app_linhd.zip',    '{"name":"spring-mvc-app.zip","size":5042176,"type":"application/zip"}',   'SUBMITTED'),
(16, 5, NOW() - INTERVAL '3 days', 'https://res.cloudinary.com/swd_g1_asm/raw/upload/v1/1759507202/submissions/crs_srvlt1_lab_phuc.zip',     '{"name":"servlet-late.zip","size":1204224,"type":"application/zip"}',     'LATE');

-- AssignmentEvaluations
INSERT INTO assignment_evaluations (submission_id, evaluator_id, score, feedback, evaluation_status) VALUES
(1,  4, 8.5, 'Clear goals and scope. Add a detailed weekly timeline.',                                        'COMPLETED'),
(2,  4, 9.0, 'Excellent proposal: clear scope, risk assessment, and a complete Gantt chart.',                'COMPLETED'),
(3,  4, 7.5, 'Solid content, but team roles are missing. Add a RACI matrix.',                                 'COMPLETED'),
(6,  5, 8.0, 'Servlet runs on Tomcat. Separate business logic from the servlet and add javadoc.',             'COMPLETED'),
(10, 6, 9.2, 'Fully 3NF-normalized ERD with clear DDL scripts and EXPLAIN plans. Excellent.',                 'COMPLETED');

-- AuditLogs
INSERT INTO audit_logs (actor_id, action, resource_type, resource_reference, occurred_at) VALUES
(4,  'COURSE_CREATED',        'COURSE',      'CRS-SWD01',               NOW() - INTERVAL '60 days'),
(4,  'COURSE_PUBLISHED',      'COURSE',      'CRS-SWD01',               NOW() - INTERVAL '55 days'),
(5,  'COURSE_CREATED',        'COURSE',      'CRS-SPRMVC',              NOW() - INTERVAL '50 days'),
(6,  'COURSE_CREATED',        'COURSE',      'CRS-DBSQL1',              NOW() - INTERVAL '40 days'),
(4,  'ASSIGNMENT_PUBLISHED',  'ASSIGNMENT',  'Project Proposal',        NOW() - INTERVAL '10 days'),
(7,  'COURSE_ENROLLED',       'ENROLLMENT',  'ENR-F26-1013',            NOW() - INTERVAL '15 days'),
(7,  'PAYMENT_SUCCESS',       'PAYMENT',     'VNPAY20261019000101',     NOW() - INTERVAL '15 days'),
(23, 'PAYMENT_FAILED',        'PAYMENT',     'VNPAY20261101000106',     NOW() - INTERVAL '2 days'),
(18, 'ENROLLMENT_CANCELLED',  'ENROLLMENT',  'ENR-F26-1019',            NOW() - INTERVAL '16 days'),
(4,  'SUBMISSION_GRADED',     'EVALUATION',  'Sprint 1 Report',         NOW() - INTERVAL '4 days'),
(1,  'USER_SUSPENDED',        'USER',        'student11',               NOW() - INTERVAL '60 days'),
(2,  'TEMPLATE_CREATED',      'TEMPLATE',    'Project Proposal',        NOW() - INTERVAL '45 days');

-- SystemConfigurations
INSERT INTO system_configurations (configuration_name, business_value, effective_status, last_reviewed_at) VALUES
('registration.fee.default',      '50000',             'ACTIVE', NOW() - INTERVAL '30 days'),
('registration.fee.discount',     '10',                'ACTIVE', NOW() - INTERVAL '30 days'),
('submission.max_file_size_mb',   '50',                'ACTIVE', NOW() - INTERVAL '60 days'),
('submission.allowed_types',      'pdf,zip,docx,pptx', 'ACTIVE', NOW() - INTERVAL '60 days'),
('evaluation.passing_score',      '5.0',               'ACTIVE', NOW() - INTERVAL '90 days'),
('academic.current_term',         'Fall2026',          'ACTIVE', NOW() - INTERVAL '7 days');
